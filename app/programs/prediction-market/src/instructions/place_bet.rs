use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{PlatformConfig, PredictionEvent, UserBet, UserStats};
use crate::errors::PredictionError;
use crate::Outcome;

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED],
        bump = platform_config.bump,
        constraint = !platform_config.paused @ PredictionError::PlatformPaused
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [PredictionEvent::SEED, &event.event_id.to_le_bytes()],
        bump = event.bump
    )]
    pub event: Account<'info, PredictionEvent>,

    #[account(
        init,
        payer = user,
        space = UserBet::SIZE,
        seeds = [UserBet::SEED, event.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,

    /// User's DOOM token account (source for DOOM bets)
    #[account(
        mut,
        constraint = user_doom_account.owner == user.key()
    )]
    pub user_doom_account: Account<'info, TokenAccount>,

    /// User's LIFE token account (source for LIFE bets)
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

    /// User stats account
    #[account(
        init_if_needed,
        payer = user,
        space = UserStats::SIZE,
        seeds = [UserStats::SEED, user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<PlaceBet>, outcome: Outcome, amount: u64) -> Result<()> {
    require!(amount > 0, PredictionError::InvalidBetAmount);

    let clock = Clock::get()?;
    let event = &ctx.accounts.event;

    require!(
        event.is_betting_open(clock.unix_timestamp),
        PredictionError::EventEnded
    );

    // Transfer tokens to the appropriate vault
    let (source, destination) = match outcome {
        Outcome::Doom => (&ctx.accounts.user_doom_account, &ctx.accounts.doom_vault),
        Outcome::Life => (&ctx.accounts.user_life_account, &ctx.accounts.life_vault),
    };

    let transfer_accounts = Transfer {
        from: source.to_account_info(),
        to: destination.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };

    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts),
        amount,
    )?;

    // Update event pools
    let event = &mut ctx.accounts.event;
    match outcome {
        Outcome::Doom => {
            event.doom_pool = event.doom_pool.checked_add(amount).ok_or(PredictionError::Overflow)?;
        }
        Outcome::Life => {
            event.life_pool = event.life_pool.checked_add(amount).ok_or(PredictionError::Overflow)?;
        }
    }
    event.total_bettors = event.total_bettors.saturating_add(1);

    // Record user bet
    let user_bet = &mut ctx.accounts.user_bet;
    user_bet.event = ctx.accounts.event.key();
    user_bet.user = ctx.accounts.user.key();
    user_bet.outcome = outcome;
    user_bet.amount = amount;
    user_bet.placed_at = clock.unix_timestamp;
    user_bet.claimed = false;
    user_bet.refunded = false;
    user_bet.bump = ctx.bumps.user_bet;

    // Update user stats
    let user_stats = &mut ctx.accounts.user_stats;
    if user_stats.user == Pubkey::default() {
        user_stats.user = ctx.accounts.user.key();
        user_stats.bump = ctx.bumps.user_stats;
    }
    user_stats.record_bet(amount, clock.unix_timestamp);

    // Update platform stats
    let platform_config = &mut ctx.accounts.platform_config;
    platform_config.total_bets = platform_config.total_bets.saturating_add(1);

    msg!(
        "Bet placed: {} tokens on {:?} for event {}",
        amount,
        outcome,
        event.event_id
    );

    Ok(())
}
