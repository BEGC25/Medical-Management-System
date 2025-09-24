import { Activity, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-medical-blue rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Bahr El Ghazal Clinic</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Medical Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-green' : 'bg-alert-red'}`}></div>
              {isOnline ? <Wifi className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <WifiOff className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
