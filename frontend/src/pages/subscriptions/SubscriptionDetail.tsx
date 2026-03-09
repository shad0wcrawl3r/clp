import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronRight, XCircle, ChevronDown, Plus, Trash2, Info, CreditCard, Calendar, RefreshCw } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { UuidCell } from '@/components/shared/UuidCell'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  useSubscription,
  useUpdateSubscriptionStatus,
  useCancelSubscription,
  useSubscriptionFeatures,
  useAddSubscriptionFeature,
  useRemoveSubscriptionFeature,
  useSubscriptionEvents,
} from '@/hooks/useSubscriptions'
import { useFeatureList } from '@/hooks/useFeatures'
import { formatDate, relativeTime, formatDateTime } from '@/lib/utils'
import { SUBSCRIPTION_STATUSES } from '@/lib/constants'
import type { ListSubscriptionFeaturesRow, EntitlementEvent, SubscriptionStatus } from '@/types/api'

export function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [addFeatureOpen, setAddFeatureOpen] = useState(false)
  const [removeFeatureId, setRemoveFeatureId] = useState<string | null>(null)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [selectedFeatureId, setSelectedFeatureId] = useState('')

  const { data: sub, isLoading, error } = useSubscription(id!)
  const { data: features } = useSubscriptionFeatures(id!)
  const { data: events, isLoading: eventsLoading } = useSubscriptionEvents(id!, { limit: 50 })
  const { data: catalog } = useFeatureList({ limit: 1000 })

  const updateStatus = useUpdateSubscriptionStatus(id!, sub?.tenant_id)
  const cancelSub = useCancelSubscription(id!, sub?.tenant_id)
  const addFeature = useAddSubscriptionFeature(id!)
  const removeFeature = useRemoveSubscriptionFeature(id!)

  if (error) return <ErrorAlert error={error} />

  const handleStatusChange = async (status: SubscriptionStatus) => {
    try {
      await updateStatus.mutateAsync({ status })
      toast.success(`Status changed to "${status}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleCancel = async () => {
    try {
      await cancelSub.mutateAsync()
      toast.success('Subscription cancelled')
      setCancelOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel subscription')
    }
  }

  const handleAddFeature = async () => {
    if (!selectedFeatureId) return
    try {
      await addFeature.mutateAsync({ feature_id: selectedFeatureId, enabled: true })
      toast.success('Feature added to subscription')
      setAddFeatureOpen(false)
      setSelectedFeatureId('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add feature')
    }
  }

  const handleRemoveFeature = async () => {
    if (!removeFeatureId) return
    try {
      await removeFeature.mutateAsync(removeFeatureId)
      toast.success('Feature removed')
      setRemoveFeatureId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove feature')
    }
  }

  const existingFeatureIds = new Set((features ?? []).map((f) => f.feature_id))
  const availableCatalog = (catalog ?? []).filter((f) => !existingFeatureIds.has(f.id))

  const featureColumns = [
    {
      key: 'feature_code',
      header: 'Feature',
      render: (f: ListSubscriptionFeaturesRow) => (
        <div>
          <code className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono">{f.feature_code}</code>
          <p className="text-xs text-muted-foreground mt-0.5">{f.name}</p>
        </div>
      ),
    },
    {
      key: 'enabled',
      header: 'Enabled',
      render: (f: ListSubscriptionFeaturesRow) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Switch checked={f.enabled} disabled aria-label="Enabled" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {f.enabled ? 'Feature is active for agents to use' : 'Feature is disabled — agents will be denied access'}
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      key: 'limits',
      header: 'Limits',
      render: (f: ListSubscriptionFeaturesRow) =>
        f.limits ? (
          <JsonViewer data={f.limits} />
        ) : (
          <span className="text-xs text-muted-foreground italic">no limits set</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (f: ListSubscriptionFeaturesRow) => (
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setRemoveFeatureId(f.feature_id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
      className: 'w-12',
    },
  ]

  const eventColumns = [
    { key: 'id', header: 'ID', render: (e: EntitlementEvent) => <UuidCell uuid={e.id} />, className: 'w-28' },
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
          onClick={() => setExpandedEventId(expandedEventId === e.id ? null : e.id)}
        >
          {expandedEventId === e.id ? <><ChevronDown className="size-3" /> Hide</> : 'Metadata'}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-0">
      <PageHeader
        breadcrumb={
          sub?.tenant_id ? (
            <span className="flex items-center gap-1">
              <Link to="/tenants" className="hover:underline">Tenants</Link>
              <ChevronRight className="size-3" />
              <Link to={`/tenants/${sub.tenant_id}/subscriptions`} className="hover:underline">
                Subscriptions
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-foreground/70">{sub.plan_code}</span>
            </span>
          ) : null
        }
        title={isLoading ? '' : (sub?.plan_code ?? '')}
        description={isLoading ? undefined : `${sub?.billing_model ?? ''} · ${sub?.status ?? ''}`}
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!sub}>
                  <RefreshCw className="size-3.5" />
                  Change Status
                  <ChevronDown className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Current: <span className="font-semibold capitalize">{sub?.status?.replace('_', ' ')}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SUBSCRIPTION_STATUSES.filter((s) => s !== sub?.status).map((s) => (
                  <DropdownMenuItem key={s} className="capitalize" onClick={() => handleStatusChange(s)}>
                    Set to <span className="font-medium ml-1">{s.replace('_', ' ')}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)} disabled={!sub}>
              <XCircle className="size-3.5" />
              Cancel
            </Button>
          </div>
        }
      />

      {/* Metadata strip */}
      {sub && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-3 border">
          <StatusBadge status={sub.status} />
          <div className="flex items-center gap-1.5">
            <CreditCard className="size-3.5" />
            <span className="text-xs capitalize">{sub.billing_model}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            <span className="text-xs">
              {formatDate(sub.start_date)} — {formatDate(sub.end_date)}
            </span>
          </div>
          {sub.trial_end && (
            <span className="text-xs">Trial ends {formatDate(sub.trial_end)}</span>
          )}
          <Badge variant="outline" className="text-xs">
            {sub.auto_renew === true ? '↻ Auto-renews' : '✗ No auto-renew'}
          </Badge>
          <div className="flex items-center gap-1.5">
            <span className="text-xs">ID:</span>
            <UuidCell uuid={sub.id} />
          </div>
        </div>
      )}

      {isLoading && <Skeleton className="h-12 w-full mb-6" />}

      <Tabs defaultValue="features">
        <TabsList>
          <TabsTrigger value="features">
            Features
            {features && (
              <span className="ml-1.5 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 tabular-nums">
                {features.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="events">
            Events
            {events && (
              <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 tabular-nums">
                {events.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p>Features gate access to product capabilities. Add a feature from the catalog to enable it for this subscription. Set <strong>Limits</strong> to cap usage (e.g. max seats).</p>
            </div>
            <Button size="sm" onClick={() => setAddFeatureOpen(true)} className="shrink-0">
              <Plus className="size-4" /> Add Feature
            </Button>
          </div>
          <DataTable
            columns={featureColumns}
            data={features}
            rowKey={(f) => f.feature_id}
            emptyMessage="No features assigned"
            emptyDescription="Assign features from the catalog to control what this tenant can access. Agents check these entitlements at runtime."
          />
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="size-4 shrink-0" />
            <p>Entitlement events scoped to this subscription — license checks, status transitions, and audit entries.</p>
          </div>
          <DataTable
            columns={eventColumns}
            data={events}
            loading={eventsLoading}
            rowKey={(e) => e.id}
            emptyMessage="No events for this subscription"
            emptyDescription="Events appear as agents check entitlements against this subscription."
          />
          {expandedEventId && (events ?? []).find((e) => e.id === expandedEventId) && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Event Metadata</p>
              <JsonViewer data={(events ?? []).find((e) => e.id === expandedEventId)?.metadata} />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Feature Dialog */}
      <Dialog open={addFeatureOpen} onOpenChange={(o) => { setAddFeatureOpen(o); if (!o) setSelectedFeatureId('') }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Feature</DialogTitle>
            <DialogDescription>
              Select a feature from the catalog to enable it for this subscription. Agents can then check access to this feature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select onValueChange={setSelectedFeatureId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a feature…" />
              </SelectTrigger>
              <SelectContent>
                {availableCatalog.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    All catalog features already assigned
                  </div>
                ) : (
                  availableCatalog.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <span className="font-mono text-xs">{f.feature_code}</span>
                      <span className="ml-2 text-muted-foreground">— {f.name}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Can't find a feature? Add it to the{' '}
              <Link to="/features" className="underline">Feature Catalog</Link> first.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddFeatureOpen(false); setSelectedFeatureId('') }}>Cancel</Button>
            <Button onClick={handleAddFeature} disabled={!selectedFeatureId || addFeature.isPending}>
              {addFeature.isPending ? 'Adding…' : 'Add Feature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeFeatureId}
        onOpenChange={(o) => !o && setRemoveFeatureId(null)}
        title="Remove Feature"
        description="Remove this feature from the subscription? Agents will immediately lose access to this entitlement."
        onConfirm={handleRemoveFeature}
        loading={removeFeature.isPending}
        confirmLabel="Remove"
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Subscription"
        description={`Cancel "${sub?.plan_code}"? The subscription will be marked as cancelled. Agents will lose entitlement access immediately.`}
        onConfirm={handleCancel}
        loading={cancelSub.isPending}
        confirmLabel="Cancel Subscription"
      />
    </div>
  )
}
