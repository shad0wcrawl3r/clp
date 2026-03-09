import { useState } from 'react'
import { Search, Zap, Info } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { UuidCell } from '@/components/shared/UuidCell'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEventsByType, useSearchEventsByMetadata } from '@/hooks/useEvents'
import { relativeTime, formatDateTime } from '@/lib/utils'
import type { EntitlementEvent } from '@/types/api'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function EventTable({
  data,
  loading,
  error,
}: {
  data: EntitlementEvent[] | undefined
  loading: boolean
  error: unknown
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const columns = [
    { key: 'id', header: 'ID', render: (e: EntitlementEvent) => <UuidCell uuid={e.id} />, className: 'w-28' },
    {
      key: 'tenant_id',
      header: 'Tenant',
      render: (e: EntitlementEvent) => <UuidCell uuid={e.tenant_id} />,
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
            <span className="text-xs text-muted-foreground cursor-default">{relativeTime(e.created_at)}</span>
          </TooltipTrigger>
          <TooltipContent>{formatDateTime(e.created_at)}</TooltipContent>
        </Tooltip>
      ),
    },
    {
      key: 'metadata',
      header: '',
      render: (e: EntitlementEvent) => (
        <Button
          size="xs"
          variant="ghost"
          className="text-xs"
          onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
        >
          {expandedId === e.id ? 'Hide' : 'Metadata'}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {!!error && <ErrorAlert error={error} />}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        rowKey={(e) => e.id}
        emptyMessage="No events found"
        emptyDescription="Try a different event type or adjust the metadata filter."
      />
      {expandedId && (data ?? []).find((e) => e.id === expandedId) && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Metadata</p>
          <JsonViewer data={(data ?? []).find((e) => e.id === expandedId)?.metadata} />
        </div>
      )}
    </div>
  )
}

function ByTypeSearch() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const { data, isLoading, error } = useEventsByType(submitted)

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 rounded-lg p-3 flex gap-2 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 mt-0.5" />
        <p>
          Search for all events of a specific type across all tenants. Event types use dot notation,
          e.g. <code className="bg-muted rounded px-1">entitlement.granted</code>, <code className="bg-muted rounded px-1">subscription.activated</code>.
        </p>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="e.g. entitlement.granted"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSubmitted(query)}
            className="pl-8 font-mono text-sm"
          />
        </div>
        <Button onClick={() => setSubmitted(query)} disabled={!query}>
          <Search className="size-4" /> Search
        </Button>
      </div>
      {submitted && <EventTable data={data} loading={isLoading} error={error} />}
    </div>
  )
}

function ByMetadataSearch() {
  const [json, setJson] = useState('{\n  \n}')
  const [jsonError, setJsonError] = useState('')
  const searchMutation = useSearchEventsByMetadata()

  const handleSearch = () => {
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>
      setJsonError('')
      searchMutation.mutate({ metadata: parsed })
    } catch {
      setJsonError('Invalid JSON — check syntax and try again')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 rounded-lg p-3 flex gap-2 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 mt-0.5" />
        <p>
          Find events whose metadata contains all the specified key-value pairs. Use this to locate events for a specific feature code, endpoint ID, or custom field your agents write.
        </p>
      </div>
      <div className="space-y-1.5 max-w-lg">
        <Label>Metadata Filter (JSON)</Label>
        <Textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={6}
          className="font-mono text-sm"
          placeholder={'{\n  "feature_code": "advanced-reporting"\n}'}
        />
        {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
        <Button onClick={handleSearch} disabled={searchMutation.isPending}>
          <Search className="size-4" />
          {searchMutation.isPending ? 'Searching…' : 'Search by Metadata'}
        </Button>
      </div>
      {(searchMutation.data || searchMutation.isPending || searchMutation.error) && (
        <EventTable
          data={searchMutation.data}
          loading={searchMutation.isPending}
          error={searchMutation.error}
        />
      )}
    </div>
  )
}

export function EventSearch() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Search"
        description="Entitlement events are the audit log of CLP — every license check, grant, and state change is recorded here. Search across all tenants by event type or metadata."
      />
      <Tabs defaultValue="by-type">
        <TabsList>
          <TabsTrigger value="by-type" className="gap-1.5">
            <Zap className="size-3.5" /> By Event Type
          </TabsTrigger>
          <TabsTrigger value="by-metadata">
            By Metadata
          </TabsTrigger>
        </TabsList>
        <TabsContent value="by-type" className="mt-4">
          <ByTypeSearch />
        </TabsContent>
        <TabsContent value="by-metadata" className="mt-4">
          <ByMetadataSearch />
        </TabsContent>
      </Tabs>
    </div>
  )
}
