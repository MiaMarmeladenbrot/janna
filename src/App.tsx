import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { StundenErfassung } from './pages/StundenErfassung';
import { StundenUebersicht } from './pages/StundenUebersicht';
import { Rechnungen } from './pages/Rechnungen';
import { RechnungDetail } from './pages/RechnungDetail';
import { Einstellungen } from './pages/Einstellungen';
import { Projekte } from './pages/Projekte';


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
            <Route index element={<StundenErfassung />} />
            <Route path="uebersicht" element={<StundenUebersicht />} />
            <Route path="rechnungen" element={<Rechnungen />} />
            <Route path="rechnungen/:id" element={<RechnungDetail />} />
            <Route path="einstellungen" element={<Einstellungen />} />
            <Route path="projekte" element={<Projekte />} />

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
