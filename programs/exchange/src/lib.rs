//! A virtual automated market exchange program, inspired by Uniswap V1 seen here:
//! https://github.com/Uniswap/uniswap-v1/. This example has some
//! implementation changes to address the differences between the EVM and
//! Solana's BPF-modified LLVM, but more or less should be the same overall.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, SetAuthority, Transfer};
use spl_token::instruction::AuthorityType::AccountOwner;

use pyth::utils::Price;

#[cfg(feature = "devnet")]
declare_id!("5wruGah8XQEhtpALeQufRYrQSYW6FpUYw3NfWr18AHXZ");
#[cfg(not(any(feature = "devnet")))]
declare_id!("5wruGah8XQEhtpALeQufRYrQSYW6FpUYw3NfWr18AHXZ");

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
    /// fee Fee given in BPS
    pub fn create(ctx: Context<Create>, fee: u64) -> ProgramResult {
        let exchange = &mut ctx.accounts.exchange;
        exchange.factory = ctx.accounts.factory.key();
        exchange.fee = fee;
        exchange.last_price = 0;
        exchange.supply_a = 0;
        exchange.supply_b = 0;
        exchange.token_c = ctx.accounts.token_c.key();
        exchange.token_v = ctx.accounts.token_v.key();
        let (pda, _nonce) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        token::set_authority(ctx.accounts.into_ctx_v(), AccountOwner, Some(pda))?;
        Ok(())
    }

    /// Deposit B and A at current ratio to mint C tokens.
    ///
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
        if ctx.accounts.exchange.supply_a > 0 && ctx.accounts.exchange.supply_b > 0 {
            assert!(min_liquidity_c > 0);
            amount_a = (amount_b as f64 * ctx.accounts.exchange.supply_a as f64
                / ctx.accounts.exchange.supply_b as f64) as u64;
            liquidity_minted = (amount_b as f64 * ctx.accounts.mint_c.supply as f64
                / ctx.accounts.exchange.supply_a as f64) as u64;
            msg!(&format!(
                "{} {} {} {}",
                max_amount_a, amount_a, liquidity_minted, min_liquidity_c
            ));
            assert!(max_amount_a >= amount_a && liquidity_minted >= min_liquidity_c);
        }
        token::transfer(ctx.accounts.into_ctx_v(), amount_a)?;
        token::mint_to(ctx.accounts.into_ctx_c(), liquidity_minted)?;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        exchange.supply_a += amount_a;
        exchange.supply_b += liquidity_minted;
        Ok(())
    }

    /// Burn C tokens to withdraw B and A at current ratio.
    ///
    /// amount_c Amount of C burned
    /// deadline Time after which this transaction can no longer be executed
    #[access_control(unbond_future_deadline(&ctx, deadline) unbond_correct_tokens(&ctx))]
    pub fn unbond(ctx: Context<Unbond>, amount_c: u64, deadline: i64) -> ProgramResult {
        let amount_a = (amount_c as f64 * ctx.accounts.exchange.supply_a as f64
            / ctx.accounts.mint_c.supply as f64) as u64;
        let amount_b = (amount_c as f64 * ctx.accounts.exchange.supply_b as f64
            / ctx.accounts.mint_c.supply as f64) as u64;
        let (_pda, nonce) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        let seeds = &[&EXCHANGE_PDA_SEED[..], &[nonce]];
        token::transfer(
            ctx.accounts.into_ctx_v().with_signer(&[&seeds[..]]),
            amount_a,
        )?;
        token::burn(ctx.accounts.into_ctx_c(), amount_c)?;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        exchange.supply_a -= amount_a;
        exchange.supply_b -= amount_b;
        Ok(())
    }

    /// Price function for B to A trades with an exact input.
    ///
    /// amount_b Amount of B sold
    pub fn get_b_to_a_input_price(
        ctx: Context<GetBToAOutputPrice>,
        amount_b: u64,
    ) -> ProgramResult {
        let quote = &mut ctx.accounts.quote;
        quote.price = get_input_price(
            amount_b,
            ctx.accounts.exchange.supply_b,
            ctx.accounts.exchange.supply_a,
            ctx.accounts.exchange.fee,
        );
        Ok(())
    }

    /// Price function for B to A trades with an exact output.
    ///
    /// amount_a Amount of output A bough
    pub fn get_b_to_a_output_price(
        ctx: Context<GetBToAOutputPrice>,
        amount_a: u64,
    ) -> ProgramResult {
        let quote = &mut ctx.accounts.quote;
        quote.price = get_output_price(
            amount_a,
            ctx.accounts.exchange.supply_a,
            ctx.accounts.exchange.supply_b,
            ctx.accounts.exchange.fee,
        );
        Ok(())
    }

    /// Convert A to B.
    ///
    /// amount_a Amount A sold (exact input)
    /// deadline Time after which this transaction can no longer be executed
    /// direction Trade can be long or short
    /// equity Collateral used
    pub fn a_to_b_input(
        ctx: Context<Swap>,
        amount_a: u64,
        bump: u8,
        deadline: Option<i64>,
        direction: Direction,
        equity: u64,
        index: u64,
    ) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let amount_b = get_input_price(
            amount_a,
            ctx.accounts.exchange.supply_a - amount_a,
            ctx.accounts.exchange.supply_b,
            ctx.accounts.exchange.fee,
        );
        assert!(amount_b >= 1);
        let (_pda, nonce) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        let seeds = &[&EXCHANGE_PDA_SEED[..], &[nonce]];
        token::transfer(
            ctx.accounts.into_ctx_v().with_signer(&[&seeds[..]]),
            amount_a,
        )?;
        let position = &mut ctx.accounts.position;
        position.direction = direction;
        position.entry = amount_b;
        position.equity = equity;
        position.quantity = amount_b;
        position.status = Status::Open;
        position.unix_timestamp = ts;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        exchange.supply_a += amount_a;
        exchange.supply_b -= amount_b;
        Ok(())
    }

    /// Convert B to A.
    ///
    /// amount_b Amount B sold (exact input)
    /// deadline Time after which this transaction can no longer be executed
    /// direction Trade can be long or short
    /// equity Collateral used for position
    pub fn b_to_a_input(
        ctx: Context<Swap>,
        amount_b: u64,
        bump: u8,
        deadline: Option<i64>,
        direction: Direction,
        equity: u64,
        index: u64,
    ) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let amount_a = get_input_price(
            amount_b,
            ctx.accounts.exchange.supply_b - amount_b,
            ctx.accounts.exchange.supply_a,
            ctx.accounts.exchange.fee,
        );
        assert!(amount_a >= 1);
        let (_pda, nonce) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        let seeds = &[&EXCHANGE_PDA_SEED[..], &[nonce]];
        token::transfer(
            ctx.accounts.into_ctx_v().with_signer(&[&seeds[..]]),
            amount_a,
        )?;
        let position = &mut ctx.accounts.position;
        position.direction = direction;
        position.entry = amount_b;
        position.equity = equity;
        position.quantity = amount_b;
        position.status = Status::Open;
        position.unix_timestamp = ts;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        exchange.supply_a -= amount_a;
        exchange.supply_b += amount_b;
        Ok(())
    }

    /// Convert B to A.
    ///
    /// amount_b Amount B sold (exact output)
    /// deadline Time after which this transaction can no longer be executed
    pub fn b_to_a_output(
        ctx: Context<Swap>,
        amount_b: u64,
        deadline: Option<i64>,
        index: u64,
    ) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let amount_a = get_output_price(
            amount_b,
            ctx.accounts.exchange.supply_b - amount_b,
            ctx.accounts.exchange.supply_a,
            ctx.accounts.exchange.fee,
        );
        assert!(amount_a >= 1);
        let (_pda, nonce) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        let seeds = &[&EXCHANGE_PDA_SEED[..], &[nonce]];
        token::transfer(
            ctx.accounts.into_ctx_v().with_signer(&[&seeds[..]]),
            amount_a,
        )?;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        exchange.supply_a -= amount_a;
        exchange.supply_b += amount_b;
        Ok(())
    }

    /// Convert A to B.
    ///
    /// amount_a Amount A sold (exact output)
    /// deadline Time after which this transaction can no longer be executed
    pub fn a_to_b_output(
        ctx: Context<Swap>,
        amount_a: u64,
        deadline: Option<i64>,
        index: u64,
    ) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let amount_b = get_output_price(
            amount_a,
            ctx.accounts.exchange.supply_a - amount_a,
            ctx.accounts.exchange.supply_b,
            ctx.accounts.exchange.fee,
        );
        assert!(amount_b >= 1);
        let (_pda, nonce) = Pubkey::find_program_address(&[EXCHANGE_PDA_SEED], ctx.program_id);
        let seeds = &[&EXCHANGE_PDA_SEED[..], &[nonce]];
        token::transfer(
            ctx.accounts.into_ctx_v().with_signer(&[&seeds[..]]),
            amount_b,
        )?;
        let exchange = &mut ctx.accounts.exchange;
        exchange.last_price = amount_b;
        exchange.supply_a += amount_a;
        exchange.supply_b -= amount_b;
        Ok(())
    }

    /// Liquidate position. When margin drops to zero this is the bankruptcy price.
    /// The bankruptcy and liquidation price spread goes to the insurance fund.
    /// Initial margin is set at the beginning and can be calculated using the
    /// order quantity and position equity. Maintenance margin is used to keep
    /// the position open.
    ///
    /// deadline Time after which this transaction can no longer be executed
    pub fn liquidate(ctx: Context<Update>, deadline: Option<i64>) -> ProgramResult {
        let ts = ctx.accounts.clock.unix_timestamp;
        assert!(deadline.unwrap_or(ts) >= ts);
        let oracle = Price::load(&ctx.accounts.oracle).unwrap();
        let position = &mut ctx.accounts.position;
        let pnl = match position.direction {
            Direction::Long => {
                (1.0 / position.entry as f64 - 1.0 / oracle.agg.price as f64)
                    * position.quantity as f64
                    * position.equity as f64
            }
            Direction::Short => {
                (1.0 / oracle.agg.price as f64 - 1.0 / position.entry as f64)
                    * position.quantity as f64
                    * position.equity as f64
            }
        };
        assert!(pnl <= 0.0);
        position.status = Status::Liquidated;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(zero)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut)]
    pub exchange_v: AccountInfo<'info>,
    pub factory: AccountInfo<'info>,
    pub token_c: AccountInfo<'info>,
    pub token_v: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(max_amount_a: u64, amount_b: u64)]
pub struct Bond<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut)]
    pub exchange_v: AccountInfo<'info>,
    #[account(mut)]
    pub mint_c: Account<'info, Mint>,
    pub token_program: AccountInfo<'info>,
    #[account(mut, constraint = amount_b > 0)]
    pub user_c: AccountInfo<'info>,
    #[account(mut, constraint = max_amount_a > 0)]
    pub user_v: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(max_amount_a: u64, amount_c: u64)]
pub struct Unbond<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut)]
    pub exchange_v: AccountInfo<'info>,
    #[account(mut, constraint = mint_c.supply > 0)]
    pub mint_c: Account<'info, Mint>,
    pub token_program: AccountInfo<'info>,
    #[account(mut, constraint = amount_c > 0)]
    pub user_c: AccountInfo<'info>,
    #[account(mut, constraint = max_amount_a > 0)]
    pub user_v: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(amount_b: u64)]
pub struct GetBToAOutputPrice<'info> {
    pub authority: Signer<'info>,
    pub exchange: Account<'info, ExchangeData>,
    #[account(init, payer = authority, space = 8 + 8, constraint = amount_b > 0)]
    pub quote: Account<'info, Quote>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(index: u64, bump: u8)]
pub struct Swap<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut)]
    pub exchange_v: UncheckedAccount<'info>,
    pub pda: UncheckedAccount<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8,
        seeds = [exchange.token_v.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub position: Account<'info, PositionData>,
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub user_v: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub exchange: Account<'info, ExchangeData>,
    #[account(mut)]
    pub exchange_v: UncheckedAccount<'info>,
    #[account(mut)]
    pub oracle: AccountInfo<'info>,
    #[account(mut)]
    pub position: Account<'info, PositionData>,
    pub system_program: Program<'info, System>,
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub user_v: UncheckedAccount<'info>,
}

/// Implements creation accounts
impl<'info> Create<'info> {
    fn into_ctx_v(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.exchange_v.to_account_info(),
            current_authority: self.exchange.to_account_info(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

/// Implements adding liquidity accounts
impl<'info> Bond<'info> {
    fn into_ctx_c(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.mint_c.to_account_info(),
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
    fn into_ctx_c(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: self.mint_c.to_account_info(),
            to: self.user_c.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_ctx_v(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.exchange_v.to_account_info(),
            to: self.user_v.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

/// Implements swap accounts
impl<'info> Swap<'info> {
    fn into_ctx_v(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_v.to_account_info(),
            to: self.exchange_v.to_account_info(),
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
    pub supply_a: u64,
    pub supply_b: u64,
    pub token_c: Pubkey,
    pub token_v: Pubkey,
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
    Closed,
    Liquidated,
    Open,
}

/// User position account state
#[account]
pub struct PositionData {
    pub direction: Direction,
    pub entry: u64,
    pub equity: u64,
    pub exit: u64,
    pub quantity: u64,
    pub status: Status,
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
    if !(ctx.accounts.mint_c.key() == ctx.accounts.exchange.token_c.key()) {
        return Err(ErrorCode::CorrectTokens.into());
    }
    Ok(())
}

/// Access control function for ensuring correct token accounts are used.
fn unbond_correct_tokens<'info>(ctx: &Context<Unbond<'info>>) -> Result<()> {
    if !(ctx.accounts.mint_c.key() == ctx.accounts.exchange.token_c.key()) {
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
