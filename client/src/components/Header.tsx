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
                       relative overflow-hidden
                       bg-gradient-to-r from-[hsl(var(--clinical-teal-500))] via-[hsl(var(--clinical-teal-600))] to-[hsl(var(--clinical-teal-700))]
                       dark:from-gray-800 dark:via-gray-850 dark:to-gray-900
                       shadow-[var(--shadow-lg)]
                       dark:shadow-[0_2px_12px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3)]
                       border-b border-[hsl(var(--clinical-teal-800))]/30 dark:border-gray-700/50
                       backdrop-blur-xl
                       transition-all duration-[var(--transition-slow)]">
      {/* Premium top highlight line for depth */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></div>
      
      {/* Subtle overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none"></div>
      
      {/* Soft glow effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }}
      />
      
      {/* Header content with relative positioning */}
      <div className="relative px-3 sm:px-6 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Button - Mobile Only */}
            {onToggleMobileMenu && (
              <button 
                className="lg:hidden p-2 rounded-lg glass-effect glass-hover transition-all duration-300"
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
                           shadow-[0_2px_8px_rgba(0,0,0,0.15)]
                           ring-2 ring-white/30"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight
                             drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                <span className="sm:hidden">BGC</span>
                <span className="hidden sm:inline">Bahr El Ghazal Clinic</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/95 font-medium hidden md:block">Medical Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-effect transition-all duration-300">
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
                                   glass-effect glass-hover
                                   text-white font-medium
                                   shadow-[0_2px_6px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]
                                   hover:shadow-[0_4px_12px_rgba(0,0,0,0.18),0_2px_4px_rgba(0,0,0,0.12)]
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
                             glass-effect
                             hover:bg-red-500/90 dark:hover:bg-red-600/80
                             text-white font-medium
                             border border-white/30 dark:border-gray-500/30
                             hover:border-red-400/50 dark:hover:border-red-500/50
                             shadow-[0_2px_6px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]
                             hover:shadow-[0_4px_12px_rgba(239,68,68,0.3),0_2px_4px_rgba(239,68,68,0.2)]
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
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </header>
  );
}
