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
                      bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500
                      dark:from-blue-900 dark:via-blue-800 dark:to-cyan-900
                      backdrop-blur-xl
                      border-r border-blue-300/50 dark:border-cyan-700/40
                      shadow-[2px_0_24px_rgba(59,130,246,0.15),
                              2px_0_12px_rgba(14,165,233,0.10),
                              2px_0_6px_rgba(59,130,246,0.08)]
                      dark:shadow-[2px_0_32px_rgba(59,130,246,0.25),
                                   2px_0_16px_rgba(59,130,246,0.18),
                                   2px_0_8px_rgba(0,0,0,0.50)]
                      overflow-y-auto
                      transition-all duration-300
                      z-40">
      
      {/* Subtle depth overlay */}
      <div className="absolute inset-0 
                      bg-gradient-to-b from-white/10 via-transparent to-black/5 
                      dark:from-white/5 dark:via-transparent dark:to-black/10 
                      pointer-events-none"></div>
      
      {/* Sidebar content with relative positioning */}
      <nav className="relative z-10 h-full overflow-y-auto px-4 py-6 pb-20">
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] 
                             text-white/70 dark:text-cyan-200/60 
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
                                        bg-gradient-to-r from-white/25 via-cyan-50/20 to-white/15
                                        dark:from-white/20 dark:via-cyan-200/15 dark:to-white/10
                                        text-white dark:text-white
                                        border-l-4 border-cyan-300 dark:border-cyan-300
                                        shadow-[inset_0_1px_0_rgba(255,255,255,0.4),
                                                inset_0_-1px_0_rgba(0,0,0,0.1),
                                                0_4px_12px_rgba(255,255,255,0.20),
                                                0_2px_6px_rgba(14,165,233,0.25)]
                                        dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),
                                                     inset_0_-1px_0_rgba(0,0,0,0.2),
                                                     0_4px_16px_rgba(255,255,255,0.15),
                                                     0_2px_8px_rgba(14,165,233,0.30)]
                                        transition-all duration-300
                                        ml-[-4px]">
                          <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                          <span className="font-semibold tracking-tight">{item.label}</span>
                          
                          {/* Enhanced indicator with glow */}
                          <div className="absolute right-3 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full 
                                            bg-cyan-300 dark:bg-cyan-200
                                            shadow-[0_0_14px_rgba(34,211,238,1),
                                                    0_0_8px_rgba(255,255,255,0.8),
                                                    0_0_4px_rgba(14,165,233,0.7)]
                                            dark:shadow-[0_0_16px_rgba(34,211,238,1),
                                                         0_0_10px_rgba(255,255,255,0.9),
                                                         0_0_6px_rgba(14,165,233,0.8)]"></div>
                            <div className="absolute w-2 h-2 rounded-full 
                                            bg-cyan-200 dark:bg-cyan-100 
                                            animate-ping opacity-70"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative flex items-center gap-3 px-4 py-2.5 rounded-r-xl
                                        text-white/90 dark:text-white/85
                                        hover:bg-gradient-to-r 
                                        hover:from-white/20 hover:via-cyan-50/15 hover:to-white/10
                                        dark:hover:from-white/15 dark:hover:via-cyan-200/10 dark:hover:to-white/8
                                        hover:text-white dark:hover:text-white
                                        border-l-4 border-transparent
                                        hover:border-l-cyan-300 dark:hover:border-l-cyan-400
                                        hover:shadow-[2px_0_12px_rgba(255,255,255,0.15),
                                                     1px_0_6px_rgba(14,165,233,0.12)]
                                        dark:hover:shadow-[2px_0_16px_rgba(255,255,255,0.18),
                                                            1px_0_8px_rgba(14,165,233,0.20)]
                                        transition-all duration-300 ease-out
                                        hover:translate-x-1.5
                                        cursor-pointer
                                        ml-[-4px]">
                          <Icon className="w-5 h-5 transition-all duration-300 
                                         group-hover:scale-110 
                                         group-hover:text-white dark:group-hover:text-cyan-100
                                         group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
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
          <div className="mt-8 pt-4 border-t border-white/20 dark:border-white/10">
            <div className="text-center px-3">
              <p className="text-xs text-white/70 dark:text-white/60 font-medium">
                © 2025 BGC Medical System
              </p>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
