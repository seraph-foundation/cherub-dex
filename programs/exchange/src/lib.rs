use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token::{self, Transfer};

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
        decimals_x: u64,
        token_y: Pubkey,
        decimals_y: u64,
    ) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        exchange.token_x = token_x;
        exchange.decimals_x = decimals_x;
        exchange.token_y = token_y;
        exchange.decimals_y = decimals_y;
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

        let authority = &mut ctx.accounts.authority;
        let exchange = &mut ctx.accounts.exchange;

        let from_x = &mut ctx.accounts.from_x;
        let from_y = &mut ctx.accounts.from_y;

        let total_liquidity_x = exchange.total_supply_x;

        //if total_liquidity_x > 0 {
        //    // eth_reserve: uint256(wei) = self.balance - msg.value
        //    // token_reserve: uint256 = self.token.balanceOf(self)
        //    // token_xmount: uint256 = msg.value * token_reserve / eth_reserve + 1
        //    // liquidity_minted: uint256 = msg.value * total_liquidity / eth_reserve
        //    // assert max_tokens >= token_amount and liquidity_minted >= min_liquidity
        //    // self.balances[msg.sender] += liquidity_minted
        //    // self.totalSupply = total_liquidity + liquidity_minted
        //    let sol_reserve = exchange.balance - sol;
        //    let token_reserve = exchange.total_supply;
        //    let token_amount = sol * token_reserve / sol_reserve + 1;
        //    let liquidity_minted = sol * total_liquidity / sol_reserve;
        //    assert!(max_tokens >= token_amount && liquidity_minted >= min_liquidity);
        //    exchange.total_supply = max_tokens;
        //} else {
        //    // token_amount: uint256 = max_tokens
        //    // initial_liquidity: uint256 = as_unitless_number(self.balance)  # `balance` is already defined
        //    // self.totalSupply = initial_liquidity
        //    // self.balances[msg.sender] = initial_liquidity
        //    // assert self.token.transferFrom(msg.sender, self, token_amount)
        //    let token_amount = max_tokens;
        //    let initial_liquidity = exchange.balance;
        //    let total_supply = initial_liquidity;
        //    exchange.total_supply = token_amount;
        //}

        token::transfer(ctx.accounts.into_y_context(), max_tokens_y);
        token::transfer(ctx.accounts.into(), max_tokens_x)
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

    pub fn sol_to(_ctx: Context<SolTo>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8)]
    pub exchange: Account<'info, Exchange>,
    #[account(signer)]
    pub user: AccountInfo<'info>,
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
    pub from_x: AccountInfo<'info>,
    #[account(mut)]
    pub to_x: AccountInfo<'info>,
    #[account(mut)]
    pub from_y: AccountInfo<'info>,
    #[account(mut)]
    pub to_y: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub from_x: AccountInfo<'info>,
    #[account(mut)]
    pub to_x: AccountInfo<'info>,
    #[account(mut)]
    pub from_y: AccountInfo<'info>,
    #[account(mut)]
    pub to_y: AccountInfo<'info>,
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
pub struct SolTo<'info> {
    pub exchange: Account<'info, Exchange>,
}

impl<'info> AddLiquidity<'info> {
    fn into_y_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.from_y.clone(),
            to: self.to_y.clone(),
            authority: self.authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

impl<'a, 'b, 'c, 'd, 'info> From<&mut AddLiquidity<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(accounts: &mut AddLiquidity<'info>) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts.from_x.clone(),
            to: accounts.to_x.clone(),
            authority: accounts.authority.clone(),
        };
        let cpi_program = accounts.token_program.clone();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl<'a, 'b, 'c, 'd, 'info> From<&mut RemoveLiquidity<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &mut RemoveLiquidity<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts.from_x.clone(),
            to: accounts.to_x.clone(),
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
    pub decimals_x: u64,
    pub token_y: Pubkey,
    pub decimals_y: u64,
    pub total_supply_x: u64,
    pub total_supply_y: u64,
}
