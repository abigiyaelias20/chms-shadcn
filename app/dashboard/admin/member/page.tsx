'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Users,
  Filter,
  UserPlus,
} from "lucide-react";
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosInstance';

// Type definitions
interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  user_type: string;
}

interface Family {
  family_id: number;
  family_name: string;
}

interface Team {
  team_id: number;
  name: string;
}

interface TeamParticipation {
  team_id: number;
  role: 'member' | 'leader' | 'coordinator';
  join_date: string;
  end_date?: string;
  is_active: boolean;
}

interface EventParticipation {
  event_id: number;
  role: 'attendee' | 'volunteer' | 'coordinator';
  join_date: string;
  end_date?: string;
  feedback?: string;
}

interface Member {
  member_id: number;
  user_id: number;
  user?: User;
  join_date?: string;
  membership_status: 'visitor' | 'new_member' | 'active' | 'inactive' | 'transferred';
  baptism_date?: string;
  family_id?: number;
  family?: Family;
  family_relationship?: 'head' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  team_participation?: TeamParticipation[];
  spiritual_gifts?: string[];
  event_participation?: EventParticipation[];
  notes?: string;
}

const spiritualGiftsOptions = [
  'teaching', 'worship', 'outreach', 'administration',
  'hospitality', 'prayer', 'counseling', 'technical'
];

export default function MemberCRUD() {
  const [members, setMembers] = useState<Member[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedMemberForTeam, setSelectedMemberForTeam] = useState<Member | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const form = useForm<Member>();
  const teamForm = useForm<TeamParticipation>();



  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        axiosInstance.get('/members/members'),
        axiosInstance.get('/user'),
        axiosInstance.get('/families'),
        axiosInstance.get('/teams')
      ]);

      // Set state individually based on success/failure
      if (results[0].status === 'fulfilled') {
        setMembers(results[0].value.data.data || []);
        console.log("Members Data", results[0].value.data.data)
      }
      else { console.error('Failed to load members'); toast.error('Failed to load members'); };

      if (results[1].status === 'fulfilled') {
        const usersData = results[1].value.data.data || [];
        setUsers(usersData.filter((user: User) => user.user_type === 'Member'));
      } else {
        toast.error('Failed to load users');
      }

      if (results[2].status === 'fulfilled') setFamilies(results[2].value.data || []);
      else console.error('Failed to load families');

      if (results[3].status === 'fulfilled') setTeams(results[3].value.data || []);
      else console.error('Failed to load teams');

    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };


  // Reset form when editing member changes
  useEffect(() => {
    if (editingMember) {
      form.reset({
        ...editingMember,
        spiritual_gifts: editingMember.spiritual_gifts || []
      });
    } else {
      form.reset({
        member_id: 0,
        user_id: 0,
        join_date: new Date().toISOString().split('T')[0],
        membership_status: 'visitor',
        baptism_date: '',
        family_id: 0,
        family_relationship: undefined,
        spiritual_gifts: [],
        notes: ''
      });
    }
  }, [editingMember, form]);

  const staffMember = Array.isArray(members) ? members : []

  // Filter members based on selected filters
  const filteredMembers = staffMember.filter(member => {
    const statusMatch = filterStatus === 'all' || member.membership_status === filterStatus;
    const teamMatch = filterTeam === 'all' ||
      (member.team_participation && member.team_participation.some(t =>
        t.is_active && filterTeam === 'has_team')) ||
      ((!member.team_participation || member.team_participation.length === 0) && filterTeam === 'no_team');
    return statusMatch && teamMatch;
  });


  const onSubmit = async (data: Member) => {
    try {
      if (editingMember) {
        // Update existing member
        const response = await axiosInstance.put(`/members/members${editingMember.member_id}`, data);
        setMembers(prev =>
          prev.map(m => m.member_id === editingMember.member_id ? response.data : m)
        );
        toast.success('Member updated successfully');
      } else {
        // Create new member
        const response = await axiosInstance.post('/members/members', data);
        setMembers(prev => [...prev, response.data]);
        toast.success('Member created successfully');
      }
      closeModal();
      loadData(); // Reload to ensure users are updated if needed
    } catch (error) {
      toast.error('Failed to save member');
      console.error('Error saving member:', error);
    }
  };

  const onTeamSubmit = async (data: TeamParticipation) => {
    if (!selectedMemberForTeam) return;

    try {
      const response = await axiosInstance.post(
        `/members/${selectedMemberForTeam.member_id}/teams`,
        data
      );

      setMembers(prev => prev.map(member =>
        member.member_id === selectedMemberForTeam.member_id ? response.data : member
      ));

      setTeamModalOpen(false);
      setSelectedMemberForTeam(null);
      teamForm.reset();
      toast.success('Team participation updated successfully');
    } catch (error) {
      toast.error('Failed to update team participation');
      console.error('Error updating team:', error);
    }
  };

  const removeTeamParticipation = async (memberId: number, teamId: number) => {
    try {
      const response = await axiosInstance.delete(
        `/members/${memberId}/teams/${teamId}`
      );

      setMembers(prev => prev.map(member =>
        member.member_id === memberId ? response.data : member
      ));

      toast.success('Removed from team successfully');
    } catch (error) {
      toast.error('Failed to remove from team');
      console.error('Error removing team:', error);
    }
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      await axiosInstance.delete(`/members/members${memberToDelete.member_id}`);
      setMembers(prev => prev.filter(m => m.member_id !== memberToDelete.member_id));
      setIsDeleteConfirmOpen(false);
      setMemberToDelete(null);
      toast.success('Member deleted successfully');
    } catch (error) {
      toast.error('Failed to delete member');
      console.error('Error deleting member:', error);
    }
  };

  const openCreateModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const openTeamModal = (member: Member) => {
    setSelectedMemberForTeam(member);
    setTeamModalOpen(true);
    teamForm.reset({
      team_id: 0,
      role: 'member'
    });
  };

  const openDeleteConfirm = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteConfirmOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'visitor': return 'outline';
      case 'new_member': return 'success';
      case 'transferred': return 'destructive';
      default: return 'outline';
    }
  };



  if (loading) {
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
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p>Loading members...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
        <div className="container mx-auto flex flex-col gap-6 p-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Member Management
              </h1>
              <p className="text-muted-foreground">
                Manage church members, their details, and team participation
              </p>
            </div>
            <Button onClick={openCreateModal} className="gap-2 shadow-md hover:shadow-lg transition-shadow duration-200">
              <UserPlus className="h-4 w-4" />
              Add New Member
            </Button>
          </div>

          {/* Filters */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>Filter members by status and team participation</CardDescription>
                </div>
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="grid gap-2 flex-1">
                  <Label htmlFor="status-filter">Membership Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="status-filter" className="focus:ring-2 focus:ring-blue-500 transition-shadow">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="new_member">New Member</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 flex-1">
                  <Label htmlFor="team-filter">Team Participation</Label>
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger id="team-filter" className="focus:ring-2 focus:ring-blue-500 transition-shadow">
                      <SelectValue placeholder="Select team filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="has_team">With Team</SelectItem>
                      <SelectItem value="no_team">Without Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Member</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Family</TableHead>
                      <TableHead>Teams</TableHead>
                      <TableHead>Spiritual Gifts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.member_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                        <TableCell>
                          <div className="font-medium">
                            {member.user?.first_name} {member.user?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.user?.email}
                          </div>
                          {member.user?.phone && (
                            <div className="text-sm text-muted-foreground">
                              {member.user.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={getStatusVariant(member.membership_status)}>
                              {member.membership_status}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              Joined: {formatDate(member.join_date)}
                            </div>
                            {member.baptism_date && (
                              <div className="text-xs text-muted-foreground">
                                Baptized: {formatDate(member.baptism_date)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.family ? (
                            <>
                              <div className="font-medium">{member.family.family_name}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {member.family_relationship}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">No family</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {member.team_participation && member.team_participation.filter(t => t.is_active).length > 0 ? (
                              member.team_participation.filter(t => t.is_active).map(team => {
                                const teamInfo = teams.find(t => t.team_id === team.team_id);
                                return (
                                  <div key={team.team_id} className="flex items-center justify-between gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {teamInfo?.name} ({team.role})
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTeamParticipation(member.member_id, team.team_id)}
                                      className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground text-sm">No teams</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(member.spiritual_gifts) && member.spiritual_gifts.length > 0 ? (
                              member.spiritual_gifts.map(gift => (
                                <Badge key={gift} variant="secondary" className="text-xs">
                                  {gift}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No gifts listed</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="shadow-lg rounded-md">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditModal(member)} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openTeamModal(member)} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Users className="mr-2 h-4 w-4" />
                                Manage Teams
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteConfirm(member)}
                                className="text-destructive hover:bg-red-50 dark:hover:bg-red-900"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredMembers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No members found</h3>
                  <p className="text-muted-foreground mb-4">
                    No members match the selected filters.
                  </p>
                  <Button onClick={() => {
                    setFilterStatus('all');
                    setFilterTeam('all');
                  }} className="shadow-md hover:shadow-lg transition-shadow duration-200">
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create/Edit Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-0">
              <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingMember ? 'Update member details' : 'Add a new member to the church database'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <TabsTrigger value="basic" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">Basic Info</TabsTrigger>
                      <TabsTrigger value="family" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">Family</TabsTrigger>
                      <TabsTrigger value="spiritual" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900">Spiritual</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="user_id"
                          rules={{ required: "User is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>User *</FormLabel>
                              <Select
                                value={field.value?.toString()}
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                disabled={!!editingMember}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow">
                                    <SelectValue placeholder="Select a user" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                  {users.filter(user => !members.some(m => m.user_id === user.user_id)).map((user) => (
                                    <SelectItem key={user.user_id} value={user.user_id.toString()} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                      {user.first_name} {user.last_name} ({user.email})
                                    </SelectItem>
                                  ))}
                                  {users.filter(user => !members.some(m => m.user_id === user.user_id)).length === 0 && (
                                    <SelectItem value="0" disabled>No available users</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="membership_status"
                          rules={{ required: "Membership status is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Membership Status *</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="visitor">Visitor</SelectItem>
                                  <SelectItem value="new_member">New Member</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="transferred">Transferred</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="join_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Join Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="baptism_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Baptism Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="family" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="family_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Family</FormLabel>
                              <Select
                                value={field.value?.toString()}
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow">
                                    <SelectValue placeholder="Select a family" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">No family</SelectItem>
                                  {families.map((family) => (
                                    <SelectItem key={family.family_id} value={family.family_id.toString()} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                      {family.family_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="family_relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Family Relationship</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow">
                                    <SelectValue placeholder="Select relationship" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="head">Head</SelectItem>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="child">Child</SelectItem>
                                  <SelectItem value="parent">Parent</SelectItem>
                                  <SelectItem value="sibling">Sibling</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="spiritual" className="mt-6">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="spiritual_gifts"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spiritual Gifts</FormLabel>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {spiritualGiftsOptions.map((gift) => (
                                  <div key={gift} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={gift}
                                      checked={field.value?.includes(gift)}
                                      onCheckedChange={(checked) => {
                                        const currentGifts = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentGifts, gift]);
                                        } else {
                                          field.onChange(currentGifts.filter(g => g !== gift));
                                        }
                                      }}
                                      className="rounded-md border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors"
                                    />
                                    <Label htmlFor={gift} className="text-sm font-normal capitalize">
                                      {gift}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional notes about the member..."
                                  className="min-h-[120px] w-full resize-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={closeModal} className="rounded-lg hover:shadow-md transition-shadow duration-200">
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                      {editingMember ? 'Update' : 'Create'} Member
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Team Management Modal */}
          <Dialog open={teamModalOpen} onOpenChange={setTeamModalOpen}>
            <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-0">
              <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Manage Teams for {selectedMemberForTeam?.user?.first_name} {selectedMemberForTeam?.user?.last_name}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add or update team participation for this member
                </DialogDescription>
              </DialogHeader>
              <Form {...teamForm}>
                <form onSubmit={teamForm.handleSubmit(onTeamSubmit)} className="p-6 space-y-6">
                  <FormField
                    control={teamForm.control}
                    name="team_id"
                    rules={{ required: "Team is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team *</FormLabel>
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow">
                              <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {teams.map((team) => (
                              <SelectItem key={team.team_id} value={team.team_id.toString()} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={teamForm.control}
                    name="role"
                    rules={{ required: "Role is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 transition-shadow">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="leader">Leader</SelectItem>
                            <SelectItem value="coordinator">Coordinator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setTeamModalOpen(false)} className="rounded-lg hover:shadow-md transition-shadow duration-200">
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                      Add to Team
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Modal */}
          <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-0">
              <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
                <DialogTitle className="text-xl font-bold text-red-600">Confirm Deletion</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  This action cannot be undone. This will permanently delete the member record.
                </DialogDescription>
              </DialogHeader>
              <div className="p-6">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-medium">
                    {memberToDelete?.user?.first_name} {memberToDelete?.user?.last_name}
                  </span>
                  ? All associated data will be removed.
                </p>
              </div>
              <DialogFooter className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-lg hover:shadow-md transition-shadow duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDelete}
                  className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  Delete Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}