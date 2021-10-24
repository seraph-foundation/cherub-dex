use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

declare_id!("G79PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// DAO
#[program]
pub mod dao {
    use super::*;

    /// Initializes the DAO account
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let dao = &mut ctx.accounts.dao;
        dao.proposals = 0;
        Ok(())
    }

    /// Creates a new proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        deadline: i64,
        description: String,
    ) -> ProgramResult {
        let dao = &mut ctx.accounts.dao;
        dao.proposals += 1;
        let proposal = &mut ctx.accounts.proposal;
        proposal.created = ctx.accounts.clock.unix_timestamp;
        proposal.deadline = deadline;
        proposal.description = description;
        Ok(())
    }

    /// Votes on a proposal
    pub fn vote(ctx: Context<Vote>) -> ProgramResult {
        let proposal = &mut ctx.accounts.proposal;
        assert!(ctx.accounts.clock.unix_timestamp <= proposal.deadline);
        proposal.votes += ctx.accounts.token_s.amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(init, payer = authority, space = 8 + 8)]
    pub dao: Account<'info, DaoData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    #[account(mut)]
    pub dao: Account<'info, DaoData>,
    #[account(init, payer = authority, space = 8 + 8 + 8 + 8 + 256)]
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
