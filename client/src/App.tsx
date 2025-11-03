import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import Treatment from "@/pages/Treatment";
import VisitRedirector from "@/pages/VisitRedirector";
import Laboratory from "@/pages/Laboratory";
import XRay from "@/pages/XRay";
import Ultrasound from "@/pages/Ultrasound";
import Pharmacy from "@/pages/Pharmacy";
import PharmacyInventory from "@/pages/PharmacyInventory";
import Reports from "@/pages/Reports";
import AllResults from "@/pages/AllResults";
import Payment from "@/pages/Payment";
import Billing from "@/pages/Billing";
import BillingSettings from "@/pages/BillingSettings";
import ServiceManagement from "@/pages/ServiceManagement";
import UserManagement from "@/pages/UserManagement";
import Auth from "@/pages/Auth";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import OfflineIndicator from "@/components/OfflineIndicator";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ROLES } from "@shared/auth-roles";

// ✅ NEW: Daily Cash page
import ReportsDailyCash from "@/pages/ReportsDailyCash";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <OfflineIndicator />

          <Switch>
            {/* Public Routes */}
            <Route path="/auth" component={Auth} />
            <Route path="/unauthorized" component={Unauthorized} />
            
            {/* Protected Routes */}
            <Route>
              <Header />
              <Navigation />

              <main className="ml-64 min-h-screen">
                <div className="px-6 py-6">
                  <Switch>
                    {/* Dashboard - All roles */}
                    <ProtectedRoute path="/" component={Dashboard} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB, ROLES.RADIOLOGY]} />
                    
                    {/* Patient Management - All roles */}
                    <ProtectedRoute path="/patients" component={Patients} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB, ROLES.RADIOLOGY]} />
                    
                    {/* Treatment - Admin & Doctor */}
                    <ProtectedRoute path="/treatment/new" component={VisitRedirector} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]} />
                    <ProtectedRoute path="/treatment/:visitId" component={Treatment} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]} />
                    <ProtectedRoute path="/treatment" component={Treatment} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]} />
                    
                    {/* Diagnostics */}
                    <ProtectedRoute path="/laboratory" component={Laboratory} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB]} />
                    <ProtectedRoute path="/xray" component={XRay} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGY]} />
                    <ProtectedRoute path="/ultrasound" component={Ultrasound} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGY]} />
                    
                    {/* Pharmacy - Admin & Doctor */}
                    <ProtectedRoute path="/pharmacy" component={Pharmacy} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]} />
                    <ProtectedRoute path="/pharmacy-inventory" component={PharmacyInventory} allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR]} />
                    
                    {/* Financial - Admin Only */}
                    <ProtectedRoute path="/payment" component={Payment} allowedRoles={[ROLES.ADMIN]} />
                    <ProtectedRoute path="/billing" component={Billing} allowedRoles={[ROLES.ADMIN]} />
                    <ProtectedRoute path="/reports/daily-cash" component={ReportsDailyCash} allowedRoles={[ROLES.ADMIN]} />
                    <ProtectedRoute path="/all-results" component={AllResults} allowedRoles={[ROLES.ADMIN]} />
                    
                    {/* Settings - Admin Only */}
                    <ProtectedRoute path="/billing-settings" component={BillingSettings} allowedRoles={[ROLES.ADMIN]} />
                    <ProtectedRoute path="/service-management" component={ServiceManagement} allowedRoles={[ROLES.ADMIN]} />
                    <ProtectedRoute path="/users" component={UserManagement} allowedRoles={[ROLES.ADMIN]} />
                    <ProtectedRoute path="/reports" component={Reports} allowedRoles={[ROLES.ADMIN]} />
                    
                    <Route component={NotFound} />
                  </Switch>
                </div>
              </main>
            </Route>
          </Switch>

          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
