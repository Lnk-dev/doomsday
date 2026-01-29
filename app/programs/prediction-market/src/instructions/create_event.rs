use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::{PlatformConfig, PredictionEvent, EventStatus, UserStats};
use crate::errors::PredictionError;

#[derive(Accounts)]
#[instruction(event_id: u64)]
pub struct CreateEvent<'info> {
    #[account(
        seeds = [PlatformConfig::SEED],
        bump = platform_config.bump,
        constraint = !platform_config.paused @ PredictionError::PlatformPaused
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        init,
        payer = creator,
        space = PredictionEvent::SIZE,
        seeds = [PredictionEvent::SEED, &event_id.to_le_bytes()],
        bump
    )]
    pub event: Account<'info, PredictionEvent>,

    /// DOOM token mint
    pub doom_mint: Account<'info, Mint>,

    /// LIFE token mint
    pub life_mint: Account<'info, Mint>,

    /// DOOM token vault for this event
    #[account(
        init,
        payer = creator,
        token::mint = doom_mint,
        token::authority = event,
        seeds = [PredictionEvent::DOOM_VAULT_SEED, event.key().as_ref()],
        bump
    )]
    pub doom_vault: Account<'info, TokenAccount>,

    /// LIFE token vault for this event
    #[account(
        init,
        payer = creator,
        token::mint = life_mint,
        token::authority = event,
        seeds = [PredictionEvent::LIFE_VAULT_SEED, event.key().as_ref()],
        bump
    )]
    pub life_vault: Account<'info, TokenAccount>,

    /// User stats account (created if doesn't exist)
    #[account(
        init_if_needed,
        payer = creator,
        space = UserStats::SIZE,
        seeds = [UserStats::SEED, creator.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateEvent>,
    event_id: u64,
    title: String,
    description: String,
    deadline: i64,
    resolution_deadline: i64,
) -> Result<()> {
    // Validate inputs
    require!(
        !title.is_empty() && title.len() <= 128,
        PredictionError::InvalidTitle
    );
    require!(
        !description.is_empty() && description.len() <= 512,
        PredictionError::InvalidDescription
    );

    let clock = Clock::get()?;
    require!(
        deadline > clock.unix_timestamp,
        PredictionError::InvalidDeadline
    );
    require!(
        resolution_deadline > deadline,
        PredictionError::InvalidResolutionDeadline
    );

    let event = &mut ctx.accounts.event;

    event.event_id = event_id;
    event.creator = ctx.accounts.creator.key();
    event.title = title;
    event.description = description;
    event.deadline = deadline;
    event.resolution_deadline = resolution_deadline;
    event.status = EventStatus::Active;
    event.outcome = None;
    event.doom_pool = 0;
    event.life_pool = 0;
    event.total_bettors = 0;
    event.created_at = clock.unix_timestamp;
    event.resolved_at = None;
    event.doom_vault_bump = ctx.bumps.doom_vault;
    event.life_vault_bump = ctx.bumps.life_vault;
    event.bump = ctx.bumps.event;

    // Update user stats
    let user_stats = &mut ctx.accounts.user_stats;
    if user_stats.user == Pubkey::default() {
        user_stats.user = ctx.accounts.creator.key();
        user_stats.bump = ctx.bumps.user_stats;
    }
    user_stats.events_created = user_stats.events_created.saturating_add(1);

    msg!("Event {} created: {}", event_id, event.title);

    Ok(())
}
