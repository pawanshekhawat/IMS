import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { SalesBilling } from './pages/SalesBilling';
import { Customers } from './pages/Customers';
import { Purchases } from './pages/Purchases';
import { Suppliers } from './pages/Suppliers';
import { Inventory } from './pages/Inventory';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Admin-only routes */}
              <Route
                index
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="purchases"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Purchases />
                  </ProtectedRoute>
                }
              />
              <Route
                path="suppliers"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Suppliers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="expenses"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Expenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Shared routes accessible to both Staff and Admin */}
              <Route path="sales" element={<SalesBilling />} />
              <Route path="products" element={<Products />} />
              <Route path="customers" element={<Customers />} />
              <Route path="inventory" element={<Inventory />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
