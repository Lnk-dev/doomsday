use anchor_lang::prelude::*;
use crate::Outcome;

/// Status of a prediction event
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum EventStatus {
    /// Event is active and accepting bets
    #[default]
    Active,
    /// Event has been resolved with an outcome
    Resolved,
    /// Event has been cancelled, bets can be refunded
    Cancelled,
}

/// Prediction event account
/// PDA seeds: ["event", event_id.to_le_bytes()]
#[account]
#[derive(Default)]
pub struct PredictionEvent {
    /// Unique event identifier
    pub event_id: u64,

    /// Event creator
    pub creator: Pubkey,

    /// Event title (max 128 chars)
    pub title: String,

    /// Event description (max 512 chars)
    pub description: String,

    /// Unix timestamp when betting closes
    pub deadline: i64,

    /// Unix timestamp by which event must be resolved
    pub resolution_deadline: i64,

    /// Current event status
    pub status: EventStatus,

    /// Final outcome (set when resolved)
    pub outcome: Option<Outcome>,

    /// Total amount bet on DOOM outcome
    pub doom_pool: u64,

    /// Total amount bet on LIFE outcome
    pub life_pool: u64,

    /// Number of unique bettors
    pub total_bettors: u64,

    /// Timestamp when event was created
    pub created_at: i64,

    /// Timestamp when event was resolved (if resolved)
    pub resolved_at: Option<i64>,

    /// DOOM token vault bump
    pub doom_vault_bump: u8,

    /// LIFE token vault bump
    pub life_vault_bump: u8,

    /// Event PDA bump
    pub bump: u8,
}

impl PredictionEvent {
    pub const SIZE: usize = 8 +   // discriminator
        8 +   // event_id
        32 +  // creator
        4 + 128 + // title (4 bytes length prefix + max chars)
        4 + 512 + // description
        8 +   // deadline
        8 +   // resolution_deadline
        1 +   // status
        2 +   // outcome (Option<enum>)
        8 +   // doom_pool
        8 +   // life_pool
        8 +   // total_bettors
        8 +   // created_at
        9 +   // resolved_at (Option<i64>)
        1 +   // doom_vault_bump
        1 +   // life_vault_bump
        1 +   // bump
        64;   // padding

    pub const SEED: &'static [u8] = b"event";
    pub const DOOM_VAULT_SEED: &'static [u8] = b"vault_doom";
    pub const LIFE_VAULT_SEED: &'static [u8] = b"vault_life";

    /// Check if betting is still open
    pub fn is_betting_open(&self, current_time: i64) -> bool {
        self.status == EventStatus::Active && current_time < self.deadline
    }

    /// Check if event can be resolved
    pub fn can_resolve(&self, current_time: i64) -> bool {
        self.status == EventStatus::Active && current_time >= self.deadline
    }

    /// Get total pool size
    pub fn total_pool(&self) -> u64 {
        self.doom_pool.saturating_add(self.life_pool)
    }

    /// Calculate implied odds for DOOM outcome (as percentage * 100)
    pub fn doom_odds(&self) -> u64 {
        let total = self.total_pool();
        if total == 0 {
            return 5000; // 50% if no bets
        }
        ((self.doom_pool as u128 * 10000) / total as u128) as u64
    }

    /// Calculate implied odds for LIFE outcome (as percentage * 100)
    pub fn life_odds(&self) -> u64 {
        let total = self.total_pool();
        if total == 0 {
            return 5000; // 50% if no bets
        }
        ((self.life_pool as u128 * 10000) / total as u128) as u64
    }

    /// Calculate payout for a winning bet
    /// Returns (user_payout, platform_fee)
    pub fn calculate_payout(
        &self,
        bet_amount: u64,
        bet_outcome: Outcome,
        fee_basis_points: u16,
    ) -> Option<(u64, u64)> {
        // Check if this is a winning bet
        if self.outcome != Some(bet_outcome) {
            return None;
        }

        let winning_pool = match bet_outcome {
            Outcome::Doom => self.doom_pool,
            Outcome::Life => self.life_pool,
        };

        let losing_pool = match bet_outcome {
            Outcome::Doom => self.life_pool,
            Outcome::Life => self.doom_pool,
        };

        if winning_pool == 0 {
            return None;
        }

        // User's share of the losing pool
        // share = (bet_amount / winning_pool) * losing_pool
        let share = (bet_amount as u128)
            .checked_mul(losing_pool as u128)?
            .checked_div(winning_pool as u128)?;

        // Calculate fee on the winnings (share of losing pool)
        let fee = share
            .checked_mul(fee_basis_points as u128)?
            .checked_div(10000)?;

        // Net winnings = share - fee
        let net_winnings = share.checked_sub(fee)?;

        // Total payout = original bet + net winnings
        let total_payout = (bet_amount as u128).checked_add(net_winnings)?;

        Some((total_payout as u64, fee as u64))
    }
}
