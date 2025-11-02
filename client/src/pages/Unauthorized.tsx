import { ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function Unauthorized() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-red-100 dark:bg-red-900/20 rounded-full">
            <ShieldAlert className="w-16 h-16 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          You don't have permission to access this page.
        </p>
        
        {user && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Logged in as: <span className="font-semibold">{user.username}</span> ({user.role})
          </p>
        )}
        
        <div className="space-x-4">
          <Link href="/">
            <Button variant="default">
              Go to Dashboard
            </Button>
          </Link>
          
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
