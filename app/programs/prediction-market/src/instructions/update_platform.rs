use anchor_lang::prelude::*;
use crate::state::PlatformConfig;
use crate::errors::PredictionError;

#[derive(Accounts)]
pub struct UpdatePlatform<'info> {
    #[account(
        mut,
        seeds = [PlatformConfig::SEED],
        bump = platform_config.bump,
        constraint = platform_config.authority == authority.key() @ PredictionError::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// Admin authority
    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdatePlatform>,
    fee_basis_points: Option<u16>,
    new_oracle: Option<Pubkey>,
    paused: Option<bool>,
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;

    if let Some(fee) = fee_basis_points {
        require!(fee <= 10000, PredictionError::InvalidFeeBasisPoints);
        config.fee_basis_points = fee;
        msg!("Fee updated to {}%", fee as f64 / 100.0);
    }

    if let Some(oracle) = new_oracle {
        config.oracle = oracle;
        msg!("Oracle updated to {}", oracle);
    }

    if let Some(is_paused) = paused {
        config.paused = is_paused;
        msg!("Platform paused: {}", is_paused);
    }

    Ok(())
}
