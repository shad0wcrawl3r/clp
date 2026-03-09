import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TenantStatus, SubscriptionStatus, EndpointStatus, DeploymentStatus } from '@/types/api'

type Status = TenantStatus | SubscriptionStatus | EndpointStatus | DeploymentStatus | string

const statusConfig: Record<string, { className: string; label?: string }> = {
  active:    { className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
  trial:     { className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  grace:     { className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
  suspended: { className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  past_due:  { className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', label: 'Past Due' },
  cancelled: { className: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-400 dark:border-zinc-800' },
  expired:   { className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  deleted:   { className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  inactive:  { className: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-500 dark:border-zinc-800' },
  revoked:   { className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
}

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] ?? { className: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
  const label = config.label ?? status.replace('_', ' ')
  return (
    <Badge
      variant="outline"
      className={cn('capitalize text-xs font-medium px-2 py-0.5', config.className)}
    >
      {label}
    </Badge>
  )
}
