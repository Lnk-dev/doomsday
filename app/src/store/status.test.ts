/**
 * Status Store Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useStatusStore } from './status'
import { ServiceStatus, IncidentStatus, IncidentSeverity } from '@/lib/statusPage'

describe('status store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))

    // Reset store state with fresh services
    useStatusStore.setState({
      services: [
        {
          id: 'api',
          name: 'API',
          status: ServiceStatus.OPERATIONAL,
          lastUpdated: new Date(),
          description: 'Core API',
        },
        {
          id: 'web',
          name: 'Web',
          status: ServiceStatus.OPERATIONAL,
          lastUpdated: new Date(),
          description: 'Web app',
        },
      ],
      incidents: [],
      isSubscribed: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have default services', () => {
      const state = useStatusStore.getState()
      expect(state.services.length).toBeGreaterThan(0)
    })

    it('should have empty incidents after reset', () => {
      const state = useStatusStore.getState()
      expect(state.incidents).toEqual([])
    })

    it('should not be subscribed initially', () => {
      const state = useStatusStore.getState()
      expect(state.isSubscribed).toBe(false)
    })
  })

  describe('updateServiceStatus', () => {
    it('should update service status', () => {
      const { updateServiceStatus } = useStatusStore.getState()

      updateServiceStatus('api', ServiceStatus.DEGRADED)

      const service = useStatusStore.getState().services.find((s) => s.id === 'api')
      expect(service?.status).toBe(ServiceStatus.DEGRADED)
    })

    it('should update lastUpdated timestamp', () => {
      const { updateServiceStatus } = useStatusStore.getState()
      const now = new Date()

      updateServiceStatus('api', ServiceStatus.DEGRADED)

      const service = useStatusStore.getState().services.find((s) => s.id === 'api')
      expect(service?.lastUpdated.getTime()).toBe(now.getTime())
    })

    it('should not affect other services', () => {
      const { updateServiceStatus } = useStatusStore.getState()

      updateServiceStatus('api', ServiceStatus.MAJOR_OUTAGE)

      const web = useStatusStore.getState().services.find((s) => s.id === 'web')
      expect(web?.status).toBe(ServiceStatus.OPERATIONAL)
    })

    it('should handle non-existent service gracefully', () => {
      const { updateServiceStatus } = useStatusStore.getState()

      // Should not throw
      updateServiceStatus('nonexistent', ServiceStatus.DEGRADED)

      expect(useStatusStore.getState().services).toHaveLength(2)
    })
  })

  describe('createIncident', () => {
    it('should create an incident', () => {
      const { createIncident } = useStatusStore.getState()

      const id = createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      expect(id).toBeDefined()
      expect(id.startsWith('inc-')).toBe(true)
    })

    it('should store incident in state', () => {
      const { createIncident } = useStatusStore.getState()

      createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      const incidents = useStatusStore.getState().incidents
      expect(incidents).toHaveLength(1)
      expect(incidents[0].title).toBe('API Issues')
    })

    it('should add initial update', () => {
      const { createIncident } = useStatusStore.getState()

      createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      const incident = useStatusStore.getState().incidents[0]
      expect(incident.updates).toHaveLength(1)
      expect(incident.updates[0].message).toBe('Incident created')
    })

    it('should set timestamps', () => {
      const { createIncident } = useStatusStore.getState()
      const now = new Date()

      createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      const incident = useStatusStore.getState().incidents[0]
      expect(incident.createdAt.getTime()).toBe(now.getTime())
      expect(incident.updatedAt.getTime()).toBe(now.getTime())
    })

    it('should add new incidents at the beginning', () => {
      const { createIncident } = useStatusStore.getState()

      createIncident({
        title: 'First',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      vi.advanceTimersByTime(1000)

      createIncident({
        title: 'Second',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MAJOR,
        affectedServices: ['web'],
      })

      const incidents = useStatusStore.getState().incidents
      expect(incidents[0].title).toBe('Second')
      expect(incidents[1].title).toBe('First')
    })
  })

  describe('addIncidentUpdate', () => {
    it('should add update to incident', () => {
      const { createIncident, addIncidentUpdate } = useStatusStore.getState()

      const id = createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      addIncidentUpdate(id, {
        message: 'We have identified the issue',
        status: IncidentStatus.IDENTIFIED,
      })

      const incident = useStatusStore.getState().incidents[0]
      expect(incident.updates).toHaveLength(2)
      expect(incident.updates[1].message).toBe('We have identified the issue')
    })

    it('should update incident status', () => {
      const { createIncident, addIncidentUpdate } = useStatusStore.getState()

      const id = createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      addIncidentUpdate(id, {
        message: 'Issue identified',
        status: IncidentStatus.IDENTIFIED,
      })

      const incident = useStatusStore.getState().incidents[0]
      expect(incident.status).toBe(IncidentStatus.IDENTIFIED)
    })

    it('should update updatedAt timestamp', () => {
      const { createIncident, addIncidentUpdate } = useStatusStore.getState()

      const id = createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      vi.advanceTimersByTime(5000)

      addIncidentUpdate(id, {
        message: 'Update',
        status: IncidentStatus.IDENTIFIED,
      })

      const incident = useStatusStore.getState().incidents[0]
      expect(incident.updatedAt.getTime()).toBeGreaterThan(incident.createdAt.getTime())
    })
  })

  describe('resolveIncident', () => {
    it('should resolve an incident', () => {
      const { createIncident, resolveIncident } = useStatusStore.getState()

      const id = createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      resolveIncident(id, 'Issue has been resolved')

      const incident = useStatusStore.getState().incidents[0]
      expect(incident.status).toBe(IncidentStatus.RESOLVED)
    })

    it('should add resolution update', () => {
      const { createIncident, resolveIncident } = useStatusStore.getState()

      const id = createIncident({
        title: 'API Issues',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      resolveIncident(id, 'Issue has been resolved')

      const incident = useStatusStore.getState().incidents[0]
      const lastUpdate = incident.updates[incident.updates.length - 1]
      expect(lastUpdate.message).toBe('Issue has been resolved')
      expect(lastUpdate.status).toBe(IncidentStatus.RESOLVED)
    })
  })

  describe('toggleSubscription', () => {
    it('should toggle subscription on', () => {
      const { toggleSubscription } = useStatusStore.getState()

      toggleSubscription()

      expect(useStatusStore.getState().isSubscribed).toBe(true)
    })

    it('should toggle subscription off', () => {
      useStatusStore.setState({ isSubscribed: true })
      const { toggleSubscription } = useStatusStore.getState()

      toggleSubscription()

      expect(useStatusStore.getState().isSubscribed).toBe(false)
    })
  })

  describe('getActiveIncidents', () => {
    it('should return only non-resolved incidents', () => {
      const { createIncident, resolveIncident, getActiveIncidents } = useStatusStore.getState()

      const id1 = createIncident({
        title: 'Active',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      vi.advanceTimersByTime(1000)

      createIncident({
        title: 'Also Active',
        status: IncidentStatus.IDENTIFIED,
        severity: IncidentSeverity.MAJOR,
        affectedServices: ['web'],
      })

      resolveIncident(id1, 'Resolved')

      const active = getActiveIncidents()
      expect(active).toHaveLength(1)
      expect(active[0].title).toBe('Also Active')
    })

    it('should return empty array when no active incidents', () => {
      const { createIncident, resolveIncident, getActiveIncidents } = useStatusStore.getState()

      const id = createIncident({
        title: 'Incident',
        status: IncidentStatus.INVESTIGATING,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      resolveIncident(id, 'Resolved')

      expect(getActiveIncidents()).toEqual([])
    })
  })

  describe('getRecentIncidents', () => {
    it('should return incidents from last 7 days', () => {
      const { createIncident, getRecentIncidents } = useStatusStore.getState()

      // Create incident now
      createIncident({
        title: 'Recent',
        status: IncidentStatus.RESOLVED,
        severity: IncidentSeverity.MINOR,
        affectedServices: ['api'],
      })

      expect(getRecentIncidents()).toHaveLength(1)
    })

    it('should not return incidents older than 7 days', () => {
      // Manually add old incident
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      useStatusStore.setState({
        incidents: [
          {
            id: 'old-incident',
            title: 'Old Incident',
            status: IncidentStatus.RESOLVED,
            severity: IncidentSeverity.MINOR,
            createdAt: oldDate,
            updatedAt: oldDate,
            updates: [],
            affectedServices: ['api'],
          },
        ],
      })

      const { getRecentIncidents } = useStatusStore.getState()
      expect(getRecentIncidents()).toHaveLength(0)
    })
  })
})
