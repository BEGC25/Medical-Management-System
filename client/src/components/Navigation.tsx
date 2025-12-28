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
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64
                      bg-gradient-to-br from-blue-50/95 via-cyan-50/90 to-blue-100/95
                      dark:from-blue-950/40 dark:via-cyan-950/35 dark:to-blue-900/40
                      backdrop-blur-2xl
                      border-r-2 border-blue-200/50 dark:border-blue-800/40
                      shadow-[2px_0_24px_rgba(59,130,246,0.10),
                              2px_0_12px_rgba(14,165,233,0.06),
                              2px_0_4px_rgba(59,130,246,0.04)]
                      dark:shadow-[2px_0_32px_rgba(59,130,246,0.18),
                                   2px_0_16px_rgba(59,130,246,0.12),
                                   2px_0_4px_rgba(0,0,0,0.35)]
                      overflow-y-auto
                      transition-all duration-300
                      z-40">
      
      {/* Subtle depth overlay */}
      <div className="absolute inset-0 
                      bg-gradient-to-b from-white/8 via-transparent to-white/4 
                      dark:from-white/3 dark:via-transparent dark:to-white/1 
                      pointer-events-none"></div>
      
      {/* Sidebar content with relative positioning */}
      <nav className="relative z-10 h-full overflow-y-auto px-4 py-6 pb-20">
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] 
                             text-blue-700/60 dark:text-cyan-400/50 
                             mb-3 mt-6 px-4
                             first:mt-2
                             transition-colors duration-300">
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
                                        bg-gradient-to-r from-blue-100/95 via-cyan-100/85 to-blue-100/90
                                        dark:from-blue-800/45 dark:via-cyan-800/40 dark:to-blue-800/40
                                        text-blue-700 dark:text-cyan-200
                                        border-l-4 border-blue-600 dark:border-cyan-400
                                        shadow-[inset_0_1px_0_rgba(255,255,255,0.4),
                                                inset_0_-1px_0_rgba(59,130,246,0.1),
                                                0_3px_10px_rgba(59,130,246,0.15),
                                                0_1px_4px_rgba(14,165,233,0.10)]
                                        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),
                                                     inset_0_-1px_0_rgba(59,130,246,0.2),
                                                     0_3px_12px_rgba(59,130,246,0.25),
                                                     0_1px_6px_rgba(14,165,233,0.18)]
                                        transition-all duration-300
                                        ml-[-4px]">
                          <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                          <span className="font-semibold tracking-tight">{item.label}</span>
                          
                          {/* Enhanced indicator with glow */}
                          <div className="absolute right-3 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full 
                                            bg-blue-600 dark:bg-cyan-400
                                            shadow-[0_0_12px_rgba(59,130,246,0.9),
                                                    0_0_6px_rgba(14,165,233,0.7),
                                                    0_0_3px_rgba(59,130,246,0.5)]
                                            dark:shadow-[0_0_14px_rgba(34,211,238,1),
                                                         0_0_8px_rgba(59,130,246,0.8),
                                                         0_0_4px_rgba(14,165,233,0.6)]"></div>
                            <div className="absolute w-2 h-2 rounded-full 
                                            bg-blue-400 dark:bg-cyan-300 
                                            animate-ping opacity-60"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative flex items-center gap-3 px-4 py-2.5 rounded-r-xl
                                        text-gray-700 dark:text-gray-300
                                        hover:bg-gradient-to-r 
                                        hover:from-blue-100/50 hover:via-cyan-50/40 hover:to-blue-50/45
                                        dark:hover:from-blue-800/25 dark:hover:via-cyan-800/20 dark:hover:to-blue-800/22
                                        hover:text-blue-700 dark:hover:text-cyan-300
                                        border-l-4 border-transparent
                                        hover:border-l-blue-400 dark:hover:border-l-cyan-500
                                        hover:shadow-[2px_0_12px_rgba(59,130,246,0.08),
                                                     1px_0_4px_rgba(14,165,233,0.05)]
                                        dark:hover:shadow-[2px_0_16px_rgba(59,130,246,0.18),
                                                            1px_0_6px_rgba(14,165,233,0.12)]
                                        transition-all duration-300 ease-out
                                        hover:translate-x-1.5
                                        cursor-pointer
                                        ml-[-4px]">
                          <Icon className="w-5 h-5 transition-all duration-300 
                                         group-hover:scale-110 
                                         group-hover:text-blue-600 dark:group-hover:text-cyan-400
                                         group-hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
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
