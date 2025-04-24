import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import JoinFamilyPage from "@/pages/join-family-page";
import ProfilePage from "@/pages/profile-page";
import TestUploadPage from "@/pages/test-upload-page";
import GazetteSettingsPage from "@/pages/gazette-settings-page";
import AdminDashboard from "@/pages/admin-dashboard";
import LandingPage from "@/pages/landing-page";
import FeaturesPage from "@/pages/features-page";
import AboutPage from "@/pages/about-page";
import ContactPage from "@/pages/contact-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import { LocaleProvider } from "./components/ui/locale-provider";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Public routes - new landing pages */}
      <Route path="/" component={LandingPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />

      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/dashboard" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/families/:id/gazette-settings" component={GazetteSettingsPage} />
      <AdminRoute path="/admin" component={AdminDashboard} />

      {/* Authentication routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/join-family" component={JoinFamilyPage} />
      <Route path="/test-upload" component={TestUploadPage} />

      {/* Fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;