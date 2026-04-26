import { NavLink } from 'react-router-dom';
import {
  Clock,
  BarChart3,
  FileText,
  Settings,
  FolderOpen,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../store/useAuth';

const links = [
  { to: '/', icon: Clock, label: 'Stundenerfassung' },
  { to: '/overview', icon: BarChart3, label: 'Stundenübersicht' },
  { to: '/invoices', icon: FileText, label: 'Rechnungen' },
  { to: '/projects', icon: FolderOpen, label: 'Projekte' },
  { to: '/settings', icon: Settings, label: 'Einstellungen' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { signOut, user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-stone-200 min-h-screen flex flex-col">
      <div className="p-5 border-b border-stone-100">
        <h1 className="text-lg font-bold text-stone-800">Stundentracker</h1>
        {user?.email && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-stone-500 break-all">{user.email}</p>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-stone-300 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-800 hover:border-stone-400 transition-colors"
            >
              <LogOut size={12} />
              Abmelden
            </button>
          </div>
        )}
      </div>
      <nav className="p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
