import { CheckCircle, AlertTriangle, AlertOctagon, Wrench, MinusCircle } from 'lucide-react'
import type { Service } from '@/lib/statusPage'
import { ServiceStatus as SSC, getStatusColor, getStatusLabel, formatStatusDate } from '@/lib/statusPage'

const STATUS_ICONS = {
  [SSC.OPERATIONAL]: CheckCircle,
  [SSC.DEGRADED]: AlertTriangle,
  [SSC.PARTIAL_OUTAGE]: MinusCircle,
  [SSC.MAJOR_OUTAGE]: AlertOctagon,
  [SSC.MAINTENANCE]: Wrench,
} as const

export function ServiceCard({ service }: { service: Service }) {
  const Icon = STATUS_ICONS[service.status] || MinusCircle, color = getStatusColor(service.status), label = getStatusLabel(service.status)
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-[var(--color-bg-hover)] transition-colors rounded-lg group">
      <div className="flex items-center gap-3">
        <Icon size={20} style={{color}} className="transition-transform group-hover:scale-110" />
        <div><p className="text-[15px] font-medium text-[var(--color-text-primary)]">{service.name}</p><p className="text-[12px] text-[var(--color-text-muted)]">{service.description}</p></div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-medium px-2 py-1 rounded-md" style={{color, backgroundColor: color+'15'}}>{label}</span>
        <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">{formatStatusDate(new Date(service.lastUpdated))}</span>
      </div>
    </div>
  )
}
