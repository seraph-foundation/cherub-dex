//! An example of an AMM program, inspired by Uniswap V1 seen here:
//! https://github.com/Uniswap/uniswap-v1/. This example has some
//! implementation changes to address the differences between the EVM and
//! Solana's BPF-modified LLVM, but more or less should be the same overall.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Burn, MintTo, TokenAccount, Transfer};

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
        exchange.total_supply_c = 0;
        Ok(())
    }

    #[access_control(add_future_deadline(&ctx, deadline) add_correct_tokens(&ctx))]
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        max_tokens_a: u64,
        tokens_b: u64,
        min_liquidity_c: u64,
        deadline: i64,
    ) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        let mut liquidity_minted = tokens_b;
        let mut amount_a = max_tokens_a;
        if exchange.total_supply_c > 0 {
            assert!(min_liquidity_c > 0);
            amount_a = tokens_b * ctx.accounts.to_a.amount / ctx.accounts.to_b.amount + 1;
            liquidity_minted = tokens_b * exchange.total_supply_c / ctx.accounts.to_a.amount;
            assert!(max_tokens_a >= amount_a && liquidity_minted >= min_liquidity_c);
        }
        exchange.total_supply_c += liquidity_minted;
        token::transfer(ctx.accounts.into_context_a(), amount_a)?;
        token::transfer(ctx.accounts.into_context_b(), tokens_b)?;
        token::mint_to(ctx.accounts.into_context_c(), liquidity_minted)?;
        Ok(())
    }

    #[access_control(remove_future_deadline(&ctx, deadline) remove_correct_tokens(&ctx))]
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        tokens_c: u64,
        min_tokens_a: u64,
        min_tokens_b: u64,
        deadline: i64,
    ) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        assert!(exchange.total_supply_c > 0);
        let reserve_b = ctx.accounts.from_b.amount;
        let tokens_a = min_tokens_a;
        let tokens_b = min_tokens_b;
        exchange.total_supply_c -= tokens_c;
        token::burn(ctx.accounts.into_context_c(), tokens_c)?;
        token::transfer(ctx.accounts.into_context_a(), tokens_a)?;
        token::transfer(ctx.accounts.into_context_b(), tokens_b)
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
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 8 + 8)]
    pub exchange: Account<'info, Exchange>,
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
}

#[derive(Accounts)]
#[instruction(max_tokens_a: u64, tokens_b: u64)]
pub struct AddLiquidity<'info> {
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    #[account(mut, constraint = max_tokens_a > 0)]
    pub from_a: AccountInfo<'info>,
    #[account(mut)]
    pub to_a: Account<'info, TokenAccount>,
    #[account(mut, constraint = tokens_b > 0)]
    pub from_b: AccountInfo<'info>,
    #[account(mut)]
    pub to_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_c: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(tokens_c: u64, min_tokens_a: u64, min_tokens_b: u64)]
pub struct RemoveLiquidity<'info> {
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    pub burn_authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    #[account(mut, constraint = min_tokens_a > 0)]
    pub from_a: AccountInfo<'info>,
    #[account(mut)]
    pub to_a: Account<'info, TokenAccount>,
    #[account(mut, constraint = min_tokens_b > 0)]
    pub from_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_b: AccountInfo<'info>,
    #[account(mut, constraint = tokens_c > 0)]
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

impl<'info> AddLiquidity<'info> {
    fn into_context_a(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_a.clone(),
            to: self.to_a.to_account_info().clone(),
            authority: self.authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_context_b(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_b.clone(),
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

impl<'info> RemoveLiquidity<'info> {
    fn into_context_a(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_a.clone(),
            to: self.to_a.to_account_info().clone(),
            authority: self.exchange.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_context_b(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_b.to_account_info().clone(),
            to: self.to_b.to_account_info().clone(),
            authority: self.exchange.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_context_c(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: self.mint.clone(),
            to: self.to_c.clone(),
            authority: self.burn_authority.clone(),
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
    pub total_supply_c: u64,
    pub price: u64,
}

#[error]
pub enum ErrorCode {
    #[msg("Adding or removing liquidity must be done in the present or future time")]
    FutureDeadline,
    #[msg("Incorrect tokens")]
    CorrectTokens,
}

fn add_future_deadline<'info>(ctx: &Context<AddLiquidity<'info>>, deadline: i64) -> Result<()> {
    if !(ctx.accounts.clock.unix_timestamp <= deadline) {
        return Err(ErrorCode::FutureDeadline.into());
    }
    Ok(())
}

fn remove_future_deadline<'info>(
    ctx: &Context<RemoveLiquidity<'info>>,
    deadline: i64,
) -> Result<()> {
    if !(ctx.accounts.clock.unix_timestamp <= deadline) {
        return Err(ErrorCode::FutureDeadline.into());
    }
    Ok(())
}

fn add_correct_tokens<'info>(ctx: &Context<AddLiquidity<'info>>) -> Result<()> {
    if !(ctx.accounts.to_a.mint.key() == ctx.accounts.exchange.token_a.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    if !(ctx.accounts.to_b.mint.key() == ctx.accounts.exchange.token_b.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    if !(ctx.accounts.mint.key() == ctx.accounts.exchange.token_c.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    Ok(())
}

fn remove_correct_tokens<'info>(ctx: &Context<RemoveLiquidity<'info>>) -> Result<()> {
    if !(ctx.accounts.to_a.mint.key() == ctx.accounts.exchange.token_a.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    if !(ctx.accounts.from_b.mint.key() == ctx.accounts.exchange.token_b.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    if !(ctx.accounts.mint.key() == ctx.accounts.exchange.token_c.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    Ok(())
}
