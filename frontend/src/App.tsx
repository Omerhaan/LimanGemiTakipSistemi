import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ShipsPage } from './pages/ShipsPage';
import { PortsPage } from './pages/PortsPage';
import { ShipVisitsPage } from './pages/ShipVisitsPage';
import { CargoesPage } from './pages/CargoesPage';
import { CrewMembersPage } from './pages/CrewMembersPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { PerformanceReportsPage } from './pages/PerformanceReportsPage';
import { SecurityLabPage } from './pages/SecurityLabPage';

const LiveMapPage = lazy(() => import('./pages/LiveMapPage').then(module => ({ default: module.LiveMapPage })));

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Oturum yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      ) : (
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
            <span>Sayfa yükleniyor...</span>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="map" element={<LiveMapPage />} />
              <Route path="ships" element={<ShipsPage />} />
              <Route path="ports" element={<PortsPage />} />
              <Route path="visits" element={<ShipVisitsPage />} />
              <Route path="cargoes" element={<CargoesPage />} />
              <Route path="crew" element={<CrewMembersPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="reports" element={<PerformanceReportsPage />} />
              <Route path="security-lab" element={<SecurityLabPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      )}
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
