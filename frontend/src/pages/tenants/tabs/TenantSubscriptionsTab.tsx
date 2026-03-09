import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, CreditCard, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'

import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { UuidCell } from '@/components/shared/UuidCell'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useTenantSubscriptions, useCreateSubscription, useTenantActiveSubscription } from '@/hooks/useSubscriptions'
import { formatDate } from '@/lib/utils'
import { SUBSCRIPTION_STATUSES, BILLING_MODELS } from '@/lib/constants'
import type { Subscription, SubscriptionStatus, BillingModel } from '@/types/api'

const schema = z.object({
  plan_code: z.string().min(1, 'Plan code is required'),
  billing_model: z.enum(['prepaid', 'postpaid']),
  status: z.enum(['trial', 'active', 'grace', 'past_due', 'cancelled', 'expired']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  trial_end: z.string().optional(),
  auto_renew: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{children}</p>
}

export function TenantSubscriptionsTab() {
  const { id: tenantId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, error } = useTenantSubscriptions(tenantId!)
  const { data: activeSub } = useTenantActiveSubscription(tenantId!)
  const createMutation = useCreateSubscription(tenantId!)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { billing_model: 'prepaid', auto_renew: false },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const sub = await createMutation.mutateAsync(values)
      toast.success(`Subscription "${sub.plan_code}" created`)
      setDialogOpen(false)
      reset()
      navigate(`/subscriptions/${sub.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create subscription')
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (s: Subscription) => <UuidCell uuid={s.id} />,
      className: 'w-28',
    },
    {
      key: 'plan_code',
      header: 'Plan Code',
      render: (s: Subscription) => (
        <div className="flex items-center gap-2">
          <button
            className="font-semibold text-sm hover:underline text-left"
            onClick={() => navigate(`/subscriptions/${s.id}`)}
          >
            {s.plan_code}
          </button>
          {activeSub?.id === s.id && (
            <Badge variant="outline" className="text-[10px] px-1.5 bg-green-50 text-green-700 border-green-200">
              Active Plan
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'billing_model',
      header: 'Billing',
      render: (s: Subscription) => (
        <span className="text-xs capitalize text-muted-foreground">{s.billing_model}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Subscription) => <StatusBadge status={s.status} />,
    },
    {
      key: 'start_date',
      header: 'Period',
      render: (s: Subscription) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(s.start_date)} — {formatDate(s.end_date)}
        </span>
      ),
    },
    {
      key: 'auto_renew',
      header: 'Auto Renew',
      render: (s: Subscription) => (
        <span className="text-xs">
          {s.auto_renew === true ? '✓ Yes' : s.auto_renew === false ? '✗ No' : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s: Subscription) => (
        <Button size="sm" variant="ghost" onClick={() => navigate(`/subscriptions/${s.id}`)}>
          View <ArrowRight className="size-3 ml-1" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Subscriptions define which plan a tenant is on, the billing model, and validity period.
            Each subscription can be assigned features from the catalog to gate entitlements.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="size-4" /> New Subscription
        </Button>
      </div>

      {error && <ErrorAlert error={error} />}

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(s) => s.id}
        emptyMessage="No subscriptions yet"
        emptyDescription="Create a subscription to grant this tenant access to licensed features. Each subscription links to a plan and controls entitlement validity."
      />

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-4" /> New Subscription
            </DialogTitle>
            <DialogDescription>
              Create a new subscription for this tenant. You'll be redirected to the subscription page to assign features.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Plan Code <span className="text-destructive">*</span></Label>
              <Input {...register('plan_code')} placeholder="e.g. enterprise-annual" />
              <FieldHint>
                A unique slug identifying this plan. Use lowercase letters, hyphens, or underscores. E.g. <code className="text-[10px] bg-muted px-1 rounded">pro-monthly</code>, <code className="text-[10px] bg-muted px-1 rounded">enterprise-annual</code>.
              </FieldHint>
              {errors.plan_code && <p className="text-xs text-destructive">{errors.plan_code.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Billing Model <span className="text-destructive">*</span></Label>
              <Select
                defaultValue="prepaid"
                onValueChange={(v) => setValue('billing_model', v as BillingModel)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BILLING_MODELS.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHint>
                <strong>Prepaid</strong> — customer pays upfront before using the service.{' '}
                <strong>Postpaid</strong> — customer is billed after usage (usage-based).
              </FieldHint>
            </div>

            <div className="space-y-1.5">
              <Label>Initial Status</Label>
              <Select onValueChange={(v) => setValue('status', v as SubscriptionStatus)}>
                <SelectTrigger><SelectValue placeholder="trial (default)" /></SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldHint>
                Defaults to <strong>trial</strong>. Set to <strong>active</strong> once payment is confirmed.
              </FieldHint>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" {...register('start_date')} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" {...register('end_date')} />
              </div>
            </div>
            <FieldHint>
              Inclusive validity window. Leave blank for open-ended subscriptions.
            </FieldHint>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="auto_renew"
                checked={watch('auto_renew') ?? false}
                onCheckedChange={(v) => setValue('auto_renew', !!v)}
              />
              <Label htmlFor="auto_renew" className="font-normal cursor-pointer">
                Auto Renew
                <span className="ml-1 text-xs text-muted-foreground font-normal">— automatically extends end date on expiry</span>
              </Label>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setDialogOpen(false); reset() }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Subscription'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
