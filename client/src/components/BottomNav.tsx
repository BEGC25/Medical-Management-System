import { Link, useLocation } from "wouter";
import { Users, Search, Stethoscope, AlertTriangle } from "lucide-react";

const bottomNavItems = [
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/patients?search=true", label: "Find", icon: Search },
  { path: "/treatment", label: "Treatment", icon: Stethoscope },
  { path: "/reports", label: "Urgent", icon: AlertTriangle },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden z-40 pb-safe">
      <div className="grid grid-cols-4 h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || location.startsWith(item.path.split('?')[0]);
          
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`
                  flex flex-col items-center justify-center h-full transition-colors
                  ${isActive 
                    ? 'text-medical-blue bg-cyan-50 dark:bg-cyan-950' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-medical-blue hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
                data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-medical-blue' : ''}`} />
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-medical-blue' : ''}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
