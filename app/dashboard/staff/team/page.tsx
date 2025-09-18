'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

// Type definitions
interface MinistryTeam {
  team_id: number;
  ministry_id: number;
  name: string;
  description?: string;
  meeting_schedule?: string;
  member_count?: number;
}

interface Ministry {
  ministry_id: number;
  name: string;
  description?: string;
}

interface TeamRole {
  role_id: number;
  team_id: number;
  title: string;
  responsibilities?: string;
  team_name?: string;
  ministry_name?: string;
}

interface Member {
  member_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  team_participation?: string;
}

export default function SingleMinistryTeamManagementPage() {
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
        <SingleMinistryTeamManagement />
      </SidebarInset>
    </SidebarProvider>
  );
}

function SingleMinistryTeamManagement() {
  const [teams, setTeams] = useState<MinistryTeam[]>([]);
  const [currentMinistry, setCurrentMinistry] = useState<Ministry | null>(null);
  const [editingTeam, setEditingTeam] = useState<MinistryTeam | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<MinistryTeam | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<MinistryTeam | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [loading, setLoading] = useState(true);
  
  // Team role states
  const [teamRoles, setTeamRoles] = useState<TeamRole[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null);
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamRole | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MinistryTeam>();
  const { register: registerRole, handleSubmit: handleSubmitRole, reset: resetRole, formState: { errors: roleErrors } } = useForm<TeamRole>();

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [teamsResponse, ministryResponse, rolesResponse] = await Promise.all([
        axiosInstance.get('/teams'),
        axiosInstance.get(`/ministry`),
        axiosInstance.get('/teamrole')
      ]);

      // Handle API response structure
      const teamsData = Array.isArray(teamsResponse.data)
        ? teamsResponse.data
        : teamsResponse.data?.data || [];
      
      console.log('Fetched teams:', teamsData);
      // Filter teams for the current ministry
      setTeams(teamsData);

      // Handle ministry response
      const ministryData = ministryResponse.data.data || ministryResponse.data;
      setCurrentMinistry(ministryData);

      // Handle roles response
      const rolesData = Array.isArray(rolesResponse.data)
        ? rolesResponse.data
        : rolesResponse.data?.data || [];
      setTeamRoles(rolesData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch members for role assignment
  const fetchMembers = async () => {
    try {
      const response = await axiosInstance.get('/members/members');
      const membersData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    }
  };

  // Reset form when editing team changes
  useEffect(() => {
    if (editingTeam) {
      reset(editingTeam);
    } else {
      reset({
        team_id: 0,
        ministry_id: currentMinistry?.ministry_id || 0,
        name: '',
        description: '',
        meeting_schedule: ''
      });
    }
  }, [editingTeam, reset, currentMinistry]);

  // Reset role form when editing role changes
  useEffect(() => {
    if (editingRole) {
      resetRole(editingRole);
    } else {
      resetRole({
        role_id: 0,
        team_id: selectedTeam?.team_id || 0,
        title: '',
        responsibilities: ''
      });
    }
  }, [editingRole, resetRole, selectedTeam]);

  const onSubmit = async (data: MinistryTeam) => {
    try {
      console.log('Submitting team data:', data);
      if (editingTeam) {
        // Update existing team
        const response = await axiosInstance.put(`/teams/${editingTeam.team_id}`, data);
        const updatedTeam = response.data.data || response.data;
        setTeams(prev =>
          prev.map(t => t.team_id === editingTeam.team_id ?
            { ...updatedTeam, member_count: editingTeam.member_count } : t
          )
        );
        toast.success('Team updated successfully');
      } else {
        // Create new team
        const response = await axiosInstance.post('/teams', data);
        const newTeam = response.data.data || response.data;
        setTeams(prev => [...prev, newTeam]);
        toast.success('Team created successfully');
      }
      closeModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${editingTeam ? 'update' : 'create'} team`;
      toast.error(errorMessage);
      console.error('Error saving team:', error);
    }
  };

  const onSubmitRole = async (data: TeamRole) => {
    try {
      if (editingRole) {
        // Update existing role
        const response = await axiosInstance.put(`/teamrole/${editingRole.role_id}`, data);
        const updatedRole = response.data.data || response.data;
        setTeamRoles(prev =>
          prev.map(r => r.role_id === editingRole.role_id ? updatedRole : r
          )
        );
        toast.success('Role updated successfully');
      } else {
        // Create new role
        const response = await axiosInstance.post('/teamrole', data);
        const newRole = response.data.data || response.data;
        setTeamRoles(prev => [...prev, newRole]);
        toast.success('Role created successfully');
      }
      closeRoleModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${editingRole ? 'update' : 'create'} role`;
      toast.error(errorMessage);
      console.error('Error saving role:', error);
    }
  };

  const onAssignRole = async () => {
    if (!selectedRole || !selectedMember) {
      toast.error('Please select both a role and a member');
      return;
    }

    try {
      await axiosInstance.post('/teamrole/assign', {
        role_id: selectedRole.role_id,
        member_id: selectedMember
      });
      toast.success('Role assigned successfully');
      setIsAssignRoleModalOpen(false);
      setSelectedRole(null);
      setSelectedMember(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to assign role';
      toast.error(errorMessage);
      console.error('Error assigning role:', error);
    }
  };

  const openCreateModal = () => {
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (team: MinistryTeam, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Fetch full team details
      const response = await axiosInstance.get(`/teams/${team.team_id}`);
      const teamData = response.data.data || response.data;
      setEditingTeam(teamData);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load team details');
      console.error('Error fetching team details:', error);
    }
  };

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const openEditRoleModal = (role: TeamRole) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const openAssignRoleModal = async (role: TeamRole) => {
    setSelectedRole(role);
    await fetchMembers();
    setIsAssignRoleModalOpen(true);
  };

  const openDeleteConfirm = (team: MinistryTeam, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeamToDelete(team);
    setIsDeleteConfirmOpen(true);
  };

  const deleteRole = async (roleId: number) => {
    try {
      await axiosInstance.delete(`/teamrole/${roleId}`);
      setTeamRoles(prev => prev.filter(r => r.role_id !== roleId));
      toast.success('Role deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete role';
      toast.error(errorMessage);
      console.error('Error deleting role:', error);
    }
  };

  const viewTeamDetails = (team: MinistryTeam) => {
    setSelectedTeam(team);
    setViewMode('detail');
  };

  const closeTeamDetails = () => {
    setSelectedTeam(null);
    setViewMode('grid');
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;

    try {
      await axiosInstance.delete(`/teams/${teamToDelete.team_id}`);
      setTeams(prev => prev.filter(t => t.team_id !== teamToDelete.team_id));
      setIsDeleteConfirmOpen(false);
      setTeamToDelete(null);

      // If we're viewing the deleted team, close the detail view
      if (selectedTeam && selectedTeam.team_id === teamToDelete.team_id) {
        closeTeamDetails();
      }
      toast.success('Team deleted successfully');
    } catch (error) {
      toast.error('Failed to delete team');
      console.error('Error deleting team:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  const closeAssignRoleModal = () => {
    setIsAssignRoleModalOpen(false);
    setSelectedRole(null);
    setSelectedMember(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading teams data...</p>
        </div>
      </div>
    );
  }

  // Team Card Component
  const TeamCard = ({ team }: { team: MinistryTeam }) => (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={() => viewTeamDetails(team)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{team.name}</CardTitle>
          <Badge variant="secondary">
            {team.member_count || 0} members
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 mb-4">{team.description}</p>

        {team.meeting_schedule && (
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{team.meeting_schedule}</span>
          </div>
        )}

        <div className="flex justify-end space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => openEditModal(team, e)}
            title="Edit Team"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={(e) => openDeleteConfirm(team, e)}
            title="Delete Team"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Team Roles Section
  const TeamRolesSection = () => {
    const teamRolesForSelectedTeam = teamRoles.filter(role => role.team_id === selectedTeam?.team_id);

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Team Roles</CardTitle>
            <Button onClick={openCreateRoleModal}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamRolesForSelectedTeam.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Responsibilities</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamRolesForSelectedTeam.map((role) => (
                  <TableRow key={role.role_id}>
                    <TableCell className="font-medium">{role.title}</TableCell>
                    <TableCell>{role.responsibilities || 'No responsibilities specified'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignRoleModal(role)}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditRoleModal(role)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteRole(role.role_id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">No roles yet</h3>
              <p className="text-muted-foreground mb-4">
                Create roles to organize your team members and assign responsibilities.
              </p>
              <Button onClick={openCreateRoleModal}>
                Create Your First Role
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Team Detail View
  const TeamDetailView = () => {
    if (!selectedTeam) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Button
                  variant="ghost"
                  onClick={closeTeamDetails}
                  className="mb-4 pl-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Teams
                </Button>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{selectedTeam.name}</CardTitle>
                  <Badge variant="secondary">
                    {selectedTeam.member_count || 0} members
                  </Badge>
                </div>
              </div>

              <Button onClick={() => openEditModal(selectedTeam)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Team
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{selectedTeam.description || 'No description provided.'}</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meeting Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTeam.meeting_schedule ? (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{selectedTeam.meeting_schedule}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No meeting schedule set.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">Team Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Team ID</Label>
                  <p className="font-medium">{selectedTeam.team_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ministry</Label>
                  <p className="font-medium">{currentMinistry?.name || 'Unknown Ministry'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TeamRolesSection />
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Ministry Header */}
      {currentMinistry && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-700 border-0 text-white mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{currentMinistry.name}</CardTitle>
            <CardDescription className="text-blue-100">{currentMinistry.description}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Ministry Teams</h2>
        <Button onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Team
        </Button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.team_id} team={team} />
          ))}
        </div>
      ) : (
        <TeamDetailView />
      )}

      {teams.length === 0 && viewMode === 'grid' && (
        <Card className="text-center py-12">
          <CardContent>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first team for {currentMinistry?.name || 'this ministry'}.
            </p>
            <Button onClick={openCreateModal}>
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Team Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
            <DialogDescription>
              for {currentMinistry?.name || 'Ministry'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('ministry_id')} value={currentMinistry?.ministry_id || 0} />

            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Team name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this team do?"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_schedule">Meeting Schedule</Label>
              <Input
                id="meeting_schedule"
                placeholder="e.g., Every Tuesday at 7:00 PM"
                {...register('meeting_schedule')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTeam ? 'Update Team' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              for {selectedTeam?.name || 'Team'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRole(onSubmitRole)} className="space-y-4">
            <input type="hidden" {...registerRole('team_id')} value={selectedTeam?.team_id || 0} />

            <div className="space-y-2">
              <Label htmlFor="title">Role Title *</Label>
              <Input
                id="title"
                {...registerRole('title', { required: 'Role title is required' })}
              />
              {roleErrors.title && (
                <p className="text-sm text-destructive">{roleErrors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                placeholder="What are the responsibilities of this role?"
                {...registerRole('responsibilities')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeRoleModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Role Modal */}
      <Dialog open={isAssignRoleModalOpen} onOpenChange={setIsAssignRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign {selectedRole?.title} to a member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member">Select Member</Label>
              <Select onValueChange={(value) => setSelectedMember(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.member_id} value={member.member_id.toString()}>
                      {member.first_name} {member.last_name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAssignRoleModal}>
                Cancel
              </Button>
              <Button onClick={onAssignRole} disabled={!selectedMember}>
                Assign Role
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete Team
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}