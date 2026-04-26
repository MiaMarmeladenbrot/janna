import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-stone-50">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-stone-900/40 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-[drawerSlideIn_0.2s_ease-out]">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
              aria-label="Menü schließen"
            >
              <X size={20} />
            </button>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      <main className="flex-1 lg:max-w-5xl">
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 -ml-1 rounded-lg text-stone-700 hover:bg-stone-100"
            aria-label="Menü öffnen"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-base font-bold text-stone-800">Stundentracker</h1>
        </div>

        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
