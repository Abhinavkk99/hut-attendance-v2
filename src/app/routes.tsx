import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AddParticipant from './pages/AddParticipant';
import AddParticipantMultiStep from './pages/AddParticipantMultiStep';
import SearchParticipant from './pages/SearchParticipant';
import AddToProgram from './pages/AddToProgram';
import ParticipantProfile from './pages/ParticipantProfile';
import EditParticipant from './pages/EditParticipant';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Training from './pages/Training';
import Approvals from './pages/Approvals';
import Programs from './pages/Programs';
import Debug from './pages/Debug';

// Root layout that wraps everything with AuthProvider
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Root redirect based on authentication and role
function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role === 'staff') {
    return <Navigate to="/volunteer-dashboard" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

// Login redirect - if already logged in, go to appropriate dashboard
function LoginRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    if (user?.role === 'staff') {
      return <Navigate to="/volunteer-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Login />;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <LoginRoute />,
      },
      {
        path: '/signup',
        element: <SignUp />,
      },
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/volunteer-dashboard',
        element: (
          <ProtectedRoute>
            <VolunteerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/add-participant',
        element: (
          <ProtectedRoute>
            <AddParticipant />
          </ProtectedRoute>
        ),
      },
      {
        path: '/add-participant-multistep',
        element: (
          <ProtectedRoute>
            <AddParticipantMultiStep />
          </ProtectedRoute>
        ),
      },
      {
        path: '/search',
        element: (
          <ProtectedRoute>
            <SearchParticipant />
          </ProtectedRoute>
        ),
      },
      {
        path: '/add-to-program',
        element: (
          <ProtectedRoute>
            <AddToProgram />
          </ProtectedRoute>
        ),
      },
      {
        path: '/participant/:id',
        element: (
          <ProtectedRoute>
            <ParticipantProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/participant/:id/edit',
        element: (
          <ProtectedRoute>
            <EditParticipant />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance',
        element: (
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: '/training',
        element: (
          <ProtectedRoute>
            <Training />
          </ProtectedRoute>
        ),
      },
      {
        path: '/approvals',
        element: (
          <ProtectedRoute>
            <Approvals />
          </ProtectedRoute>
        ),
      },
      {
        path: '/programs',
        element: (
          <ProtectedRoute>
            <Programs />
          </ProtectedRoute>
        ),
      },
      {
        path: '/debug',
        element: (
          <ProtectedRoute>
            <Debug />
          </ProtectedRoute>
        ),
      },
      {
        path: '/',
        element: <RootRedirect />,
      },
      {
        path: '*',
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);