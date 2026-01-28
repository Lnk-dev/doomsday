import { CheckCircle, AlertTriangle, AlertOctagon, Wrench, MinusCircle } from 'lucide-react'
import type { Service, ServiceStatus } from '@/lib/statusPage'
import { ServiceStatus as SSC, getStatusColor, getStatusLabel, formatStatusDate } from '@/lib/statusPage'

function getIcon(s: ServiceStatus) { switch(s) { case SSC.OPERATIONAL: return CheckCircle; case SSC.DEGRADED: return AlertTriangle; case SSC.PARTIAL_OUTAGE: return MinusCircle; case SSC.MAJOR_OUTAGE: return AlertOctagon; case SSC.MAINTENANCE: return Wrench; default: return MinusCircle } }

export function ServiceCard({ service }: { service: Service }) {
  const Icon = getIcon(service.status), color = getStatusColor(service.status), label = getStatusLabel(service.status)
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
