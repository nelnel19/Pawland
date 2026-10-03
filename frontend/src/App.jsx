import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Report from "./pages/Report";
import Reports from "./pages/Reports";
import Available from "./pages/Available";
import Adoption from "./pages/Adoption";
import Application from "./pages/Application";
import MyApplications from "./pages/MyApplications";
import Adminpanel from "./pages/Adminpanel";
import Announcements from "./pages/Announcements";
import Announcement from "./pages/Announcement";
import Users from "./pages/Users";
import Admindashboard from "./pages/Admindashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes for any logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/report" element={<Report />} />
          <Route path="/adoption" element={<Adoption />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/announcement" element={<Announcement />} />
        </Route>

        {/* Admin-only routes — all wrapped in Adminpanel layout */}
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin" element={<Adminpanel />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Admindashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="animals" element={<Available />} />
            <Route path="reports" element={<Reports />} />
            <Route path="applications" element={<Application />} />
            <Route path="announcements" element={<Announcements />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;