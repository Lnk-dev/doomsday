use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{PlatformConfig, PredictionEvent, UserBet, UserStats, EventStatus};
use crate::errors::PredictionError;
use crate::Outcome;

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        seeds = [PredictionEvent::SEED, &event.event_id.to_le_bytes()],
        bump = event.bump,
        constraint = event.status == EventStatus::Resolved @ PredictionError::EventNotResolved
    )]
    pub event: Account<'info, PredictionEvent>,

    #[account(
        mut,
        seeds = [UserBet::SEED, event.key().as_ref(), user.key().as_ref()],
        bump = user_bet.bump,
        constraint = !user_bet.claimed @ PredictionError::AlreadyClaimed,
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

    /// Platform fee account for DOOM tokens
    #[account(mut)]
    pub doom_fee_account: Account<'info, TokenAccount>,

    /// Platform fee account for LIFE tokens
    #[account(mut)]
    pub life_fee_account: Account<'info, TokenAccount>,

    /// User stats account
    #[account(
        mut,
        seeds = [UserStats::SEED, user.key().as_ref()],
        bump = user_stats.bump
    )]
    pub user_stats: Account<'info, UserStats>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimWinnings>) -> Result<()> {
    let event = &ctx.accounts.event;
    let user_bet = &ctx.accounts.user_bet;
    let platform_config = &ctx.accounts.platform_config;

    // Check if user won
    require!(
        user_bet.is_winner(event.outcome),
        PredictionError::NotAWinner
    );

    // Calculate payout
    let (payout, fee) = event
        .calculate_payout(user_bet.amount, user_bet.outcome, platform_config.fee_basis_points)
        .ok_or(PredictionError::NoWinnings)?;

    // Create signer seeds for the event PDA
    let event_id_bytes = event.event_id.to_le_bytes();
    let seeds = &[
        PredictionEvent::SEED,
        event_id_bytes.as_ref(),
        &[event.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Transfer winnings from both vaults based on outcome
    match user_bet.outcome {
        Outcome::Doom => {
            // Winner bet on DOOM - they get their DOOM back plus share of LIFE pool
            // Return original DOOM bet
            let doom_transfer = Transfer {
                from: ctx.accounts.doom_vault.to_account_info(),
                to: ctx.accounts.user_doom_account.to_account_info(),
                authority: ctx.accounts.event.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    doom_transfer,
                    signer_seeds,
                ),
                user_bet.amount,
            )?;

            // Calculate LIFE winnings (share of losing pool minus fee)
            let life_winnings = payout.saturating_sub(user_bet.amount);
            if life_winnings > 0 {
                // Transfer winnings from LIFE vault
                let life_transfer = Transfer {
                    from: ctx.accounts.life_vault.to_account_info(),
                    to: ctx.accounts.user_life_account.to_account_info(),
                    authority: ctx.accounts.event.to_account_info(),
                };
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        life_transfer,
                        signer_seeds,
                    ),
                    life_winnings,
                )?;
            }

            // Transfer fee to platform
            if fee > 0 {
                let fee_transfer = Transfer {
                    from: ctx.accounts.life_vault.to_account_info(),
                    to: ctx.accounts.life_fee_account.to_account_info(),
                    authority: ctx.accounts.event.to_account_info(),
                };
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        fee_transfer,
                        signer_seeds,
                    ),
                    fee,
                )?;

                // Update platform fee tracking
                let platform_config = &mut ctx.accounts.platform_config;
                platform_config.total_life_fees = platform_config.total_life_fees.saturating_add(fee);
            }
        }
        Outcome::Life => {
            // Winner bet on LIFE - they get their LIFE back plus share of DOOM pool
            // Return original LIFE bet
            let life_transfer = Transfer {
                from: ctx.accounts.life_vault.to_account_info(),
                to: ctx.accounts.user_life_account.to_account_info(),
                authority: ctx.accounts.event.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    life_transfer,
                    signer_seeds,
                ),
                user_bet.amount,
            )?;

            // Calculate DOOM winnings (share of losing pool minus fee)
            let doom_winnings = payout.saturating_sub(user_bet.amount);
            if doom_winnings > 0 {
                // Transfer winnings from DOOM vault
                let doom_transfer = Transfer {
                    from: ctx.accounts.doom_vault.to_account_info(),
                    to: ctx.accounts.user_doom_account.to_account_info(),
                    authority: ctx.accounts.event.to_account_info(),
                };
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        doom_transfer,
                        signer_seeds,
                    ),
                    doom_winnings,
                )?;
            }

            // Transfer fee to platform
            if fee > 0 {
                let fee_transfer = Transfer {
                    from: ctx.accounts.doom_vault.to_account_info(),
                    to: ctx.accounts.doom_fee_account.to_account_info(),
                    authority: ctx.accounts.event.to_account_info(),
                };
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        fee_transfer,
                        signer_seeds,
                    ),
                    fee,
                )?;

                // Update platform fee tracking
                let platform_config = &mut ctx.accounts.platform_config;
                platform_config.total_doom_fees = platform_config.total_doom_fees.saturating_add(fee);
            }
        }
    }

    // Mark as claimed
    let user_bet = &mut ctx.accounts.user_bet;
    user_bet.claimed = true;

    // Update user stats
    let user_stats = &mut ctx.accounts.user_stats;
    user_stats.record_win(user_bet.amount, payout);

    msg!(
        "Claimed {} tokens for event {} (fee: {})",
        payout,
        event.event_id,
        fee
    );

    Ok(())
}
