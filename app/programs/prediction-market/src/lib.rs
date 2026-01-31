/**
 * Doomsday Prediction Market Program
 * Full version with SPL token vault integration
 */

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

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
        config.doom_mint = ctx.accounts.doom_mint.key();
        config.life_mint = ctx.accounts.life_mint.key();
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

    /// Create a new prediction event with token vaults
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

        // Derive vault PDAs for this event
        let (doom_vault_pda, doom_vault_bump) = Pubkey::find_program_address(
            &[b"vault_doom", event_id.to_le_bytes().as_ref()],
            ctx.program_id
        );
        let (life_vault_pda, life_vault_bump) = Pubkey::find_program_address(
            &[b"vault_life", event_id.to_le_bytes().as_ref()],
            ctx.program_id
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
        event.doom_vault = doom_vault_pda;
        event.life_vault = life_vault_pda;
        event.bump = ctx.bumps.event;
        event.doom_vault_bump = doom_vault_bump;
        event.life_vault_bump = life_vault_bump;

        let platform_config = &mut ctx.accounts.platform_config;
        platform_config.total_events = platform_config.total_events.saturating_add(1);

        msg!("Event {} created: {}", event_id, event.title);
        Ok(())
    }

    /// Place a bet on an event with token transfer
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

        // Transfer tokens from user to event vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.event_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

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

    /// Claim winnings after event resolution
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let event = &ctx.accounts.event;
        let user_bet = &mut ctx.accounts.user_bet;
        let platform_config = &ctx.accounts.platform_config;

        // Verify event is resolved
        require!(
            event.status == EventStatus::Resolved,
            PredictionError::EventNotResolved
        );

        // Verify bet hasn't been claimed
        require!(!user_bet.claimed, PredictionError::AlreadyClaimed);

        // Verify user won
        let event_outcome = event.outcome.ok_or(PredictionError::EventNotResolved)?;
        require!(
            user_bet.outcome == event_outcome,
            PredictionError::DidNotWin
        );

        // Calculate payout
        let (winning_pool, losing_pool) = match event_outcome {
            Outcome::Doom => (event.doom_pool, event.life_pool),
            Outcome::Life => (event.life_pool, event.doom_pool),
        };

        // Ensure winning pool is not zero (prevents division by zero)
        require!(winning_pool > 0, PredictionError::InvalidWinningPool);

        let total_pool = winning_pool.checked_add(losing_pool).ok_or(PredictionError::Overflow)?;

        // Calculate user's share of the winnings
        // payout = (bet_amount / winning_pool) * total_pool
        let user_share = (user_bet.amount as u128)
            .checked_mul(total_pool as u128)
            .ok_or(PredictionError::Overflow)?
            .checked_div(winning_pool as u128)
            .ok_or(PredictionError::Overflow)? as u64;

        // Calculate platform fee
        let fee = user_share
            .checked_mul(platform_config.fee_basis_points as u64)
            .ok_or(PredictionError::Overflow)?
            .checked_div(10000)
            .ok_or(PredictionError::Overflow)?;

        let payout = user_share.checked_sub(fee).ok_or(PredictionError::Overflow)?;

        // Transfer winnings from vault to user
        let event_id_bytes = event.event_id.to_le_bytes();
        let seeds: &[&[u8]] = match event_outcome {
            Outcome::Doom => &[b"vault_doom", event_id_bytes.as_ref(), &[event.doom_vault_bump]],
            Outcome::Life => &[b"vault_life", event_id_bytes.as_ref(), &[event.life_vault_bump]],
        };
        let signer_seeds = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.event_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.event_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, payout)?;

        // Mark bet as claimed
        let user_bet = &mut ctx.accounts.user_bet;
        user_bet.claimed = true;

        msg!(
            "Claimed {} (fee: {}) for event {}",
            payout,
            fee,
            event.event_id
        );
        Ok(())
    }

    /// Refund bet for cancelled event
    pub fn refund_bet(ctx: Context<RefundBet>) -> Result<()> {
        let event = &ctx.accounts.event;
        let user_bet = &mut ctx.accounts.user_bet;

        // Verify event is cancelled
        require!(
            event.status == EventStatus::Cancelled,
            PredictionError::EventNotCancelled
        );

        // Verify bet hasn't been refunded
        require!(!user_bet.refunded, PredictionError::AlreadyRefunded);

        // Determine which vault to refund from
        let event_id_bytes = event.event_id.to_le_bytes();
        let seeds: &[&[u8]] = match user_bet.outcome {
            Outcome::Doom => &[b"vault_doom", event_id_bytes.as_ref(), &[event.doom_vault_bump]],
            Outcome::Life => &[b"vault_life", event_id_bytes.as_ref(), &[event.life_vault_bump]],
        };
        let signer_seeds = &[seeds];

        // Transfer refund from vault to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.event_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.event_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, user_bet.amount)?;

        // Mark bet as refunded
        user_bet.refunded = true;

        msg!("Refunded {} for event {}", user_bet.amount, event.event_id);
        Ok(())
    }

    /// Cancel an event
    pub fn cancel_event(ctx: Context<CancelEvent>) -> Result<()> {
        let event = &mut ctx.accounts.event;

        require!(
            event.status == EventStatus::Active,
            PredictionError::EventAlreadyResolved
        );

        event.status = EventStatus::Cancelled;
        msg!("Event {} cancelled", event.event_id);
        Ok(())
    }

    /// Initialize DOOM vault for an event
    /// Must be called after create_event to set up token account for DOOM bets
    pub fn initialize_doom_vault(ctx: Context<InitializeDoomVault>) -> Result<()> {
        let event = &ctx.accounts.event;

        // Verify the vault matches what's stored in the event
        require!(
            ctx.accounts.doom_vault.key() == event.doom_vault,
            PredictionError::InvalidVault
        );

        msg!("DOOM vault initialized for event {}", event.event_id);
        msg!("DOOM vault: {}", ctx.accounts.doom_vault.key());

        Ok(())
    }

    /// Initialize LIFE vault for an event
    /// Must be called after create_event to set up token account for LIFE bets
    pub fn initialize_life_vault(ctx: Context<InitializeLifeVault>) -> Result<()> {
        let event = &ctx.accounts.event;

        // Verify the vault matches what's stored in the event
        require!(
            ctx.accounts.life_vault.key() == event.life_vault,
            PredictionError::InvalidVault
        );

        msg!("LIFE vault initialized for event {}", event.event_id);
        msg!("LIFE vault: {}", ctx.accounts.life_vault.key());

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

    /// Migrate platform configuration from old format to new format with token mints
    /// This instruction reallocates the account and adds doom_mint and life_mint fields
    pub fn migrate_platform(ctx: Context<MigratePlatform>) -> Result<()> {
        let config_info = &ctx.accounts.platform_config;
        let authority = &ctx.accounts.authority;

        // Verify authority matches the one stored in the account
        let data = config_info.try_borrow_data()?;
        let stored_authority = Pubkey::try_from(&data[8..40]).unwrap();
        require!(
            stored_authority == authority.key(),
            PredictionError::Unauthorized
        );
        drop(data);

        // Calculate new size needed
        let new_size = 8 + PlatformConfig::INIT_SPACE;
        let current_size = config_info.data_len();

        // Already migrated if account is correct size
        if current_size >= new_size {
            msg!("Platform already migrated (size: {})", current_size);
            return Ok(());
        }

        // Reallocate account to new size
        let rent = Rent::get()?;
        let new_minimum_balance = rent.minimum_balance(new_size);
        let current_balance = config_info.lamports();

        // Transfer additional lamports if needed
        if current_balance < new_minimum_balance {
            let lamports_diff = new_minimum_balance - current_balance;
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    anchor_lang::system_program::Transfer {
                        from: authority.to_account_info(),
                        to: config_info.to_account_info(),
                    },
                ),
                lamports_diff,
            )?;
        }

        // Reallocate account
        config_info.realloc(new_size, false)?;

        // Now we need to manually update the account data since we can't use
        // Anchor's Account wrapper on a reallocating instruction
        let mut data = config_info.try_borrow_mut_data()?;

        // Read existing data (first 108 bytes of old format)
        // Old format: discriminator(8) + authority(32) + oracle(32) + fee(2) + paused(1) +
        //             total_doom_fees(8) + total_life_fees(8) + total_events(8) + total_bets(8) + bump(1)
        // = 108 bytes

        // New format: discriminator(8) + authority(32) + oracle(32) + doom_mint(32) + life_mint(32) +
        //             fee(2) + paused(1) + total_doom_fees(8) + total_life_fees(8) + total_events(8) +
        //             total_bets(8) + bump(1) = 172 bytes

        // Extract old data
        let authority_bytes: [u8; 32] = data[8..40].try_into().unwrap();
        let oracle_bytes: [u8; 32] = data[40..72].try_into().unwrap();
        let fee_bytes: [u8; 2] = data[72..74].try_into().unwrap();
        let paused_byte = data[74];
        let total_doom_fees_bytes: [u8; 8] = data[75..83].try_into().unwrap();
        let total_life_fees_bytes: [u8; 8] = data[83..91].try_into().unwrap();
        let total_events_bytes: [u8; 8] = data[91..99].try_into().unwrap();
        let total_bets_bytes: [u8; 8] = data[99..107].try_into().unwrap();
        let bump_byte = data[107];

        // Get new mint addresses from context
        let doom_mint_bytes = ctx.accounts.doom_mint.key().to_bytes();
        let life_mint_bytes = ctx.accounts.life_mint.key().to_bytes();

        // Write new format data
        // Discriminator stays the same (first 8 bytes)
        // Authority (8..40)
        data[8..40].copy_from_slice(&authority_bytes);
        // Oracle (40..72)
        data[40..72].copy_from_slice(&oracle_bytes);
        // Doom mint (72..104) - NEW
        data[72..104].copy_from_slice(&doom_mint_bytes);
        // Life mint (104..136) - NEW
        data[104..136].copy_from_slice(&life_mint_bytes);
        // Fee basis points (136..138)
        data[136..138].copy_from_slice(&fee_bytes);
        // Paused (138)
        data[138] = paused_byte;
        // Total doom fees (139..147)
        data[139..147].copy_from_slice(&total_doom_fees_bytes);
        // Total life fees (147..155)
        data[147..155].copy_from_slice(&total_life_fees_bytes);
        // Total events (155..163)
        data[155..163].copy_from_slice(&total_events_bytes);
        // Total bets (163..171)
        data[163..171].copy_from_slice(&total_bets_bytes);
        // Bump (171)
        data[171] = bump_byte;

        msg!("Platform migrated from {} to {} bytes", current_size, new_size);
        msg!("DOOM mint: {}", ctx.accounts.doom_mint.key());
        msg!("LIFE mint: {}", ctx.accounts.life_mint.key());

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
    pub doom_mint: Account<'info, Mint>,
    pub life_mint: Account<'info, Mint>,
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
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    #[account(
        init,
        payer = creator,
        space = 8 + PredictionEvent::INIT_SPACE,
        seeds = [b"event", event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub event: Box<Account<'info, PredictionEvent>>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction()]
pub struct InitializeDoomVault<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Account<'info, PredictionEvent>,
    /// DOOM token vault for this event
    #[account(
        init,
        payer = payer,
        token::mint = doom_mint,
        token::authority = doom_vault,
        seeds = [b"vault_doom", event.event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub doom_vault: Account<'info, TokenAccount>,
    #[account(
        constraint = doom_mint.key() == platform_config.doom_mint @ PredictionError::InvalidMint
    )]
    pub doom_mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction()]
pub struct InitializeLifeVault<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    #[account(
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Account<'info, PredictionEvent>,
    /// LIFE token vault for this event
    #[account(
        init,
        payer = payer,
        token::mint = life_mint,
        token::authority = life_vault,
        seeds = [b"vault_life", event.event_id.to_le_bytes().as_ref()],
        bump
    )]
    pub life_vault: Account<'info, TokenAccount>,
    #[account(
        constraint = life_mint.key() == platform_config.life_mint @ PredictionError::InvalidMint
    )]
    pub life_mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
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
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    #[account(
        mut,
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Box<Account<'info, PredictionEvent>>,
    #[account(
        init,
        payer = user,
        space = 8 + UserBet::INIT_SPACE,
        seeds = [b"user_bet", event.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_bet: Box<Account<'info, UserBet>>,
    /// User's token account (source of bet)
    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ PredictionError::InvalidTokenAccount
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,
    /// Event vault to deposit bet (DOOM or LIFE vault based on outcome)
    /// Must match one of the event's vaults and have correct mint
    #[account(
        mut,
        constraint = (event_vault.key() == event.doom_vault || event_vault.key() == event.life_vault) @ PredictionError::InvalidVault,
        constraint = (event_vault.mint == platform_config.doom_mint || event_vault.mint == platform_config.life_mint) @ PredictionError::InvalidMint
    )]
    pub event_vault: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveEvent<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = platform_config.oracle == oracle.key() @ PredictionError::UnauthorizedOracle
    )]
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    #[account(
        mut,
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Box<Account<'info, PredictionEvent>>,
    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = !platform_config.paused @ PredictionError::PlatformPaused
    )]
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    #[account(
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump,
        constraint = event.status == EventStatus::Resolved @ PredictionError::EventNotResolved
    )]
    pub event: Box<Account<'info, PredictionEvent>>,
    #[account(
        mut,
        seeds = [b"user_bet", event.key().as_ref(), user.key().as_ref()],
        bump = user_bet.bump,
        constraint = user_bet.user == user.key() @ PredictionError::Unauthorized
    )]
    pub user_bet: Box<Account<'info, UserBet>>,
    /// Event vault containing the winning pool
    /// Must match the winning outcome's vault
    #[account(
        mut,
        constraint = (event_vault.key() == event.doom_vault || event_vault.key() == event.life_vault) @ PredictionError::InvalidVault,
        constraint = (event_vault.mint == platform_config.doom_mint || event_vault.mint == platform_config.life_mint) @ PredictionError::InvalidMint
    )]
    pub event_vault: Box<Account<'info, TokenAccount>>,
    /// User's token account to receive winnings
    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ PredictionError::InvalidTokenAccount
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundBet<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = !platform_config.paused @ PredictionError::PlatformPaused
    )]
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    #[account(
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump,
        constraint = event.status == EventStatus::Cancelled @ PredictionError::EventNotCancelled
    )]
    pub event: Box<Account<'info, PredictionEvent>>,
    #[account(
        mut,
        seeds = [b"user_bet", event.key().as_ref(), user.key().as_ref()],
        bump = user_bet.bump,
        constraint = user_bet.user == user.key() @ PredictionError::Unauthorized
    )]
    pub user_bet: Box<Account<'info, UserBet>>,
    /// Event vault containing the bet amount
    /// Must match the user's bet outcome vault
    #[account(
        mut,
        constraint = (event_vault.key() == event.doom_vault || event_vault.key() == event.life_vault) @ PredictionError::InvalidVault,
        constraint = (event_vault.mint == platform_config.doom_mint || event_vault.mint == platform_config.life_mint) @ PredictionError::InvalidMint
    )]
    pub event_vault: Box<Account<'info, TokenAccount>>,
    /// User's token account to receive refund
    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ PredictionError::InvalidTokenAccount
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelEvent<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        constraint = platform_config.authority == authority.key() @ PredictionError::Unauthorized
    )]
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    #[account(
        mut,
        seeds = [b"event", event.event_id.to_le_bytes().as_ref()],
        bump = event.bump
    )]
    pub event: Box<Account<'info, PredictionEvent>>,
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
    pub platform_config: Box<Account<'info, PlatformConfig>>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct MigratePlatform<'info> {
    /// CHECK: We're migrating this account, can't use Account wrapper
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump,
        owner = crate::ID
    )]
    pub platform_config: UncheckedAccount<'info>,
    pub doom_mint: Account<'info, Mint>,
    pub life_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// State Accounts
#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub oracle: Pubkey,
    pub doom_mint: Pubkey,
    pub life_mint: Pubkey,
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
    pub doom_vault: Pubkey,
    pub life_vault: Pubkey,
    pub bump: u8,
    pub doom_vault_bump: u8,
    pub life_vault_bump: u8,
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
    #[msg("Invalid token mint")]
    InvalidMint,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Invalid vault")]
    InvalidVault,
    #[msg("Already claimed winnings")]
    AlreadyClaimed,
    #[msg("Did not win this bet")]
    DidNotWin,
    #[msg("Event not cancelled")]
    EventNotCancelled,
    #[msg("Invalid winning pool - cannot be zero")]
    InvalidWinningPool,
    #[msg("Already refunded")]
    AlreadyRefunded,
}
