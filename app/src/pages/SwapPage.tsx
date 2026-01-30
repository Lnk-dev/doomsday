/**
 * Swap Page - DOOM/LIFE Token Exchange
 * Issue #132: AMM and liquidity provision
 */

import { useState, useEffect, useCallback } from 'react'
import { ArrowDownUp, Loader2, AlertCircle, Info } from 'lucide-react'
import { useWalletStore } from '@/store/wallet'
import { getNetworkConfig } from '@/lib/solana/config'

interface SwapState {
  fromToken: 'DOOM' | 'LIFE'
  fromAmount: string
  toAmount: string
  slippage: number
  isLoading: boolean
  error: string | null
  priceImpact: number
}

export function SwapPage() {
  const { primaryWalletAddress, doomBalance, lifeBalance } = useWalletStore()
  const connected = primaryWalletAddress !== null
  const config = getNetworkConfig()

  const [state, setState] = useState<SwapState>({
    fromToken: 'DOOM',
    fromAmount: '',
    toAmount: '',
    slippage: 0.5,
    isLoading: false,
    error: null,
    priceImpact: 0,
  })

  const toToken = state.fromToken === 'DOOM' ? 'LIFE' : 'DOOM'
  const fromBalance = (state.fromToken === 'DOOM' ? doomBalance : lifeBalance) ?? 0
  const toBalance = (state.fromToken === 'DOOM' ? lifeBalance : doomBalance) ?? 0

  // Mock pool data (replace with real data from chain)
  const [poolData] = useState({
    doomReserve: 10000,
    lifeReserve: 10000,
    feePercent: 0.3,
  })

  // Calculate output amount using constant product formula
  const calculateOutput = useCallback((inputAmount: number, doomToLife: boolean) => {
    if (inputAmount <= 0) return { output: 0, priceImpact: 0 }

    const { doomReserve, lifeReserve, feePercent } = poolData
    const reserveIn = doomToLife ? doomReserve : lifeReserve
    const reserveOut = doomToLife ? lifeReserve : doomReserve

    const amountInWithFee = inputAmount * (1 - feePercent / 100)
    const numerator = amountInWithFee * reserveOut
    const denominator = reserveIn + amountInWithFee
    const amountOut = numerator / denominator

    // Calculate price impact
    const spotPrice = reserveOut / reserveIn
    const executionPrice = amountOut / inputAmount
    const priceImpact = Math.abs((spotPrice - executionPrice) / spotPrice) * 100

    return { output: amountOut, priceImpact }
  }, [poolData])

  // Update output when input changes
  useEffect(() => {
    const inputAmount = parseFloat(state.fromAmount) || 0
    if (inputAmount > 0) {
      const { output, priceImpact } = calculateOutput(
        inputAmount,
        state.fromToken === 'DOOM'
      )
      setState(prev => ({
        ...prev,
        toAmount: output.toFixed(4),
        priceImpact,
      }))
    } else {
      setState(prev => ({ ...prev, toAmount: '', priceImpact: 0 }))
    }
  }, [state.fromAmount, state.fromToken, calculateOutput])

  const handleSwapTokens = () => {
    setState(prev => ({
      ...prev,
      fromToken: prev.fromToken === 'DOOM' ? 'LIFE' : 'DOOM',
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }))
  }

  const handleFromAmountChange = (value: string) => {
    // Only allow valid numbers
    if (value && !/^\d*\.?\d*$/.test(value)) return
    setState(prev => ({ ...prev, fromAmount: value, error: null }))
  }

  const handleMaxClick = () => {
    setState(prev => ({ ...prev, fromAmount: fromBalance.toString() }))
  }

  const handleSwap = async () => {
    if (!connected) {
      setState(prev => ({ ...prev, error: 'Please connect your wallet' }))
      return
    }

    const amount = parseFloat(state.fromAmount)
    if (!amount || amount <= 0) {
      setState(prev => ({ ...prev, error: 'Enter an amount' }))
      return
    }

    if (amount > fromBalance) {
      setState(prev => ({ ...prev, error: 'Insufficient balance' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // TODO: Implement actual swap transaction
      await new Promise(resolve => setTimeout(resolve, 2000))

      // For now, show success message
      setState(prev => ({
        ...prev,
        isLoading: false,
        fromAmount: '',
        toAmount: '',
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Swap failed',
      }))
    }
  }

  const minReceived = parseFloat(state.toAmount) * (1 - state.slippage / 100)

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Swap</h1>
          <button
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800"
            title="Settings"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* From Token */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">From</span>
            <span className="text-zinc-400 text-sm">
              Balance: {fromBalance.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={state.fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className="flex-1 bg-transparent text-2xl font-medium text-white outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleMaxClick}
                className="text-xs text-[#ff3040] hover:text-[#ff5060] font-medium"
              >
                MAX
              </button>
              <div className={`px-3 py-1.5 rounded-full font-medium ${
                state.fromToken === 'DOOM'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                ${state.fromToken}
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-zinc-700 hover:bg-zinc-600 p-2 rounded-xl border-4 border-zinc-900 transition-colors"
          >
            <ArrowDownUp className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* To Token */}
        <div className="bg-zinc-800 rounded-xl p-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-sm">To</span>
            <span className="text-zinc-400 text-sm">
              Balance: {toBalance.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="0.0"
              value={state.toAmount}
              readOnly
              className="flex-1 bg-transparent text-2xl font-medium text-white outline-none"
            />
            <div className={`px-3 py-1.5 rounded-full font-medium ${
              toToken === 'DOOM'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              ${toToken}
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {state.fromAmount && parseFloat(state.fromAmount) > 0 && (
          <div className="mt-4 p-3 bg-zinc-800/50 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Rate</span>
              <span>
                1 {state.fromToken} ≈ {(parseFloat(state.toAmount) / parseFloat(state.fromAmount) || 0).toFixed(4)} {toToken}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Price Impact</span>
              <span className={state.priceImpact > 5 ? 'text-red-400' : ''}>
                {state.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Min. Received</span>
              <span>{minReceived.toFixed(4)} {toToken}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Slippage</span>
              <span>{state.slippage}%</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Fee</span>
              <span>0.3%</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{state.error}</span>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={state.isLoading || !state.fromAmount || parseFloat(state.fromAmount) <= 0}
          className="w-full mt-4 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#ff3040] to-[#ff6040] hover:from-[#ff4050] hover:to-[#ff7050] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {state.isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Swapping...
            </>
          ) : !connected ? (
            'Connect Wallet'
          ) : !state.fromAmount ? (
            'Enter Amount'
          ) : parseFloat(state.fromAmount) > fromBalance ? (
            'Insufficient Balance'
          ) : (
            'Swap'
          )}
        </button>

        {/* Network Info */}
        <div className="mt-4 text-center text-xs text-zinc-500">
          Trading on {config.network === 'devnet' ? 'Devnet' : 'Mainnet'}
        </div>
      </div>

      {/* Pool Info */}
      <div className="mt-6 bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-4">Pool Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">$DOOM Reserve</span>
            <span className="text-white">{poolData.doomReserve.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">$LIFE Reserve</span>
            <span className="text-white">{poolData.lifeReserve.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Pool Fee</span>
            <span className="text-white">{poolData.feePercent}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SwapPage
