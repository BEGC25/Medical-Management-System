import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { canSeeNavItem, ROLES } from "@shared/auth-roles";
import { 
  BarChart3, 
  Stethoscope, 
  Users, 
  TestTube, 
  Scan, 
  LayoutDashboard,
  MonitorSpeaker,
  FileSearch,
  DollarSign,
  Pill,
  Settings,
  Receipt,
  UserCog,
  Tag,
  X
} from "lucide-react";

const navItems = [
  // OVERVIEW
  { path: "/", label: "Dashboard", icon: LayoutDashboard, category: "Overview" },
  
  // MANAGEMENT
  { path: "/patients", label: "Patients", icon: Users, category: "Management" },
  { path: "/payment", label: "Payment", icon: DollarSign, category: "Management" },
  
  // DIAGNOSTICS
  { path: "/laboratory", label: "Laboratory", icon: TestTube, category: "Diagnostics" },
  { path: "/xray", label: "X-Ray", icon: Scan, category: "Diagnostics" },
  { path: "/ultrasound", label: "Ultrasound", icon: MonitorSpeaker, category: "Diagnostics" },
  
  // CLINICAL
  { path: "/treatment", label: "Treatment", icon: Stethoscope, category: "Clinical" },
  { path: "/pharmacy", label: "Pharmacy", icon: Pill, category: "Clinical" },
  
  // FINANCIAL
  { path: "/reports/daily-cash", label: "Daily Cash Report", icon: BarChart3, category: "Financial" },
  { path: "/billing", label: "Billing & Invoices", icon: Receipt, category: "Financial" },
  { path: "/all-results", label: "All Results Report", icon: FileSearch, category: "Financial" },
  
  // SETTINGS
  { path: "/service-management", label: "Service Management", icon: Tag, category: "Settings" },
  { path: "/users", label: "User Management", icon: UserCog, category: "Settings" },
  { path: "/billing-settings", label: "Billing Settings", icon: Settings, category: "Settings" },
  
  // REPORTS
  { path: "/reports", label: "Reports", icon: BarChart3, category: "Reports" },
];

interface NavigationProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export default function Navigation({ isMobileMenuOpen = false, onCloseMobileMenu }: NavigationProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Filter navigation items based on user role
  const visibleItems = navItems.filter((item) => {
    if (!user) return false; // No user logged in, show nothing
    return canSeeNavItem(user.role as any, item.path);
  });

  // Group navigation items by category
  const groupedItems = visibleItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const renderNavItems = (closeOnClick: boolean = false) => (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/90 mb-3 mt-6 px-4 first:mt-2">
            {category}
          </h3>
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <div onClick={closeOnClick && onCloseMobileMenu ? onCloseMobileMenu : undefined}>
                    {isActive ? (
                      <div 
                        className="group relative flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-xl ml-[-4px] transition-all duration-300"
                        style={{
                          background: 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)',
                          borderLeft: '5px solid #ffffff',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 20px rgba(255,255,255,0.3), 0 2px 8px rgba(255,255,255,0.2)'
                        }}
                      >
                        <Icon className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                        <span className="font-bold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{item.label}</span>
                        
                        {/* Pulsing indicator */}
                        <div className="absolute right-3">
                          <div 
                            className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"
                            style={{ boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(255,255,255,0.6)' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="group relative flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-xl ml-[-4px] text-white/85 hover:text-white hover:bg-white/15 border-l-4 border-transparent hover:border-white/60 transition-all duration-300 cursor-pointer hover:translate-x-1">
                        <Icon className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Professional Footer - Now part of scrollable content */}
      <div className="mt-8 pt-4 border-t border-white/20">
        <div className="text-center px-3">
          <p className="text-xs text-white/70 font-medium">
            © 2025 BGC Medical System
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside 
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 overflow-y-auto transition-all duration-300 z-30
                   hidden lg:block"
        style={{
          background: 'linear-gradient(160deg, #0ea5e9 0%, #06b6d4 20%, #14b8a6 40%, #0d9488 60%, #0891b2 80%, #0ea5e9 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '4px 0 35px rgba(14, 165, 233, 0.35), 2px 0 20px rgba(6, 182, 212, 0.25)'
        }}
      >
        {/* Glassmorphism overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.1) 100%)',
            backdropFilter: 'blur(10px)'
          }}
        />
        
        {/* Desktop nav content */}
        <nav className="relative z-10 h-full overflow-y-auto px-4 py-6 pb-20">
          {renderNavItems(false)}
        </nav>
      </aside>

      {/* Mobile Overlay - Only visible when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside 
        className={`fixed left-0 top-0 h-full w-72 z-50 lg:hidden
                    transform transition-transform duration-300 ease-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(160deg, #0ea5e9 0%, #06b6d4 20%, #14b8a6 40%, #0d9488 60%, #0891b2 80%, #0ea5e9 100%)',
          boxShadow: isMobileMenuOpen ? '4px 0 35px rgba(0,0,0,0.35)' : 'none'
        }}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h2 className="text-lg font-bold text-white">Menu</h2>
          <button 
            onClick={onCloseMobileMenu}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Mobile Navigation Content */}
        <nav className="h-[calc(100%-60px)] overflow-y-auto px-4 py-4">
          {renderNavItems(true)}
        </nav>
      </aside>
    </>
  );
}
