/**
 * Status Page Library - Types and utilities for the system status page.
 */

export const ServiceStatus = { OPERATIONAL: 'operational', DEGRADED: 'degraded', PARTIAL_OUTAGE: 'partial_outage', MAJOR_OUTAGE: 'major_outage', MAINTENANCE: 'maintenance' } as const
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus]

export const IncidentSeverity = { MINOR: 'minor', MAJOR: 'major', CRITICAL: 'critical' } as const
export type IncidentSeverity = (typeof IncidentSeverity)[keyof typeof IncidentSeverity]

export const IncidentStatus = { INVESTIGATING: 'investigating', IDENTIFIED: 'identified', MONITORING: 'monitoring', RESOLVED: 'resolved' } as const
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus]

export interface Service { id: string; name: string; status: ServiceStatus; lastUpdated: Date; description: string }
export interface IncidentUpdate { id: string; message: string; status: IncidentStatus; createdAt: Date }
export interface Incident { id: string; title: string; status: IncidentStatus; severity: IncidentSeverity; createdAt: Date; updatedAt: Date; updates: IncidentUpdate[]; affectedServices: string[] }

export function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case ServiceStatus.OPERATIONAL: return '#10b981'
    case ServiceStatus.DEGRADED: return '#f59e0b'
    case ServiceStatus.PARTIAL_OUTAGE: return '#f97316'
    case ServiceStatus.MAJOR_OUTAGE: return '#ef4444'
    case ServiceStatus.MAINTENANCE: return '#6366f1'
    default: return '#6b7280'
  }
}

export function getStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case ServiceStatus.OPERATIONAL: return 'Operational'
    case ServiceStatus.DEGRADED: return 'Degraded Performance'
    case ServiceStatus.PARTIAL_OUTAGE: return 'Partial Outage'
    case ServiceStatus.MAJOR_OUTAGE: return 'Major Outage'
    case ServiceStatus.MAINTENANCE: return 'Under Maintenance'
    default: return 'Unknown'
  }
}

export function getSeverityColor(severity: IncidentSeverity): string {
  switch (severity) { case IncidentSeverity.MINOR: return '#f59e0b'; case IncidentSeverity.MAJOR: return '#f97316'; case IncidentSeverity.CRITICAL: return '#ef4444'; default: return '#6b7280' }
}

export function getSeverityLabel(severity: IncidentSeverity): string {
  switch (severity) { case IncidentSeverity.MINOR: return 'Minor'; case IncidentSeverity.MAJOR: return 'Major'; case IncidentSeverity.CRITICAL: return 'Critical'; default: return 'Unknown' }
}

export function getIncidentStatusLabel(status: IncidentStatus): string {
  switch (status) { case IncidentStatus.INVESTIGATING: return 'Investigating'; case IncidentStatus.IDENTIFIED: return 'Identified'; case IncidentStatus.MONITORING: return 'Monitoring'; case IncidentStatus.RESOLVED: return 'Resolved'; default: return 'Unknown' }
}

export function calculateOverallStatus(services: Service[]): ServiceStatus {
  if (services.length === 0) return ServiceStatus.OPERATIONAL
  const priority: ServiceStatus[] = [ServiceStatus.MAJOR_OUTAGE, ServiceStatus.PARTIAL_OUTAGE, ServiceStatus.DEGRADED, ServiceStatus.MAINTENANCE, ServiceStatus.OPERATIONAL]
  for (const s of priority) { if (services.some(svc => svc.status === s)) return s }
  return ServiceStatus.OPERATIONAL
}

export function formatStatusDate(date: Date): string {
  const now = new Date(), diff = now.getTime() - date.getTime(), mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'; if (mins < 60) return mins + 'm ago'; if (hrs < 24) return hrs + 'h ago'; if (days < 7) return days + 'd ago'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}
