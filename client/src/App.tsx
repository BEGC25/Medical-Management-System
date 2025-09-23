import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import Treatment from "@/pages/Treatment";
import Laboratory from "@/pages/Laboratory";
import XRay from "@/pages/XRay";
import Ultrasound from "@/pages/Ultrasound";
import Reports from "@/pages/Reports";
import AllResults from "@/pages/AllResults";
import Payment from "@/pages/Payment";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import OfflineIndicator from "@/components/OfflineIndicator";
import { queryClient } from "@/lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <OfflineIndicator />
        <Header />
        <Navigation />
        
        {/* Main content area with left margin for sidebar */}
        <main className="ml-64 pt-20 min-h-screen">
          <div className="px-6 py-8">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/patients" component={Patients} />
              <Route path="/treatment" component={Treatment} />
              <Route path="/laboratory" component={Laboratory} />
              <Route path="/xray" component={XRay} />
              <Route path="/ultrasound" component={Ultrasound} />
              <Route path="/payment" component={Payment} />
              <Route path="/reports" component={Reports} />
              <Route path="/all-results" component={AllResults} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
        
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
