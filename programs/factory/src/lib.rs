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
        token_x: Pubkey,
        decimals_x: u64,
        token_y: Pubkey,
        decimals_y: u64,
    ) -> ProgramResult {
        let factory = &mut ctx.accounts.factory.clone();
        factory.token_count = factory.token_count + 1;
        let exchange_program = ctx.accounts.exchange_program.clone();
        let exchange_accounts = exchange::Create {
            exchange: ctx.accounts.exchange.clone().into(),
        };
        let exchange_ctx = CpiContext::new(exchange_program, exchange_accounts);
        exchange::cpi::create(exchange_ctx, token_x, decimals_x, token_y, decimals_y)?;
        Ok(())
    }

    pub fn get_exchange(_ctx: Context<GetExchange>, token: Pubkey) -> ProgramResult {
        Ok(())
    }

    pub fn get_token(_ctx: Context<GetToken>, token: Pubkey) -> ProgramResult {
        Ok(())
    }

    pub fn get_token_with_id(_ctx: Context<GetTokenWithId>, token: Pubkey) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8)]
    pub factory: Account<'info, Factory>,
    #[account(signer)]
    pub user: AccountInfo<'info>,
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

#[account]
pub struct Factory {
    pub exchange_template: Pubkey,
    pub token_count: u64,
}
