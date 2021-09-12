use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

use exchange::Exchange;

declare_id!("FyuPaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod factory {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, template: Pubkey) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        factory.exchange_template = template;
        factory.token_count = 0;
        Ok(())
    }

    pub fn create_exchange(
        ctx: Context<CreateExchange>,
        token_a: Pubkey,
        token_b: Pubkey,
    ) -> ProgramResult {
        let factory = &mut ctx.accounts.factory.clone();
        factory.token_count = factory.token_count + 1;
        exchange::cpi::create(ctx.accounts.into(), token_a, token_b)
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
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8)]
    pub factory: Account<'info, Factory>,
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CreateExchange<'info> {
    #[account(mut)]
    pub factory: Account<'info, Factory>,
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
    pub exchange_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetExchange<'info> {
    #[account(mut)]
    pub factory: Account<'info, Factory>,
}

#[derive(Accounts)]
pub struct GetToken<'info> {
    #[account(mut)]
    pub factory: Account<'info, Factory>,
}

#[derive(Accounts)]
pub struct GetTokenWithId<'info> {
    #[account(mut)]
    pub factory: Account<'info, Factory>,
}

impl<'a, 'b, 'c, 'd, 'info> From<&mut CreateExchange<'info>>
    for CpiContext<'a, 'b, 'c, 'info, exchange::Create<'info>>
{
    fn from(
        accounts: &mut CreateExchange<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, exchange::Create<'info>> {
        let cpi_accounts = exchange::Create {
            exchange: accounts.exchange.clone().into(),
        };
        let cpi_program = accounts.exchange_program.clone();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[account]
pub struct Factory {
    pub exchange_template: Pubkey,
    pub token_count: u64,
}
