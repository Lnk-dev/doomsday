import { Bell, BellOff, CheckCircle, AlertTriangle, AlertOctagon, Wrench, MinusCircle } from 'lucide-react'
import { useStatusStore } from '@/store/status'
import { ServiceCard } from '@/components/status/ServiceCard'
import { IncidentCard } from '@/components/status/IncidentCard'
import { calculateOverallStatus, getStatusColor, getStatusLabel, ServiceStatus } from '@/lib/statusPage'

const STATUS_ICONS = {
  [ServiceStatus.OPERATIONAL]: CheckCircle,
  [ServiceStatus.DEGRADED]: AlertTriangle,
  [ServiceStatus.PARTIAL_OUTAGE]: MinusCircle,
  [ServiceStatus.MAJOR_OUTAGE]: AlertOctagon,
  [ServiceStatus.MAINTENANCE]: Wrench,
} as const

export function StatusPage() {
  const { services, isSubscribed, toggleSubscription, getActiveIncidents, getRecentIncidents } = useStatusStore()

  const overallStatus = calculateOverallStatus(services)
  const OverallIcon = STATUS_ICONS[overallStatus] || MinusCircle
  const overallColor = getStatusColor(overallStatus)
  const overallLabel = getStatusLabel(overallStatus)

  const activeIncidents = getActiveIncidents()
  const recentIncidents = getRecentIncidents()
  const isAllOperational = overallStatus === ServiceStatus.OPERATIONAL

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Overall Status Header */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ backgroundColor: overallColor + '10', borderColor: overallColor + '30', borderWidth: '1px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: overallColor + '20' }}
            >
              <OverallIcon size={28} style={{ color: overallColor }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">System Status</h1>
              <p className="text-[15px] font-medium" style={{ color: overallColor }}>{overallLabel}</p>
            </div>
          </div>
          <button
            onClick={toggleSubscription}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-[14px] transition-colors ${
              isSubscribed
                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                : 'bg-[#ff3040] text-white hover:bg-[#e02838]'
            }`}
          >
            {isSubscribed ? <BellOff size={18} /> : <Bell size={18} />}
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        </div>
        {isAllOperational && (
          <p className="mt-4 text-[14px] text-[var(--color-text-secondary)]">
            All systems are operating normally. No incidents reported.
          </p>
        )}
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            Active Incidents ({activeIncidents.length})
          </h2>
          <div className="space-y-4">
            {activeIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} expanded />
            ))}
          </div>
        </section>
      )}

      {/* Services List */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Services</h2>
        <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Incident History (Last 7 Days) */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Incident History
          <span className="text-[13px] font-normal text-[var(--color-text-muted)] ml-2">Last 7 days</span>
        </h2>
        {recentIncidents.length === 0 ? (
          <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-8 text-center">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
            <p className="text-[14px] text-[var(--color-text-secondary)]">No incidents in the last 7 days</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-[var(--color-border)] text-center">
        <p className="text-[12px] text-[var(--color-text-muted)]">
          Status updates are refreshed automatically. Subscribe to receive notifications about service disruptions.
        </p>
      </footer>
    </div>
  )
}
