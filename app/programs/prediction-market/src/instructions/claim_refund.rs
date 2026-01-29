use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{PredictionEvent, UserBet, EventStatus};
use crate::errors::PredictionError;
use crate::Outcome;

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(
        seeds = [PredictionEvent::SEED, &event.event_id.to_le_bytes()],
        bump = event.bump,
        constraint = event.status == EventStatus::Cancelled @ PredictionError::EventNotCancelled
    )]
    pub event: Account<'info, PredictionEvent>,

    #[account(
        mut,
        seeds = [UserBet::SEED, event.key().as_ref(), user.key().as_ref()],
        bump = user_bet.bump,
        constraint = !user_bet.refunded @ PredictionError::RefundAlreadyClaimed,
        constraint = user_bet.user == user.key()
    )]
    pub user_bet: Account<'info, UserBet>,

    /// User's DOOM token account
    #[account(
        mut,
        constraint = user_doom_account.owner == user.key()
    )]
    pub user_doom_account: Account<'info, TokenAccount>,

    /// User's LIFE token account
    #[account(
        mut,
        constraint = user_life_account.owner == user.key()
    )]
    pub user_life_account: Account<'info, TokenAccount>,

    /// Event DOOM vault
    #[account(
        mut,
        seeds = [PredictionEvent::DOOM_VAULT_SEED, event.key().as_ref()],
        bump = event.doom_vault_bump
    )]
    pub doom_vault: Account<'info, TokenAccount>,

    /// Event LIFE vault
    #[account(
        mut,
        seeds = [PredictionEvent::LIFE_VAULT_SEED, event.key().as_ref()],
        bump = event.life_vault_bump
    )]
    pub life_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimRefund>) -> Result<()> {
    let event = &ctx.accounts.event;
    let user_bet = &ctx.accounts.user_bet;

    // Create signer seeds for the event PDA
    let event_id_bytes = event.event_id.to_le_bytes();
    let seeds = &[
        PredictionEvent::SEED,
        event_id_bytes.as_ref(),
        &[event.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Transfer refund from appropriate vault
    match user_bet.outcome {
        Outcome::Doom => {
            let transfer_accounts = Transfer {
                from: ctx.accounts.doom_vault.to_account_info(),
                to: ctx.accounts.user_doom_account.to_account_info(),
                authority: ctx.accounts.event.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    transfer_accounts,
                    signer_seeds,
                ),
                user_bet.amount,
            )?;
        }
        Outcome::Life => {
            let transfer_accounts = Transfer {
                from: ctx.accounts.life_vault.to_account_info(),
                to: ctx.accounts.user_life_account.to_account_info(),
                authority: ctx.accounts.event.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    transfer_accounts,
                    signer_seeds,
                ),
                user_bet.amount,
            )?;
        }
    }

    // Mark as refunded
    let user_bet = &mut ctx.accounts.user_bet;
    user_bet.refunded = true;

    msg!(
        "Refunded {} tokens for cancelled event {}",
        user_bet.amount,
        event.event_id
    );

    Ok(())
}
