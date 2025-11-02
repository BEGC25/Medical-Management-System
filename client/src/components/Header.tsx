import { Activity, Wifi, WifiOff, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-lg z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={clinicLogo} 
              alt="Bahr El Ghazal Clinic Logo" 
              className="h-12 w-12 object-contain rounded-lg bg-white/10 p-0.5"
            />
            <div>
              <h1 className="text-xl font-semibold text-white">Bahr El Ghazal Clinic</h1>
              <p className="text-sm text-cyan-50">Medical Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              {isOnline ? <Wifi className="w-4 h-4 text-white" /> : <WifiOff className="w-4 h-4 text-white" />}
              <span className="text-sm text-white font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {user && (
              <>
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/15 backdrop-blur-sm" data-testid="user-info">
                  <User className="w-4 h-4 text-white" />
                  <div className="text-sm">
                    <div className="font-medium text-white" data-testid="user-fullname">
                      {user.fullName || user.username}
                    </div>
                    <div className="text-xs text-cyan-50 capitalize" data-testid="user-role">
                      {user.role}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                  className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
