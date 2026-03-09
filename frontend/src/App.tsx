import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { TenantList } from '@/pages/tenants/TenantList'
import { TenantDetail } from '@/pages/tenants/TenantDetail'
import { TenantSubscriptionsTab } from '@/pages/tenants/tabs/TenantSubscriptionsTab'
import { TenantDeploymentsTab } from '@/pages/tenants/tabs/TenantDeploymentsTab'
import { TenantEndpointsTab } from '@/pages/tenants/tabs/TenantEndpointsTab'
import { TenantCloudAccountsTab } from '@/pages/tenants/tabs/TenantCloudAccountsTab'
import { TenantEventsTab } from '@/pages/tenants/tabs/TenantEventsTab'
import { TenantUsageTab } from '@/pages/tenants/tabs/TenantUsageTab'
import { SubscriptionDetail } from '@/pages/subscriptions/SubscriptionDetail'
import { FeatureList } from '@/pages/features/FeatureList'
import { EventSearch } from '@/pages/events/EventSearch'
import { AdminPanel } from '@/pages/admin/AdminPanel'
import { DeploymentList } from '@/pages/deployments/DeploymentList'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tenants" element={<TenantList />} />
            <Route path="/tenants/:id" element={<TenantDetail />}>
              <Route index element={<Navigate to="subscriptions" replace />} />
              <Route path="subscriptions" element={<TenantSubscriptionsTab />} />
              <Route path="deployments" element={<TenantDeploymentsTab />} />
              <Route path="endpoints" element={<TenantEndpointsTab />} />
              <Route path="cloud-accounts" element={<TenantCloudAccountsTab />} />
              <Route path="events" element={<TenantEventsTab />} />
              <Route path="usage" element={<TenantUsageTab />} />
            </Route>
            <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
            <Route path="/deployments" element={<DeploymentList />} />
            <Route path="/features" element={<FeatureList />} />
            <Route path="/events" element={<EventSearch />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
