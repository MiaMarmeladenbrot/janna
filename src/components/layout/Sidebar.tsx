import { NavLink } from 'react-router-dom';
import {
  Clock,
  BarChart3,
  FileText,
  Settings,
  FolderOpen,
  Database,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const links = [
  { to: '/', icon: Clock, label: 'Stundenerfassung' },
  { to: '/uebersicht', icon: BarChart3, label: 'Stundenübersicht' },
  { to: '/rechnungen', icon: FileText, label: 'Rechnungen' },
  { to: '/projekte', icon: FolderOpen, label: 'Projekte' },
  { to: '/einstellungen', icon: Settings, label: 'Einstellungen' },
  { to: '/daten', icon: Database, label: 'Daten' },
];

export function Sidebar() {
  const { signOut, user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-stone-200 min-h-screen flex flex-col">
      <div className="p-5 border-b border-stone-100">
        <h1 className="text-lg font-bold text-stone-800">Stundentracker</h1>
        <p className="text-xs text-stone-500 mt-0.5">{user?.email}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
      <div className="p-3 border-t border-stone-100">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors w-full"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
