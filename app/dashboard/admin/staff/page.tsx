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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Users,
  Briefcase,
  Award,
  Loader2,
  Heart,
  CheckCircle,
  DollarSign,
  Calendar,
  FileText,
  User,
  Phone,
  Notebook,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

// Type definitions
interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface Ministry {
  ministry_id: number;
  name: string;
}

interface Qualification {
  type: 'degree' | 'masters' | 'phd' | 'certification' | 'license';
  name: string;
  institution: string;
  date_earned: string;
  expiration?: string;
  verification_id?: string;
}

interface Staff {
  staff_id: number;
  user_id: number;
  user?: User;
  position: string;
  ministry_id?: number;
  ministry?: Ministry;
  employment_type: 'full-time' | 'part-time' | 'volunteer';
  salary?: number;
  qualifications?: Qualification[];
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  notes?: string;
  hire_date: string;
  end_date?: string;
  is_active: boolean;
}

const employmentTypes = ['full-time', 'part-time', 'volunteer'];
const qualificationTypes = ['degree', 'masters', 'phd', 'certification', 'license'];

export default function StaffCRUDPage() {
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
        <StaffCRUD />
      </SidebarInset>
    </SidebarProvider>
  );
}

function StaffCRUD() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [qualificationModalOpen, setQualificationModalOpen] = useState(false);
  const [selectedStaffForQualification, setSelectedStaffForQualification] = useState<Staff | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEmploymentType, setFilterEmploymentType] = useState<string>('all');
  const [filterMinistry, setFilterMinistry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors }, watch } = useForm<Staff>({
    defaultValues: {
      user_id: 0,
      position: '',
      ministry_id: 0,
      employment_type: 'volunteer',
      is_active: true,
    },
  });

  const { register: registerQualification, handleSubmit: handleQualificationSubmit, reset: resetQualification } = useForm<Qualification>();

  const employmentType = watch('employment_type');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [staffResponse, usersResponse, ministriesResponse] = await Promise.all([
        axiosInstance.get('/staff/staff'),
        axiosInstance.get('/user'),
        axiosInstance.get('/ministry'),
      ]);
      setStaff(Array.isArray(staffResponse.data) ? staffResponse.data : staffResponse.data?.data || []);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data?.data || []);
      setMinistries(Array.isArray(ministriesResponse.data) ? ministriesResponse.data : ministriesResponse.data?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when editing staff changes
  useEffect(() => {
    if (editingStaff) {
      reset({
        ...editingStaff,
        qualifications: editingStaff.qualifications || [],
      });
    } else {
      reset({
        staff_id: 0,
        user_id: 0,
        position: '',
        ministry_id: 0,
        employment_type: 'volunteer',
        salary: undefined,
        qualifications: [],
        bio: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        notes: '',
        hire_date: new Date().toISOString().split('T')[0],
        end_date: undefined,
        is_active: true,
      });
    }
  }, [editingStaff, reset]);

  // Filter staff based on search and filters
  useEffect(() => {
    let filtered = staff;

    if (searchQuery) {
      filtered = filtered.filter(staffMember =>
        `${staffMember.user?.first_name} ${staffMember.user?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staffMember.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staffMember.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(staffMember =>
        filterStatus === 'active' ? staffMember.is_active : !staffMember.is_active
      );
    }

    if (filterEmploymentType !== 'all') {
      filtered = filtered.filter(staffMember => staffMember.employment_type === filterEmploymentType);
    }

    if (filterMinistry !== 'all') {
      filtered = filtered.filter(staffMember => staffMember.ministry_id?.toString() === filterMinistry);
    }

    setFilteredStaff(filtered);
  }, [staff, searchQuery, filterStatus, filterEmploymentType, filterMinistry]);

  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);

  const onSubmit = async (data: Staff) => {
    try {
      setIsSubmitting(true);
      let response;
      if (editingStaff) {
        response = await axiosInstance.put(`/staff/staff${editingStaff.staff_id}`, data);
        const updatedStaff = response.data.data || response.data;
        setStaff(prev => prev.map(s => s.staff_id === editingStaff.staff_id ? updatedStaff : s));
        toast.success('Staff member updated successfully', { icon: '✅' });
      } else {
        response = await axiosInstance.post('/staff/staff', data);
        const newStaff = response.data.data || response.data;
        setStaff(prev => [...prev, newStaff]);
        toast.success('Staff member created successfully', { icon: '✅' });
      }
      closeModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${editingStaff ? 'update' : 'create'} staff member`;
      toast.error(errorMessage, { icon: '❌' });
      console.error('Error saving staff:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onQualificationSubmit = async (data: Qualification) => {
    if (!selectedStaffForQualification) return;

    try {
      setIsSubmitting(true);
      const updatedStaff = staff.map(staffMember => {
        if (staffMember.staff_id === selectedStaffForQualification.staff_id) {
          const existingQualifications = staffMember.qualifications || [];
          existingQualifications.push(data);
          return { ...staffMember, qualifications: existingQualifications };
        }
        return staffMember;
      });

      setStaff(updatedStaff);
      setQualificationModalOpen(false);
      setSelectedStaffForQualification(null);
      resetQualification();
      toast.success('Qualification added successfully', { icon: '✅' });
    } catch (error) {
      toast.error('Failed to add qualification', { icon: '❌' });
      console.error('Error adding qualification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeQualification = async (staffId: number, qualificationIndex: number) => {
    try {
      setIsSubmitting(true);
      const updatedStaff = staff.map(staffMember => {
        if (staffMember.staff_id === staffId) {
          const updatedQualifications = (staffMember.qualifications || []).filter((_, index) => index !== qualificationIndex);
          return { ...staffMember, qualifications: updatedQualifications };
        }
        return staffMember;
      });

      setStaff(updatedStaff);
      toast.success('Qualification removed successfully', { icon: '✅' });
    } catch (error) {
      toast.error('Failed to remove qualification', { icon: '❌' });
      console.error('Error removing qualification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (staffMember: Staff) => {
    try {
      const response = await axiosInstance.get(`/staff/${staffMember.staff_id}`);
      const staffData = response.data.data || response.data;
      setEditingStaff(staffData);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load staff details', { icon: '❌' });
      console.error('Error fetching staff details:', error);
    }
  };

  const openQualificationModal = (staffMember: Staff) => {
    setSelectedStaffForQualification(staffMember);
    setQualificationModalOpen(true);
    resetQualification({
      type: 'degree',
      name: '',
      institution: '',
      date_earned: new Date().toISOString().split('T')[0],
      expiration: undefined,
      verification_id: '',
    });
  };

  const openDeleteConfirm = (staffMember: Staff) => {
    setStaffToDelete(staffMember);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;

    try {
      setIsSubmitting(true);
      await axiosInstance.delete(`/staff/${staffToDelete.staff_id}`);
      setStaff(prev => prev.filter(s => s.staff_id !== staffToDelete.staff_id));
      setIsDeleteConfirmOpen(false);
      setStaffToDelete(null);
      toast.success('Staff member deleted successfully', { icon: '✅' });
    } catch (error) {
      toast.error('Failed to delete staff member', { icon: '❌' });
      console.error('Error deleting staff:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Unpaid';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getEmploymentVariant = (type: string) => {
    switch (type) {
      case 'full-time': return 'default';
      case 'part-time': return 'secondary';
      case 'volunteer': return 'outline';
      default: return 'outline';
    }
  };

  const getEmploymentIcon = (type?: string) => {
    const normalizedType = typeof type === 'string' ? type.toLowerCase() : 'default';
    switch (normalizedType) {
      case 'full-time':
        return <Briefcase className="h-4 w-4" />;
      case 'part-time':
        return <Briefcase className="h-4 w-4" />;
      case 'volunteer':
        return <Heart className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  const StaffTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Ministry</TableHead>
          <TableHead>Employment Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Hire Date</TableHead>
          <TableHead>Salary</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your church staff, their roles, and qualifications
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="h-4 w-4" />
          Add New Staff
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-200">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Staff</p>
              <p className="text-2xl font-bold">{staff.filter(s => s.is_active).length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-200">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Full-Time Staff</p>
              <p className="text-2xl font-bold">{staff.filter(s => s.employment_type === 'full-time').length}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-200">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Total Qualifications</p>
              <p className="text-2xl font-bold">{staff.reduce((acc, s) => acc + (s.qualifications?.length || 0), 0)}</p>
            </div>
            <div className="p-3 rounded-full bg-amber-200">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-8 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search staff by name, email, or position..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMinistry} onValueChange={setFilterMinistry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by ministry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ministries</SelectItem>
                  {ministries.map(ministry => (
                    <SelectItem key={ministry.ministry_id} value={ministry.ministry_id.toString()}>
                      {ministry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table of Staff */}
      {isLoading ? (
        <StaffTableSkeleton />
      ) : filteredStaff.length > 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Position</TableHead>
                <TableHead className="font-semibold">Ministry</TableHead>
                <TableHead className="font-semibold">Employment Type</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Hire Date</TableHead>
                <TableHead className="font-semibold">Salary</TableHead>
                <TableHead className="font-semibold">Qualifications</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staffMember) => (
                <TableRow
                  key={staffMember.staff_id}
                  className="hover:bg-muted/30 transition-colors duration-200"
                >
                  <TableCell className="font-medium">
                    {staffMember.first_name} {staffMember.last_name}
                    <div className="text-sm text-muted-foreground">{staffMember.user?.email}</div>
                  </TableCell>
                  <TableCell>{staffMember.position}</TableCell>
                  {/* <TableCell>{staffMember.ministry?.name || 'No ministry assigned'}</TableCell> */}
                  {/* <TableCell>{ministries.filter((min) => {min.ministry_id === staffMember.ministry_id})[0]}</TableCell> */}
                  <TableCell>{ministries.find(min => min.ministry_id === staffMember.ministry_id)?.name || 'No ministry assigned'}</TableCell>                  <TableCell>
                    <Badge variant={getEmploymentVariant(staffMember.employment_type)} className="flex items-center gap-1">
                      {getEmploymentIcon(staffMember.employment_type)}
                      {staffMember.employment_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(staffMember.is_active)}>
                      {staffMember.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(staffMember.hire_date)}</TableCell>
                  <TableCell>{staffMember.salary} ETB</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {staffMember.qualifications && staffMember.qualifications.length > 0 ? (
                        staffMember.qualifications.slice(0, 2).map((qual, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {qual.name} ({qual.type})
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No qualifications</span>
                      )}
                      {staffMember.qualifications && staffMember.qualifications.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{staffMember.qualifications.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(staffMember)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openQualificationModal(staffMember)}>
                          Add Qualification
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openDeleteConfirm(staffMember)}
                        >
                          {staffMember.is_active ? 'Deactivate' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <CardTitle className="text-xl mb-2">No staff members found</CardTitle>
            <CardDescription className="mb-6">
              {searchQuery || filterStatus !== 'all' || filterEmploymentType !== 'all' || filterMinistry !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first staff member'}
            </CardDescription>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Staff
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Staff Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl transition-all duration-300">
          <DialogHeader className="p-8 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
              {editingStaff
                ? 'Update the details of the staff member below.'
                : 'Add a new staff member to your church community.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="p-2 space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="user_id" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Users className="h-4 w-4 text-primary" />
                    User <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="user_id"
                    control={control}
                    rules={{ required: 'User is required' }}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(Number(value))}
                        disabled={!!editingStaff}
                      >
                        <SelectTrigger
                          className={`w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50 ${errors.user_id ? 'border-destructive focus:ring-destructive' : 'focus:ring-primary'
                            }`}
                        >
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                          {users && users.length > 0 ? (
                            users
                              .filter(user => user.user_type === 'Staff' && !staff.some(staffMember => staffMember.user_id === user.user_id))
                              .map(user => (
                                <SelectItem
                                  key={user.user_id}
                                  value={user.user_id.toString()}
                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {user.first_name} {user.last_name} ({user.email})
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="0" disabled>
                              No users available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.user_id && (
                    <p className="text-sm text-destructive mt-1 animate-pulse">{errors.user_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Position <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="position"
                    {...register('position', { required: 'Position is required' })}
                    className={`w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50 ${errors.position ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'
                      }`}
                    placeholder="e.g. Pastor, Youth Leader"
                  />
                  {errors.position && (
                    <p className="text-sm text-destructive mt-1 animate-pulse">{errors.position.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ministry_id" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Users className="h-4 w-4 text-primary" />
                    Ministry
                  </Label>
                  <Controller
                    name="ministry_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50">
                          <SelectValue placeholder="Select a ministry" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                          <SelectItem value="0">No ministry</SelectItem>
                          {ministries && ministries.length > 0 ? (
                            ministries.map((ministry) => (
                              <SelectItem key={ministry.ministry_id} value={ministry.ministry_id.toString()} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                {ministry.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="0" disabled>
                              No ministries available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employment_type" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Employment Type <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="employment_type"
                    control={control}
                    rules={{ required: 'Employment type is required' }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        className={`rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50 ${errors.employment_type ? 'border-destructive focus:ring-destructive' : 'focus:ring-primary'
                          }`}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                          {employmentTypes.map(type => (
                            <SelectItem key={type} value={type} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.employment_type && (
                    <p className="text-sm text-destructive mt-1 animate-pulse">{errors.employment_type.message}</p>
                  )}
                  {employmentType && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
                      <Badge variant={getEmploymentVariant(employmentType)} className="flex items-center gap-1">
                        {getEmploymentIcon(employmentType)}
                        {employmentType.charAt(0).toUpperCase() + employmentType.slice(1)}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Salary
                  </Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    {...register('salary', { valueAsNumber: true })}
                    className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                    placeholder="e.g. 50000"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Enter monthly salary in ETB (optional).</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-primary" />
                    Hire Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="hire_date"
                    type="date"
                    {...register('hire_date', { required: 'Hire date is required' })}
                    className={`w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50 ${errors.hire_date ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'
                      }`}
                  />
                  {errors.hire_date && (
                    <p className="text-sm text-destructive mt-1 animate-pulse">{errors.hire_date.message}</p>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Select the staff member's hire date.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-primary" />
                    End Date
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...register('end_date')}
                    className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Optional end date for employment.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FileText className="h-4 w-4 text-primary" />
                  Biography
                </Label>
                <Textarea
                  id="bio"
                  rows={4}
                  {...register('bio')}
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                  placeholder="Describe the staff member's background..."
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <User className="h-4 w-4 text-primary" />
                      Name
                    </Label>
                    <Input
                      id="emergency_contact_name"
                      {...register('emergency_contact_name')}
                      className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone
                    </Label>
                    <Input
                      id="emergency_contact_phone"
                      {...register('emergency_contact_phone')}
                      className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                      placeholder="e.g. +1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_relationship" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Users className="h-4 w-4 text-primary" />
                      Relationship
                    </Label>
                    <Input
                      id="emergency_contact_relationship"
                      {...register('emergency_contact_relationship')}
                      className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                      placeholder="e.g. Spouse"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Notebook className="h-4 w-4 text-primary" />
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  rows={4}
                  {...register('notes')}
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                {...register('is_active')}
                defaultChecked={editingStaff?.is_active ?? true}
                className="transition-all duration-200 hover:scale-110 border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Active Staff Member
              </Label>
            </div>

            <DialogFooter className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/10 to-transparent flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-24 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingStaff ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Qualification Modal */}
      <Dialog open={qualificationModalOpen} onOpenChange={setQualificationModalOpen}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl transition-all duration-300">
          <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/10 to-transparent">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Add Qualification for {selectedStaffForQualification?.user?.first_name} {selectedStaffForQualification?.user?.last_name}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Add a new qualification for this staff member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQualificationSubmit(onQualificationSubmit)} className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Award className="h-4 w-4 text-primary" />
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                {...registerQualification('type', { required: 'Type is required' })}
                defaultValue="degree"
              >
                <SelectTrigger className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  {qualificationTypes.map(type => (
                    <SelectItem key={type} value={type} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <FileText className="h-4 w-4 text-primary" />
                Qualification Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...registerQualification('name', { required: 'Name is required' })}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                placeholder="e.g. Bachelor of Theology"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Users className="h-4 w-4 text-primary" />
                Institution <span className="text-destructive">*</span>
              </Label>
              <Input
                id="institution"
                {...registerQualification('institution', { required: 'Institution is required' })}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                placeholder="e.g. University of Example"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date_earned" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date Earned <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date_earned"
                  type="date"
                  {...registerQualification('date_earned', { required: 'Date earned is required' })}
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 text-primary" />
                  Expiration Date
                </Label>
                <Input
                  id="expiration"
                  type="date"
                  {...registerQualification('expiration')}
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification_id" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-primary" />
                Verification ID
              </Label>
              <Input
                id="verification_id"
                {...registerQualification('verification_id')}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 transition-all duration-200 hover:ring-2 hover:ring-primary/50"
                placeholder="e.g. CERT12345"
              />
            </div>

            <DialogFooter className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/10 to-transparent flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQualificationModalOpen(false);
                  setSelectedStaffForQualification(null);
                }}
                disabled={isSubmitting}
                className="rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-24 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add Qualification'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl transition-all duration-300">
          <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-destructive/10 to-transparent">
            <DialogTitle className="text-xl font-bold text-destructive">
              Confirm {staffToDelete?.is_active ? 'Deactivation' : 'Deletion'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to {staffToDelete?.is_active ? 'deactivate' : 'delete'} the staff member{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                "{staffToDelete?.user?.first_name} {staffToDelete?.user?.last_name}"
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isSubmitting}
              className="rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md hover:scale-105"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="min-w-24 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-all duration-200 hover:shadow-md hover:scale-105"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : staffToDelete?.is_active ? (
                'Deactivate'
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}