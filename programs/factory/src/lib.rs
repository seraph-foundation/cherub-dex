//! An example of an AMM factory program, inspired by Uniswap V1 seen here:
//! https://github.com/Uniswap/uniswap-v1/. This example has some
//! implementation changes to address the differences between the EVM and
//! Solana's BPF-modified LLVM, but more or less should be the same overall.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount, Transfer};

use exchange;

declare_id!("2vTL4Kks8UVNQoQmaWHyJCfJxivaHm8zgFPfsw9watmY");

/// Factory
#[program]
pub mod factory {
    use super::*;

    /// Initializes the factory account
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        factory.tokens = 0;
        Ok(())
    }

    /// Initializes and adds an exchange for a new token pair.
    ///
    /// fee In basis points
    pub fn add_exchange(ctx: Context<AddExchange>, fee: u64) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        factory.tokens += 1;
        exchange::cpi::initialize(ctx.accounts.into(), fee)?;
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

    /// Meta. Sets factory user account up.
    ///
    /// bump Random seed used to bump PDA off curve
    pub fn meta(ctx: Context<Meta>, bump: u8) -> ProgramResult {
        let meta = &mut ctx.accounts.meta;
        meta.stakes = 0;
        Ok(())
    }

    /// Stake.
    ///
    /// bump Random seed used to bump PDA off curve
    pub fn stake(ctx: Context<Stake>, amount_c: u64, bump: u8) -> ProgramResult {
        token::transfer(ctx.accounts.into_ctx_c(), amount_c)?;
        token::mint_to(ctx.accounts.into_ctx_s(), amount_c)?;
        let stake = &mut ctx.accounts.stake;
        stake.unix_timestamp = ctx.accounts.clock.unix_timestamp;
        stake.quantity = amount_c;
        let meta = &mut ctx.accounts.meta;
        meta.stakes += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct AddExchange<'info> {
    #[account(zero)]
    pub exchange: Account<'info, exchange::ExchangeData>,
    #[account(mut)]
    pub exchange_v: AccountInfo<'info>,
    pub exchange_program: AccountInfo<'info>,
    #[account(mut)]
    pub factory: Account<'info, FactoryData>,
    pub token_c: AccountInfo<'info>,
    pub token_v: AccountInfo<'info>,
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
pub struct Initialize<'info> {
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + 8)]
    pub factory: Account<'info, FactoryData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Meta<'info> {
    pub authority: Signer<'info>,
    pub factory: Account<'info, FactoryData>,
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 8 + 8,
        seeds = [b"meta", authority.key.as_ref()],
        bump = bump
    )]
    pub meta: Account<'info, MetaData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Stake<'info> {
    pub authority: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub factory_c: Account<'info, TokenAccount>,
    #[account(mut)]
    pub meta: Account<'info, MetaData>,
    #[account(mut)]
    pub mint_s: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 8,
        seeds = [b"stake", authority.key.as_ref(), meta.stakes.to_string().as_bytes()],
        bump
    )]
    pub stake: Account<'info, StakeData>,
    pub system_program: Program<'info, System>,
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub user_s: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_c: Account<'info, TokenAccount>,
}

impl<'info> Stake<'info> {
    fn into_ctx_c(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            authority: self.authority.to_account_info(),
            from: self.user_c.to_account_info(),
            to: self.factory_c.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_ctx_s(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            authority: self.authority.to_account_info(),
            mint: self.mint_s.to_account_info(),
            to: self.user_s.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

impl<'a, 'b, 'c, 'd, 'info> From<&mut AddExchange<'info>>
    for CpiContext<'a, 'b, 'c, 'info, exchange::Initialize<'info>>
{
    fn from(accounts: &mut AddExchange<'info>) -> CpiContext<'a, 'b, 'c, 'info, exchange::Initialize<'info>> {
        let cpi_accounts = exchange::Initialize {
            exchange: accounts.exchange.clone(),
            exchange_v: accounts.exchange_v.clone(),
            factory: accounts.factory.to_account_info(),
            token_c: accounts.token_c.clone(),
            token_v: accounts.token_v.clone(),
            token_program: accounts.token_program.clone(),
        };
        CpiContext::new(accounts.exchange_program.to_account_info(), cpi_accounts)
    }
}

#[account]
pub struct FactoryData {
    pub tokens: u64,
}

#[account]
pub struct MetaData {
    pub stakes: u64,
}

#[account]
pub struct StakeData {
    pub quantity: u64,
    pub unix_timestamp: i64,
}
