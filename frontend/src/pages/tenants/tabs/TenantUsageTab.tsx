import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'
import { Plus, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { DateRangePicker } from '@/components/shared/DateRangePicker'
import { DataTable } from '@/components/shared/DataTable'
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
import { useUsageRange, useUpsertUsage } from '@/hooks/useUsage'
import { formatDate } from '@/lib/utils'
import type { UsageMetricsDaily } from '@/types/api'

const schema = z.object({
  usage_date: z.string().min(1, 'Date is required'),
  endpoints_active: z.number().int().min(0),
  events_ingested: z.number().int().min(0),
  eps_avg: z.number().int().min(0),
  eps_peak: z.number().int().min(0),
})
type FormValues = z.infer<typeof schema>

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{children}</p>
}

export function TenantUsageTab() {
  const { id: tenantId } = useParams<{ id: string }>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const params = {
    from: format(dateRange.from, 'yyyy-MM-dd'),
    to: format(dateRange.to, 'yyyy-MM-dd'),
  }

  const { data, isLoading, error } = useUsageRange(tenantId!, params)
  const upsertMutation = useUpsertUsage(tenantId!)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      usage_date: format(new Date(), 'yyyy-MM-dd'),
      endpoints_active: 0,
      events_ingested: 0,
      eps_avg: 0,
      eps_peak: 0,
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await upsertMutation.mutateAsync(values)
      toast.success('Usage metrics saved')
      setDialogOpen(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save usage')
    }
  }

  const chartData = (data ?? []).map((d) => ({
    date: d.usage_date ? format(new Date(d.usage_date), 'MMM d') : '',
    'Active Endpoints': d.endpoints_active,
    'Events Ingested': d.events_ingested,
    'EPS Avg': d.eps_avg,
    'EPS Peak': d.eps_peak,
  }))

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (d: UsageMetricsDaily) => <span className="text-sm font-mono">{formatDate(d.usage_date)}</span>,
    },
    {
      key: 'endpoints_active',
      header: 'Active Endpoints',
      render: (d: UsageMetricsDaily) => <span className="text-sm tabular-nums">{d.endpoints_active.toLocaleString()}</span>,
    },
    {
      key: 'events_ingested',
      header: 'Events Ingested',
      render: (d: UsageMetricsDaily) => <span className="text-sm tabular-nums">{d.events_ingested.toLocaleString()}</span>,
    },
    {
      key: 'eps_avg',
      header: 'EPS Avg',
      render: (d: UsageMetricsDaily) => <span className="text-sm tabular-nums">{d.eps_avg}</span>,
    },
    {
      key: 'eps_peak',
      header: 'EPS Peak',
      render: (d: UsageMetricsDaily) => <span className="text-sm tabular-nums">{d.eps_peak}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0" />
        <p>
          Daily usage metrics track how many endpoints were active, total events ingested, and throughput (EPS = Events Per Second — average and peak).
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Upsert Metrics
        </Button>
      </div>

      {error && <ErrorAlert error={error} />}

      {chartData.length > 0 ? (
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Usage Over Time
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="Active Endpoints" stroke="var(--color-chart-1)" dot={false} strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="EPS Avg" stroke="var(--color-chart-2)" dot={false} strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="EPS Peak" stroke="var(--color-chart-3)" dot={false} strokeWidth={2} strokeDasharray="4 2" />
              <Bar yAxisId="right" dataKey="Events Ingested" fill="var(--color-chart-4)" opacity={0.6} radius={[2, 2, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : !isLoading && (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p className="text-sm font-medium">No usage data in selected range</p>
          <p className="text-xs mt-1 opacity-60">Use "Upsert Metrics" to add daily usage records, or widen the date range.</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(d) => d.id}
        emptyMessage="No usage records"
        emptyDescription="Usage records are typically written daily by a billing or metrics collection job."
      />

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Upsert Daily Usage</DialogTitle>
            <DialogDescription>
              Create or update usage metrics for a specific date. If a record already exists for the date, it will be overwritten.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...register('usage_date')} />
              {errors.usage_date && <p className="text-xs text-destructive">{errors.usage_date.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Active Endpoints</Label>
                <Input type="number" min="0" {...register('endpoints_active', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Events Ingested</Label>
                <Input type="number" min="0" {...register('events_ingested', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>EPS Avg</Label>
                <Input type="number" min="0" {...register('eps_avg', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>EPS Peak</Label>
                <Input type="number" min="0" {...register('eps_peak', { valueAsNumber: true })} />
              </div>
            </div>
            <FieldHint>
              EPS = Events Per Second. Avg is the mean throughout the day; Peak is the highest burst.
            </FieldHint>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setDialogOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
