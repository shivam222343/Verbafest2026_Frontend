import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./store/authStore";

// Admin Pages
import Dashboard from "./pages/Dashboard";
import SubEventsPage from "./pages/SubEventsPage";
import ParticipantsPage from "./pages/ParticipantsPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import EventControlRoom from "./pages/admin/EventControlRoom";
import ParticipantProfile from "./pages/admin/ParticipantProfile";
import PaymentSettingsPage from "./pages/PaymentSettingsPage";
import AttendancePage from "./pages/admin/AttendancePage";
import TopicsPage from "./pages/admin/TopicsPage";

// Auth Pages
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import AdminSignupPage from "./pages/auth/AdminSignupPage";
import ParticipantLoginPage from "./pages/auth/ParticipantLoginPage";
import ParticipantSignupPage from "./pages/auth/ParticipantSignupPage";
import AdminProfileCompletion from "./pages/auth/AdminProfileCompletion";
import ParticipantProfileCompletion from "./pages/auth/ParticipantProfileCompletion";

// Participant Pages
import ParticipantDashboard from "./pages/ParticipantDashboard";

// Judge Pages
import JudgeLogin from "./pages/judge/JudgeLogin";
import JudgeDashboard from "./pages/judge/JudgeDashboard";

// Public Pages
import RegistrationPage from "./pages/RegistrationPage";
import PublicSubEventsPage from "./pages/PublicSubEventsPage";

import { Toaster } from 'react-hot-toast';

const RootRedirect = () => {
    const { isAuthenticated, userRole } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
    return userRole === 'admin'
        ? <Navigate to="/admin/dashboard" replace />
        : <Navigate to="/participant/dashboard" replace />;
};

const App = () => {
    return (
        <BrowserRouter>
            <Toaster position="top-right" reverseOrder={false} />
            <Routes>
                {/* Public Routes */}
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/sub-events" element={<PublicSubEventsPage />} />

                {/* Admin Auth Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/signup" element={<AdminSignupPage />} />

                {/* Participant Auth Routes */}
                <Route path="/participant/login" element={<ParticipantLoginPage />} />
                <Route path="/participant/signup" element={<Navigate to="/participant/login" replace />} />
                <Route path="/participant/complete-profile" element={<ParticipantProfileCompletion />} />

                {/* Profile Completion Routes */}
                <Route path="/admin/complete-profile" element={<AdminProfileCompletion />} />

                {/* Admin Protected Routes */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="subevents" element={<SubEventsPage />} />
                    <Route path="subevents/:id/manage" element={<EventControlRoom />} />
                    <Route path="participants" element={<ParticipantsPage />} />
                    <Route path="participants/:id" element={<ParticipantProfile />} />
                    <Route path="registrations" element={<RegistrationsPage />} />
                    <Route path="availability" element={<AvailabilityPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="topics" element={<TopicsPage />} />
                    <Route path="payment-settings" element={<PaymentSettingsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Participant Protected Routes */}
                <Route
                    path="/participant/dashboard"
                    element={
                        <ProtectedRoute allowedRoles={['participant']}>
                            <ParticipantDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Judge Routes (Public - Access Code Protected) */}
                <Route path="/judge/login" element={<JudgeLogin />} />
                <Route path="/judge/dashboard" element={<JudgeDashboard />} />

                {/* Root Redirect */}
                <Route path="/" element={<RootRedirect />} />

                {/* Default Redirect */}
                <Route path="*" element={<RootRedirect />} />
            </Routes>
        </BrowserRouter>
    );
};

// Temporary Coming Soon Component
const ComingSoon = ({ title }) => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                {title}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
                This page is under construction
            </p>
        </div>
    </div>
);

export default App;
