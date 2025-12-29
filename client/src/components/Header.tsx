import { Activity, Wifi, WifiOff, LogOut, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import clinicLogo from "@assets/Logo-Clinic_1760859723870.jpeg";

interface HeaderProps {
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export default function Header({ isMobileMenuOpen = false, onToggleMobileMenu }: HeaderProps) {
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
    <header className="sticky top-0 left-0 right-0 z-[var(--z-sticky)]
                       bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 
                       dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950
                       border-b border-blue-800/30 dark:border-slate-700/50
                       shadow-lg shadow-blue-900/20 dark:shadow-slate-950/50
                       backdrop-blur-sm
                       transition-all duration-[var(--transition-slow)]
                       after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px]
                       after:bg-gradient-to-r after:from-transparent after:via-blue-400/30 after:to-transparent
                       dark:after:via-slate-500/20">
      
      {/* Header content */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Button - Mobile Only */}
            {onToggleMobileMenu && (
              <button 
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300"
                onClick={onToggleMobileMenu}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            )}
            <div className="relative">
              <img 
                src={clinicLogo} 
                alt="Bahr El Ghazal Clinic Logo" 
                className="h-12 w-12 object-contain rounded-full 
                           shadow-md
                           ring-2 ring-blue-400/40 dark:ring-slate-600/40"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
                <span className="sm:hidden">BGC</span>
                <span className="hidden sm:inline">Bahr El Ghazal Clinic</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-medium hidden md:block">Medical Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md transition-all duration-300">
              <div className="relative">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}
                                shadow-[0_0_8px_rgba(74,222,128,0.6)]`}></div>
                {isOnline && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 
                                  animate-ping opacity-75"></div>
                )}
              </div>
              {isOnline ? <Wifi className="w-4 h-4 text-white" /> : <WifiOff className="w-4 h-4 text-white" />}
              <span className="text-sm font-medium text-white hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {user && (
              <>
                <button className="group relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl
                                   bg-white/10 dark:bg-white/5
                                   hover:bg-white/20 dark:hover:bg-white/10
                                   text-white font-medium
                                   border border-white/20 dark:border-white/10
                                   shadow-sm
                                   hover:shadow-md
                                   backdrop-blur-md
                                   transition-all duration-300 ease-out
                                   hover:scale-[1.02]"
                        data-testid="user-info">
                  <User className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  <span data-testid="user-fullname" className="hidden sm:inline">{user.fullName || user.username}</span>
                </button>
                
                <ThemeToggle />
                
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                  className="group relative flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl
                             bg-white/10 dark:bg-white/5
                             hover:bg-red-500/20 dark:hover:bg-red-500/20
                             text-white hover:text-red-100 dark:hover:text-red-100 font-medium
                             border border-white/20 dark:border-white/10
                             hover:border-red-400/50 dark:hover:border-red-400/30
                             shadow-sm
                             hover:shadow-md hover:shadow-red-500/20
                             backdrop-blur-md
                             transition-all duration-300 ease-out
                             hover:scale-[1.02]"
                >
                  <LogOut className="w-4 h-4 transition-all duration-300 
                                     group-hover:scale-110 group-hover:-translate-x-0.5" />
                  <span className="hidden sm:inline transition-colors duration-300">Sign Out</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
