/**
 * Doomsday AMM Program
 * Issue #132: Liquidity provision and AMM for DOOM/LIFE trading
 *
 * Implements a constant-product (x * y = k) AMM for trading
 * between $DOOM and $LIFE tokens.
 */

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn};

declare_id!("ESVUbV7TzjW8VsZdDTFAq7kobcsmGXL29YFqcPkxB1qe");

/// Fee in basis points (30 = 0.3%)
const SWAP_FEE_BPS: u64 = 30;
/// Minimum liquidity locked forever (prevents division by zero)
const MINIMUM_LIQUIDITY: u64 = 1000;

#[program]
pub mod amm {
    use super::*;

    /// Initialize a new liquidity pool
    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        pool.doom_mint = ctx.accounts.doom_mint.key();
        pool.life_mint = ctx.accounts.life_mint.key();
        pool.doom_reserve = 0;
        pool.life_reserve = 0;
        pool.lp_mint = ctx.accounts.lp_mint.key();
        pool.lp_supply = 0;
        pool.total_fees_doom = 0;
        pool.total_fees_life = 0;
        pool.authority = ctx.accounts.authority.key();
        pool.bump = ctx.bumps.pool;

        msg!("Pool initialized for DOOM/LIFE");
        Ok(())
    }

    /// Add liquidity to the pool
    /// First deposit sets the price ratio, subsequent deposits must match
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        doom_amount: u64,
        life_amount: u64,
        min_lp_tokens: u64,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;

        require!(doom_amount > 0 && life_amount > 0, AmmError::InvalidAmount);

        let lp_tokens_to_mint: u64;

        if pool.lp_supply == 0 {
            // First liquidity - use geometric mean
            let product = (doom_amount as u128)
                .checked_mul(life_amount as u128)
                .ok_or(AmmError::Overflow)?;
            lp_tokens_to_mint = (product as f64).sqrt() as u64;

            require!(
                lp_tokens_to_mint > MINIMUM_LIQUIDITY,
                AmmError::InsufficientInitialLiquidity
            );
        } else {
            // Subsequent liquidity - proportional to existing
            let doom_ratio = (doom_amount as u128)
                .checked_mul(pool.lp_supply as u128)
                .ok_or(AmmError::Overflow)?
                .checked_div(pool.doom_reserve as u128)
                .ok_or(AmmError::Overflow)?;

            let life_ratio = (life_amount as u128)
                .checked_mul(pool.lp_supply as u128)
                .ok_or(AmmError::Overflow)?
                .checked_div(pool.life_reserve as u128)
                .ok_or(AmmError::Overflow)?;

            // Take the minimum to ensure proportional deposit
            lp_tokens_to_mint = doom_ratio.min(life_ratio) as u64;
        }

        require!(
            lp_tokens_to_mint >= min_lp_tokens,
            AmmError::SlippageExceeded
        );

        // Transfer DOOM to pool
        let doom_transfer = Transfer {
            from: ctx.accounts.user_doom.to_account_info(),
            to: ctx.accounts.pool_doom.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), doom_transfer),
            doom_amount,
        )?;

        // Transfer LIFE to pool
        let life_transfer = Transfer {
            from: ctx.accounts.user_life.to_account_info(),
            to: ctx.accounts.pool_life.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), life_transfer),
            life_amount,
        )?;

        // Mint LP tokens to user
        let seeds = &[b"pool".as_ref(), &[ctx.accounts.pool.bump]];
        let signer_seeds = &[&seeds[..]];

        let mint_to = MintTo {
            mint: ctx.accounts.lp_mint.to_account_info(),
            to: ctx.accounts.user_lp.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                mint_to,
                signer_seeds,
            ),
            lp_tokens_to_mint,
        )?;

        // Update pool state
        let pool = &mut ctx.accounts.pool;
        pool.doom_reserve = pool.doom_reserve.checked_add(doom_amount).ok_or(AmmError::Overflow)?;
        pool.life_reserve = pool.life_reserve.checked_add(life_amount).ok_or(AmmError::Overflow)?;
        pool.lp_supply = pool.lp_supply.checked_add(lp_tokens_to_mint).ok_or(AmmError::Overflow)?;

        msg!("Added liquidity: {} DOOM, {} LIFE -> {} LP", doom_amount, life_amount, lp_tokens_to_mint);
        Ok(())
    }

    /// Remove liquidity from the pool
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_amount: u64,
        min_doom: u64,
        min_life: u64,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;

        require!(lp_amount > 0, AmmError::InvalidAmount);
        require!(pool.lp_supply > 0, AmmError::EmptyPool);

        // Calculate proportional share
        let doom_amount = (lp_amount as u128)
            .checked_mul(pool.doom_reserve as u128)
            .ok_or(AmmError::Overflow)?
            .checked_div(pool.lp_supply as u128)
            .ok_or(AmmError::Overflow)? as u64;

        let life_amount = (lp_amount as u128)
            .checked_mul(pool.life_reserve as u128)
            .ok_or(AmmError::Overflow)?
            .checked_div(pool.lp_supply as u128)
            .ok_or(AmmError::Overflow)? as u64;

        require!(doom_amount >= min_doom, AmmError::SlippageExceeded);
        require!(life_amount >= min_life, AmmError::SlippageExceeded);

        // Burn LP tokens
        let burn = Burn {
            mint: ctx.accounts.lp_mint.to_account_info(),
            from: ctx.accounts.user_lp.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        token::burn(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), burn),
            lp_amount,
        )?;

        // Transfer tokens back to user
        let seeds = &[b"pool".as_ref(), &[ctx.accounts.pool.bump]];
        let signer_seeds = &[&seeds[..]];

        let doom_transfer = Transfer {
            from: ctx.accounts.pool_doom.to_account_info(),
            to: ctx.accounts.user_doom.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                doom_transfer,
                signer_seeds,
            ),
            doom_amount,
        )?;

        let life_transfer = Transfer {
            from: ctx.accounts.pool_life.to_account_info(),
            to: ctx.accounts.user_life.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                life_transfer,
                signer_seeds,
            ),
            life_amount,
        )?;

        // Update pool state
        let pool = &mut ctx.accounts.pool;
        pool.doom_reserve = pool.doom_reserve.checked_sub(doom_amount).ok_or(AmmError::Underflow)?;
        pool.life_reserve = pool.life_reserve.checked_sub(life_amount).ok_or(AmmError::Underflow)?;
        pool.lp_supply = pool.lp_supply.checked_sub(lp_amount).ok_or(AmmError::Underflow)?;

        msg!("Removed liquidity: {} LP -> {} DOOM, {} LIFE", lp_amount, doom_amount, life_amount);
        Ok(())
    }

    /// Swap DOOM for LIFE or vice versa
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        doom_to_life: bool,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;

        require!(amount_in > 0, AmmError::InvalidAmount);
        require!(pool.doom_reserve > 0 && pool.life_reserve > 0, AmmError::EmptyPool);

        // Calculate output using constant product formula with fee
        // amount_out = (reserve_out * amount_in * (10000 - fee)) / (reserve_in * 10000 + amount_in * (10000 - fee))
        let (reserve_in, reserve_out) = if doom_to_life {
            (pool.doom_reserve, pool.life_reserve)
        } else {
            (pool.life_reserve, pool.doom_reserve)
        };

        let amount_in_with_fee = (amount_in as u128)
            .checked_mul(10000 - SWAP_FEE_BPS as u128)
            .ok_or(AmmError::Overflow)?;

        let numerator = amount_in_with_fee
            .checked_mul(reserve_out as u128)
            .ok_or(AmmError::Overflow)?;

        let denominator = (reserve_in as u128)
            .checked_mul(10000)
            .ok_or(AmmError::Overflow)?
            .checked_add(amount_in_with_fee)
            .ok_or(AmmError::Overflow)?;

        let amount_out = numerator
            .checked_div(denominator)
            .ok_or(AmmError::Overflow)? as u64;

        require!(amount_out >= min_amount_out, AmmError::SlippageExceeded);
        require!(amount_out < reserve_out, AmmError::InsufficientLiquidity);

        let seeds = &[b"pool".as_ref(), &[ctx.accounts.pool.bump]];
        let signer_seeds = &[&seeds[..]];

        if doom_to_life {
            // Transfer DOOM in
            let transfer_in = Transfer {
                from: ctx.accounts.user_doom.to_account_info(),
                to: ctx.accounts.pool_doom.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            token::transfer(
                CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_in),
                amount_in,
            )?;

            // Transfer LIFE out
            let transfer_out = Transfer {
                from: ctx.accounts.pool_life.to_account_info(),
                to: ctx.accounts.user_life.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    transfer_out,
                    signer_seeds,
                ),
                amount_out,
            )?;

            // Update reserves
            let pool = &mut ctx.accounts.pool;
            pool.doom_reserve = pool.doom_reserve.checked_add(amount_in).ok_or(AmmError::Overflow)?;
            pool.life_reserve = pool.life_reserve.checked_sub(amount_out).ok_or(AmmError::Underflow)?;

            // Track fees
            let fee = amount_in.checked_mul(SWAP_FEE_BPS).ok_or(AmmError::Overflow)? / 10000;
            pool.total_fees_doom = pool.total_fees_doom.saturating_add(fee);
        } else {
            // Transfer LIFE in
            let transfer_in = Transfer {
                from: ctx.accounts.user_life.to_account_info(),
                to: ctx.accounts.pool_life.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            token::transfer(
                CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_in),
                amount_in,
            )?;

            // Transfer DOOM out
            let transfer_out = Transfer {
                from: ctx.accounts.pool_doom.to_account_info(),
                to: ctx.accounts.user_doom.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    transfer_out,
                    signer_seeds,
                ),
                amount_out,
            )?;

            // Update reserves
            let pool = &mut ctx.accounts.pool;
            pool.life_reserve = pool.life_reserve.checked_add(amount_in).ok_or(AmmError::Overflow)?;
            pool.doom_reserve = pool.doom_reserve.checked_sub(amount_out).ok_or(AmmError::Underflow)?;

            // Track fees
            let fee = amount_in.checked_mul(SWAP_FEE_BPS).ok_or(AmmError::Overflow)? / 10000;
            pool.total_fees_life = pool.total_fees_life.saturating_add(fee);
        }

        msg!("Swapped {} -> {} (doom_to_life: {})", amount_in, amount_out, doom_to_life);
        Ok(())
    }

    /// Get quote for a swap (view function simulated)
    pub fn get_quote(
        ctx: Context<GetQuote>,
        amount_in: u64,
        doom_to_life: bool,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;

        let (reserve_in, reserve_out) = if doom_to_life {
            (pool.doom_reserve, pool.life_reserve)
        } else {
            (pool.life_reserve, pool.doom_reserve)
        };

        if reserve_in == 0 || reserve_out == 0 {
            msg!("Quote: Pool is empty");
            return Ok(());
        }

        let amount_in_with_fee = (amount_in as u128) * (10000 - SWAP_FEE_BPS as u128);
        let numerator = amount_in_with_fee * (reserve_out as u128);
        let denominator = (reserve_in as u128) * 10000 + amount_in_with_fee;
        let amount_out = numerator / denominator;

        msg!("Quote: {} in -> {} out", amount_in, amount_out);
        Ok(())
    }
}

// Account contexts
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + LiquidityPool::INIT_SPACE,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, LiquidityPool>,

    pub doom_mint: Account<'info, Mint>,
    pub life_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = pool,
        seeds = [b"lp_mint"],
        bump
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = doom_mint,
        token::authority = pool,
        seeds = [b"pool_doom"],
        bump
    )]
    pub pool_doom: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = life_mint,
        token::authority = pool,
        seeds = [b"pool_life"],
        bump
    )]
    pub pool_life: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, LiquidityPool>,

    #[account(
        mut,
        seeds = [b"lp_mint"],
        bump
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"pool_doom"],
        bump
    )]
    pub pool_doom: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"pool_life"],
        bump
    )]
    pub pool_life: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_doom.owner == user.key())]
    pub user_doom: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_life.owner == user.key())]
    pub user_life: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_lp.owner == user.key())]
    pub user_lp: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, LiquidityPool>,

    #[account(
        mut,
        seeds = [b"lp_mint"],
        bump
    )]
    pub lp_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"pool_doom"],
        bump
    )]
    pub pool_doom: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"pool_life"],
        bump
    )]
    pub pool_life: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_doom.owner == user.key())]
    pub user_doom: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_life.owner == user.key())]
    pub user_life: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_lp.owner == user.key())]
    pub user_lp: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, LiquidityPool>,

    #[account(
        mut,
        seeds = [b"pool_doom"],
        bump
    )]
    pub pool_doom: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"pool_life"],
        bump
    )]
    pub pool_life: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_doom.owner == user.key())]
    pub user_doom: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_life.owner == user.key())]
    pub user_life: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetQuote<'info> {
    #[account(seeds = [b"pool"], bump = pool.bump)]
    pub pool: Account<'info, LiquidityPool>,
}

// State
#[account]
#[derive(InitSpace)]
pub struct LiquidityPool {
    pub doom_mint: Pubkey,
    pub life_mint: Pubkey,
    pub doom_reserve: u64,
    pub life_reserve: u64,
    pub lp_mint: Pubkey,
    pub lp_supply: u64,
    pub total_fees_doom: u64,
    pub total_fees_life: u64,
    pub authority: Pubkey,
    pub bump: u8,
}

// Errors
#[error_code]
pub enum AmmError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Arithmetic underflow")]
    Underflow,
    #[msg("Slippage exceeded")]
    SlippageExceeded,
    #[msg("Insufficient initial liquidity")]
    InsufficientInitialLiquidity,
    #[msg("Pool is empty")]
    EmptyPool,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
}
