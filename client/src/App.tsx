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
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import OfflineIndicator from "@/components/OfflineIndicator";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// ✅ NEW: Daily Cash page
import ReportsDailyCash from "@/pages/ReportsDailyCash";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <OfflineIndicator />

          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route>
              <Header />
              <Navigation />

              <main className="ml-64 pt-16 min-h-screen">
                <div className="px-6 py-6">
                  <Switch>
                    {/* 🔒 AUTHENTICATION DISABLED - using Route instead of ProtectedRoute */}
                    <Route path="/" component={Dashboard} />
                    <Route path="/patients" component={Patients} />
                    <Route path="/treatment/new" component={VisitRedirector} />
                    <Route path="/treatment/:visitId" component={Treatment} />
                    <Route path="/treatment" component={Treatment} />
                    <Route path="/laboratory" component={Laboratory} />
                    <Route path="/xray" component={XRay} />
                    <Route path="/ultrasound" component={Ultrasound} />
                    <Route path="/pharmacy" component={Pharmacy} />
                    <Route path="/pharmacy-inventory" component={PharmacyInventory} />
                    <Route path="/payment" component={Payment} />
                    <Route path="/billing" component={Billing} />
                    <Route path="/billing-settings" component={BillingSettings} />
                    <Route path="/service-management" component={ServiceManagement} />
                    <Route path="/reports" component={Reports} />
                    {/* ✅ NEW route for Daily Cash */}
                    <Route path="/reports/daily-cash" component={ReportsDailyCash} />
                    <Route path="/all-results" component={AllResults} />
                    <Route path="/users" component={UserManagement} />
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
