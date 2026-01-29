use anchor_lang::prelude::*;
use crate::Outcome;

/// User's bet on a specific event
/// PDA seeds: ["user_bet", event.key(), user.key()]
#[account]
#[derive(Default)]
pub struct UserBet {
    /// The event this bet is for
    pub event: Pubkey,

    /// The user who placed the bet
    pub user: Pubkey,

    /// The outcome the user bet on (DOOM or LIFE)
    pub outcome: Outcome,

    /// Amount of tokens bet
    pub amount: u64,

    /// Timestamp when bet was placed
    pub placed_at: i64,

    /// Whether winnings have been claimed
    pub claimed: bool,

    /// Whether refund has been claimed (for cancelled events)
    pub refunded: bool,

    /// PDA bump
    pub bump: u8,
}

impl UserBet {
    pub const SIZE: usize = 8 +  // discriminator
        32 + // event
        32 + // user
        1 +  // outcome
        8 +  // amount
        8 +  // placed_at
        1 +  // claimed
        1 +  // refunded
        1 +  // bump
        32;  // padding

    pub const SEED: &'static [u8] = b"user_bet";

    /// Check if this bet won
    pub fn is_winner(&self, event_outcome: Option<Outcome>) -> bool {
        event_outcome == Some(self.outcome)
    }
}
