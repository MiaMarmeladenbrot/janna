import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { TimeTracking } from './pages/TimeTracking';
import { TimeOverview } from './pages/TimeOverview';
import { Invoices } from './pages/Invoices';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { Settings } from './pages/Settings';
import { Projects } from './pages/Projects';


function AppRoutes() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Laden...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TimeTracking />} />
            <Route path="overview" element={<TimeOverview />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="projects" element={<Projects />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
