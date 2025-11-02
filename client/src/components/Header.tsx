import { Wifi, WifiOff, LogOut, User, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import clinicLogo from "@assets/Logo-Clinic_1760859723870.jpeg";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
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
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button - only visible on mobile */}
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              data-testid="mobile-menu-toggle"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            <img 
              src={clinicLogo} 
              alt="Bahr El Ghazal Clinic Logo" 
              className="h-12 w-12 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Bahr El Ghazal Clinic</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Medical Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-green' : 'bg-alert-red'}`}></div>
              {isOnline ? <Wifi className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <WifiOff className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {user && (
              <>
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20" data-testid="user-info">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white" data-testid="user-fullname">
                      {user.fullName || user.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize" data-testid="user-role">
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
                  className="flex items-center gap-2"
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
