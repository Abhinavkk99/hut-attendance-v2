import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  Menu,
  X,
  Home,
  ClipboardCheck,
  UserPlus,
  UserCheck,
  Search,
  BarChart3,
  GraduationCap,
  User,
  Calendar,
  FileText,
  FolderOpen,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import logo from 'figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
}

interface MenuItem {
  path: string;
  icon: typeof Home;
  label: string;
  action?: 'home';
  managerOnly?: boolean;
  adminOnly?: boolean;
}

const staffMenuItems: MenuItem[] = [
  { path: 'home', icon: Home, label: 'Dashboard', action: 'home' },
  { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { path: '/add-participant-multistep', icon: UserPlus, label: 'Register', managerOnly: true },
  { path: '/add-to-program', icon: UserCheck, label: 'Add to Program', managerOnly: true },
  { path: '/search', icon: Search, label: 'Participants', adminOnly: true },
  { path: '/programs', icon: FolderOpen, label: 'Programs', adminOnly: true },
  { path: '/reports', icon: BarChart3, label: 'Reports', adminOnly: true },
  { path: '/training', icon: GraduationCap, label: 'Training' },
  { path: '/approvals', icon: CheckCircle, label: 'Approvals', adminOnly: true },
];

const participantMenuItems: MenuItem[] = [
  { path: 'home', icon: Home, label: 'Dashboard', action: 'home' },
  { path: '/participant/profile', icon: User, label: 'My Profile' },
  { path: '/participant/events', icon: Calendar, label: 'Events' },
  { path: '/participant/records', icon: FileText, label: 'Records' },
];

function initials(name?: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || name.slice(0, 2).toUpperCase();
}

export function Layout({ children, title, subtitle }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleHome = () => {
    if (user?.role === ('Participant' as unknown)) {
      navigate('/participant-dashboard');
    } else {
      navigate('/dashboard');
    }
    setMobileOpen(false);
  };

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path: string) => {
    if (path === 'home') {
      return (
        location.pathname === '/' ||
        location.pathname === '/dashboard' ||
        location.pathname === '/volunteer-dashboard' ||
        location.pathname === '/participant-dashboard'
      );
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getMenuItems = (): MenuItem[] => {
    if ((user?.role as unknown as string) === 'Participant') return participantMenuItems;
    if (user?.role === 'staff') return staffMenuItems.filter((i) => !i.managerOnly && !i.adminOnly);
    if (user?.role === 'manager') return staffMenuItems.filter((i) => !i.adminOnly);
    return staffMenuItems;
  };

  const menuItems = getMenuItems();

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'manager'
        ? 'Manager'
        : user?.role === 'staff'
          ? 'Staff'
          : 'Participant';

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <img src={logo} alt="The Hut" className="h-9 w-auto flex-shrink-0 rounded-lg" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-100">The Hut</div>
          <div className="truncate text-xs text-zinc-500">Participation Portal</div>
        </div>
      </div>

      <div className="mx-3 h-px bg-zinc-800/80" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const onClick = item.action === 'home' ? handleHome : () => go(item.path);
          return (
            <button
              key={item.path}
              onClick={onClick}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                active
                  ? 'bg-zinc-800/80 text-white shadow-inner'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              <Icon
                size={17}
                className={active ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0b] text-zinc-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-zinc-900 lg:bg-[#0c0c0e]">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 h-full w-64 border-r border-zinc-900 bg-[#0c0c0e]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              >
                <X size={18} />
              </button>
            </div>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-900 bg-[#0a0a0b]/80 px-4 backdrop-blur-md md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-900"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-xs font-semibold text-white">
                {initials(user?.name)}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold text-zinc-100 leading-tight">{user?.name || 'Guest'}</div>
                <div className="text-[11px] text-zinc-500 leading-tight">{user?.email || roleLabel}</div>
              </div>
              <ChevronDown size={14} className="hidden text-zinc-500 sm:block" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 overflow-hidden rounded-lg border border-zinc-800 bg-[#111113] shadow-2xl">
                <div className="border-b border-zinc-800 px-3 py-2.5">
                  <div className="text-sm font-semibold text-zinc-100">{user?.name}</div>
                  <div className="text-xs text-zinc-500">{user?.email}</div>
                  <div className="mt-1 inline-flex rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-300">
                    {roleLabel}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
