use anchor_lang::prelude::*;
use crate::state::PlatformConfig;
use crate::errors::PredictionError;

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = PlatformConfig::SIZE,
        seeds = [PlatformConfig::SEED],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePlatform>, fee_basis_points: u16) -> Result<()> {
    require!(
        fee_basis_points <= 10000,
        PredictionError::InvalidFeeBasisPoints
    );

    let config = &mut ctx.accounts.platform_config;

    config.authority = ctx.accounts.authority.key();
    config.oracle = ctx.accounts.authority.key(); // Initially, authority is also oracle
    config.fee_basis_points = fee_basis_points;
    config.paused = false;
    config.total_doom_fees = 0;
    config.total_life_fees = 0;
    config.total_events = 0;
    config.total_bets = 0;
    config.bump = ctx.bumps.platform_config;

    msg!("Platform initialized with {}% fee", fee_basis_points as f64 / 100.0);

    Ok(())
}
