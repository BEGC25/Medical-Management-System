import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import Treatment from "@/pages/Treatment";
import Laboratory from "@/pages/Laboratory";
import XRay from "@/pages/XRay";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import OfflineIndicator from "@/components/OfflineIndicator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string];
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <OfflineIndicator />
        <Header />
        <Navigation />
        
        <main className="container mx-auto px-4 py-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/patients" component={Patients} />
            <Route path="/treatment" component={Treatment} />
            <Route path="/laboratory" component={Laboratory} />
            <Route path="/xray" component={XRay} />
            <Route path="/reports" component={Reports} />
            <Route component={NotFound} />
          </Switch>
        </main>
        
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
