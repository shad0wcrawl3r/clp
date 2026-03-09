import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2, Search, Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { UuidCell } from '@/components/shared/UuidCell'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useTenantList, useCreateTenant, useDeleteTenant } from '@/hooks/useTenants'
import { formatDate } from '@/lib/utils'
import { TENANT_STATUSES } from '@/lib/constants'
import type { Tenant, TenantStatus } from '@/types/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  external_ref: z.string().optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
})
type FormValues = z.infer<typeof schema>

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{children}</p>
}

export function TenantList() {
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: tenants, isLoading, error } = useTenantList({ limit: 1000 })
  const createMutation = useCreateTenant()
  const deleteMutation = useDeleteTenant()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const filtered = (tenants ?? [])
    .filter((t) => statusFilter === 'all' || t.status === statusFilter)
    .filter(
      (t) =>
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.external_ref ?? '').toLowerCase().includes(search.toLowerCase()),
    )

  const onSubmit = async (values: FormValues) => {
    try {
      const tenant = await createMutation.mutateAsync(values)
      toast.success(`Tenant "${tenant.name}" created`)
      setSheetOpen(false)
      reset()
      navigate(`/tenants/${tenant.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tenant')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Tenant deleted')
      setDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tenant')
    }
  }

  const statusCounts = {
    active: (tenants ?? []).filter((t) => t.status === 'active').length,
    suspended: (tenants ?? []).filter((t) => t.status === 'suspended').length,
    deleted: (tenants ?? []).filter((t) => t.status === 'deleted').length,
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (t: Tenant) => <UuidCell uuid={t.id} />,
      className: 'w-28',
    },
    {
      key: 'name',
      header: 'Name',
      render: (t: Tenant) => (
        <button
          className="font-semibold hover:underline text-left text-sm"
          onClick={() => navigate(`/tenants/${t.id}`)}
        >
          {t.name}
        </button>
      ),
    },
    {
      key: 'external_ref',
      header: 'External Ref',
      render: (t: Tenant) => (
        <span className="text-muted-foreground text-xs font-mono">
          {t.external_ref ?? <span className="italic">none</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Tenant) => <StatusBadge status={t.status} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (t: Tenant) => (
        <span className="text-xs text-muted-foreground">{formatDate(t.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (t: Tenant) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/tenants/${t.id}`)}>
            View
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => { e.stopPropagation(); setDeleteId(t.id) }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
      className: 'w-28',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Each tenant represents an organization or customer account. Tenants own subscriptions, deployments, endpoints, and usage records."
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="size-4" />
            New Tenant
          </Button>
        }
      />

      {error && <ErrorAlert error={error} />}

      {/* Summary chips */}
      {!isLoading && tenants && tenants.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs gap-1.5">
            <span className="size-1.5 rounded-full bg-green-500 inline-block" />
            {statusCounts.active} active
          </Badge>
          <Badge variant="outline" className="text-xs gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
            {statusCounts.suspended} suspended
          </Badge>
          <Badge variant="outline" className="text-xs gap-1.5">
            <span className="size-1.5 rounded-full bg-red-400 inline-block" />
            {statusCounts.deleted} deleted
          </Badge>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or external ref…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TENANT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        rowKey={(t) => t.id}
        emptyMessage="No tenants yet"
        emptyDescription="Create your first tenant to get started. Tenants are the top-level container for subscriptions, endpoints, and usage data."
      />

      {/* Create sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="size-4" /> New Tenant
            </SheetTitle>
            <SheetDescription>
              Create a new tenant account. You'll be taken to the tenant page to add subscriptions and endpoints.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Acme Corp"
                autoFocus
              />
              <FieldHint>
                The display name for this organization. Used throughout the admin UI.
              </FieldHint>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="external_ref">External Ref</Label>
              <Input
                id="external_ref"
                {...register('external_ref')}
                placeholder="e.g. sf-account-001 or org_xyz"
              />
              <FieldHint>
                Optional. Your own system's ID for this account — e.g. a Salesforce account ID or CRM reference. Used for cross-system lookups via the <code className="text-[10px] bg-muted px-1 rounded">/tenants/external/:ref</code> endpoint.
              </FieldHint>
            </div>

            <div className="space-y-1.5">
              <Label>Initial Status</Label>
              <Select
                defaultValue="active"
                onValueChange={(v) => setValue('status', v as TenantStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="active" />
                </SelectTrigger>
                <SelectContent>
                  {TENANT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHint>
                <strong>active</strong> — can validate entitlements.{' '}
                <strong>suspended</strong> — license checks blocked.{' '}
                <strong>deleted</strong> — soft-deleted, hidden from most views.
              </FieldHint>
            </div>

            <SheetFooter>
              <Button variant="outline" type="button" onClick={() => { setSheetOpen(false); reset() }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Tenant'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Tenant"
        description="This will permanently delete the tenant along with all its subscriptions, endpoints, deployments, and usage records. This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
