use anchor_lang::prelude::*;

/// Global platform configuration account
/// PDA seeds: ["platform_config"]
#[account]
#[derive(Default)]
pub struct PlatformConfig {
    /// Admin authority who can update config and cancel events
    pub authority: Pubkey,

    /// Oracle authority who can resolve events
    pub oracle: Pubkey,

    /// Platform fee in basis points (e.g., 200 = 2%)
    pub fee_basis_points: u16,

    /// Whether the platform is paused
    pub paused: bool,

    /// Total fees collected in DOOM tokens
    pub total_doom_fees: u64,

    /// Total fees collected in LIFE tokens
    pub total_life_fees: u64,

    /// Total number of events created
    pub total_events: u64,

    /// Total number of bets placed
    pub total_bets: u64,

    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl PlatformConfig {
    pub const SIZE: usize = 8 + // discriminator
        32 + // authority
        32 + // oracle
        2 +  // fee_basis_points
        1 +  // paused
        8 +  // total_doom_fees
        8 +  // total_life_fees
        8 +  // total_events
        8 +  // total_bets
        1 +  // bump
        64;  // padding for future fields

    pub const SEED: &'static [u8] = b"platform_config";

    /// Calculate fee amount from a given value
    pub fn calculate_fee(&self, amount: u64) -> Option<u64> {
        // fee = amount * fee_basis_points / 10000
        let fee = (amount as u128)
            .checked_mul(self.fee_basis_points as u128)?
            .checked_div(10000)?;
        Some(fee as u64)
    }
}
