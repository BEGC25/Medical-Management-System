import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { canSeeNavItem } from "@shared/auth-roles";
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
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

export default function Navigation({ isMobileMenuOpen, onMobileMenuClose }: NavigationProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Filter navigation items based on user role
  const visibleItems = navItems.filter((item) => {
    if (!user) return false;
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

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    onMobileMenuClose();
  };

  return (
    <>
      {/* Mobile backdrop - only show on mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileMenuClose}
          data-testid="mobile-menu-backdrop"
        />
      )}

      {/* Navigation sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg dark:bg-gray-900 dark:border-gray-700 pt-16 z-50
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:transform-none lg:transition-none
      `}>
        {/* Mobile close button */}
        <button
          onClick={onMobileMenuClose}
          className="lg:hidden absolute top-20 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          data-testid="mobile-menu-close"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

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
                        <div 
                          onClick={handleLinkClick}
                          className={`
                            group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer
                            ${isActive 
                              ? 'bg-medical-blue text-white shadow-md' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-medical-blue dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400'
                            }
                          `}
                        >
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
            
            {/* Professional Footer */}
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
