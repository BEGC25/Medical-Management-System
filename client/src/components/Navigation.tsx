import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  { path: "/", label: "Dashboard", icon: LayoutDashboard, category: "Overview" },
  { path: "/patients", label: "Patients", icon: Users, category: "Management" },
  { path: "/laboratory", label: "Laboratory", icon: TestTube, category: "Diagnostics" },
  { path: "/xray", label: "X-Ray", icon: Scan, category: "Diagnostics" },
  { path: "/ultrasound", label: "Ultrasound", icon: MonitorSpeaker, category: "Diagnostics" },
  { path: "/treatment", label: "Treatment", icon: Stethoscope, category: "Clinical" },
  { path: "/pharmacy", label: "Pharmacy", icon: Pill, category: "Clinical" },
  { path: "/payment", label: "Payment", icon: DollarSign, category: "Administration" },
  { path: "/billing", label: "Billing", icon: Receipt, category: "Administration" },
  { path: "/service-management", label: "Service Management", icon: Tag, category: "Administration" },
  { path: "/users", label: "User Management", icon: UserCog, category: "Administration" },
  { path: "/billing-settings", label: "Billing Settings", icon: Settings, category: "Administration" },
  { path: "/all-results", label: "All Results", icon: FileSearch, category: "Reports" },

  // ✅ NEW: Daily Cash report (manager)
  { path: "/reports/daily-cash", label: "Daily Cash", icon: BarChart3, category: "Reports" },

  { path: "/reports", label: "Reports", icon: BarChart3, category: "Reports" },
];

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Show all items since auth is disabled
  const allItems = navItems;

  // Group navigation items by category
  const groupedItems = allItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg dark:bg-gray-900 dark:border-gray-700 z-30 pt-16">
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
  );
}
