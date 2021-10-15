//! A virtual automated market exchange program, inspired by Uniswap V1 seen here:
//! https://github.com/Uniswap/uniswap-v1/. This example has some
//! implementation changes to address the differences between the EVM and
//! Solana's BPF-modified LLVM, but more or less should be the same overall.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, SetAuthority, TokenAccount, Transfer};
use spl_token::instruction::AuthorityType::AccountOwner;

declare_id!("Gx9PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// Exchange
#[program]
pub mod exchange {
    use super::*;

    // TODO: This should use token pk for exchange PDAs
    const EXCHANGE_PDA_SEED: &[u8] = b"exchange";

    /// This function acts as a contract constructor which is not currently
    /// supported in contracts deployed using `initialize()` which is called
    /// once by the factory during contract creation.
    ///
    /// factory Factory public key
    /// token_a Token A public key
    /// token_b Token B public key
    /// token_c Token C public key
    /// fee Fee given in BPS
    pub fn create(
        ctx: Context<Create>,
        token_a: Pubkey,
        token_b: Pubkey,
        token_c: Pubkey,
        fee: u64,
    ) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        exchange.factory = ctx.accounts.factory.key();
        exchange.token_a = token_a;
        exchange.token_b = token_b;
        exchange.token_c = token_c;
        exchange.fee = fee;
        exchange.last_price = 0;
        let (pda, _bump_seed) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        token::set_authority(ctx.accounts.into_ctx_a(), AccountOwner, Some(pda))?;
        token::set_authority(ctx.accounts.into_ctx_b(), AccountOwner, Some(pda))?;
        // TODO: C authority
        Ok(())
    }

    /// Deposit B and A at current ratio to mint C tokens.
    ///
    /// min_liquidity_c does nothing when total C supply is 0
    /// max_amount_a Maximum number of A deposited. Deposits max amount if total C supply is 0
    /// amount_b Amount of B deposited
    /// min_liquidity_c Minimum number of C sender will mint if total C supply is greater than 0
    /// deadline Time after which this transaction can no longer be executed
    #[access_control(bond_future_deadline(&ctx, deadline) bond_correct_tokens(&ctx))]
    pub fn bond(
        ctx: Context<Bond>,
        max_amount_a: u64,
        amount_b: u64,
        min_liquidity_c: u64,
        deadline: i64,
    ) -> ProgramResult {
        let mut liquidity_minted = amount_b;
        let mut amount_a = max_amount_a;
        if ctx.accounts.exchange_a.amount > 0 && ctx.accounts.exchange_b.amount > 0 {
            assert!(min_liquidity_c > 0);
            amount_a = amount_b * ctx.accounts.exchange_a.amount / ctx.accounts.exchange_b.amount;
            liquidity_minted = amount_b * ctx.accounts.mint.supply / ctx.accounts.exchange_a.amount;
            msg!(&format!(
                "max_amount_a: {}, amount_a: {}, liquidity_minted: {}, min_liquidity_c: {}",
                max_amount_a, amount_a, liquidity_minted, min_liquidity_c
            ));
            assert!(max_amount_a >= amount_a && liquidity_minted >= min_liquidity_c);
        }
        msg!(&format!("amount_a: {}, amount_b: {}, liquidity_minted: {}", amount_a, amount_b, liquidity_minted));
        token::transfer(ctx.accounts.into_ctx_a(), amount_a)?;
        token::transfer(ctx.accounts.into_ctx_b(), amount_b)?;
        token::transfer(ctx.accounts.into_ctx_v(), amount_a)?;
        token::mint_to(ctx.accounts.into_ctx_c(), liquidity_minted)?;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        Ok(())
    }

    /// Burn C tokens to withdraw B and A at current ratio.
    ///
    /// amount_c Amount of C burned
    /// min_amount_a Minimum A withdrawn
    /// min_amount_b Minimum B withdrawn
    /// deadline Time after which this transaction can no longer be executed
    #[access_control(unbond_future_deadline(&ctx, deadline) unbond_correct_tokens(&ctx))]
    pub fn unbond(ctx: Context<Unbond>, amount_c: u64, deadline: i64) -> ProgramResult {
        let amount_a = amount_c * ctx.accounts.exchange_a.amount / ctx.accounts.mint.supply;
        let amount_b = amount_c * ctx.accounts.exchange_b.amount / ctx.accounts.mint.supply;
        let (_pda, bump_seed) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        let seeds = &[&EXCHANGE_PDA_SEED[..], &[bump_seed]];
        token::transfer(
            ctx.accounts.into_ctx_a().with_signer(&[&seeds[..]]),
            amount_a,
        )?;
        token::transfer(
            ctx.accounts.into_ctx_b().with_signer(&[&seeds[..]]),
            amount_b,
        )?;
        token::burn(ctx.accounts.into_ctx_c(), amount_c)?;
        Ok(())
    }

    /// Price function for B to A trades with an exact input.
    ///
    /// amount_b Amount of B sold
    /// [quote.price] Amount of A needed to buy input B
    pub fn get_b_to_a_input_price(
        ctx: Context<GetBToAOutputPrice>,
        amount_b: u64,
    ) -> ProgramResult {
        let quote = &mut ctx.accounts.quote;
        quote.price = get_input_price(
            amount_b,
            ctx.accounts.exchange_b.amount,
            ctx.accounts.exchange_a.amount,
            ctx.accounts.exchange.fee,
        );
        Ok(())
    }

    /// Price function for B to A trades with an exact output.
    ///
    /// amount_a Amount of output A bough
    /// [quote.price] Amount of B needed to buy output A
    pub fn get_b_to_a_output_price(
        ctx: Context<GetBToAOutputPrice>,
        amount_a: u64,
    ) -> ProgramResult {
        let quote = &mut ctx.accounts.quote;
        quote.price = get_output_price(
            amount_a,
            ctx.accounts.exchange_a.amount,
            ctx.accounts.exchange_b.amount,
            ctx.accounts.exchange.fee,
        );
        Ok(())
    }

    /// Convert B to A.
    ///
    /// amount_b Amount B sold (exact input)
    pub fn b_to_a_input(
        ctx: Context<Swap>,
        amount_b: u64,
        deadline: Option<i64>,
        direction: Direction,
        equity: u64,
    ) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let amount_a = get_input_price(
            amount_b,
            ctx.accounts.exchange_b.amount - amount_b,
            ctx.accounts.exchange_a.amount,
            ctx.accounts.exchange.fee,
        );
        assert!(amount_a >= 1);
        let (_pda, bump_seed) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        let seeds = &[&EXCHANGE_PDA_SEED[..], &[bump_seed]];
        token::transfer(
            ctx.accounts.into_ctx_a().with_signer(&[&seeds[..]]),
            amount_a,
        )?;
        token::transfer(ctx.accounts.into_ctx_b(), amount_b)?;
        let position = &mut ctx.accounts.position;
        position.direction = direction;
        position.entry = amount_b;
        position.equity = equity;
        position.quantity = amount_b;
        position.status = Status::Open;
        position.unix_timestamp = ts;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        Ok(())
    }

    /// Convert A to B.
    ///
    /// amount_a Amount A sold (exact input)
    pub fn a_to_b_input(
        ctx: Context<Swap>,
        amount_a: u64,
        deadline: Option<i64>,
        direction: Direction,
        equity: u64,
    ) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let amount_b = get_input_price(
            amount_a,
            ctx.accounts.exchange_a.amount - amount_a,
            ctx.accounts.exchange_b.amount,
            ctx.accounts.exchange.fee,
        );
        assert!(amount_b >= 1);
        let (_pda, bump_seed) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        let seeds = &[&EXCHANGE_PDA_SEED[..], &[bump_seed]];
        token::transfer(
            ctx.accounts.into_ctx_a().with_signer(&[&seeds[..]]),
            amount_a,
        )?;
        token::transfer(ctx.accounts.into_ctx_b(), amount_b)?;
        let position = &mut ctx.accounts.position;
        position.direction = direction;
        position.entry = amount_b;
        position.equity = equity;
        position.quantity = amount_b;
        position.status = Status::Open;
        position.unix_timestamp = ts;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        Ok(())
    }

    /// Convert B to A.
    ///
    /// amount_b Amount B sold (exact output)
    pub fn b_to_a_output(
        ctx: Context<Swap>,
        amount_b: u64,
        deadline: Option<i64>,
    ) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let amount_a = get_output_price(
            amount_b,
            ctx.accounts.exchange_b.amount - amount_b,
            ctx.accounts.exchange_a.amount,
            ctx.accounts.exchange.fee,
        );
        assert!(amount_a >= 1);
        token::transfer(ctx.accounts.into_ctx_a(), amount_a)?;
        token::transfer(ctx.accounts.into_ctx_b(), amount_b)?;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        Ok(())
    }

    /// Convert A to B.
    ///
    /// amount_a Amount A sold (exact output)
    pub fn a_to_b_output(
        ctx: Context<Swap>,
        amount_a: u64,
        deadline: Option<i64>,
    ) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let amount_b = get_output_price(
            amount_a,
            ctx.accounts.exchange_a.amount - amount_a,
            ctx.accounts.exchange_b.amount,
            ctx.accounts.exchange.fee,
        );
        assert!(amount_b >= 1);
        token::transfer(ctx.accounts.into_ctx_a(), amount_a)?;
        token::transfer(ctx.accounts.into_ctx_b(), amount_b)?;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(zero)]
    pub exchange: Account<'info, ExchangeData>,
    pub factory: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub exchange_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub exchange_b: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
#[instruction(max_amount_a: u64, amount_b: u64)]
pub struct Bond<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut)]
    pub exchange_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub exchange_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub exchange_v: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub token_program: UncheckedAccount<'info>,
    #[account(mut, constraint = max_amount_a > 0)]
    pub user_a: UncheckedAccount<'info>,
    #[account(mut, constraint = amount_b > 0)]
    pub user_b: UncheckedAccount<'info>,
    #[account(mut)]
    pub user_c: UncheckedAccount<'info>,
    #[account(mut)]
    pub user_v: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(amount_c: u64)]
pub struct Unbond<'info> {
    pub authority: UncheckedAccount<'info>,
    pub token_program: UncheckedAccount<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub pda: UncheckedAccount<'info>,
    #[account(mut)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut, constraint = mint.supply > 0)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub exchange_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub exchange_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_a: UncheckedAccount<'info>,
    #[account(mut)]
    pub user_b: UncheckedAccount<'info>,
    #[account(mut, constraint = amount_c > 0)]
    pub user_c: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(amount_b: u64)]
pub struct GetBToAOutputPrice<'info> {
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub exchange: Account<'info, ExchangeData>,
    #[account(init, payer = authority, space = 8 + 8, constraint = amount_b > 0)]
    pub quote: Account<'info, Quote>,
    pub exchange_a: Account<'info, TokenAccount>,
    pub exchange_b: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut)]
    pub exchange_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub exchange_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    pub pda: UncheckedAccount<'info>,
    #[account(init, payer = authority, space = 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8)]
    pub position: Account<'info, PositionData>,
    pub system_program: Program<'info, System>,
    pub token_program: UncheckedAccount<'info>,
    #[account(mut)]
    pub user_a: UncheckedAccount<'info>,
    #[account(mut)]
    pub user_b: UncheckedAccount<'info>,
}

/// Implements creation accounts
impl<'info> Create<'info> {
    fn into_ctx_a(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.exchange_a.to_account_info(),
            current_authority: self.exchange.to_account_info(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_ctx_b(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.exchange_b.to_account_info(),
            current_authority: self.exchange.to_account_info(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

/// Implements adding liquidity accounts
impl<'info> Bond<'info> {
    fn into_ctx_a(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_a.to_account_info(),
            to: self.exchange_a.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_ctx_b(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_b.to_account_info(),
            to: self.exchange_b.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_ctx_c(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.user_c.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_ctx_v(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_v.to_account_info(),
            to: self.exchange_v.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

/// Implements removing liquidity accounts
impl<'info> Unbond<'info> {
    fn into_ctx_a(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.exchange_a.to_account_info(),
            to: self.user_a.to_account_info(),
            authority: self.pda.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_ctx_b(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.exchange_b.to_account_info(),
            to: self.user_b.to_account_info(),
            authority: self.pda.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    fn into_ctx_c(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: self.mint.to_account_info(),
            to: self.user_c.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

/// Implements swap accounts
impl<'info> Swap<'info> {
    fn into_ctx_a(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.exchange_a.to_account_info(),
            to: self.recipient.to_account_info(),
            authority: self.pda.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_ctx_b(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_b.to_account_info(),
            to: self.exchange_b.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

/// ABC exchange account state.
#[account]
pub struct ExchangeData {
    pub factory: Pubkey,
    pub fee: u64,
    pub last_price: u64,
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub token_c: Pubkey,
}

/// User account state for input and output price quotes.
#[account]
pub struct Quote {
    pub price: u64,
}

/// Specifies if the user is buying / long, or selling / short
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Direction {
    Long,
    Short,
}

/// Trade status must be one of these three
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Status {
    Open,
    Closed,
    Liquidated,
}

/// User position account state
#[account]
pub struct PositionData {
    pub direction: Direction,
    pub entry: u64,
    pub equity: u64,
    pub exit: u64,
    pub status: Status,
    pub quantity: u64,
    pub unix_timestamp: i64,
}

#[error]
pub enum ErrorCode {
    #[msg("Adding or removing liquidity must be done in the present or at a future time")]
    FutureDeadline,
    #[msg("Incorrect tokens")]
    CorrectTokens,
}

/// Deadline must be in the future
fn future_deadline(ts: i64, deadline: i64) -> Result<()> {
    if !(ts <= deadline) {
        return Err(ErrorCode::FutureDeadline.into());
    }
    Ok(())
}

/// Access control function for ensuring transaction is performed in present
/// or future.
///
/// deadline Timestamp specified by user
fn bond_future_deadline<'info>(ctx: &Context<Bond<'info>>, deadline: i64) -> Result<()> {
    future_deadline(ctx.accounts.clock.unix_timestamp, deadline)
}

/// Access control function for ensuring transaction is performed in present
/// or future.
///
/// deadline Timestamp specified by user
fn unbond_future_deadline<'info>(ctx: &Context<Unbond<'info>>, deadline: i64) -> Result<()> {
    future_deadline(ctx.accounts.clock.unix_timestamp, deadline)
}

/// Access control function for ensuring correct token accounts are used.
fn bond_correct_tokens<'info>(ctx: &Context<Bond<'info>>) -> Result<()> {
    if !(ctx.accounts.exchange_a.mint.key() == ctx.accounts.exchange.token_a.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    if !(ctx.accounts.exchange_b.mint.key() == ctx.accounts.exchange.token_b.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    if !(ctx.accounts.mint.key() == ctx.accounts.exchange.token_c.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    Ok(())
}

/// Access control function for ensuring correct token accounts are used.
fn unbond_correct_tokens<'info>(ctx: &Context<Unbond<'info>>) -> Result<()> {
    if !(ctx.accounts.exchange_a.mint.key() == ctx.accounts.exchange.token_a.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    if !(ctx.accounts.exchange_b.mint.key() == ctx.accounts.exchange.token_b.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    if !(ctx.accounts.mint.key() == ctx.accounts.exchange.token_c.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    Ok(())
}

/// Pricing function for converting between B and A.
///
/// input_amount Amount of B or A being sold
/// input_reserve Amount of B or A (input type) in exchange reserves
/// output_reserve Amount of B or A (output type) in exchange reserves
///
/// return Amount of B or A bought
pub fn get_input_price(
    input_amount: u64,
    input_reserve: u64,
    output_reserve: u64,
    fee: u64,
) -> u64 {
    assert!(input_reserve > 0 && output_reserve > 0);
    let input_amount_with_fee = input_amount as f64 * (fee as f64 * 1.00001);
    let numerator = input_amount_with_fee * output_reserve as f64;
    let demonominator = input_reserve as f64 + input_amount_with_fee;
    (numerator / demonominator) as u64
}

/// Pricing function for converting between B and A.
///
/// output_amount Amount of B or A being bought
/// input_reserve Amount of B or A (input type) in exchange reserves
/// output_reserve Amount of B or A (output type) in exchange reserves
///
/// return Amount of B or A sold
pub fn get_output_price(
    output_amount: u64,
    input_reserve: u64,
    output_reserve: u64,
    fee: u64,
) -> u64 {
    assert!(input_reserve > 0 && output_reserve > 0);
    let numerator = input_reserve as f64 * output_amount as f64;
    let denominator = (output_reserve - output_amount) as f64 * (fee as f64 * 1.0001);
    (numerator / denominator + 1.0) as u64
}
