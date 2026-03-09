import { useState } from 'react'
import { useParams, useNavigate, Outlet, useLocation, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronRight, Trash2, ChevronDown, Calendar, Hash, Tag } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { UuidCell } from '@/components/shared/UuidCell'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useTenant, useUpdateTenantStatus, useDeleteTenant } from '@/hooks/useTenants'
import { useTenantEndpointCount } from '@/hooks/useEndpoints'
import { useTenantSubscriptions } from '@/hooks/useSubscriptions'
import { TENANT_STATUSES } from '@/lib/constants'
import type { TenantStatus } from '@/types/api'

const TABS = [
  {
    path: 'subscriptions',
    label: 'Subscriptions',
    description: 'Plans, billing, and feature entitlements',
  },
  {
    path: 'deployments',
    label: 'Deployments',
    description: 'Cloud/on-prem installation environments',
  },
  {
    path: 'endpoints',
    label: 'Endpoints',
    description: 'Agent instances reporting in for license checks',
  },
  {
    path: 'cloud-accounts',
    label: 'Cloud Accounts',
    description: 'Linked AWS/Azure/GCP accounts',
  },
  {
    path: 'events',
    label: 'Events',
    description: 'Entitlement audit log',
  },
  {
    path: 'usage',
    label: 'Usage',
    description: 'Daily metrics: endpoints, events, EPS',
  },
]

export function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: tenant, isLoading, error } = useTenant(id!)
  const { data: endpointCount } = useTenantEndpointCount(id!)
  const { data: subscriptions } = useTenantSubscriptions(id!)
  const updateStatus = useUpdateTenantStatus(id!)
  const deleteTenant = useDeleteTenant()

  const handleStatusChange = async (status: TenantStatus) => {
    try {
      await updateStatus.mutateAsync({ status })
      toast.success(`Status updated to "${status}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTenant.mutateAsync(id!)
      toast.success('Tenant deleted')
      navigate('/tenants')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tenant')
    }
  }

  if (error) return <ErrorAlert error={error} />

  const activeSubCount = (subscriptions ?? []).filter(
    (s) => s.status === 'active' || s.status === 'trial',
  ).length

  return (
    <div className="space-y-0">
      <PageHeader
        breadcrumb={
          <span className="flex items-center gap-1">
            <Link to="/tenants" className="hover:underline">Tenants</Link>
            <ChevronRight className="size-3" />
            {isLoading ? (
              <Skeleton className="h-3 w-24 inline-block" />
            ) : (
              <span className="text-foreground/70">{tenant?.name}</span>
            )}
          </span>
        }
        title={isLoading ? '' : (tenant?.name ?? '')}
        description={
          isLoading
            ? undefined
            : tenant?.external_ref
              ? `External ref: ${tenant.external_ref}`
              : 'No external reference set'
        }
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!tenant}>
                  Change Status
                  <ChevronDown className="size-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Current: <span className="font-semibold capitalize">{tenant?.status}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TENANT_STATUSES.filter((s) => s !== tenant?.status).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    className="capitalize"
                    onClick={() => handleStatusChange(s)}
                  >
                    Set to <span className="font-medium ml-1">{s}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={!tenant}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Metadata strip */}
      {tenant && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-3 border">
          <div className="flex items-center gap-1.5">
            <StatusBadge status={tenant.status} />
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="size-3.5" />
            <span className="text-xs">ID:</span>
            <UuidCell uuid={tenant.id} />
          </div>
          {tenant.external_ref && (
            <div className="flex items-center gap-1.5">
              <Tag className="size-3.5" />
              <span className="text-xs">Ref:</span>
              <code className="text-xs bg-muted rounded px-1.5 py-0.5">{tenant.external_ref}</code>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            <span className="text-xs">Created {formatDate(tenant.created_at)}</span>
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div className="border-b mb-6">
        <nav className="flex overflow-x-auto">
          {TABS.map(({ path, label, description }) => {
            const fullPath = `/tenants/${id}/${path}`
            const isActive =
              location.pathname === fullPath ||
              location.pathname.startsWith(fullPath + '/')

            // badge counts
            let badge: number | undefined
            if (path === 'endpoints') badge = endpointCount?.count
            if (path === 'subscriptions') badge = subscriptions?.length

            return (
              <Link
                key={path}
                to={fullPath}
                title={description}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                )}
              >
                {label}
                {badge !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] rounded-full px-1.5 py-0.5 font-semibold tabular-nums',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {badge}
                  </span>
                )}
                {path === 'subscriptions' && activeSubCount > 0 && (
                  <span className="size-1.5 rounded-full bg-green-500 inline-block" title={`${activeSubCount} active`} />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <Outlet />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Tenant"
        description={`Permanently delete "${tenant?.name}"? This removes all subscriptions, endpoints, deployments, cloud accounts, and usage data. Cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteTenant.isPending}
      />
    </div>
  )
}
