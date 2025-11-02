import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Shield, Trash2, Key, Edit } from "lucide-react";
import { InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function UserManagement() {
  const { user, registerMutation } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  
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

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been removed from the system",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      await apiRequest("PUT", `/api/users/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "The user's password has been updated successfully",
      });
      setResetOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
      await apiRequest("PUT", `/api/users/${userId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User details have been updated successfully",
      });
      setEditOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
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
    
    registerMutation.mutate(newUser, {
      onSuccess: () => {
        toast({
          title: "User created successfully",
          description: `${newUser.username} has been added to the system`,
        });
        setCreateOpen(false);
        setNewUser({
          username: "",
          password: "",
          fullName: "",
          role: "reception",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage clinic staff accounts
          </p>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg font-semibold transition-all" data-testid="button-create-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new staff member to the clinic system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-fullname">Full Name</Label>
                <Input
                  id="new-fullname"
                  data-testid="input-new-fullname"
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-username">Username</Label>
                <Input
                  id="new-username"
                  data-testid="input-new-username"
                  type="text"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  data-testid="input-new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Role</Label>
                <select
                  id="new-role"
                  data-testid="select-new-role"
                  className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
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
              <Button
                type="submit"
                className="w-full"
                data-testid="button-submit-user"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullname">Full Name</Label>
              <Input
                id="edit-fullname"
                type="text"
                value={editData.fullName}
                onChange={(e) =>
                  setEditData({ ...editData, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
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
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password-reset">New Password</Label>
              <Input
                id="new-password-reset"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Complete list of clinic staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : (
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50 to-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                <TableRow>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-400">Username</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-400">Full Name</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-400">Role</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-400">Created</TableHead>
                  <TableHead className="text-right font-bold text-gray-700 dark:text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u: any) => (
                  <TableRow key={u.id} data-testid={`user-row-${u.id}`} className="hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-colors">
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.fullName || "-"}</TableCell>
                    <TableCell>
                      <span className="capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-500 tabular-nums">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(u)}
                          data-testid={`button-edit-${u.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(u)}
                          data-testid={`button-reset-${u.id}`}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={u.id === user?.id}
                              data-testid={`button-delete-${u.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{u.username}</strong>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(u.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
