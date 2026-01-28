/**
 * Streak Store - Daily streak rewards for life posts
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StreakMilestone {
  days: number
  reward: number
  name: string
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 7, reward: 5, name: 'Week Warrior' },
  { days: 30, reward: 25, name: 'Monthly Champion' },
  { days: 100, reward: 100, name: 'Century Legend' },
]

export const STREAK_GRACE_PERIOD_HOURS = 24

const getDateKey = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getDaysDiff = (t1: number, t2: number) => {
  const d1 = new Date(t1), d2 = new Date(t2)
  d1.setHours(0, 0, 0, 0); d2.setHours(0, 0, 0, 0)
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / 86400000)
}

interface StreakState {
  currentStreak: number
  longestStreak: number
  lastPostDate: number | null
  claimedMilestones: number[]
  isInGracePeriod: boolean
  totalStreakRewards: number
  getNextMilestone: () => StreakMilestone | null
  getAchievedMilestones: () => StreakMilestone[]
  getClaimableMilestones: () => StreakMilestone[]
  checkStreakStatus: () => { active: boolean; inGrace: boolean; daysUntilLoss: number }
  recordLifePost: () => { streakUpdated: boolean; newStreak: number; milestonesClaimed: StreakMilestone[] }
  claimMilestone: (days: number) => { success: boolean; reward: number }
  claimAllMilestones: () => { rewards: number[]; total: number }
  updateStreakStatus: () => void
  resetStreak: () => void
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0, longestStreak: 0, lastPostDate: null, claimedMilestones: [], isInGracePeriod: false, totalStreakRewards: 0,
      getNextMilestone: () => STREAK_MILESTONES.find(m => m.days > get().currentStreak) || null,
      getAchievedMilestones: () => STREAK_MILESTONES.filter(m => m.days <= get().currentStreak),
      getClaimableMilestones: () => { const s = get(); return STREAK_MILESTONES.filter(m => m.days <= s.currentStreak && !s.claimedMilestones.includes(m.days)) },
      checkStreakStatus: () => {
        const { lastPostDate: lp, currentStreak: cs } = get()
        if (!lp || cs === 0) return { active: false, inGrace: false, daysUntilLoss: 0 }
        const dd = getDaysDiff(lp, Date.now())
        if (dd <= 1) return { active: true, inGrace: false, daysUntilLoss: 2 - dd }
        if (dd === 2) { const h = (Date.now() - lp) / 3600000, r = Math.max(0, 72 - h); return { active: false, inGrace: r > 0, daysUntilLoss: r > 0 ? 1 : 0 } }
        return { active: false, inGrace: false, daysUntilLoss: 0 }
      },
      recordLifePost: () => {
        const s = get(), now = Date.now()
        if (s.lastPostDate && getDateKey(s.lastPostDate) === getDateKey(now)) return { streakUpdated: false, newStreak: s.currentStreak, milestonesClaimed: [] }
        const st = s.checkStreakStatus()
        const ns = !s.lastPostDate ? 1 : (st.active || st.inGrace ? s.currentStreak + 1 : 1)
        set({ currentStreak: ns, longestStreak: Math.max(s.longestStreak, ns), lastPostDate: now, isInGracePeriod: false })
        return { streakUpdated: true, newStreak: ns, milestonesClaimed: STREAK_MILESTONES.filter(m => m.days <= ns && !s.claimedMilestones.includes(m.days)) }
      },
      claimMilestone: (days) => {
        const s = get(), m = STREAK_MILESTONES.find(x => x.days === days)
        if (!m || s.claimedMilestones.includes(days) || s.currentStreak < days) return { success: false, reward: 0 }
        set(x => ({ claimedMilestones: [...x.claimedMilestones, days], totalStreakRewards: x.totalStreakRewards + m.reward }))
        return { success: true, reward: m.reward }
      },
      claimAllMilestones: () => {
        const cl = get().getClaimableMilestones()
        if (!cl.length) return { rewards: [], total: 0 }
        const rw = cl.map(m => m.reward), tot = rw.reduce((a, b) => a + b, 0)
        set(s => ({ claimedMilestones: [...s.claimedMilestones, ...cl.map(m => m.days)], totalStreakRewards: s.totalStreakRewards + tot }))
        return { rewards: rw, total: tot }
      },
      updateStreakStatus: () => {
        const s = get(), st = s.checkStreakStatus()
        if (!st.active && !st.inGrace && s.currentStreak > 0) set({ currentStreak: 0, isInGracePeriod: false })
        else if (st.inGrace && !s.isInGracePeriod) set({ isInGracePeriod: true })
      },
      resetStreak: () => set({ currentStreak: 0, longestStreak: 0, lastPostDate: null, claimedMilestones: [], isInGracePeriod: false, totalStreakRewards: 0 }),
    }),
    { name: 'doomsday-streak' }
  )
)
