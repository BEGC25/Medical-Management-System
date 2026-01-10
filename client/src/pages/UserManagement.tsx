import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { UserPlus, Shield, Trash2, Key, Edit, Search, Users, ArrowUpDown, ArrowUp, ArrowDown, User, Lock, AtSign, BadgeCheck, X, AlertCircle, CheckCircle2, AlertTriangle, UserCircle, Stethoscope, FlaskConical, Radio, Pill, ShieldCheck, Eye } from "lucide-react";
import { InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { PermissionsModal } from "@/components/PermissionsModal";

// Password strength calculator
function getPasswordStrength(password: string): { strength: 'weak' | 'medium' | 'strong', score: number } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) return { strength: 'weak', score: 33 };
  if (score <= 3) return { strength: 'medium', score: 66 };
  return { strength: 'strong', score: 100 };
}

// Role icons
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return <ShieldCheck className="w-3.5 h-3.5" />;
    case 'doctor': return <Stethoscope className="w-3.5 h-3.5" />;
    case 'lab': return <FlaskConical className="w-3.5 h-3.5" />;
    case 'radiology': return <Radio className="w-3.5 h-3.5" />;
    case 'pharmacy': return <Pill className="w-3.5 h-3.5" />;
    default: return <UserCircle className="w-3.5 h-3.5" />;
  }
};

// Types for better type safety
type UserRole = "admin" | "doctor" | "lab" | "radiology" | "pharmacy" | "reception";
interface User {
  id: number;
  username: string;
  fullName?: string | null;
  role: UserRole;
  createdAt: string;
}

interface RoleBreakdown {
  [key: string]: number;
}

// Sort types
type SortField = 'username' | 'fullName' | 'role' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

export default function UserManagement() {
  const { user, registerMutation } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  
  // Search, filter, and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Form validation state
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = useState<{ strength: 'weak' | 'medium' | 'strong', score: number } | null>(null);
  
  const [newUser, setNewUser] = useState<InsertUser>({
    username: "",
    password: "",
    fullName: "",
    role: "reception",
  });

  const [editData, setEditData] = useState({
    fullName: "",
    role: "reception" as any,
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Calculate stats from users
  const stats = useMemo(() => {
    if (!users) return null;
    
    const typedUsers = users as User[];
    const totalUsers = typedUsers.length;
    const roleBreakdown: RoleBreakdown = typedUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as RoleBreakdown);
    
    // Recently added (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAdded = typedUsers.filter((u) => new Date(u.createdAt) > sevenDaysAgo).length;
    
    return {
      totalUsers,
      roleBreakdown,
      recentlyAdded,
    };
  }, [users]);

  // Filter, search, and sort users
  const filteredAndSortedUsers = useMemo(() => {
    if (!users) return [];
    
    const typedUsers = users as User[];
    let filtered = [...typedUsers];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u) => 
        u.username?.toLowerCase().includes(query) ||
        u.fullName?.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: string | number | null | undefined = a[sortField];
        let bValue: string | number | null | undefined = b[sortField];
        
        // Handle null/undefined
        if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
        
        // Handle dates
        if (sortField === 'createdAt') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        }
        
        // Handle strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [users, searchQuery, sortField, sortDirection]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedUsers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField('createdAt');
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page
  };

  // Update password strength on password change
  useEffect(() => {
    if (newUser.password) {
      setPasswordStrength(getPasswordStrength(newUser.password));
    } else {
      setPasswordStrength(null);
    }
  }, [newUser.password]);

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      await apiRequest("PUT", `/api/users/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      const username = selectedUser?.fullName || selectedUser?.username || 'User';
      toast({
        title: "Password reset successfully",
        description: `Password has been updated for ${username}`,
        variant: "success",
      });
      setResetOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reset password",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
      await apiRequest("PUT", `/api/users/${userId}`, updates);
    },
    onSuccess: () => {
      const username = selectedUser?.fullName || selectedUser?.username || 'User';
      toast({
        title: "User updated successfully",
        description: `${username}'s details have been updated`,
        variant: "success",
      });
      setEditOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              Only administrators can access user management
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: {[key: string]: string} = {};
    if (!newUser.fullName || newUser.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    }
    if (!newUser.username || newUser.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    if (newUser.username && /\s/.test(newUser.username)) {
      errors.username = "Username cannot contain spaces";
    }
    if (!newUser.password || newUser.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    
    setFormErrors({});
    
    registerMutation.mutate(newUser, {
      onSuccess: () => {
        toast({
          title: "User created successfully",
          description: `${newUser.fullName || newUser.username} has been added to the system`,
          variant: "success",
        });
        setCreateOpen(false);
        setNewUser({
          username: "",
          password: "",
          fullName: "",
          role: "reception",
        });
        setPasswordStrength(null);
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: (error: any) => {
        toast({
          title: "Failed to create user",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleEditUser = (userToEdit: any) => {
    setSelectedUser(userToEdit);
    setEditData({
      fullName: userToEdit.fullName || "",
      role: userToEdit.role,
    });
    setEditOpen(true);
  };

  const handleResetPassword = (userToReset: any) => {
    setSelectedUser(userToReset);
    setNewPassword("");
    setResetOpen(true);
  };

  const handleViewPermissions = (userToView: any) => {
    setSelectedUser(userToView);
    setPermissionsOpen(true);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      userId: selectedUser.id,
      updates: editData,
    });
  };

  const submitReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      newPassword,
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage clinic staff accounts
            </p>
          </div>
          
          <Dialog open={createOpen} onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) {
              setFormErrors({});
              setPasswordStrength(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover:shadow-lg font-semibold transition-all hover:scale-105" data-testid="button-create-user">
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create New User</DialogTitle>
                <DialogDescription>
                  Add a new staff member to the clinic system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-5">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="new-fullname" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-fullname"
                      data-testid="input-new-fullname"
                      type="text"
                      value={newUser.fullName || ""}
                      onChange={(e) => {
                        setNewUser({ ...newUser, fullName: e.target.value });
                        if (formErrors.fullName) {
                          setFormErrors(prev => ({ ...prev, fullName: '' }));
                        }
                      }}
                      className={cn(
                        "pl-10 transition-all duration-200",
                        formErrors.fullName && "border-red-500 focus-visible:ring-red-500"
                      )}
                      placeholder="Enter full name"
                    />
                  </div>
                  {formErrors.fullName && (
                    <div className="flex items-center gap-1 text-xs text-red-600 animate-in fade-in-0 slide-in-from-top-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{formErrors.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="new-username" className="text-sm font-medium">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-username"
                      data-testid="input-new-username"
                      type="text"
                      value={newUser.username}
                      onChange={(e) => {
                        setNewUser({ ...newUser, username: e.target.value });
                        if (formErrors.username) {
                          setFormErrors(prev => ({ ...prev, username: '' }));
                        }
                      }}
                      className={cn(
                        "pl-10 transition-all duration-200",
                        formErrors.username && "border-red-500 focus-visible:ring-red-500"
                      )}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  {formErrors.username && (
                    <div className="flex items-center gap-1 text-xs text-red-600 animate-in fade-in-0 slide-in-from-top-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{formErrors.username}</span>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      data-testid="input-new-password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => {
                        setNewUser({ ...newUser, password: e.target.value });
                        if (formErrors.password) {
                          setFormErrors(prev => ({ ...prev, password: '' }));
                        }
                      }}
                      className={cn(
                        "pl-10 transition-all duration-200",
                        formErrors.password && "border-red-500 focus-visible:ring-red-500"
                      )}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  {formErrors.password && (
                    <div className="flex items-center gap-1 text-xs text-red-600 animate-in fade-in-0 slide-in-from-top-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{formErrors.password}</span>
                    </div>
                  )}
                  {/* Password Strength Indicator */}
                  {passwordStrength && (
                    <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password Strength</span>
                        <span className={cn(
                          "font-medium capitalize",
                          passwordStrength.strength === 'weak' && "text-red-600",
                          passwordStrength.strength === 'medium' && "text-yellow-600",
                          passwordStrength.strength === 'strong' && "text-green-600"
                        )}>
                          {passwordStrength.strength}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500 ease-out",
                            passwordStrength.strength === 'weak' && "bg-red-500",
                            passwordStrength.strength === 'medium' && "bg-yellow-500",
                            passwordStrength.strength === 'strong' && "bg-green-500"
                          )}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use 10+ characters with mix of letters, numbers & symbols
                      </p>
                    </div>
                  )}
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <Label htmlFor="new-role" className="text-sm font-medium">Role</Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <select
                      id="new-role"
                      data-testid="select-new-role"
                      className="w-full border border-input bg-background pl-10 pr-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          role: e.target.value as any,
                        })
                      }
                    >
                      <option value="reception">Reception</option>
                      <option value="doctor">Doctor</option>
                      <option value="lab">Laboratory</option>
                      <option value="radiology">Radiology</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full transition-all duration-200 hover:scale-105"
                  data-testid="button-submit-user"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit User</DialogTitle>
              <DialogDescription>
                Update user details for {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitEdit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-fullname" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-fullname"
                    type="text"
                    value={editData.fullName}
                    onChange={(e) =>
                      setEditData({ ...editData, fullName: e.target.value })
                    }
                    className="pl-10 transition-all duration-200"
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-sm font-medium">Role</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <select
                    id="edit-role"
                    className="w-full border border-input bg-background pl-10 pr-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                    value={editData.role}
                    onChange={(e) =>
                      setEditData({ ...editData, role: e.target.value as any })
                    }
                  >
                    <option value="reception">Reception</option>
                    <option value="doctor">Doctor</option>
                    <option value="lab">Laboratory</option>
                    <option value="radiology">Radiology</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending} className="transition-all duration-200 hover:scale-105">
                  {updateMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password-reset" className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password-reset"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="pl-10 transition-all duration-200"
                    required
                  />
                </div>
                {newPassword && newPassword.length < 6 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 animate-in fade-in-0 slide-in-from-top-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Password must be at least 6 characters</span>
                  </div>
                )}
                {newPassword && newPassword.length >= 6 && (
                  <div className="flex items-center gap-1 text-xs text-green-600 animate-in fade-in-0 slide-in-from-top-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Password meets minimum requirements</span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={resetPasswordMutation.isPending} className="transition-all duration-200 hover:scale-105">
                  {resetPasswordMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Permissions Modal */}
        {selectedUser && (
          <PermissionsModal
            open={permissionsOpen}
            onOpenChange={setPermissionsOpen}
            user={selectedUser}
          />
        )}

        {/* Stats Section */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
            {/* Total Users */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">{stats.totalUsers}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Count */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 tabular-nums">{stats.roleBreakdown.admin || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctor Count */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Doctors</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 tabular-nums">{stats.roleBreakdown.doctor || 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Stethoscope className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lab & Radiology */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lab & Radio</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1 tabular-nums">
                      {(stats.roleBreakdown.lab || 0) + (stats.roleBreakdown.radiology || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <FlaskConical className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recently Added */}
            <Card className="shadow-premium-md hover:shadow-premium-lg transition-all duration-300 border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recent (7d)</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">{stats.recentlyAdded}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <UserPlus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Table Card */}
        <Card className="shadow-premium-lg hover:shadow-premium-xl transition-shadow duration-300 animate-in fade-in-0 slide-in-from-bottom-3 duration-700" style={{ animationDelay: '200ms' }}>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">All Users</CardTitle>
                <CardDescription className="mt-1.5">
                  {isLoading ? (
                    "Loading users..."
                  ) : filteredAndSortedUsers.length === 0 ? (
                    searchQuery ? "No users match your search" : "No users found"
                  ) : (
                    `Showing ${paginatedUsers.length} of ${filteredAndSortedUsers.length} user${filteredAndSortedUsers.length !== 1 ? 's' : ''}`
                  )}
                </CardDescription>
              </div>
              
              {/* Page Size Selector */}
              {!isLoading && filteredAndSortedUsers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-20 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {/* Search Bar */}
            {!isLoading && users && (users as User[]).length > 0 ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username, full name, or role..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-10 transition-all duration-200 focus:shadow-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              /* Skeleton Loading State */
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredAndSortedUsers.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in-0 zoom-in-95 duration-500">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  {searchQuery ? (
                    <Search className="h-12 w-12 text-muted-foreground" />
                  ) : (
                    <Users className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No users found" : "No users yet"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery 
                    ? `No users match "${searchQuery}". Try adjusting your search.`
                    : "Get started by creating your first user account."
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setCreateOpen(true)} className="shadow-md hover:shadow-lg transition-all">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create First User
                  </Button>
                )}
              </div>
            ) : (
              /* Users Table */
              <div className="space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-muted/50">
                        {/* Username - Sortable */}
                        <TableHead className="font-semibold">
                          <button
                            onClick={() => handleSort('username')}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                          >
                            <span>Username</span>
                            <div className="flex flex-col">
                              {sortField === 'username' && sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4 text-primary" />
                              ) : sortField === 'username' && sortDirection === 'desc' ? (
                                <ArrowDown className="h-4 w-4 text-primary" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                              )}
                            </div>
                          </button>
                        </TableHead>
                        
                        {/* Full Name - Sortable */}
                        <TableHead className="font-semibold">
                          <button
                            onClick={() => handleSort('fullName')}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                          >
                            <span>Full Name</span>
                            <div className="flex flex-col">
                              {sortField === 'fullName' && sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4 text-primary" />
                              ) : sortField === 'fullName' && sortDirection === 'desc' ? (
                                <ArrowDown className="h-4 w-4 text-primary" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                              )}
                            </div>
                          </button>
                        </TableHead>
                        
                        {/* Role - Sortable */}
                        <TableHead className="font-semibold">
                          <button
                            onClick={() => handleSort('role')}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                          >
                            <span>Role</span>
                            <div className="flex flex-col">
                              {sortField === 'role' && sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4 text-primary" />
                              ) : sortField === 'role' && sortDirection === 'desc' ? (
                                <ArrowDown className="h-4 w-4 text-primary" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                              )}
                            </div>
                          </button>
                        </TableHead>
                        
                        {/* Created - Sortable */}
                        <TableHead className="font-semibold">
                          <button
                            onClick={() => handleSort('createdAt')}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                          >
                            <span>Created</span>
                            <div className="flex flex-col">
                              {sortField === 'createdAt' && sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4 text-primary" />
                              ) : sortField === 'createdAt' && sortDirection === 'desc' ? (
                                <ArrowDown className="h-4 w-4 text-primary" />
                              ) : (
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                              )}
                            </div>
                          </button>
                        </TableHead>
                        
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((u: any, index: number) => (
                        <TableRow 
                          key={u.id} 
                          data-testid={`user-row-${u.id}`} 
                          className={cn(
                            "transition-all duration-200 group",
                            "hover:bg-muted/50 hover:shadow-sm",
                            index % 2 === 0 ? "bg-background" : "bg-muted/20"
                          )}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              {u.username}
                            </div>
                          </TableCell>
                          <TableCell>{u.fullName || "-"}</TableCell>
                          <TableCell>
                            <span className="capitalize inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800 transition-all duration-200 group-hover:shadow-md">
                              {getRoleIcon(u.role)}
                              {u.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums text-sm">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {/* View Permissions Button with Tooltip */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewPermissions(u)}
                                    data-testid={`button-view-permissions-${u.id}`}
                                    className="h-9 w-9 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 hover:scale-110"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="animate-in fade-in-0 zoom-in-95 duration-200">
                                  <p>View permissions</p>
                                </TooltipContent>
                              </Tooltip>

                              {/* Edit Button with Tooltip */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(u)}
                                    data-testid={`button-edit-${u.id}`}
                                    className="h-9 w-9 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-110"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="animate-in fade-in-0 zoom-in-95 duration-200">
                                  <p>Edit user details</p>
                                </TooltipContent>
                              </Tooltip>

                              {/* Reset Password Button with Tooltip */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResetPassword(u)}
                                    data-testid={`button-reset-${u.id}`}
                                    className="h-9 w-9 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 hover:scale-110"
                                  >
                                    <Key className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="animate-in fade-in-0 zoom-in-95 duration-200">
                                  <p>Reset user password</p>
                                </TooltipContent>
                              </Tooltip>

                              {/* Delete Button with Tooltip */}
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={u.id === user?.id}
                                        data-testid={`button-delete-${u.id}`}
                                        className="h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="animate-in fade-in-0 zoom-in-95 duration-200">
                                    <p>{u.id === user?.id ? "Cannot delete yourself" : "Delete user"}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent className="animate-in fade-in-0 zoom-in-95 duration-300">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                      <AlertTriangle className="h-5 w-5" />
                                      Delete User?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-base space-y-3">
                                      <p>
                                        Are you sure you want to delete{' '}
                                        <strong className="text-foreground font-semibold">
                                          {u.fullName || u.username} ({u.role.charAt(0).toUpperCase() + u.role.slice(1)})
                                        </strong>?
                                      </p>
                                      <p className="text-red-600 dark:text-red-400 font-medium">
                                        This action cannot be undone. All user data and access will be permanently removed.
                                      </p>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="transition-all duration-200 hover:scale-105">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        deleteMutation.mutate(u.id, {
                                          onSuccess: () => {
                                            toast({
                                              title: "User deleted successfully",
                                              description: `${u.fullName || u.username} has been removed from the system`,
                                              variant: "success",
                                            });
                                          }
                                        });
                                      }}
                                      disabled={deleteMutation.isPending}
                                      className="bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                                    >
                                      {deleteMutation.isPending ? (
                                        <>
                                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                          Deleting...
                                        </>
                                      ) : (
                                        "Delete User"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="gap-1 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                          >
                            <PaginationPrevious className="h-4 w-4" />
                          </Button>
                        </PaginationItem>

                        {/* Page Numbers */}
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          // Show first page, last page, current page, and pages around current
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className={cn(
                                    "cursor-pointer transition-all duration-200",
                                    currentPage === pageNum 
                                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                                      : "hover:scale-110"
                                  )}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            pageNum === currentPage - 2 ||
                            pageNum === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">...</span>
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="gap-1 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                          >
                            <PaginationNext className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
