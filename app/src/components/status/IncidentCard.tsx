import { AlertTriangle, AlertOctagon, Info, Clock } from 'lucide-react'
import type { Incident } from '@/lib/statusPage'
import { IncidentSeverity as IS, IncidentStatus as IST, getSeverityColor, getSeverityLabel, getIncidentStatusLabel, formatStatusDate } from '@/lib/statusPage'

const SEVERITY_ICONS = {
  [IS.CRITICAL]: AlertOctagon,
  [IS.MAJOR]: AlertTriangle,
  [IS.MINOR]: Info,
} as const

const STATUS_ICONS = {
  [IST.INVESTIGATING]: AlertTriangle,
  [IST.IDENTIFIED]: Info,
  [IST.MONITORING]: Clock,
  [IST.RESOLVED]: Info,
} as const

export function IncidentCard({ incident, expanded = false }: { incident: Incident; expanded?: boolean }) {
  const Icon = SEVERITY_ICONS[incident.severity] || Info
  const severityColor = getSeverityColor(incident.severity)
  const isResolved = incident.status === IST.RESOLVED

  return (
    <div className={`border rounded-lg p-4 ${isResolved ? 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]' : 'border-[var(--color-border-accent)] bg-[var(--color-bg-tertiary)]'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <Icon size={20} style={{ color: severityColor }} className="mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{incident.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[12px] font-medium px-2 py-0.5 rounded" style={{ color: severityColor, backgroundColor: severityColor + '15' }}>
                {getSeverityLabel(incident.severity)}
              </span>
              <span className={`text-[12px] font-medium px-2 py-0.5 rounded ${isResolved ? 'bg-green-500/15 text-green-500' : 'bg-amber-500/15 text-amber-500'}`}>
                {getIncidentStatusLabel(incident.status)}
              </span>
            </div>
          </div>
        </div>
        <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
          {formatStatusDate(new Date(incident.createdAt))}
        </span>
      </div>

      {(expanded || !isResolved) && incident.updates.length > 0 && (
        <div className="mt-4 ml-7 border-l-2 border-[var(--color-border)] pl-4 space-y-3">
          {incident.updates.slice().reverse().map((update) => {
            const UpdateIcon = STATUS_ICONS[update.status] || Info
            return (
              <div key={update.id} className="relative">
                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[var(--color-bg-primary)] border-2 border-[var(--color-border)]" />
                <div className="flex items-center gap-2 mb-1">
                  <UpdateIcon size={14} className="text-[var(--color-text-muted)]" />
                  <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
                    {getIncidentStatusLabel(update.status)}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {formatStatusDate(new Date(update.createdAt))}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--color-text-primary)]">{update.message}</p>
              </div>
            )
          })}
        </div>
      )}

      {incident.affectedServices.length > 0 && (
        <div className="mt-3 ml-7">
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Affected: {incident.affectedServices.join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}
