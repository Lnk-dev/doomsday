use anchor_lang::prelude::*;
use crate::state::{PlatformConfig, PredictionEvent, EventStatus};
use crate::errors::PredictionError;
use crate::Outcome;

#[derive(Accounts)]
pub struct ResolveEvent<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED],
        bump = platform_config.bump,
        constraint = platform_config.oracle == oracle.key() @ PredictionError::UnauthorizedOracle
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [PredictionEvent::SEED, &event.event_id.to_le_bytes()],
        bump = event.bump
    )]
    pub event: Account<'info, PredictionEvent>,

    /// Oracle authority - must match platform_config.oracle
    pub oracle: Signer<'info>,
}

pub fn handler(ctx: Context<ResolveEvent>, outcome: Outcome) -> Result<()> {
    let clock = Clock::get()?;
    let event = &mut ctx.accounts.event;

    // Validate event state
    require!(
        event.status == EventStatus::Active,
        PredictionError::EventAlreadyResolved
    );

    require!(
        clock.unix_timestamp >= event.deadline,
        PredictionError::EventNotResolved
    );

    require!(
        clock.unix_timestamp <= event.resolution_deadline,
        PredictionError::ResolutionDeadlinePassed
    );

    // Update event
    event.status = EventStatus::Resolved;
    event.outcome = Some(outcome);
    event.resolved_at = Some(clock.unix_timestamp);

    // Update platform stats
    let platform_config = &mut ctx.accounts.platform_config;
    platform_config.total_events = platform_config.total_events.saturating_add(1);

    msg!(
        "Event {} resolved with outcome: {:?}",
        event.event_id,
        outcome
    );

    Ok(())
}
