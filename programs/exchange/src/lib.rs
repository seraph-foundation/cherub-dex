//! An example of an AMM program, inspired by Uniswap V1 seen here:
//! https://github.com/Uniswap/uniswap-v1/. This example has some
//! implementation changes to address the differences between the EVM and
//! Solana's BPF-modified LLVM, but more or less should be the same overall.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, MintTo, TokenAccount, Transfer};

declare_id!("Fx9PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod exchange {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, factory: Pubkey) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        exchange.factory = factory;
        Ok(())
    }

    pub fn create(
        ctx: Context<Create>,
        token_a: Pubkey,
        token_b: Pubkey,
        token_c: Pubkey,
    ) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        exchange.token_a = token_a;
        exchange.token_b = token_b;
        exchange.token_c = token_c;
        exchange.total_supply_a = 0;
        exchange.total_supply_b = 0;
        exchange.total_supply_c = 0;
        Ok(())
    }

    pub fn add_liquidity(
        ctx: Context<UpdateLiquidity>,
        max_tokens_a: u64,
        max_tokens_b: u64,
        min_liquidity_c: u64,
        deadline: i64,
    ) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        if exchange.total_supply_c > 0 {
            assert!(min_liquidity_c > 0);
            let reserve_b = exchange.total_supply_b - max_tokens_b;
            let amount_a = max_tokens_b * exchange.total_supply_a / reserve_b + 1;
            let liquidity_minted = max_tokens_b * exchange.total_supply_c / reserve_b;
            assert!(max_tokens_a >= amount_a && liquidity_minted >= min_liquidity_c);
            exchange.total_supply_c = exchange.total_supply_c + liquidity_minted;
            token::mint_to(ctx.accounts.into_context_c(), liquidity_minted)?;
            token::transfer(ctx.accounts.into_context_a(), amount_a)?;
        } else {
            let amount_a = max_tokens_a;
            let initial_liquidity = max_tokens_b;
            exchange.total_supply_c = initial_liquidity;
            token::mint_to(ctx.accounts.into_context_c(), initial_liquidity)?;
            token::transfer(ctx.accounts.into_context_a(), amount_a)?;
        }
        token::transfer(ctx.accounts.into_context_b(), max_tokens_b)
    }

    pub fn remove_liquidity(
        ctx: Context<UpdateLiquidity>,
        max_tokens_a: u64,
        max_tokens_b: u64,
        min_liquidity_c: u64,
        deadline: i64,
    ) -> ProgramResult {
        token::transfer(ctx.accounts.into_context_a(), max_tokens_a)?;
        token::transfer(ctx.accounts.into_context_b(), max_tokens_b)
    }

    pub fn get_input_price(_ctx: Context<GetInputPrice>) -> ProgramResult {
        Ok(())
    }

    pub fn get_output_price(_ctx: Context<GetOutputPrice>) -> ProgramResult {
        Ok(())
    }

    pub fn a_to(_ctx: Context<ATo>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8)]
    pub exchange: Account<'info, Exchange>,
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
}

#[derive(Accounts)]
#[instruction(max_tokens_a: u64, max_tokens_b: u64, min_liquidity_c: u64, deadline: i64)]
pub struct UpdateLiquidity<'info> {
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    #[account(constraint = deadline >= clock.unix_timestamp)]
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    #[account(mut, constraint = from_a.amount >= max_tokens_a && max_tokens_a > 0)]
    pub from_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_a: AccountInfo<'info>,
    #[account(mut, constraint = from_b.amount >= max_tokens_b && max_tokens_b > 0)]
    pub from_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_b: AccountInfo<'info>,
    #[account(mut)]
    pub from_c: AccountInfo<'info>,
    #[account(mut)]
    pub to_c: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetInputPrice<'info> {
    pub exchange: Account<'info, Exchange>,
}

#[derive(Accounts)]
pub struct GetOutputPrice<'info> {
    pub exchange: Account<'info, Exchange>,
}

#[derive(Accounts)]
pub struct ATo<'info> {
    pub exchange: Account<'info, Exchange>,
}

impl<'info> UpdateLiquidity<'info> {
    fn into_context_a(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_a.to_account_info().clone(),
            to: self.to_a.to_account_info().clone(),
            authority: self.authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_context_b(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_b.to_account_info().clone(),
            to: self.to_b.to_account_info().clone(),
            authority: self.authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_context_c(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.mint.clone(),
            to: self.to_c.clone(),
            authority: self.authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

#[account]
pub struct Exchange {
    pub factory: Pubkey,
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub token_c: Pubkey,
    pub total_supply_a: u64,
    pub total_supply_b: u64,
    pub total_supply_c: u64,
}
