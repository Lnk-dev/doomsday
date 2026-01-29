/**
 * Doomsday Prediction Market Program
 * Issues #34, #35, #36, #54, #77, #100, #131, #132, #134
 *
 * A decentralized prediction market on Solana where users bet on
 * whether predicted "doom" events will occur or not.
 */

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Pred111111111111111111111111111111111111111111");

#[program]
pub mod prediction_market {
    use super::*;

    /// Initialize the platform configuration
    /// Can only be called once by the initial deployer
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        fee_basis_points: u16,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, fee_basis_points)
    }

    /// Create a new prediction event
    /// Anyone can create events, but they need to provide details
    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_id: u64,
        title: String,
        description: String,
        deadline: i64,
        resolution_deadline: i64,
    ) -> Result<()> {
        instructions::create_event::handler(
            ctx,
            event_id,
            title,
            description,
            deadline,
            resolution_deadline,
        )
    }

    /// Place a bet on an event outcome
    /// User bets either DOOM (event will occur) or LIFE (event won't occur)
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        outcome: Outcome,
        amount: u64,
    ) -> Result<()> {
        instructions::place_bet::handler(ctx, outcome, amount)
    }

    /// Resolve an event with the final outcome
    /// Only the oracle can call this
    pub fn resolve_event(
        ctx: Context<ResolveEvent>,
        outcome: Outcome,
    ) -> Result<()> {
        instructions::resolve_event::handler(ctx, outcome)
    }

    /// Claim winnings from a resolved event
    /// Winners can claim their proportional share of the losing pool
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    /// Cancel an event and refund all bets
    /// Only admin can cancel events
    pub fn cancel_event(ctx: Context<CancelEvent>) -> Result<()> {
        instructions::cancel_event::handler(ctx)
    }

    /// Claim refund from a cancelled event
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        instructions::claim_refund::handler(ctx)
    }

    /// Update platform configuration
    /// Only admin can update
    pub fn update_platform(
        ctx: Context<UpdatePlatform>,
        fee_basis_points: Option<u16>,
        new_oracle: Option<Pubkey>,
        paused: Option<bool>,
    ) -> Result<()> {
        instructions::update_platform::handler(ctx, fee_basis_points, new_oracle, paused)
    }
}

/// Betting outcome - either DOOM or LIFE
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Outcome {
    /// Bet that the doom event WILL occur
    Doom,
    /// Bet that the doom event will NOT occur (life prevails)
    Life,
}

impl Default for Outcome {
    fn default() -> Self {
        Outcome::Doom
    }
}
