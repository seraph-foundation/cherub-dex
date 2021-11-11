//! A Virtual Automated Market Maker (vAMM) factory program, inspired by
//! Uniswap V1 and V2. This example has some implementation changes to address
//! the differences between the EVM and Solana's BPF-modified LLVM. Additionally, it
//! adds a level of virtualization using collateral token vaults.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, TokenAccount, Transfer};

use exchange;

declare_id!("3ed78x1nSmCw4wxm92NYWKrFhNZv185KYXLX7FxtkCRc");

/// Factory
#[program]
pub mod factory {
    use super::*;

    /// Initializes and adds an exchange for a new token pair.
    ///
    /// decimals Token decimal value
    /// fee In basis points
    pub fn add_exchange(
        ctx: Context<AddExchange>,
        bond_discount: u64,
        decimals: u64,
    ) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        let protocol_fee = factory.fee;
        factory.tokens += 1;
        exchange::cpi::initialize(ctx.accounts.into(), bond_discount, decimals, protocol_fee)?;
        Ok(())
    }

    /// Get exchange by token.
    pub fn get_exchange(ctx: Context<GetExchange>, token: Pubkey) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        let data = &mut ctx.accounts.data;
        let (pda, _) = Pubkey::find_program_address(&[token.key().as_ref()], ctx.program_id);
        data.pda = pda;
        emit!(GetExchangeEvent { pda });
        Ok(())
    }

    /// Get token by exchange.
    pub fn get_token(ctx: Context<GetExchange>, exchange: Pubkey) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        let data = &mut ctx.accounts.data;
        for i in 0..factory.tokens {
            let (pda, _) =
                Pubkey::find_program_address(&[i.to_string().as_bytes()], ctx.program_id);
            data.pda = pda;
            emit!(GetExchangeEvent { pda });
        }
        Ok(())
    }

    /// Get exchange by id.
    pub fn get_token_with_id(ctx: Context<GetExchange>, id: u64) -> ProgramResult {
        let (pda, _) = Pubkey::find_program_address(&[id.to_string().as_bytes()], ctx.program_id);
        let data = &mut ctx.accounts.data;
        data.pda = pda;
        emit!(GetExchangeEvent { pda });
        Ok(())
    }

    /// Initializes the factory account
    ///
    /// fee Given in BPS and applied to the exchange maker fee
    pub fn initialize(ctx: Context<Initialize>, fee: u64) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        factory.fee = fee;
        factory.tokens = 0;
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
    /// amount_c Amount being stakes
    /// bump Random seed used to bump PDA off curve
    pub fn stake(ctx: Context<Stake>, amount_c: u64, bump: u8) -> ProgramResult {
        let stake = &mut ctx.accounts.stake;
        stake.unix_timestamp = ctx.accounts.clock.unix_timestamp;
        stake.amount = amount_c;
        let meta = &mut ctx.accounts.meta;
        meta.stakes += 1;
        token::transfer(ctx.accounts.into_ctx_c(), amount_c)?;
        token::mint_to(ctx.accounts.into_ctx_s(), amount_c)?;
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
    pub token_program: AccountInfo<'info>,
    pub token_v: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetExchange<'info> {
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + 32)]
    pub data: Account<'info, ExchangeData>,
    pub factory: Account<'info, FactoryData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + 8 + 8)]
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
    pub user_c: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_s: Account<'info, TokenAccount>,
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
    fn from(
        accounts: &mut AddExchange<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, exchange::Initialize<'info>> {
        let cpi_accounts = exchange::Initialize {
            exchange: accounts.exchange.clone(),
            exchange_v: accounts.exchange_v.clone(),
            factory: accounts.factory.to_account_info(),
            token_c: accounts.token_c.clone(),
            token_program: accounts.token_program.clone(),
            token_v: accounts.token_v.clone(),
        };
        CpiContext::new(accounts.exchange_program.to_account_info(), cpi_accounts)
    }
}

/// Exchange data
#[account]
pub struct ExchangeData {
    pub pda: Pubkey,
}

/// Factory data
#[account]
pub struct FactoryData {
    pub fee: u64,
    pub tokens: u64,
}

/// User meta data
#[account]
pub struct MetaData {
    pub stakes: u64,
}

/// User staking data
#[account]
pub struct StakeData {
    pub amount: u64,
    pub unix_timestamp: i64,
}

/// Quote event
#[event]
pub struct GetExchangeEvent {
    pub pda: Pubkey,
}
