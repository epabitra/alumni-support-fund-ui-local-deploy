import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Eligibility from './pages/Eligibility';
import SelectionProcess from './pages/SelectionProcess';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contribute from './pages/Contribute';
import ContributeSuccess from './pages/ContributeSuccess';
import MyContributions from './pages/MyContributions';
import Fund from './pages/Fund';
import SelectedStudents from './pages/SelectedStudents';
import ChangePassword from './pages/ChangePassword';
import EditProfile from './pages/EditProfile';
import MaskMyInfo from './pages/MaskMyInfo';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { ROLE_ADMIN, ROLE_SERVICE_CENTER, ROLE_VERIFIER } from './app/Constants';

// Admin pages
import AdminSchools from './pages/admin/AdminSchools';
import AdminStudents from './pages/admin/AdminStudents';
import AdminSelection from './pages/admin/AdminSelection';
import AdminReviews from './pages/admin/AdminReviews';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAddPayment from './pages/admin/AdminAddPayment';

// Service Center pages
import RegisterStudent from './pages/service-center/RegisterStudent';
import MyApplications from './pages/service-center/MyApplications';

// Verifier pages
import PendingVerifications from './pages/verifier/PendingVerifications';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/eligibility" element={<Eligibility />} />
      <Route path="/selection-process" element={<SelectionProcess />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes - Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Payment / Fund routes - any logged-in user */}
      <Route
        path="/contribute"
        element={
          <ProtectedRoute>
            <Contribute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contribute/success"
        element={
          <ProtectedRoute>
            <ContributeSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-contributions"
        element={
          <ProtectedRoute>
            <MyContributions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fund"
        element={
          <ProtectedRoute>
            <Fund />
          </ProtectedRoute>
        }
      />
      <Route
        path="/selected-students"
        element={
          <ProtectedRoute>
            <SelectedStudents />
          </ProtectedRoute>
        }
      />

      {/* Account (any logged-in user) */}
      <Route
        path="/account/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account/mask-my-info"
        element={
          <ProtectedRoute>
            <MaskMyInfo />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/schools"
        element={
          <ProtectedRoute requiredRole={ROLE_ADMIN}>
            <AdminSchools />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute requiredRole={ROLE_ADMIN}>
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/selection"
        element={
          <ProtectedRoute requiredRole={ROLE_ADMIN}>
            <AdminSelection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute requiredRole={ROLE_ADMIN}>
            <AdminReviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole={ROLE_ADMIN}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/add-payment"
        element={
          <ProtectedRoute requiredRole={ROLE_ADMIN}>
            <AdminAddPayment />
          </ProtectedRoute>
        }
      />

      {/* Service Center Routes */}
      <Route
        path="/service-center/register-student"
        element={
          <ProtectedRoute requiredRole={ROLE_SERVICE_CENTER}>
            <RegisterStudent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-center/my-applications"
        element={
          <ProtectedRoute requiredRole={ROLE_SERVICE_CENTER}>
            <MyApplications />
          </ProtectedRoute>
        }
      />

      {/* Verifier Routes */}
      <Route
        path="/verifier/pending"
        element={
          <ProtectedRoute requiredRole={ROLE_VERIFIER}>
            <PendingVerifications />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
