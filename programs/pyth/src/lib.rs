use anchor_lang::prelude::*;

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
            msg!("Pyth product account provided is not a valid Pyth account");
            return Err(ProgramError::InvalidArgument.into());
        }
        if pyth_product.atype != pyth_client::AccountType::Product as u32 {
            msg!("Pyth product account provided is not a valid Pyth product account");
            return Err(ProgramError::InvalidArgument.into());
        }
        if pyth_product.ver != pyth_client::VERSION_2 {
            msg!("Pyth product account provided has a different version than the Pyth client");
            return Err(ProgramError::InvalidArgument.into());
        }
        if !pyth_product.px_acc.is_valid() {
            msg!("Pyth product price account is invalid");
            return Err(ProgramError::InvalidArgument.into());
        }

        let pyth_price_pubkey = Pubkey::new(&pyth_product.px_acc.val);
        if &pyth_price_pubkey != pyth_price_info.key {
            msg!("Pyth product price account does not match the Pyth price provided");
            return Err(ProgramError::InvalidArgument.into());
        }

        // Put data in caller's account data
        let pyth_price_data = &pyth_price_info.try_borrow_data()?;
        msg!("pyth_price_data.len = {}", pyth_price_data.len());

        let price_data = pyth_client::cast::<pyth_client::Price>(pyth_price_data);

        let account_data = &ctx.accounts.pyth.try_borrow_mut_data()?;
        msg!("account_data.len = {}", account_data.len());

        let account_price_data = &mut pyth_client::cast::<pyth_client::Price>(account_data);
        // Copy semantics
        *account_price_data = price_data;

        msg!("pyth .. {:?}", ctx.accounts.pyth.key);
        msg!("    exponent ..... {}", account_price_data.expo);
        msg!("    price ........ {}", account_price_data.agg.price);
        msg!("    conf ......... {}", account_price_data.agg.conf);
        msg!("    valid_slot ... {}", account_price_data.valid_slot);
        msg!("    publish_slot . {}", account_price_data.agg.pub_slot);
        msg!("    valid slot:    {}", account_price_data.valid_slot);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub authority: AccountInfo<'info>,
    /// Owned by program
    #[account(init, payer = authority, space = 8 + 8)]
    pub pyth: Account<'info, PythData>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: AccountInfo<'info>,
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
