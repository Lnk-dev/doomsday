/**
 * Reports Store
 *
 * Zustand store for managing content reports and moderation.
 * Handles:
 * - Content reporting
 * - Report tracking
 * - Report dismissal
 * - Local storage persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ID } from '@/types'
import { ViolationType } from '@/lib/guidelines'

/** Generate unique ID */
const generateId = (): ID => Math.random().toString(36).substring(2, 15)

/** Get current timestamp */
const now = (): number => Date.now()

/**
 * Report status
 */
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned'

/**
 * Content report entity
 */
export interface Report {
  /** Unique report ID */
  id: ID
  /** ID of the reported content (post or comment) */
  contentId: ID
  /** Type of content being reported */
  contentType: 'post' | 'comment'
  /** ID of the user who submitted the report */
  reporterId: ID
  /** Type of violation being reported */
  violationType: ViolationType
  /** Optional additional details from reporter */
  reason: string
  /** Report submission timestamp */
  createdAt: number
  /** Current status of the report */
  status: ReportStatus
  /** Timestamp when report was reviewed/actioned */
  resolvedAt?: number
  /** Resolution notes from moderator */
  resolutionNotes?: string
}

interface ReportsState {
  /** All reports indexed by ID */
  reports: Record<ID, Report>

  // Actions
  /** Submit a report for content */
  reportContent: (
    contentId: ID,
    reporterId: ID,
    violationType: ViolationType,
    reason: string,
    contentType?: 'post' | 'comment'
  ) => Report
  /** Get all reports for a specific piece of content */
  getReportsForContent: (contentId: ID) => Report[]
  /** Dismiss a report */
  dismissReport: (reportId: ID, notes?: string) => void
  /** Mark report as reviewed */
  markReportReviewed: (reportId: ID, notes?: string) => void
  /** Mark report as actioned */
  markReportActioned: (reportId: ID, notes?: string) => void
  /** Get all pending reports */
  getPendingReports: () => Report[]
  /** Check if user has already reported content */
  hasUserReported: (contentId: ID, reporterId: ID) => boolean
  /** Get report count for content */
  getReportCount: (contentId: ID) => number
}

export const useReportsStore = create<ReportsState>()(
  persist(
    (set, get) => ({
      reports: {},

      reportContent: (contentId, reporterId, violationType, reason, contentType = 'post') => {
        // Prevent duplicate reports from same user
        if (get().hasUserReported(contentId, reporterId)) {
          const existingReport = Object.values(get().reports).find(
            (r) => r.contentId === contentId && r.reporterId === reporterId
          )
          if (existingReport) return existingReport
        }

        const report: Report = {
          id: generateId(),
          contentId,
          contentType,
          reporterId,
          violationType,
          reason: reason.trim(),
          createdAt: now(),
          status: 'pending',
        }

        set((state) => ({
          reports: { ...state.reports, [report.id]: report },
        }))

        return report
      },

      getReportsForContent: (contentId) => {
        return Object.values(get().reports).filter((report) => report.contentId === contentId)
      },

      dismissReport: (reportId, notes) => {
        set((state) => {
          const report = state.reports[reportId]
          if (!report) return state

          return {
            reports: {
              ...state.reports,
              [reportId]: {
                ...report,
                status: 'dismissed',
                resolvedAt: now(),
                resolutionNotes: notes,
              },
            },
          }
        })
      },

      markReportReviewed: (reportId, notes) => {
        set((state) => {
          const report = state.reports[reportId]
          if (!report) return state

          return {
            reports: {
              ...state.reports,
              [reportId]: {
                ...report,
                status: 'reviewed',
                resolvedAt: now(),
                resolutionNotes: notes,
              },
            },
          }
        })
      },

      markReportActioned: (reportId, notes) => {
        set((state) => {
          const report = state.reports[reportId]
          if (!report) return state

          return {
            reports: {
              ...state.reports,
              [reportId]: {
                ...report,
                status: 'actioned',
                resolvedAt: now(),
                resolutionNotes: notes,
              },
            },
          }
        })
      },

      getPendingReports: () => {
        return Object.values(get().reports).filter((report) => report.status === 'pending')
      },

      hasUserReported: (contentId, reporterId) => {
        return Object.values(get().reports).some(
          (report) => report.contentId === contentId && report.reporterId === reporterId
        )
      },

      getReportCount: (contentId) => {
        return Object.values(get().reports).filter((report) => report.contentId === contentId)
          .length
      },
    }),
    {
      name: 'doomsday-reports',
      partialize: (state) => ({
        reports: state.reports,
      }),
    }
  )
)
