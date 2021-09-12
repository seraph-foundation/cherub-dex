use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Transfer, TokenAccount};

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
        token_x: Pubkey,
        token_y: Pubkey,
    ) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        exchange.token_x = token_x;
        exchange.token_y = token_y;
        exchange.total_supply_x = 0;
        exchange.total_supply_y = 0;
        Ok(())
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        max_tokens_x: u64,
        min_liquidity_x: u64,
        max_tokens_y: u64,
        min_liquidity_y: u64,
        deadline: i64,
    ) -> ProgramResult {
        assert!(
            max_tokens_x > 0 && max_tokens_y > 0 && deadline > ctx.accounts.clock.unix_timestamp
        );

        let exchange = &mut ctx.accounts.exchange;
        if exchange.total_supply_y > 0 {
            // eth_reserve: uint256(wei) = self.balance - msg.value
            // token_reserve: uint256 = self.token.balanceOf(self)
            // token_amount: uint256 = msg.value * token_reserve / eth_reserve + 1
            // liquidity_minted: uint256 = msg.value * total_liquidity / eth_reserve
            // assert max_tokens >= token_amount and liquidity_minted >= min_liquidity
            // self.balances[msg.sender] += liquidity_minted
            // self.totalSupply = total_liquidity + liquidity_minted
            let y_reserve = exchange.total_supply_y - max_tokens_y;
            let x_amount = max_tokens_y * exchange.total_supply_x / y_reserve + 1;
            let liquidity_minted = max_tokens_y * exchange.total_supply_y / y_reserve;
            assert!(max_tokens_x >= x_amount && liquidity_minted >= min_liquidity_x);
            exchange.total_supply_x = exchange.total_supply_x + liquidity_minted;
        } else {
            // token_amount: uint256 = max_tokens
            // initial_liquidity: uint256 = as_unitless_number(self.balance)  # `balance` is already defined
            // self.totalSupply = initial_liquidity
            // self.balances[msg.sender] = initial_liquidity
            // assert self.token.transferFrom(msg.sender, self, token_amount)
            let initial_liquidity = exchange.total_supply_y;
            exchange.total_supply_x = initial_liquidity;
            token::transfer(ctx.accounts.into_x_context(), max_tokens_x)?;
        }

        token::transfer(ctx.accounts.into_y_context(), max_tokens_y)
    }

    pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, amount: u64) -> ProgramResult {
        token::transfer(ctx.accounts.into(), amount)
    }

    pub fn get_input_price(_ctx: Context<GetInputPrice>) -> ProgramResult {
        Ok(())
    }

    pub fn get_output_price(_ctx: Context<GetOutputPrice>) -> ProgramResult {
        Ok(())
    }

    pub fn x_to(_ctx: Context<XTo>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 8 + 8)]
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
pub struct AddLiquidity<'info> {
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub from_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub from_y: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_y: Account<'info, TokenAccount>,
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub from_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub from_y: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_y: Account<'info, TokenAccount>,
    pub token_program: AccountInfo<'info>,
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
pub struct XTo<'info> {
    pub exchange: Account<'info, Exchange>,
}

impl<'info> AddLiquidity<'info> {
    fn into_x_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_x.to_account_info().clone(),
            to: self.to_x.to_account_info().clone(),
            authority: self.authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_y_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_y.to_account_info().clone(),
            to: self.to_y.to_account_info().clone(),
            authority: self.authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

impl<'a, 'b, 'c, 'd, 'info> From<&mut RemoveLiquidity<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &mut RemoveLiquidity<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts.from_x.to_account_info().clone(),
            to: accounts.to_x.to_account_info().clone(),
            authority: accounts.authority.clone(),
        };
        let cpi_program = accounts.token_program.clone();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[account]
pub struct Exchange {
    pub factory: Pubkey,
    pub token_x: Pubkey,
    pub token_y: Pubkey,
    pub total_supply_x: u64,
    pub total_supply_y: u64,
}
