import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, Heart, Monitor, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'

import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { UuidCell } from '@/components/shared/UuidCell'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useTenantEndpoints,
  useRegisterEndpoint,
  useDeleteEndpoint,
  useEndpointHeartbeat,
  useUpdateEndpointStatus,
} from '@/hooks/useEndpoints'
import { useTenantDeployments } from '@/hooks/useDeployments'
import { relativeTime } from '@/lib/utils'
import { ENDPOINT_STATUSES } from '@/lib/constants'
import type { Endpoint, EndpointStatus } from '@/types/api'

const schema = z.object({
  deployment_id: z.string().min(1, 'Deployment is required'),
  hostname: z.string().optional(),
  os: z.string().optional(),
  agent_version: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{children}</p>
}

export function TenantEndpointsTab() {
  const { id: tenantId } = useParams<{ id: string }>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error } = useTenantEndpoints(tenantId!)
  const { data: deployments } = useTenantDeployments(tenantId!)
  const registerMutation = useRegisterEndpoint(tenantId!)
  const deleteMutation = useDeleteEndpoint(tenantId!)
  const heartbeatMutation = useEndpointHeartbeat(tenantId!)
  const updateStatusMutation = useUpdateEndpointStatus(tenantId!)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await registerMutation.mutateAsync(values)
      toast.success('Endpoint registered')
      setDialogOpen(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register endpoint')
    }
  }

  const handleHeartbeat = async (id: string, hostname: string | null) => {
    try {
      await heartbeatMutation.mutateAsync(id)
      toast.success(`Heartbeat sent to ${hostname ?? 'endpoint'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Heartbeat failed')
    }
  }

  const handleStatusChange = async (id: string, status: EndpointStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, body: { status } })
      toast.success('Status updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Endpoint deleted')
      setDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete endpoint')
    }
  }

  const columns = [
    { key: 'id', header: 'ID', render: (e: Endpoint) => <UuidCell uuid={e.id} />, className: 'w-28' },
    {
      key: 'hostname',
      header: 'Hostname',
      render: (e: Endpoint) => (
        <div className="flex items-center gap-2">
          <Monitor className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-mono text-sm">{e.hostname ?? <span className="text-muted-foreground italic text-xs">unnamed</span>}</span>
        </div>
      ),
    },
    {
      key: 'os',
      header: 'OS / Agent',
      render: (e: Endpoint) => (
        <div className="text-xs text-muted-foreground">
          <p>{e.os ?? '—'}</p>
          <p className="font-mono">{e.agent_version ? `v${e.agent_version}` : '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e: Endpoint) => (
        <Select
          value={e.status}
          onValueChange={(v) => handleStatusChange(e.id, v as EndpointStatus)}
        >
          <SelectTrigger className="h-7 w-28 text-xs border-0 shadow-none bg-transparent hover:bg-muted px-2">
            <StatusBadge status={e.status} />
          </SelectTrigger>
          <SelectContent>
            {ENDPOINT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'last_seen',
      header: 'Last Seen',
      render: (e: Endpoint) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
              <Clock className="size-3" />
              {relativeTime(e.last_seen)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Last heartbeat received. Agents should heartbeat every few minutes.
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (e: Endpoint) => (
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => handleHeartbeat(e.id, e.hostname)}
                className="text-muted-foreground hover:text-green-600 hover:bg-green-50"
              >
                <Heart className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Simulate a heartbeat — updates last_seen timestamp</TooltipContent>
          </Tooltip>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteId(e.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
      className: 'w-20',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Endpoints are individual agent instances running inside this tenant's deployments. They periodically send heartbeats and validate entitlements against active subscriptions.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="size-4" /> Register Endpoint
        </Button>
      </div>

      {error && <ErrorAlert error={error} />}
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(e) => e.id}
        emptyMessage="No endpoints registered"
        emptyDescription="Endpoints are agent instances that run in the tenant's environment and call back to validate licenses. Register one manually or let the agent auto-register on first heartbeat."
      />

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Register Endpoint</DialogTitle>
            <DialogDescription>
              Manually register an agent endpoint. In production, agents self-register on first heartbeat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Deployment <span className="text-destructive">*</span></Label>
              {errors.deployment_id && <p className="text-xs text-destructive">{errors.deployment_id.message}</p>}
              <Select onValueChange={(v) => setValue('deployment_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select a deployment" /></SelectTrigger>
                <SelectContent>
                  {(deployments ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.deployment_type.toUpperCase()} — {d.environment ?? d.region ?? d.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHint>The deployment environment this agent belongs to. Create a deployment first if none exist.</FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label>Hostname</Label>
              <Input {...register('hostname')} placeholder="e.g. prod-agent-01.acme.com" />
              <FieldHint>The FQDN or identifier of the machine running the agent.</FieldHint>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>OS</Label>
                <Input {...register('os')} placeholder="linux" />
              </div>
              <div className="space-y-1.5">
                <Label>Agent Version</Label>
                <Input {...register('agent_version')} placeholder="1.0.0" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setDialogOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Registering…' : 'Register'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Endpoint"
        description="Remove this endpoint? Its heartbeat and event history will be retained but it will no longer check in."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
