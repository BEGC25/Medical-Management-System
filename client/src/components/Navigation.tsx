import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { canSeeNavItem, ROLES } from "@shared/auth-roles";
import { useState, useEffect, useRef } from "react";
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
  Menu,
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

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

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

  // Close drawer on route change (mobile)
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location]);

  // Handle Esc key to close drawer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
        // Return focus to hamburger button
        setTimeout(() => hamburgerRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDrawerOpen]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    // Return focus to hamburger button
    setTimeout(() => hamburgerRef.current?.focus(), 100);
  };

  return (
    <>
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle menu"
        data-testid="button-hamburger-menu"
      >
        {isDrawerOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Overlay - Mobile Only */}
      {isDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Sidebar/Drawer */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg dark:bg-gray-900 dark:border-gray-700 z-40 pt-16
        transition-transform duration-300 ease-in-out
        ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
      <nav className="h-full overflow-y-auto px-4 py-6 pb-20">
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  
                  return (
                    <Link key={item.path} href={item.path}>
                      <div className={`
                        group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer
                        ${isActive 
                          ? 'bg-medical-blue text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-medical-blue dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400'
                        }
                      `}>
                        <Icon className={`
                          w-5 h-5 mr-3 transition-colors
                          ${isActive 
                            ? 'text-white' 
                            : 'text-gray-500 group-hover:text-medical-blue dark:text-gray-400 dark:group-hover:text-blue-400'
                          }
                        `} />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Professional Footer - Now part of scrollable content */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                © 2025 BGC Medical System
              </p>
            </div>
          </div>
        </div>
      </nav>
    </aside>
    </>
  );
}
