import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Service, Incident, IncidentUpdate, ServiceStatus } from '@/lib/statusPage'
import { ServiceStatus as SSC, IncidentStatus, IncidentSeverity } from '@/lib/statusPage'

const defaultServices: Service[] = [
  { id: 'api', name: 'API', status: SSC.OPERATIONAL, lastUpdated: new Date(), description: 'Core API services' },
  { id: 'web', name: 'Web Application', status: SSC.OPERATIONAL, lastUpdated: new Date(), description: 'Main web application' },
  { id: 'blockchain', name: 'Blockchain Integration', status: SSC.OPERATIONAL, lastUpdated: new Date(), description: 'Solana blockchain connections' },
  { id: 'feed', name: 'Feed Service', status: SSC.OPERATIONAL, lastUpdated: new Date(), description: 'Content feed and timeline' },
  { id: 'events', name: 'Events System', status: SSC.OPERATIONAL, lastUpdated: new Date(), description: 'Prediction events and betting' },
  { id: 'notifications', name: 'Notifications', status: SSC.OPERATIONAL, lastUpdated: new Date(), description: 'Push notifications and alerts' },
]

const sampleIncidentHistory: Incident[] = [{
  id: 'incident-1', title: 'Brief API latency increase', status: IncidentStatus.RESOLVED, severity: IncidentSeverity.MINOR,
  createdAt: new Date(Date.now() - 2*24*60*60*1000), updatedAt: new Date(Date.now() - 2*24*60*60*1000 + 30*60*1000), affectedServices: ['api'],
  updates: [
    { id: 'u1', message: 'Investigating increased API response times.', status: IncidentStatus.INVESTIGATING, createdAt: new Date(Date.now() - 2*24*60*60*1000) },
    { id: 'u2', message: 'Issue identified as database connection pool saturation.', status: IncidentStatus.IDENTIFIED, createdAt: new Date(Date.now() - 2*24*60*60*1000 + 15*60*1000) },
    { id: 'u3', message: 'Resolved. All systems operating normally.', status: IncidentStatus.RESOLVED, createdAt: new Date(Date.now() - 2*24*60*60*1000 + 30*60*1000) },
  ],
}]

interface StatusState {
  services: Service[]; incidents: Incident[]; isSubscribed: boolean
  updateServiceStatus: (id: string, status: ServiceStatus) => void
  createIncident: (i: Omit<Incident, 'id'|'createdAt'|'updatedAt'|'updates'>) => string
  addIncidentUpdate: (id: string, u: Omit<IncidentUpdate, 'id'|'createdAt'>) => void
  resolveIncident: (id: string, msg: string) => void; toggleSubscription: () => void
  getActiveIncidents: () => Incident[]; getRecentIncidents: () => Incident[]
}

export const useStatusStore = create<StatusState>()(persist((set, get) => ({
  services: defaultServices, incidents: sampleIncidentHistory, isSubscribed: false,
  updateServiceStatus: (id, status) => set(s => ({ services: s.services.map(svc => svc.id === id ? {...svc, status, lastUpdated: new Date()} : svc) })),
  createIncident: (data) => { const id = 'inc-'+Date.now(), now = new Date(); set(s => ({ incidents: [{...data, id, createdAt: now, updatedAt: now, updates: [{id: 'u-'+Date.now(), message: 'Incident created', status: data.status, createdAt: now}]}, ...s.incidents] })); return id },
  addIncidentUpdate: (id, u) => { const now = new Date(); set(s => ({ incidents: s.incidents.map(i => i.id === id ? {...i, status: u.status, updatedAt: now, updates: [...i.updates, {...u, id: 'u-'+Date.now(), createdAt: now}]} : i) })) },
  resolveIncident: (id, msg) => get().addIncidentUpdate(id, {message: msg, status: IncidentStatus.RESOLVED}),
  toggleSubscription: () => set(s => ({isSubscribed: !s.isSubscribed})),
  getActiveIncidents: () => get().incidents.filter(i => i.status !== IncidentStatus.RESOLVED),
  getRecentIncidents: () => { const d = new Date(Date.now() - 7*24*60*60*1000); return get().incidents.filter(i => i.createdAt >= d) },
}), {name: 'doomsday-status', partialize: s => ({services: s.services, incidents: s.incidents, isSubscribed: s.isSubscribed})}))
