use anchor_lang::prelude::*;
pub mod utils;
use utils::{Price, PriceStatus};

#[cfg(feature = "devnet")]
declare_id!("GLncE8HkQtnVP9ZcwCia4PHdveWAJ2ERoovH1E4ruLyX");
#[cfg(not(any(feature = "devnet")))]
declare_id!("8K39TqyCiv429v6KKmyQ82u9enwSuPH8TJdi3g5fCSwk");

#[program]
pub mod pyth {
    use std::convert::TryInto;
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, price: i64, expo: i32, conf: u64) -> ProgramResult {
        let mut price_oracle = Price::load(&ctx.accounts.price).unwrap();
        price_oracle.agg.status = PriceStatus::Trading;
        price_oracle.agg.price = price;
        price_oracle.agg.conf = conf;
        price_oracle.twap.val = price;
        price_oracle.twac.val = conf.try_into().unwrap();
        price_oracle.expo = expo;
        price_oracle.ptype = utils::PriceType::Price;
        Ok(())
    }

    pub fn set_price(ctx: Context<SetPrice>, price: i64) -> ProgramResult {
        let oracle = &ctx.accounts.price;
        let mut price_oracle = Price::load(&oracle).unwrap();
        price_oracle.agg.price = price.try_into().unwrap();
        Ok(())
    }

    pub fn set_trading(ctx: Context<SetPrice>, status: u8) -> ProgramResult {
        let oracle = &ctx.accounts.price;
        let mut price_oracle = Price::load(&oracle).unwrap();
        match status {
            0 => price_oracle.agg.status = PriceStatus::Unknown,
            1 => price_oracle.agg.status = PriceStatus::Trading,
            2 => price_oracle.agg.status = PriceStatus::Halted,
            3 => price_oracle.agg.status = PriceStatus::Auction,
            _ => {
                msg!("Unknown status: {}", status);
                return Err(ProgramError::Custom(1559));
            }
        }
        Ok(())
    }

    pub fn set_twap(ctx: Context<SetPrice>, value: u64) -> ProgramResult {
        let oracle = &ctx.accounts.price;
        let mut price_oracle = Price::load(&oracle).unwrap();
        price_oracle.twap.val = value.try_into().unwrap();
        Ok(())
    }

    pub fn set_confidence(ctx: Context<SetPrice>, value: u64) -> ProgramResult {
        let oracle = &ctx.accounts.price;
        let mut price_oracle = Price::load(&oracle).unwrap();
        price_oracle.agg.conf = value;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SetPrice<'info> {
    #[account(mut)]
    pub price: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub price: AccountInfo<'info>,
}
