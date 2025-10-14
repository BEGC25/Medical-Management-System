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
import Reports from "@/pages/Reports";
import AllResults from "@/pages/AllResults";
import Payment from "@/pages/Payment";
import Billing from "@/pages/Billing";
import BillingSettings from "@/pages/BillingSettings";
import UserManagement from "@/pages/UserManagement";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import OfflineIndicator from "@/components/OfflineIndicator";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

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
                    <ProtectedRoute path="/" component={Dashboard} />
                    <ProtectedRoute path="/patients" component={Patients} />
                    <ProtectedRoute path="/treatment/new" component={VisitRedirector} />
                    <ProtectedRoute path="/treatment/:visitId" component={Treatment} />
                    <ProtectedRoute path="/treatment" component={Treatment} />
                    <ProtectedRoute path="/laboratory" component={Laboratory} />
                    <ProtectedRoute path="/xray" component={XRay} />
                    <ProtectedRoute path="/ultrasound" component={Ultrasound} />
                    <ProtectedRoute path="/pharmacy" component={Pharmacy} />
                    <ProtectedRoute path="/payment" component={Payment} />
                    <ProtectedRoute path="/billing" component={Billing} />
                    <ProtectedRoute path="/billing-settings" component={BillingSettings} />
                    <ProtectedRoute path="/reports" component={Reports} />
                    <ProtectedRoute path="/all-results" component={AllResults} />
                    <ProtectedRoute path="/users" component={UserManagement} />
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
