import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import AppointmentsPage from "@/pages/appointments-page";
import NewAppointmentPage from "@/pages/new-appointment-page";
import FeedbackPage from "@/pages/feedback-page";
import ChatPage from "@/pages/chat-page";
import ForumsPage from "@/pages/forums-page";
import SchedulePage from "@/pages/schedule-page";
import AdminPage from "@/pages/admin-page";
import NotificationTestPage from "@/pages/notification-test-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/auth" component={AuthPage} />

        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/appointments" component={AppointmentsPage} />
        <ProtectedRoute path="/appointments/new" component={NewAppointmentPage} />
        <ProtectedRoute path="/feedback" component={FeedbackPage} />
        <ProtectedRoute path="/feedback/new/:id" component={FeedbackPage} />
        <ProtectedRoute path="/chat" component={ChatPage} />
        <ProtectedRoute path="/forums" component={ForumsPage} />
        <ProtectedRoute path="/schedule" component={SchedulePage} />
        <ProtectedRoute path="/admin" component={AdminPage} requiredRole="admin" />
        <ProtectedRoute path="/notifications/test" component={NotificationTestPage} requiredRole="admin" />

        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;