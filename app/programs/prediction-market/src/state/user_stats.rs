use anchor_lang::prelude::*;

/// Aggregated statistics for a user
/// PDA seeds: ["user_stats", user.key()]
#[account]
#[derive(Default)]
pub struct UserStats {
    /// The user this stats account belongs to
    pub user: Pubkey,

    /// Total number of bets placed
    pub total_bets: u64,

    /// Number of winning bets
    pub wins: u64,

    /// Number of losing bets
    pub losses: u64,

    /// Total amount wagered (across all bets)
    pub total_wagered: u64,

    /// Total amount won (gross winnings)
    pub total_won: u64,

    /// Total amount lost
    pub total_lost: u64,

    /// Net profit/loss (can be negative)
    pub net_profit: i64,

    /// Number of events created by this user
    pub events_created: u64,

    /// Timestamp of first bet
    pub first_bet_at: Option<i64>,

    /// Timestamp of most recent bet
    pub last_bet_at: Option<i64>,

    /// Current win streak
    pub current_streak: i64, // Positive = wins, negative = losses

    /// Best win streak
    pub best_streak: u64,

    /// Worst loss streak
    pub worst_streak: u64,

    /// PDA bump
    pub bump: u8,
}

impl UserStats {
    pub const SIZE: usize = 8 +  // discriminator
        32 + // user
        8 +  // total_bets
        8 +  // wins
        8 +  // losses
        8 +  // total_wagered
        8 +  // total_won
        8 +  // total_lost
        8 +  // net_profit
        8 +  // events_created
        9 +  // first_bet_at
        9 +  // last_bet_at
        8 +  // current_streak
        8 +  // best_streak
        8 +  // worst_streak
        1 +  // bump
        32;  // padding

    pub const SEED: &'static [u8] = b"user_stats";

    /// Calculate win rate as percentage (0-10000 for 0-100%)
    pub fn win_rate(&self) -> u64 {
        if self.total_bets == 0 {
            return 0;
        }
        (self.wins * 10000) / self.total_bets
    }

    /// Record a new bet
    pub fn record_bet(&mut self, amount: u64, timestamp: i64) {
        self.total_bets = self.total_bets.saturating_add(1);
        self.total_wagered = self.total_wagered.saturating_add(amount);

        if self.first_bet_at.is_none() {
            self.first_bet_at = Some(timestamp);
        }
        self.last_bet_at = Some(timestamp);
    }

    /// Record a win
    pub fn record_win(&mut self, amount_wagered: u64, amount_won: u64) {
        self.wins = self.wins.saturating_add(1);
        self.total_won = self.total_won.saturating_add(amount_won);

        // Update net profit
        let profit = (amount_won as i64).saturating_sub(amount_wagered as i64);
        self.net_profit = self.net_profit.saturating_add(profit);

        // Update streak
        if self.current_streak >= 0 {
            self.current_streak = self.current_streak.saturating_add(1);
        } else {
            self.current_streak = 1;
        }

        if self.current_streak as u64 > self.best_streak {
            self.best_streak = self.current_streak as u64;
        }
    }

    /// Record a loss
    pub fn record_loss(&mut self, amount_wagered: u64) {
        self.losses = self.losses.saturating_add(1);
        self.total_lost = self.total_lost.saturating_add(amount_wagered);

        // Update net profit (negative change)
        self.net_profit = self.net_profit.saturating_sub(amount_wagered as i64);

        // Update streak
        if self.current_streak <= 0 {
            self.current_streak = self.current_streak.saturating_sub(1);
        } else {
            self.current_streak = -1;
        }

        if (self.current_streak.abs() as u64) > self.worst_streak {
            self.worst_streak = self.current_streak.abs() as u64;
        }
    }
}
