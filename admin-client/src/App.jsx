
import { Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import DashboardLayout from "./components/DashboardLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import BusManagement from "./pages/BusManagement";
import NoticeManagement from "./pages/NoticeManagement";
import DashboardHome from "./pages/DashboardHome";
import ExtraBusRequests from "./pages/ExtraBusRequests";
import VerificationManagement from "./pages/VerificationManagement";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />

      <Route
        path="/"
        element={
          <AdminProtectedRoute>
            <DashboardLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="buses" element={<BusManagement />} />
        <Route path="notices" element={<NoticeManagement />} />
        <Route
          path="extra-bus-requests"
          element={<ExtraBusRequests />}
        />
        <Route
          path="verifications"
          element={<VerificationManagement />}
        />
      </Route>
    </Routes>
  );
}
