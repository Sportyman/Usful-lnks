/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate 
} from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { RootLayout } from './components/layout/RootLayout';
import HomePage from './pages/HomePage';
import RedirectPage from './pages/RedirectPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CouponsPage from './pages/CouponsPage';
import LegalPage from './pages/LegalPage';
import { ADMIN_ROUTE_PATH } from './config/constants';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from './store/authStore';
import { DebugPanel } from './components/DebugPanel';
import { Toaster } from 'sonner';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'go/:linkId', element: <RedirectPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'coupons', element: <CouponsPage /> },
      { path: 'legal/:type', element: <LegalPage /> },
      { path: 'privacy', element: <Navigate to="/legal/privacy" replace /> },
      { path: 'terms', element: <Navigate to="/legal/terms" replace /> },
      { path: 'accessibility', element: <Navigate to="/legal/accessibility" replace /> },
      { path: 'disclosure', element: <Navigate to="/legal/disclosure" replace /> },
      { path: ADMIN_ROUTE_PATH, element: <AdminDashboard /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

export default function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Safety timeout: Ensure loading is disabled even if Firebase hangs
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              role: userDoc.data().role
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [setUser, setLoading]);

  return (
    <HelmetProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
      <DebugPanel />
    </HelmetProvider>
  );
}
