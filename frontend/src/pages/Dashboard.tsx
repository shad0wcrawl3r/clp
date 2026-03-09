import { Link } from 'react-router-dom'
import { Users, Star, Activity, TrendingUp, ArrowRight, Building2, BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/layout/PageHeader'
import { useTenantList } from '@/hooks/useTenants'
import { useFeatureList } from '@/hooks/useFeatures'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  accent,
  href,
}: {
  title: string
  value: number | string | undefined
  description: string
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  accent: string
  href?: string
}) {
  const content = (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <CardHeader className="flex flex-row items-start justify-between pb-2 pt-5">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {loading ? (
            <Skeleton className="h-8 w-12 mt-1" />
          ) : (
            <p className="text-3xl font-bold mt-1 tabular-nums">{value ?? '—'}</p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${accent.replace('bg-', 'bg-').replace('-500', '-100')} mt-0.5`}>
          <Icon className={`size-5 ${accent.replace('bg-', 'text-').replace('-500', '-600')}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  return href ? <Link to={href}>{content}</Link> : content
}

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Create a Tenant',
    body: 'A tenant is an organization or customer account. Each tenant has its own subscriptions, endpoints, and usage data.',
    href: '/tenants',
  },
  {
    step: '2',
    title: 'Add a Subscription',
    body: 'Subscriptions define the plan, billing model, and duration. They gate access to features via the feature catalog.',
    href: '/features',
  },
  {
    step: '3',
    title: 'Register Endpoints',
    body: 'Endpoints are agent instances deployed inside a tenant\'s environment. They heartbeat in to validate entitlements.',
  },
  {
    step: '4',
    title: 'Monitor Events',
    body: 'Every license check, grant, and denial is recorded as an entitlement event — a full audit trail per tenant.',
    href: '/events',
  },
]

export function Dashboard() {
  const { data: tenants, isLoading: tenantsLoading } = useTenantList({ limit: 1000 })
  const { data: features, isLoading: featuresLoading } = useFeatureList({ limit: 1000 })

  const totalTenants = tenants?.length ?? 0
  const activeTenants = tenants?.filter((t) => t.status === 'active').length ?? 0
  const suspendedTenants = tenants?.filter((t) => t.status === 'suspended').length ?? 0
  const totalFeatures = features?.length ?? 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Platform health and quick navigation for the Cloud License Platform."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tenants"
          value={totalTenants}
          description="All registered organizations"
          icon={Building2}
          loading={tenantsLoading}
          accent="bg-blue-500"
          href="/tenants"
        />
        <StatCard
          title="Active Tenants"
          value={activeTenants}
          description="Tenants with active status"
          icon={TrendingUp}
          loading={tenantsLoading}
          accent="bg-green-500"
          href="/tenants"
        />
        <StatCard
          title="Suspended"
          value={suspendedTenants}
          description="Temporarily disabled tenants"
          icon={Users}
          loading={tenantsLoading}
          accent="bg-amber-500"
          href="/tenants"
        />
        <StatCard
          title="Feature Catalog"
          value={totalFeatures}
          description="Licensable features defined"
          icon={Star}
          loading={featuresLoading}
          accent="bg-purple-500"
          href="/features"
        />
      </div>

      {/* How it works + Quick actions side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* How it works */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">How CLP Works</CardTitle>
            </div>
            <CardDescription>
              CLP is a multi-tenant SaaS licensing and entitlement management platform.
              Follow these steps to license your product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HOW_IT_WORKS.map(({ step, title, body, href }) => (
                <div key={step} className="flex gap-3">
                  <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
                    {href && (
                      <Link
                        to={href}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline"
                      >
                        Go there <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </div>
            <CardDescription>Common operations to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" asChild>
              <Link to="/tenants">
                <Building2 className="size-4" />
                Create a Tenant
              </Link>
            </Button>
            <Separator />
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/features">
                <Star className="size-4" />
                Add to Feature Catalog
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/events">
                <Activity className="size-4" />
                Search Audit Events
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin">
                <TrendingUp className="size-4" />
                Run Subscription Cleanup
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
