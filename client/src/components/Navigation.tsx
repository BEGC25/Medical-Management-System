import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Stethoscope, 
  Users, 
  TestTube, 
  Scan, 
  LayoutDashboard,
  MonitorSpeaker,
  FileSearch,
  DollarSign
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/treatment", label: "Treatment", icon: Stethoscope },
  { path: "/laboratory", label: "Laboratory", icon: TestTube },
  { path: "/xray", label: "X-Ray", icon: Scan },
  { path: "/ultrasound", label: "Ultrasound", icon: MonitorSpeaker },
  { path: "/payment", label: "Payment", icon: DollarSign },
  { path: "/all-results", label: "All Results", icon: FileSearch },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`
                  flex items-center py-4 px-2 border-b-2 font-medium whitespace-nowrap transition-colors cursor-pointer
                  ${isActive 
                    ? 'border-medical-blue text-medical-blue' 
                    : 'border-transparent text-gray-600 hover:text-medical-blue dark:text-gray-300 dark:hover:text-blue-400'
                  }
                `}>
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
