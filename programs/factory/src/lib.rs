use anchor_lang::prelude::*;
use exchange::Exchange;

#[program]
pub mod factory {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, template: Pubkey) -> ProgramResult {
        let factory = &mut ctx.accounts.factory;
        factory.exchange_template = template;
        factory.token_count = 0;
        msg!("Initialized factory with template {}", template);
        Ok(())
    }

    pub fn create_exchange(ctx: Context<CreateExchange>, token: Pubkey) -> ProgramResult {
        let factory = &mut ctx.accounts.factory.clone();
        factory.token_count = factory.token_count + 1;
        let exchange_program = ctx.accounts.exchange_program.clone();
        let exchange_accounts = exchange::Initialize {
            exchange: ctx.accounts.exchange.clone().into(),
        };
        let exchange_ctx = CpiContext::new(exchange_program, exchange_accounts);
        exchange::cpi::initialize(exchange_ctx, token)?;
        msg!("Created exchange for token {}", token);
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
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init)]
    pub factory: ProgramAccount<'info, Factory>,
}

#[derive(Accounts)]
pub struct CreateExchange<'info> {
    #[account(mut)]
    pub factory: ProgramAccount<'info, Factory>,
    #[account(mut)]
    pub exchange: CpiAccount<'info, Exchange>,
    pub exchange_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetExchange<'info> {
    #[account(mut)]
    pub factory: ProgramAccount<'info, Factory>,
}

#[derive(Accounts)]
pub struct GetToken<'info> {
    #[account(mut)]
    pub factory: ProgramAccount<'info, Factory>,
}

#[derive(Accounts)]
pub struct GetTokenWithId<'info> {
    #[account(mut)]
    pub factory: ProgramAccount<'info, Factory>,
}

#[account]
pub struct Factory {
    pub exchange_template: Pubkey,
    pub token_count: u64,
}
