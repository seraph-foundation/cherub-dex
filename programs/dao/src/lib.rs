use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[cfg(feature = "devnet")]
declare_id!("4NQzmUoot2wLACXbkSZLLUAVCfjBxAx9M6sVmCSHaE38");
#[cfg(not(any(feature = "devnet")))]
declare_id!("4NQzmUoot2wLACXbkSZLLUAVCfjBxAx9M6sVmCSHaE38");

/// DAO
#[program]
pub mod dao {
    use super::*;

    /// Initializes the DAO account.
    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> ProgramResult {
        let dao = &mut ctx.accounts.dao;
        dao.authority = authority;
        dao.proposals = 0;
        Ok(())
    }

    /// Creates a new proposal.
    ///
    /// bump Nonce used for PDA
    /// deadline Unix timestamp for proposal voting deadline
    /// description Proposal
    pub fn propose(
        ctx: Context<Propose>,
        bump: u8,
        deadline: i64,
        description: String,
    ) -> ProgramResult {
        let proposal = &mut ctx.accounts.proposal;
        proposal.created = ctx.accounts.clock.unix_timestamp;
        proposal.deadline = deadline;
        proposal.description = description;
        let dao = &mut ctx.accounts.dao;
        proposal.index = dao.proposals;
        dao.proposals += 1;
        Ok(())
    }

    /// Votes on a proposal.
    pub fn vote(ctx: Context<Vote>) -> ProgramResult {
        let proposal = &mut ctx.accounts.proposal;
        assert!(ctx.accounts.clock.unix_timestamp <= proposal.deadline);
        proposal.votes += ctx.accounts.token_s.amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + 40)]
    pub dao: Account<'info, DaoData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Propose<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub dao: Account<'info, DaoData>,
    #[account(
        init,
        payer = authority,
        space = 8 + 8 + 8 + 8 + 8 + 256,
        seeds = [dao.proposals.to_string().as_bytes()],
        bump
    )]
    pub proposal: Account<'info, ProposalData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub dao: Account<'info, DaoData>,
    #[account(mut)]
    pub proposal: Account<'info, ProposalData>,
    pub token_s: Account<'info, TokenAccount>,
}

#[account]
pub struct DaoData {
    pub authority: Pubkey,
    pub proposals: u64,
}

#[account]
pub struct ProposalData {
    pub created: i64,
    pub deadline: i64,
    pub description: String,
    pub index: u64,
    pub votes: u64,
}
