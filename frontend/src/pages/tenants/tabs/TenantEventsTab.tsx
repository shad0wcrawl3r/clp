import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'

import { DataTable } from '@/components/shared/DataTable'
import { UuidCell } from '@/components/shared/UuidCell'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PaginationBar } from '@/components/shared/PaginationBar'
import { Button } from '@/components/ui/button'
import { useTenantEvents } from '@/hooks/useEvents'
import { relativeTime, formatDateTime } from '@/lib/utils'
import type { EntitlementEvent } from '@/types/api'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const LIMIT = 50

export function TenantEventsTab() {
  const { id: tenantId } = useParams<{ id: string }>()
  const [offset, setOffset] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, error } = useTenantEvents(tenantId!, { limit: LIMIT, offset })

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (e: EntitlementEvent) => <UuidCell uuid={e.id} />,
      className: 'w-28',
    },
    {
      key: 'event_type',
      header: 'Event Type',
      render: (e: EntitlementEvent) => (
        <code className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono">{e.event_type}</code>
      ),
    },
    {
      key: 'created_at',
      header: 'When',
      render: (e: EntitlementEvent) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-default">
              {relativeTime(e.created_at)}
            </span>
          </TooltipTrigger>
          <TooltipContent>{formatDateTime(e.created_at)}</TooltipContent>
        </Tooltip>
      ),
    },
    {
      key: 'metadata',
      header: 'Metadata',
      render: (e: EntitlementEvent) => (
        <Button
          size="xs"
          variant="ghost"
          className="text-xs gap-1"
          onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
        >
          {expandedId === e.id
            ? <><ChevronDown className="size-3" /> Collapse</>
            : <><ChevronRight className="size-3" /> Expand</>
          }
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0" />
        <p>
          Entitlement events are immutable audit records created whenever a license check, grant, denial, or state change occurs for this tenant. Showing {LIMIT} per page.
        </p>
      </div>

      {error && <ErrorAlert error={error} />}

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(e) => e.id}
        emptyMessage="No events recorded"
        emptyDescription="Events appear automatically as agents heartbeat and check entitlements. Use the global Event Search to query by type or metadata."
      />

      {expandedId && (data ?? []).find((e) => e.id === expandedId) && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Event Metadata</p>
          <JsonViewer data={(data ?? []).find((e) => e.id === expandedId)?.metadata} />
        </div>
      )}

      <PaginationBar
        offset={offset}
        limit={LIMIT}
        count={(data?.length ?? 0) + offset}
        onOffsetChange={setOffset}
      />
    </div>
  )
}
