/**
 * Reports Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useReportsStore, type ReportStatus } from './reports'
import { ViolationType } from '@/lib/guidelines'

describe('reports store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))

    // Reset store state
    useReportsStore.setState({
      reports: {},
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have empty reports', () => {
      const state = useReportsStore.getState()
      expect(state.reports).toEqual({})
    })
  })

  describe('reportContent', () => {
    it('should create a report', () => {
      const { reportContent } = useReportsStore.getState()

      const report = reportContent(
        'post-1',
        'user-1',
        ViolationType.SPAM,
        'This is spam',
        'post'
      )

      expect(report.id).toBeDefined()
      expect(report.contentId).toBe('post-1')
      expect(report.reporterId).toBe('user-1')
      expect(report.violationType).toBe(ViolationType.SPAM)
    })

    it('should store report in state', () => {
      const { reportContent } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam', 'post')

      const state = useReportsStore.getState()
      expect(state.reports[report.id]).toEqual(report)
    })

    it('should set status to pending', () => {
      const { reportContent } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam', 'post')

      expect(report.status).toBe('pending')
    })

    it('should set createdAt timestamp', () => {
      const { reportContent } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam', 'post')

      expect(report.createdAt).toBe(Date.now())
    })

    it('should trim reason', () => {
      const { reportContent } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, '  Spam content  ', 'post')

      expect(report.reason).toBe('Spam content')
    })

    it('should default contentType to post', () => {
      const { reportContent } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')

      expect(report.contentType).toBe('post')
    })

    it('should allow comment contentType', () => {
      const { reportContent } = useReportsStore.getState()

      const report = reportContent('comment-1', 'user-1', ViolationType.HARASSMENT, 'Harassing', 'comment')

      expect(report.contentType).toBe('comment')
    })

    it('should prevent duplicate reports from same user', () => {
      const { reportContent } = useReportsStore.getState()

      const first = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      const second = reportContent('post-1', 'user-1', ViolationType.HARASSMENT, 'Different reason')

      expect(first.id).toBe(second.id)
      expect(Object.keys(useReportsStore.getState().reports)).toHaveLength(1)
    })

    it('should allow different users to report same content', () => {
      const { reportContent } = useReportsStore.getState()

      reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      reportContent('post-1', 'user-2', ViolationType.SPAM, 'Also spam')

      expect(Object.keys(useReportsStore.getState().reports)).toHaveLength(2)
    })
  })

  describe('getReportsForContent', () => {
    it('should return all reports for content', () => {
      const { reportContent, getReportsForContent } = useReportsStore.getState()

      reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      reportContent('post-1', 'user-2', ViolationType.HARASSMENT, 'Harassing')
      reportContent('post-2', 'user-1', ViolationType.SPAM, 'Other spam')

      const reports = getReportsForContent('post-1')

      expect(reports).toHaveLength(2)
      expect(reports.every((r) => r.contentId === 'post-1')).toBe(true)
    })

    it('should return empty array for content with no reports', () => {
      const { getReportsForContent } = useReportsStore.getState()

      expect(getReportsForContent('nonexistent')).toEqual([])
    })
  })

  describe('dismissReport', () => {
    it('should set status to dismissed', () => {
      const { reportContent, dismissReport } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      dismissReport(report.id)

      expect(useReportsStore.getState().reports[report.id].status).toBe('dismissed')
    })

    it('should set resolvedAt timestamp', () => {
      const { reportContent, dismissReport } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')

      vi.advanceTimersByTime(5000)
      dismissReport(report.id)

      expect(useReportsStore.getState().reports[report.id].resolvedAt).toBe(Date.now())
    })

    it('should set resolution notes', () => {
      const { reportContent, dismissReport } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      dismissReport(report.id, 'Not actually spam')

      expect(useReportsStore.getState().reports[report.id].resolutionNotes).toBe('Not actually spam')
    })

    it('should handle non-existent report', () => {
      const { dismissReport } = useReportsStore.getState()

      // Should not throw
      dismissReport('nonexistent')

      expect(Object.keys(useReportsStore.getState().reports)).toHaveLength(0)
    })
  })

  describe('markReportReviewed', () => {
    it('should set status to reviewed', () => {
      const { reportContent, markReportReviewed } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      markReportReviewed(report.id)

      expect(useReportsStore.getState().reports[report.id].status).toBe('reviewed')
    })

    it('should set notes', () => {
      const { reportContent, markReportReviewed } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      markReportReviewed(report.id, 'Looking into this')

      expect(useReportsStore.getState().reports[report.id].resolutionNotes).toBe('Looking into this')
    })
  })

  describe('markReportActioned', () => {
    it('should set status to actioned', () => {
      const { reportContent, markReportActioned } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      markReportActioned(report.id)

      expect(useReportsStore.getState().reports[report.id].status).toBe('actioned')
    })

    it('should set notes', () => {
      const { reportContent, markReportActioned } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      markReportActioned(report.id, 'Post removed')

      expect(useReportsStore.getState().reports[report.id].resolutionNotes).toBe('Post removed')
    })
  })

  describe('getPendingReports', () => {
    it('should return only pending reports', () => {
      const { reportContent, dismissReport, getPendingReports } = useReportsStore.getState()

      reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      const report2 = reportContent('post-2', 'user-1', ViolationType.HARASSMENT, 'Bad')
      reportContent('post-3', 'user-1', ViolationType.SPAM, 'More spam')

      dismissReport(report2.id)

      const pending = getPendingReports()

      expect(pending).toHaveLength(2)
      expect(pending.every((r) => r.status === 'pending')).toBe(true)
    })

    it('should return empty when no pending reports', () => {
      const { reportContent, dismissReport, getPendingReports } = useReportsStore.getState()

      const report = reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      dismissReport(report.id)

      expect(getPendingReports()).toEqual([])
    })
  })

  describe('hasUserReported', () => {
    it('should return true if user reported content', () => {
      const { reportContent, hasUserReported } = useReportsStore.getState()

      reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')

      expect(hasUserReported('post-1', 'user-1')).toBe(true)
    })

    it('should return false if user has not reported', () => {
      const { reportContent, hasUserReported } = useReportsStore.getState()

      reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')

      expect(hasUserReported('post-1', 'user-2')).toBe(false)
    })

    it('should return false for unreported content', () => {
      const { hasUserReported } = useReportsStore.getState()

      expect(hasUserReported('nonexistent', 'user-1')).toBe(false)
    })
  })

  describe('getReportCount', () => {
    it('should return number of reports for content', () => {
      const { reportContent, getReportCount } = useReportsStore.getState()

      reportContent('post-1', 'user-1', ViolationType.SPAM, 'Spam')
      reportContent('post-1', 'user-2', ViolationType.HARASSMENT, 'Bad')
      reportContent('post-1', 'user-3', ViolationType.SPAM, 'More')

      expect(getReportCount('post-1')).toBe(3)
    })

    it('should return 0 for content with no reports', () => {
      const { getReportCount } = useReportsStore.getState()

      expect(getReportCount('nonexistent')).toBe(0)
    })
  })
})
