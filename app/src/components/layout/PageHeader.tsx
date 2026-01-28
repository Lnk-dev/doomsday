interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-100">{title}</h1>
          {subtitle && (
            <p className="text-sm text-neutral-400">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  )
}
