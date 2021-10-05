use anchor_lang::prelude::*;
use pyth_client::{CorpAction, PriceStatus, PriceType};

declare_id!("Fz9PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod pyth {
    use super::*;

    /// Initializes this program to "internally own" the input account
    pub fn initialize(_ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }

    /// Gets price
    pub fn get_price(ctx: Context<GetPrice>) -> ProgramResult {
        let pyth_product_info = &mut ctx.accounts.pyth_product_info;
        let pyth_price_info = &mut ctx.accounts.pyth_price_info;

        let pyth_product_data = &pyth_product_info.try_borrow_data()?;
        let pyth_product = pyth_client::cast::<pyth_client::Product>(pyth_product_data);

        if pyth_product.magic != pyth_client::MAGIC {
            return Err(ErrorCode::ValidPythAccount.into());
        }
        if pyth_product.atype != pyth_client::AccountType::Product as u32 {
            return Err(ErrorCode::ValidProductAccount.into());
        }
        if pyth_product.ver != pyth_client::VERSION_2 {
            return Err(ErrorCode::PythClientVersion.into());
        }
        if !pyth_product.px_acc.is_valid() {
            return Err(ErrorCode::InvalidProductAccount.into());
        }

        let pyth_price_pubkey = Pubkey::new(&pyth_product.px_acc.val);
        if &pyth_price_pubkey != pyth_price_info.key {
            return Err(ErrorCode::ProductPriceAccount.into());
        }

        let pyth_price_data = &pyth_price_info.try_borrow_data()?;
        let pyth_price = pyth_client::cast::<pyth_client::Price>(pyth_price_data);

        msg!("price_account\t{:?}", pyth_price_info.key);
        msg!("  price_type\t{}", get_price_type(&pyth_price.ptype));
        msg!("  exponent\t{}", pyth_price.expo);
        msg!("  status\t{}", get_status(&pyth_price.agg.status));
        msg!("  corp_act\t{}", get_corp_act(&pyth_price.agg.corp_act));
        msg!("  price\t{}", pyth_price.agg.price);
        msg!("  conf\t{}", pyth_price.agg.conf);
        msg!("  valid_slot\t{}", pyth_price.valid_slot);
        msg!("  publish_slot\t{}", pyth_price.agg.pub_slot);

        Ok(())
    }
}

fn get_price_type(ptype: &PriceType) -> &'static str {
    match ptype {
        PriceType::Unknown => "unknown",
        PriceType::Price => "price",
    }
}

fn get_status(st: &PriceStatus) -> &'static str {
    match st {
        PriceStatus::Unknown => "unknown",
        PriceStatus::Trading => "trading",
        PriceStatus::Halted => "halted",
        PriceStatus::Auction => "auction",
    }
}

fn get_corp_act(cact: &CorpAction) -> &'static str {
    match cact {
        CorpAction::NoCorpAct => "nocorpact",
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub authority: AccountInfo<'info>,
    /// Owned by program
    #[account(init, payer = authority, space = 8 + 8)]
    pub pyth: Account<'info, PythData>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetPrice<'info> {
    /// Owned by program
    #[account(mut)]
    pub pyth: AccountInfo<'info>,
    pub pyth_product_info: AccountInfo<'info>,
    pub pyth_price_info: AccountInfo<'info>,
}

#[account]
pub struct PythData {
    pub data: u64,
}

#[error]
pub enum ErrorCode {
    #[msg("Pyth product account provided is not a valid Pyth account")]
    ValidPythAccount,
    #[msg("Pyth product account provided is not a valid Pyth product account")]
    ValidProductAccount,
    #[msg("Pyth product account provided has a different version than the Pyth client")]
    PythClientVersion,
    #[msg("Pyth product price account is invalid")]
    InvalidProductAccount,
    #[msg("Pyth product price account does not match the Pyth price provided")]
    ProductPriceAccount,
}
