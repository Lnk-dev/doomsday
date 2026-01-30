/**
 * Doomsday Prediction Market Program (Minimal Version)
 * Deploys to devnet for testing integration
 */

use anchor_lang::prelude::*;

declare_id!("BMmGykphijTgvB7WMim9UVqi9976iibKf6uYAiGXC7Mc");

#[program]
pub mod prediction_market {
    use super::*;

    /// Initialize the platform configuration
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        fee_basis_points: u16,
    ) -> Result<()> {
        require!(
            fee_basis_points <= 10000,
            PredictionError::InvalidFeeBasisPoints
        );

        let config = &mut ctx.accounts.platform_config;
        config.authority = ctx.accounts.authority.key();
        config.oracle = ctx.accounts.authority.key();
        config.fee_basis_points = fee_basis_points;
        config.paused = false;
        config.total_doom_fees = 0;
        config.total_life_fees = 0;
        config.total_events = 0;
        config.total_bets = 0;
        config.bump = ctx.bumps.platform_config;

        msg!("Platform initialized with {}bps fee", fee_basis_points);
        Ok(())
    }

    /// Create a new prediction event
    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_id: u64,
        title: String,
        description: String,
        deadline: i64,
        resolution_deadline: i64,
    ) -> Result<()> {
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
        event.bump = ctx.bumps.event;

        let platform_config = &mut ctx.accounts.platform_config;
        platform_config.total_events = platform_config.total_events.saturating_add(1);

        msg!("Event {} created: {}", event_id, event.title);
        Ok(())
    }

    /// Place a bet on an event
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        outcome: Outcome,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, PredictionError::InvalidBetAmount);

        let clock = Clock::get()?;

        // Get values before mutable borrows
        let event_key = ctx.accounts.event.key();
        let user_key = ctx.accounts.user.key();
        let event_status = ctx.accounts.event.status;
        let event_deadline = ctx.accounts.event.deadline;
        let event_id = ctx.accounts.event.event_id;

        require!(
            event_status == EventStatus::Active,
            PredictionError::EventEnded
        );
        require!(
            clock.unix_timestamp < event_deadline,
            PredictionError::EventEnded
        );

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
        user_bet.event = event_key;
        user_bet.user = user_key;
        user_bet.outcome = outcome;
        user_bet.amount = amount;
        user_bet.placed_at = clock.unix_timestamp;
        user_bet.claimed = false;
        user_bet.refunded = false;
        user_bet.bump = ctx.bumps.user_bet;

        let platform_config = &mut ctx.accounts.platform_config;
        platform_config.total_bets = platform_config.total_bets.saturating_add(1);

        msg!("Bet placed: {} on {:?} for event {}", amount, outcome, event_id);
        Ok(())
    }

    /// Resolve an event with the final outcome
    pub fn resolve_event(
        ctx: Context<ResolveEvent>,
        outcome: Outcome,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let event = &mut ctx.accounts.event;

        require!(
            event.status == EventStatus::Active,
            PredictionError::EventAlreadyResolved
        );
        require!(
            clock.unix_timestamp >= event.deadline,
            PredictionError::EventNotResolved
        );

        event.status = EventStatus::Resolved;
        event.outcome = Some(outcome);
        event.resolved_at = Some(clock.unix_timestamp);

        msg!("Event {} resolved with outcome: {:?}", event.event_id, outcome);
        Ok(())
    }

    /// Cancel an event
    pub fn cancel_event(ctx: Context<CancelEvent>) -> Result<()> {
        let event = &mut ctx.accounts.event;
        event.status = EventStatus::Cancelled;
        msg!("Event {} cancelled", event.event_id);
        Ok(())
    }

    /// Update platform configuration
    pub fn update_platform(
        ctx: Context<UpdatePlatform>,
        fee_basis_points: Option<u16>,
        new_oracle: Option<Pubkey>,
        paused: Option<bool>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.platform_config;

        if let Some(fee) = fee_basis_points {
            require!(fee <= 10000, PredictionError::InvalidFeeBasisPoints);
            config.fee_basis_points = fee;
        }
        if let Some(oracle) = new_oracle {
            config.oracle = oracle;
        }
        if let Some(is_paused) = paused {
            config.paused = is_paused;
        }

        Ok(())
    }
}

// Account Contexts
#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_id: u64)]
pub struct CreateEvent<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = !platform_config.paused @ PredictionError::PlatformPaused
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        init,
        payer = creator,
        space = 8 + PredictionEvent::INIT_SPACE,
        seeds = [b"event", event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub event: Account<'info, PredictionEvent>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = !platform_config.paused @ PredictionError::PlatformPaused
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Account<'info, PredictionEvent>,
    #[account(
        init,
        payer = user,
        space = 8 + UserBet::INIT_SPACE,
        seeds = [b"user_bet", event.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveEvent<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = platform_config.oracle == oracle.key() @ PredictionError::UnauthorizedOracle
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Account<'info, PredictionEvent>,
    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelEvent<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = platform_config.authority == authority.key() @ PredictionError::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Account<'info, PredictionEvent>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdatePlatform<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = platform_config.authority == authority.key() @ PredictionError::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    pub authority: Signer<'info>,
}

// State Accounts
#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub oracle: Pubkey,
    pub fee_basis_points: u16,
    pub paused: bool,
    pub total_doom_fees: u64,
    pub total_life_fees: u64,
    pub total_events: u64,
    pub total_bets: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PredictionEvent {
    pub event_id: u64,
    pub creator: Pubkey,
    #[max_len(128)]
    pub title: String,
    #[max_len(512)]
    pub description: String,
    pub deadline: i64,
    pub resolution_deadline: i64,
    pub status: EventStatus,
    pub outcome: Option<Outcome>,
    pub doom_pool: u64,
    pub life_pool: u64,
    pub total_bettors: u32,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserBet {
    pub event: Pubkey,
    pub user: Pubkey,
    pub outcome: Outcome,
    pub amount: u64,
    pub placed_at: i64,
    pub claimed: bool,
    pub refunded: bool,
    pub bump: u8,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum Outcome {
    Doom,
    Life,
}

impl Default for Outcome {
    fn default() -> Self {
        Outcome::Doom
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum EventStatus {
    Active,
    Resolved,
    Cancelled,
}

impl Default for EventStatus {
    fn default() -> Self {
        EventStatus::Active
    }
}

// Errors
#[error_code]
pub enum PredictionError {
    #[msg("Invalid fee basis points")]
    InvalidFeeBasisPoints,
    #[msg("Platform is paused")]
    PlatformPaused,
    #[msg("Invalid title")]
    InvalidTitle,
    #[msg("Invalid description")]
    InvalidDescription,
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Invalid resolution deadline")]
    InvalidResolutionDeadline,
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
    #[msg("Event has ended")]
    EventEnded,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Event already resolved")]
    EventAlreadyResolved,
    #[msg("Event not yet resolvable")]
    EventNotResolved,
    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,
    #[msg("Unauthorized")]
    Unauthorized,
}
