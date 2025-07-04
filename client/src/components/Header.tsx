import { Activity, User, Wifi, WifiOff } from "lucide-react";
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
    <header className="bg-medical-blue text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Activity className="text-2xl" />
            <div>
              <h1 className="text-xl font-bold">Rural Clinic Management</h1>
              <p className="text-blue-200 text-sm">Juba Medical Center</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Dr. Sarah Johnson</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success-green' : 'bg-alert-red'}`}></div>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
