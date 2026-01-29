use anchor_lang::prelude::*;
use crate::state::{PlatformConfig, PredictionEvent, EventStatus};
use crate::errors::PredictionError;

#[derive(Accounts)]
pub struct CancelEvent<'info> {
    #[account(
        seeds = [PlatformConfig::SEED],
        bump = platform_config.bump,
        constraint = platform_config.authority == authority.key() @ PredictionError::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [PredictionEvent::SEED, &event.event_id.to_le_bytes()],
        bump = event.bump,
        constraint = event.status == EventStatus::Active @ PredictionError::EventAlreadyResolved
    )]
    pub event: Account<'info, PredictionEvent>,

    /// Admin authority
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<CancelEvent>) -> Result<()> {
    let event = &mut ctx.accounts.event;

    event.status = EventStatus::Cancelled;

    msg!("Event {} cancelled by admin", event.event_id);

    Ok(())
}
