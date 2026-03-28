/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate 
} from 'react-router-dom';
import { RootLayout } from './components/layout/RootLayout';
import HomePage from './pages/HomePage';
import RedirectPage from './pages/RedirectPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CouponsPage from './pages/CouponsPage';
import { ADMIN_ROUTE_PATH } from './config/constants';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from './store/authStore';
import { DebugPanel } from './components/DebugPanel';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'redirect/:linkId', element: <RedirectPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'coupons', element: <CouponsPage /> },
      { path: ADMIN_ROUTE_PATH, element: <AdminDashboard /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

export default function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <>
      <RouterProvider router={router} />
      <DebugPanel />
    </>
  );
}
