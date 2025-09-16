'use client';
import { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

// Type definitions
interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  user_type: 'Member' | 'Staff' | 'Admin';
  status: 'Active' | 'Inactive';
  last_login?: string;
}

interface CreateUserData extends Omit<User, 'user_id' | 'last_login'> {
  password?: string;
  confirm_password?: string;
}

export default function UserCRUDPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <UserCRUD />
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserCRUD() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { register, handleSubmit, reset, formState: { errors }, watch, control } = useForm<CreateUserData>({
    mode: 'onChange'
  });
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors }, watch: watchPassword } = useForm<{
    new_password: string;
    confirm_password: string;
  }>({
    mode: 'onChange'
  });

  // Fetch users with error handling and loading state
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingUser) {
      reset({
        ...editingUser,
        password: '',
        confirm_password: ''
      });
    } else {
      reset({
        email: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        phone: '',
        address: '',
        user_type: 'Member',
        status: 'Active',
        password: '',
        confirm_password: ''
      });
    }
  }, [editingUser, reset]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/user');
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];

  // Filter users based on search and selected filters
  const filteredUsers = safeUsers.filter(user => {
    const nameMatch = !searchQuery || 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const typeMatch = filterType === 'all' || user.user_type === filterType;
    const statusMatch = filterStatus === 'all' || user.status === filterStatus;
    return nameMatch && typeMatch && statusMatch;
  });

  const onSubmit = async (data: CreateUserData) => {
    try {
      setIsSubmitting(true);
      if (editingUser) {
        const { password, confirm_password, ...updateData } = data;
        await axiosInstance.put(`/user/users/${editingUser.user_id}`, updateData);
        toast.success('User updated successfully');
      } else {
        const { confirm_password, ...createData } = data;
        await axiosInstance.post('/user/users', createData);
        toast.success('User created successfully');
      }
      fetchUsers();
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: { new_password: string; confirm_password: string }) => {
    try {
      setIsPasswordSubmitting(true);
      if (passwordUser) {
        await axiosInstance.patch(`/user/users/${passwordUser.user_id}/password`, {
          password: data.new_password
        });
        toast.success('Password updated successfully');
        setPasswordModalOpen(false);
        setPasswordUser(null);
        resetPassword();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (userToDelete) {
        await axiosInstance.delete(`/user/users/${userToDelete.user_id}`);
        toast.success('User deleted successfully');
        fetchUsers();
        setIsDeleteConfirmOpen(false);
        setUserToDelete(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const openPasswordModal = (user: User) => {
    setPasswordUser(user);
    setPasswordModalOpen(true);
  };

  const openDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'Admin': return 'destructive';
      case 'Staff': return 'default';
      case 'Member': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusVariant = (status: string) => {
    return status === 'Active' ? 'default' : 'secondary';
  };

  const UserTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead className="text-right"><Skeleton className="h-4 w-12" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16 rounded" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16 rounded" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-8 w-8 rounded" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, manage and organize users within your organization
          </p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="h-4 w-4" />
          Create New User
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-8 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Users</p>
              <p className="text-2xl font-bold">{safeUsers.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-200">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Users</p>
              <p className="text-2xl font-bold">{safeUsers.filter(u => u.status === 'Active').length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-200">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Admin Users</p>
              <p className="text-2xl font-bold">{safeUsers.filter(u => u.user_type === 'Admin').length}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-200">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Member Users</p>
              <p className="text-2xl font-bold">{safeUsers.filter(u => u.user_type === 'Member').length}</p>
            </div>
            <div className="p-3 rounded-full bg-amber-200">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="shadow-lg border-none bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Users List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-50 transition-colors duration-200">
                  <TableHead className="text-gray-700 font-medium">Name</TableHead>
                  <TableHead className="text-gray-700 font-medium">Email</TableHead>
                  <TableHead className="text-gray-700 font-medium">Type</TableHead>
                  <TableHead className="text-gray-700 font-medium">Status</TableHead>
                  <TableHead className="text-gray-700 font-medium">Last Login</TableHead>
                  <TableHead className="text-right text-gray-700 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.user_id} 
                    className="hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(user.date_of_birth)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900 font-medium">{user.email}</div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getBadgeVariant(user.user_type)}
                        className="transition-colors duration-200"
                      >
                        {user.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusVariant(user.status)}
                        className="transition-colors duration-200"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatDateTime(user.last_login)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => openEditModal(user)}
                            className="cursor-pointer focus:bg-blue-50"
                          >
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openPasswordModal(user)}
                            className="cursor-pointer focus:bg-green-50"
                          >
                            Change Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteConfirm(user)}
                            className="text-destructive focus:text-destructive focus:bg-red-50"
                          >
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <CardTitle className="text-xl mb-2">No users found</CardTitle>
                <CardDescription className="mb-6">
                  {searchQuery || filterType !== "all" || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria" 
                    : "Get started by creating your first user"
                  }
                </CardDescription>
                <Button 
                  onClick={openCreateModal}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New User
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900">
              {editingUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingUser 
                ? "Update the user details below." 
                : "Add a new user to your organization."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-gray-700 flex items-center gap-1">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  {...register('first_name', { required: 'First name is required' })}
                  className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-gray-700 flex items-center gap-1">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  {...register('last_name', { required: 'Last name is required' })}
                  className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 flex items-center gap-1">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {!editingUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 flex items-center gap-1">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters"
                      }
                    })}
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-gray-700 flex items-center gap-1">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...register('confirm_password', { 
                      required: 'Please confirm your password',
                      validate: value => value === watch('password') || "Passwords do not match"
                    })}
                    className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-red-600">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-gray-700">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register('date_of_birth')}
                  className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700">Address</Label>
              <Textarea
                id="address"
                rows={3}
                {...register('address')}
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="user_type" className="text-gray-700 flex items-center gap-1">
                  User Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="user_type"
                  rules={{ required: "User type is required" }}
                  defaultValue={editingUser?.user_type || "Member"}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.user_type && (
                  <p className="text-sm text-red-600">{errors.user_type.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-700 flex items-center gap-1">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  {...register('status', { required: 'Status is required' })}
                  defaultValue={editingUser?.status || 'Active'}
                >
                  <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeModal}
                disabled={isSubmitting}
                className="border-gray-300 hover:bg-gray-100 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200 min-w-24"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  ''
                )}
                {isSubmitting ? 'Processing...' : (editingUser ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              Change Password for {passwordUser?.first_name} {passwordUser?.last_name}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the password for this user.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-gray-700">New Password</Label>
              <Input
                id="new_password"
                type="password"
                {...registerPassword('new_password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters"
                  }
                })}
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
              {passwordErrors.new_password && (
                <p className="text-sm text-red-600">{passwordErrors.new_password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-gray-700">Confirm Password</Label>
              <Input
                id="confirm_password"
                type="password"
                {...registerPassword('confirm_password', { 
                  required: 'Please confirm your password',
                  validate: value => value === watchPassword('new_password') || "Passwords do not match"
                })}
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
              {passwordErrors.confirm_password && (
                <p className="text-sm text-red-600">{passwordErrors.confirm_password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setPasswordModalOpen(false);
                  setPasswordUser(null);
                  resetPassword();
                }}
                disabled={isPasswordSubmitting}
                className="border-gray-300 hover:bg-gray-100 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isPasswordSubmitting}
                className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200 min-w-24"
              >
                {isPasswordSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  ''
                )}
                {isPasswordSubmitting ? 'Processing...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete the user <span className="font-semibold text-foreground">"{userToDelete?.first_name} {userToDelete?.last_name}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
              className="border-gray-300 hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 transition-colors duration-200 min-w-24"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                ''
              )}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}