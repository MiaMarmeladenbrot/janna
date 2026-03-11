import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar />
      <main className="flex-1 p-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
