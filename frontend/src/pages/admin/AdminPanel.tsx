import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useExpireSubscriptions } from '@/hooks/useAdmin'

export function AdminPanel() {
  const [result, setResult] = useState<{ expired: number } | null>(null)
  const expireMutation = useExpireSubscriptions()

  const handleExpire = async () => {
    try {
      const res = await expireMutation.mutateAsync()
      setResult(res)
      toast.success(`Expired ${res.expired} subscription(s)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to expire subscriptions')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Maintenance operations that affect platform-wide data. Use with care."
      />

      <div className="max-w-lg space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="size-4 shrink-0" />
          <p>These operations affect all tenants and cannot be undone. Run during low-traffic windows.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Expire Overdue Subscriptions</CardTitle>
            </div>
            <CardDescription>
              Scans all subscriptions and transitions any whose <code className="text-[11px] bg-muted px-1 rounded">end_date</code> has passed
              (and are still in <strong>active</strong> or <strong>grace</strong> status) to <strong>expired</strong>.
              This is typically run nightly by a scheduler.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />

            {expireMutation.error && <ErrorAlert error={expireMutation.error} />}

            {result !== null && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>
                  Job completed — <strong>{result.expired}</strong>{' '}
                  subscription{result.expired !== 1 ? 's' : ''} marked as expired.
                </span>
              </div>
            )}

            <Button
              onClick={handleExpire}
              disabled={expireMutation.isPending}
              variant={expireMutation.isPending ? 'outline' : 'default'}
            >
              <RefreshCw className={`size-4 ${expireMutation.isPending ? 'animate-spin' : ''}`} />
              {expireMutation.isPending ? 'Running…' : 'Run Expire Job'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
