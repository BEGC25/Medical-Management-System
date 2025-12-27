import { Activity, Wifi, WifiOff, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import clinicLogo from "@assets/Logo-Clinic_1760859723870.jpeg";

export default function Header() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, logoutMutation } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-gradient-to-r from-cyan-600 via-cyan-600 to-cyan-700 shadow-[0_4px_12px_rgba(8,145,178,0.25)]">
      <div className="px-6 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={clinicLogo} 
              alt="Bahr El Ghazal Clinic Logo" 
              className="h-12 w-12 object-contain rounded-xl bg-white/15 p-0.5 shadow-sm"
            />
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Bahr El Ghazal Clinic</h1>
              <p className="text-sm text-cyan-50 font-medium">Medical Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 h-9 rounded-xl bg-white/15 backdrop-blur-sm shadow-sm border border-white/10">
              <div className={`w-2 h-2 rounded-full shadow-sm ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              {isOnline ? <Wifi className="w-4 h-4 text-white" /> : <WifiOff className="w-4 h-4 text-white" />}
              <span className="text-sm text-white font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {user && (
              <>
                <div className="flex items-center space-x-2 px-3.5 h-9 rounded-xl bg-white/20 backdrop-blur-sm shadow-sm border border-white/10" data-testid="user-info">
                  <User className="w-4 h-4 text-white" />
                  <div className="text-sm leading-tight">
                    <div className="font-medium text-white" data-testid="user-fullname">
                      {user.fullName || user.username}
                    </div>
                  </div>
                </div>
                
                <ThemeToggle />
                
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                  className="flex items-center gap-2 h-9 px-3.5 bg-white/15 border border-white/20 text-white hover:bg-white/25 hover:text-white hover:border-white/30 text-sm font-medium shadow-sm transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </header>
  );
}
