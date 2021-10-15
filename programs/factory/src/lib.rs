//! An example of an AMM factory program, inspired by Uniswap V1 seen here:
//! https://github.com/Uniswap/uniswap-v1/. This example has some
//! implementation changes to address the differences between the EVM and
//! Solana's BPF-modified LLVM, but more or less should be the same overall.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount, Transfer};

use exchange::{self, Create, ExchangeData};

declare_id!("GyuPaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// Factory
#[program]
pub mod factory {
    use super::*;

    /// Initializes the factory account
    pub fn initialize(ctx: Context<Initialize>, template: Pubkey) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        factory.exchange_template = template;
        factory.token_count = 0;
        Ok(())
    }

    /// Creates an exchange for a new token pair
    pub fn create_exchange(
        ctx: Context<CreateExchange>,
        token_a: Pubkey,
        token_b: Pubkey,
        token_c: Pubkey,
        fee: u64,
    ) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        factory.token_count = factory.token_count + 1;
        exchange::cpi::create(ctx.accounts.into(), token_a, token_b, token_c, fee)?;
        Ok(())
    }

    pub fn get_exchange(_ctx: Context<GetExchange>, _token: Pubkey) -> ProgramResult {
        Ok(())
    }

    pub fn get_token(_ctx: Context<GetToken>, _token: Pubkey) -> ProgramResult {
        Ok(())
    }

    pub fn get_token_with_id(_ctx: Context<GetTokenWithId>, _token: Pubkey) -> ProgramResult {
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount_c: u64) -> ProgramResult {
        token::transfer(ctx.accounts.into_ctx_c(), amount_c)?;
        token::mint_to(ctx.accounts.into_ctx_s(), amount_c)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + 32 + 8)]
    pub factory: Account<'info, FactoryData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateExchange<'info> {
    #[account(zero)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut)]
    pub exchange_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub exchange_b: Account<'info, TokenAccount>,
    pub exchange_program: AccountInfo<'info>,
    #[account(mut)]
    pub factory: Account<'info, FactoryData>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetExchange<'info> {
    pub factory: Account<'info, FactoryData>,
}

#[derive(Accounts)]
pub struct GetToken<'info> {
    pub factory: Account<'info, FactoryData>,
}

#[derive(Accounts)]
pub struct GetTokenWithId<'info> {
    pub factory: Account<'info, FactoryData>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    pub authority: AccountInfo<'info>,
    pub factory: Account<'info, FactoryData>,
    #[account(mut)]
    pub factory_c: Account<'info, TokenAccount>,
    #[account(mut)]
    pub mint_s: Account<'info, Mint>,
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub user_s: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_c: Account<'info, TokenAccount>,
}

impl<'info> Stake<'info> {
    fn into_ctx_c(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_c.to_account_info(),
            to: self.factory_c.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_ctx_s(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.mint_s.to_account_info(),
            to: self.user_s.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

impl<'a, 'b, 'c, 'd, 'info> From<&mut CreateExchange<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Create<'info>>
{
    fn from(accounts: &mut CreateExchange<'info>) -> CpiContext<'a, 'b, 'c, 'info, Create<'info>> {
        let cpi_accounts = Create {
            factory: accounts.factory.to_account_info(),
            exchange: accounts.exchange.clone(),
            token_program: accounts.token_program.clone(),
            exchange_a: accounts.exchange_a.clone(),
            exchange_b: accounts.exchange_b.clone(),
        };
        CpiContext::new(accounts.exchange_program.to_account_info(), cpi_accounts)
    }
}

#[account]
pub struct FactoryData {
    pub exchange_template: Pubkey,
    pub token_count: u64,
}
