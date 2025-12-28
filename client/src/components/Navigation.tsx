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
  Tag
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

  return (
    <aside className="fixed left-0 top-0 h-full w-64 
                      bg-white dark:bg-gray-900
                      border-r border-gray-200/60 dark:border-gray-700/60
                      shadow-[2px_0_8px_rgba(15,23,42,0.04)]
                      dark:shadow-[2px_0_8px_rgba(0,0,0,0.2)]
                      transition-colors duration-300
                      z-30 pt-16">
      <nav className="h-full overflow-y-auto px-4 py-6 pb-20">
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] 
                             text-gray-500/80 dark:text-gray-400/70 
                             mb-3 mt-6 px-4
                             first:mt-2">
                {category}
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  
                  return (
                    <Link key={item.path} href={item.path}>
                      {isActive ? (
                        <div className="group relative flex items-center gap-3 px-4 py-2.5 rounded-r-xl
                                        bg-gradient-to-r from-blue-50/90 via-blue-100/80 to-blue-50/70
                                        dark:from-blue-900/25 dark:via-blue-800/20 dark:to-blue-900/15
                                        text-blue-700 dark:text-blue-300
                                        border-l-4 border-blue-600 dark:border-blue-400
                                        shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(59,130,246,0.08)]
                                        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(59,130,246,0.15)]
                                        transition-all duration-300
                                        ml-[-4px]">
                          <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                          <span className="font-semibold">{item.label}</span>
                          {/* Active indicator dot */}
                          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 
                                          shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                        </div>
                      ) : (
                        <div className="group relative flex items-center gap-3 px-4 py-2.5 rounded-r-xl
                                        text-gray-700 dark:text-gray-300
                                        hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/60
                                        dark:hover:from-gray-800/40 dark:hover:to-gray-700/30
                                        hover:text-gray-900 dark:hover:text-white
                                        border-l-4 border-transparent
                                        hover:border-l-gray-400 dark:hover:border-l-gray-500
                                        hover:shadow-[2px_0_8px_rgba(15,23,42,0.04)]
                                        dark:hover:shadow-[2px_0_8px_rgba(0,0,0,0.2)]
                                        transition-all duration-300 ease-out
                                        hover:translate-x-1
                                        cursor-pointer
                                        ml-[-4px]">
                          <Icon className="w-5 h-5 transition-all duration-300 
                                         group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                          <span className="font-medium transition-colors duration-300">{item.label}</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Professional Footer - Now part of scrollable content */}
          <div className="mt-8 pt-4 border-t border-gray-200/80 dark:border-gray-700/80">
            <div className="text-center px-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                © 2025 BGC Medical System
              </p>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
