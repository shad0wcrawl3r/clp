import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Key,
  Star,
  Zap,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
    description: 'Platform overview',
  },
  {
    to: '/tenants',
    label: 'Tenants',
    icon: Users,
    description: 'Manage organizations',
  },
  {
    to: '/deployments',
    label: 'Deployments',
    icon: Key,
    description: 'Keys & subscriber access',
  },
  {
    to: '/features',
    label: 'Features',
    icon: Star,
    description: 'Feature catalog',
  },
  {
    to: '/events',
    label: 'Events',
    icon: Zap,
    description: 'Audit log search',
  },
  {
    to: '/admin',
    label: 'Admin',
    icon: ShieldAlert,
    description: 'Maintenance tasks',
  },
]

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r bg-sidebar flex flex-col h-full">
      {/* Logo / branding */}
      <div className="px-4 py-4 border-b flex items-center gap-3">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm tracking-tight">CLP</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-none text-sidebar-foreground">Cloud License</p>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">Platform Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Navigation
        </p>
        {navItems.map(({ to, label, icon: Icon, end, description }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none">{label}</p>
              <p className="text-[11px] text-sidebar-foreground/40 mt-0.5 group-[.active]:text-sidebar-accent-foreground/60">
                {description}
              </p>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t">
        <p className="text-[11px] text-sidebar-foreground/30">Entitlement management</p>
      </div>
    </aside>
  )
}
