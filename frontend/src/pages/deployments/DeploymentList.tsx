import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, Globe, Server, Cloud, Copy, Check, KeyRound, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAllDeployments, useCreateDeployment, useUpdateDeploymentStatus, useDeleteDeployment } from '@/hooks/useDeployments'
import { useTenantList } from '@/hooks/useTenants'
import { formatDate } from '@/lib/utils'
import { DEPLOYMENT_TYPES, DEPLOYMENT_STATUSES } from '@/lib/constants'
import type { DeploymentWithTenant, DeploymentType, DeploymentStatus } from '@/types/api'

const schema = z.object({
  tenant_id: z.string().min(1, 'Select a tenant'),
  deployment_type: z.enum(['aws', 'azure', 'gcp', 'onprem']),
  region: z.string().optional(),
  environment: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{children}</p>
}

const PROVIDER_INFO: Record<string, { label: string; icon: React.ReactNode }> = {
  aws:    { label: 'AWS',         icon: <Cloud className="size-4 text-orange-500" /> },
  azure:  { label: 'Azure',       icon: <Cloud className="size-4 text-blue-500" /> },
  gcp:    { label: 'GCP',         icon: <Cloud className="size-4 text-red-500" /> },
  onprem: { label: 'On-Premises', icon: <Server className="size-4 text-zinc-500" /> },
}

function KeyCell({ deploymentKey }: { deploymentKey: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(deploymentKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-1.5">
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
        {deploymentKey.slice(0, 8)}···
      </code>
      <Button size="icon-sm" variant="ghost" onClick={copy} className="size-6">
        {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3 text-muted-foreground" />}
      </Button>
    </div>
  )
}

function StatusCell({ deployment }: { deployment: DeploymentWithTenant }) {
  const updateStatus = useUpdateDeploymentStatus()
  const otherStatuses = DEPLOYMENT_STATUSES.filter((s) => s !== deployment.status)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer">
          <StatusBadge status={deployment.status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Change status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {otherStatuses.map((s) => (
          <DropdownMenuItem
            key={s}
            className="capitalize"
            onClick={() =>
              updateStatus.mutate(
                { id: deployment.id, status: s as DeploymentStatus },
                { onSuccess: () => toast.success(`Deployment set to ${s}`) },
              )
            }
          >
            Set to {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DeploymentList() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeploymentWithTenant | null>(null)
  const [revealKey, setRevealKey] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)

  const { data, isLoading, error } = useAllDeployments({ limit: 100 })
  const { data: tenantData } = useTenantList({ limit: 500 })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { deployment_type: 'aws' },
  })

  const selectedTenantId = watch('tenant_id')
  const createMutation = useCreateDeployment(selectedTenantId ?? '')
  const deleteByTenant = useDeleteDeployment(deleteTarget?.tenant_id ?? '')

  const onSubmit = async (values: FormValues) => {
    try {
      const { tenant_id, ...deploymentBody } = values
      const deployment = await createMutation.mutateAsync(deploymentBody)
      setDialogOpen(false)
      reset()
      setRevealKey(deployment.deployment_key)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create deployment')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteByTenant.mutateAsync(deleteTarget.id)
      toast.success('Deployment deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete deployment')
    }
  }

  const copyRevealKey = () => {
    if (!revealKey) return
    navigator.clipboard.writeText(revealKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  const columns = [
    {
      key: 'tenant',
      header: 'Tenant',
      render: (d: DeploymentWithTenant) => (
        <Link to={`/tenants/${d.tenant_id}/deployments`} className="text-sm font-medium hover:underline">
          {d.tenant_name}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Provider',
      render: (d: DeploymentWithTenant) => {
        const info = PROVIDER_INFO[d.deployment_type] ?? { label: d.deployment_type, icon: <Globe className="size-4" /> }
        return (
          <div className="flex items-center gap-2">
            {info.icon}
            <span className="text-sm font-medium">{info.label}</span>
          </div>
        )
      },
    },
    {
      key: 'region_env',
      header: 'Region / Env',
      render: (d: DeploymentWithTenant) => (
        <div className="text-xs space-y-0.5">
          <div className="font-mono">{d.region ?? <span className="text-muted-foreground italic">any region</span>}</div>
          <div className="text-muted-foreground capitalize">{d.environment ?? <span className="italic">unspecified</span>}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d: DeploymentWithTenant) => <StatusCell deployment={d} />,
    },
    {
      key: 'key',
      header: 'Deployment Key',
      render: (d: DeploymentWithTenant) => <KeyCell deploymentKey={d.deployment_key} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (d: DeploymentWithTenant) => <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (d: DeploymentWithTenant) => (
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteTarget(d)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
      className: 'w-12',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deployments"
        description="Deployment keys link your subscriber software to a licensed tenant in CLP."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> New Deployment
          </Button>
        }
      />

      <Alert>
        <Info className="size-4" />
        <AlertDescription className="text-sm">
          <strong>How it works:</strong> Create a deployment for a tenant, copy the generated key, and ship it with your subscriber product.
          The subscriber software calls <code className="text-xs bg-muted px-1 rounded">POST /api/subscribe</code> with that key
          and receives a <strong>tenant_id</strong> and <strong>decryption_key</strong> it can use to bootstrap its stack.
        </AlertDescription>
      </Alert>

      {error && <ErrorAlert error={error} />}

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(d) => d.id}
        emptyMessage="No deployments yet"
        emptyDescription="Create a deployment to generate a key for your subscriber software."
      />

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Deployment</DialogTitle>
            <DialogDescription>
              A unique deployment key will be generated. Give it to your subscriber software so it can authenticate against CLP.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Tenant <span className="text-destructive">*</span></Label>
              {errors.tenant_id && <p className="text-xs text-destructive">{errors.tenant_id.message}</p>}
              <Select onValueChange={(v) => setValue('tenant_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select tenant…" /></SelectTrigger>
                <SelectContent>
                  {(tenantData ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHint>The tenant (customer) this deployment belongs to.</FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label>Provider <span className="text-destructive">*</span></Label>
              {errors.deployment_type && <p className="text-xs text-destructive">{errors.deployment_type.message}</p>}
              <Select defaultValue="aws" onValueChange={(v) => setValue('deployment_type', v as DeploymentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        {PROVIDER_INFO[t]?.icon}
                        {PROVIDER_INFO[t]?.label ?? t}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHint>The cloud provider or infrastructure type for this deployment.</FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Input {...register('region')} placeholder="e.g. us-east-1, westeurope" />
              <FieldHint>Optional. Leave blank for global or on-premises deployments.</FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label>Environment</Label>
              <Input {...register('environment')} placeholder="e.g. production, staging" />
              <FieldHint>Optional label to distinguish environments for the same tenant.</FieldHint>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setDialogOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !selectedTenantId}>
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Key reveal dialog */}
      <Dialog open={!!revealKey} onOpenChange={(o) => { if (!o) { setRevealKey(null); setKeyCopied(false) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" /> Deployment Key Created
            </DialogTitle>
            <DialogDescription>
              Copy this key and store it securely. Your subscriber software will call{' '}
              <code className="text-xs bg-muted px-1 rounded">POST /api/subscribe</code>{' '}
              with this key to receive its <strong>tenant_id</strong> and <strong>decryption_key</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <code className="text-sm font-mono flex-1 break-all select-all">{revealKey}</code>
              <Button size="icon-sm" variant="ghost" onClick={copyRevealKey} className="shrink-0">
                {keyCopied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can always copy the key again from the masked display in the table.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => { setRevealKey(null); setKeyCopied(false) }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Deployment"
        description={`Delete the deployment for "${deleteTarget?.tenant_name}"? Any endpoints registered under it will lose their deployment reference.`}
        onConfirm={handleDelete}
        loading={deleteByTenant.isPending}
      />
    </div>
  )
}
