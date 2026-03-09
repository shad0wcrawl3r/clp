import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, Cloud, Server } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'

import { DataTable } from '@/components/shared/DataTable'
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
import { useTenantCloudAccounts, useAddCloudAccount, useDeleteCloudAccount } from '@/hooks/useCloudAccounts'
import { formatDate } from '@/lib/utils'
import { DEPLOYMENT_TYPES } from '@/lib/constants'
import type { TenantCloudAccount, DeploymentType } from '@/types/api'

const schema = z.object({
  cloud_provider: z.enum(['aws', 'azure', 'gcp', 'onprem']),
  cloud_account_id: z.string().min(1, 'Account ID is required'),
})
type FormValues = z.infer<typeof schema>

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{children}</p>
}

const PROVIDER_INFO: Record<string, { label: string; icon: React.ReactNode; placeholder: string }> = {
  aws:    { label: 'AWS',         icon: <Cloud className="size-4 text-orange-500" />, placeholder: '123456789012' },
  azure:  { label: 'Azure',       icon: <Cloud className="size-4 text-blue-500" />,   placeholder: 'subscription-uuid' },
  gcp:    { label: 'GCP',         icon: <Cloud className="size-4 text-red-500" />,    placeholder: 'my-gcp-project-id' },
  onprem: { label: 'On-Premises', icon: <Server className="size-4 text-zinc-500" />,  placeholder: 'datacenter-rack-A' },
}

export function TenantCloudAccountsTab() {
  const { id: tenantId } = useParams<{ id: string }>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('aws')

  const { data, isLoading, error } = useTenantCloudAccounts(tenantId!)
  const addMutation = useAddCloudAccount(tenantId!)
  const deleteMutation = useDeleteCloudAccount(tenantId!)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cloud_provider: 'aws' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await addMutation.mutateAsync(values)
      toast.success('Cloud account linked')
      setDialogOpen(false)
      reset()
      setSelectedProvider('aws')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add cloud account')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Cloud account removed')
      setDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove cloud account')
    }
  }

  const columns = [
    { key: 'id', header: 'ID', render: (a: TenantCloudAccount) => <UuidCell uuid={a.id} />, className: 'w-28' },
    {
      key: 'provider',
      header: 'Provider',
      render: (a: TenantCloudAccount) => {
        const info = PROVIDER_INFO[a.cloud_provider]
        return (
          <div className="flex items-center gap-2">
            {info?.icon ?? <Cloud className="size-4 text-muted-foreground" />}
            <span className="text-sm font-medium">{info?.label ?? a.cloud_provider.toUpperCase()}</span>
          </div>
        )
      },
    },
    {
      key: 'account_id',
      header: 'Account ID',
      render: (a: TenantCloudAccount) => (
        <code className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono">{a.cloud_account_id}</code>
      ),
    },
    {
      key: 'created_at',
      header: 'Linked',
      render: (a: TenantCloudAccount) => <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (a: TenantCloudAccount) => (
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteId(a.id)}
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
          Cloud accounts link a tenant to their cloud provider accounts for usage tracking and billing attribution. Link an AWS account ID, Azure subscription, GCP project, or on-premises identifier.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="size-4" /> Link Account
        </Button>
      </div>

      {error && <ErrorAlert error={error} />}
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(a) => a.id}
        emptyMessage="No cloud accounts linked"
        emptyDescription="Link a cloud provider account to track where this tenant's workloads run. Useful for billing attribution and multi-cloud deployments."
      />

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { reset(); setSelectedProvider('aws') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Link Cloud Account</DialogTitle>
            <DialogDescription>
              Associate a cloud provider account with this tenant for usage tracking and billing attribution.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Provider <span className="text-destructive">*</span></Label>
              <Select
                defaultValue="aws"
                onValueChange={(v) => { setValue('cloud_provider', v as DeploymentType); setSelectedProvider(v) }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        {PROVIDER_INFO[t]?.icon}
                        {PROVIDER_INFO[t]?.label ?? t.toUpperCase()}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Account ID <span className="text-destructive">*</span></Label>
              <Input
                {...register('cloud_account_id')}
                placeholder={PROVIDER_INFO[selectedProvider]?.placeholder ?? 'account-id'}
              />
              <FieldHint>
                {selectedProvider === 'aws' && 'Your 12-digit AWS account number, e.g. 123456789012.'}
                {selectedProvider === 'azure' && 'Your Azure Subscription UUID from the Azure Portal.'}
                {selectedProvider === 'gcp' && 'Your GCP project ID (e.g. my-project-123), not the project number.'}
                {selectedProvider === 'onprem' && 'A unique identifier for this on-premises environment, e.g. datacenter name.'}
              </FieldHint>
              {errors.cloud_account_id && <p className="text-xs text-destructive">{errors.cloud_account_id.message}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setDialogOpen(false); reset(); setSelectedProvider('aws') }}>Cancel</Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Linking…' : 'Link Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Unlink Cloud Account"
        description="Remove this cloud account link? No cloud resources are affected — only the association is removed from CLP."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
