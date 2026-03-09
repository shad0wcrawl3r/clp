import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, Globe, Server, Cloud, Copy, Check, KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'

import { DataTable } from '@/components/shared/DataTable'
import { UuidCell } from '@/components/shared/UuidCell'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { StatusBadge } from '@/components/shared/StatusBadge'
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
import { useTenantDeployments, useCreateDeployment, useDeleteDeployment } from '@/hooks/useDeployments'
import { formatDate } from '@/lib/utils'
import { DEPLOYMENT_TYPES } from '@/lib/constants'
import type { Deployment, DeploymentType } from '@/types/api'

const schema = z.object({
  deployment_type: z.enum(['aws', 'azure', 'gcp', 'onprem']),
  region: z.string().optional(),
  environment: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{children}</p>
}

const DEPLOYMENT_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  aws:    { label: 'AWS',        icon: <Cloud className="size-4 text-orange-500" /> },
  azure:  { label: 'Azure',      icon: <Cloud className="size-4 text-blue-500" /> },
  gcp:    { label: 'GCP',        icon: <Cloud className="size-4 text-red-500" /> },
  onprem: { label: 'On-Premises', icon: <Server className="size-4 text-zinc-500" /> },
}

function KeyCell({ deploymentKey }: { deploymentKey: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(deploymentKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const masked = `${deploymentKey.slice(0, 8)}···`
  return (
    <div className="flex items-center gap-1.5">
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{masked}</code>
      <Button size="icon-sm" variant="ghost" onClick={copy} className="size-6">
        {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3 text-muted-foreground" />}
      </Button>
    </div>
  )
}

export function TenantDeploymentsTab() {
  const { id: tenantId } = useParams<{ id: string }>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [revealKey, setRevealKey] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)

  const { data, isLoading, error } = useTenantDeployments(tenantId!)
  const createMutation = useCreateDeployment(tenantId!)
  const deleteMutation = useDeleteDeployment(tenantId!)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { deployment_type: 'aws' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const deployment = await createMutation.mutateAsync(values)
      setDialogOpen(false)
      reset()
      setRevealKey(deployment.deployment_key)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create deployment')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Deployment deleted')
      setDeleteId(null)
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
    { key: 'id', header: 'ID', render: (d: Deployment) => <UuidCell uuid={d.id} />, className: 'w-28' },
    {
      key: 'type',
      header: 'Provider',
      render: (d: Deployment) => {
        const info = DEPLOYMENT_TYPE_LABELS[d.deployment_type] ?? { label: d.deployment_type, icon: <Globe className="size-4" /> }
        return (
          <div className="flex items-center gap-2">
            {info.icon}
            <span className="text-sm font-medium">{info.label}</span>
          </div>
        )
      },
    },
    {
      key: 'region',
      header: 'Region',
      render: (d: Deployment) => (
        <span className="text-sm font-mono">{d.region ?? <span className="text-muted-foreground italic text-xs">any region</span>}</span>
      ),
    },
    {
      key: 'environment',
      header: 'Environment',
      render: (d: Deployment) => (
        <span className="text-sm capitalize">{d.environment ?? <span className="text-muted-foreground italic text-xs">unspecified</span>}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (d: Deployment) => <StatusBadge status={d.status} />,
    },
    {
      key: 'key',
      header: 'Deployment Key',
      render: (d: Deployment) => <KeyCell deploymentKey={d.deployment_key} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (d: Deployment) => <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (d: Deployment) => (
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteId(d.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
      className: 'w-12',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          A deployment is an installation environment where the CLP agent runs — e.g. a specific cloud account, region, or on-premises data center. Each deployment gets a unique key your subscriber software uses to authenticate against CLP.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="size-4" /> New Deployment
        </Button>
      </div>

      {error && <ErrorAlert error={error} />}
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(d) => d.id}
        emptyMessage="No deployments yet"
        emptyDescription="Add a deployment to represent a cloud account or on-premises environment where this tenant's agents run."
      />

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Deployment</DialogTitle>
            <DialogDescription>
              Register a cloud or on-premises deployment environment. A unique key will be generated for subscriber software to authenticate with.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Provider <span className="text-destructive">*</span></Label>
              {errors.deployment_type && <p className="text-xs text-destructive">{errors.deployment_type.message}</p>}
              <Select defaultValue="aws" onValueChange={(v) => setValue('deployment_type', v as DeploymentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        {DEPLOYMENT_TYPE_LABELS[t]?.icon}
                        {DEPLOYMENT_TYPE_LABELS[t]?.label ?? t}
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
              <FieldHint>Optional. The cloud region where this deployment runs.</FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label>Environment</Label>
              <Input {...register('environment')} placeholder="e.g. production, staging, dev" />
              <FieldHint>Optional label to distinguish environments for the same tenant.</FieldHint>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setDialogOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Key reveal dialog — shown once after creation */}
      <Dialog open={!!revealKey} onOpenChange={(o) => { if (!o) { setRevealKey(null); setKeyCopied(false) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" /> Deployment Key Created
            </DialogTitle>
            <DialogDescription>
              Copy this key and store it securely. Provide it to your subscriber software — it will call <code className="text-xs bg-muted px-1 rounded">POST /api/subscribe</code> with this key to receive its <strong>tenant_id</strong> and <strong>decryption_key</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <code className="text-sm font-mono flex-1 break-all">{revealKey}</code>
              <Button size="icon-sm" variant="ghost" onClick={copyRevealKey} className="shrink-0">
                {keyCopied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can always view the masked key in the table and copy it again from there.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => { setRevealKey(null); setKeyCopied(false) }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Deployment"
        description="Delete this deployment? Any endpoints registered under it will also lose their deployment reference."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
