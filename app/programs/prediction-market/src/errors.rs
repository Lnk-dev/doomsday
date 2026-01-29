use anchor_lang::prelude::*;

#[error_code]
pub enum PredictionError {
    #[msg("Platform is currently paused")]
    PlatformPaused,

    #[msg("Event has already ended")]
    EventEnded,

    #[msg("Event is not yet resolved")]
    EventNotResolved,

    #[msg("Event has already been resolved")]
    EventAlreadyResolved,

    #[msg("Event has been cancelled")]
    EventCancelled,

    #[msg("Resolution deadline has passed")]
    ResolutionDeadlinePassed,

    #[msg("Resolution deadline has not passed yet")]
    ResolutionDeadlineNotPassed,

    #[msg("Invalid bet amount - must be greater than zero")]
    InvalidBetAmount,

    #[msg("Bet already placed on this event")]
    BetAlreadyPlaced,

    #[msg("No bet found for this user")]
    NoBetFound,

    #[msg("Winnings already claimed")]
    AlreadyClaimed,

    #[msg("User did not win this bet")]
    NotAWinner,

    #[msg("No winnings to claim")]
    NoWinnings,

    #[msg("Invalid event title - must be between 1 and 128 characters")]
    InvalidTitle,

    #[msg("Invalid event description - must be between 1 and 512 characters")]
    InvalidDescription,

    #[msg("Invalid deadline - must be in the future")]
    InvalidDeadline,

    #[msg("Invalid resolution deadline - must be after betting deadline")]
    InvalidResolutionDeadline,

    #[msg("Fee basis points cannot exceed 10000 (100%)")]
    InvalidFeeBasisPoints,

    #[msg("Unauthorized - only admin can perform this action")]
    Unauthorized,

    #[msg("Unauthorized - only oracle can resolve events")]
    UnauthorizedOracle,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Insufficient funds in vault")]
    InsufficientVaultFunds,

    #[msg("Event ID already exists")]
    EventIdExists,

    #[msg("Refund already claimed")]
    RefundAlreadyClaimed,

    #[msg("Event is not cancelled")]
    EventNotCancelled,
}
