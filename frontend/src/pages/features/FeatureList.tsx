import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Star } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'

import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { UuidCell } from '@/components/shared/UuidCell'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useFeatureList, useCreateFeature, useDeleteFeature } from '@/hooks/useFeatures'
import { formatDate } from '@/lib/utils'
import type { Feature } from '@/types/api'

const schema = z.object({
  feature_code: z
    .string()
    .min(1, 'Code is required')
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, hyphens, underscores only'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{children}</p>
}

export function FeatureList() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error } = useFeatureList({ limit: 1000 })
  const createMutation = useCreateFeature()
  const deleteMutation = useDeleteFeature()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync(values)
      toast.success(`Feature "${values.feature_code}" added to catalog`)
      setDialogOpen(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create feature')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Feature removed from catalog')
      setDeleteId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete feature')
    }
  }

  // Unique categories
  const categories = [...new Set((data ?? []).map((f) => f.category).filter(Boolean))]

  const columns = [
    { key: 'id', header: 'ID', render: (f: Feature) => <UuidCell uuid={f.id} />, className: 'w-28' },
    {
      key: 'feature_code',
      header: 'Code',
      render: (f: Feature) => (
        <code className="text-xs bg-muted rounded px-1.5 py-0.5 font-mono font-medium">{f.feature_code}</code>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (f: Feature) => <span className="text-sm font-medium">{f.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (f: Feature) => (
        <span className="text-xs text-muted-foreground">{f.description ?? <span className="italic">no description</span>}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (f: Feature) =>
        f.category ? (
          <Badge variant="outline" className="text-xs capitalize">{f.category}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground italic">uncategorized</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Added',
      render: (f: Feature) => <span className="text-xs text-muted-foreground">{formatDate(f.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (f: Feature) => (
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteId(f.id)}
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
        title="Feature Catalog"
        description="Features are licensable capabilities that can be enabled or disabled per subscription. Define them here, then assign them to subscriptions to control entitlements."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> New Feature
          </Button>
        }
      />

      {error && <ErrorAlert error={error} />}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground mr-1 self-center">Categories:</span>
          {categories.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs capitalize">{cat}</Badge>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(f) => f.id}
        emptyMessage="No features in catalog"
        emptyDescription="Add features to the catalog first, then assign them to tenant subscriptions to gate entitlements. Feature codes are used by agents to check access."
      />

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="size-4" /> New Feature
            </DialogTitle>
            <DialogDescription>
              Add a new feature to the catalog. Once created, it can be assigned to any subscription with optional limits.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Feature Code <span className="text-destructive">*</span></Label>
              <Input {...register('feature_code')} placeholder="e.g. advanced-reporting" />
              <FieldHint>
                A stable, unique identifier used by agents to check entitlements. Use lowercase with hyphens or underscores. Cannot be changed after creation.
              </FieldHint>
              {errors.feature_code && <p className="text-xs text-destructive">{errors.feature_code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Display Name <span className="text-destructive">*</span></Label>
              <Input {...register('name')} placeholder="e.g. Advanced Reporting" />
              <FieldHint>Human-readable name shown in admin UI and customer portals.</FieldHint>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={2} placeholder="What does this feature do? When is it used?" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input {...register('category')} placeholder="e.g. analytics, security, integrations" />
              <FieldHint>Optional grouping label for the catalog. E.g. "analytics", "compliance", "api".</FieldHint>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setDialogOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Add to Catalog'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Remove Feature"
        description="Remove this feature from the catalog? It will be unlinked from all subscriptions that currently use it. Agents checking for this feature will no longer find it."
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
