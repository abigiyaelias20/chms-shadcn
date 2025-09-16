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
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import  axiosInstance  from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { Controller } from 'react-hook-form';

interface Event {
  event_id?: number;
  ministry_id: number;
  team_id?: number | null;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  location?: string;
  recurrence_pattern?: string;
  status: 'Planned' | 'Active' | 'Cancelled' | 'Completed';
  ministry_name?: string;
  team_name?: string;
}

interface Ministry {
  ministry_id: number;
  name: string;
}

interface Team {
  team_id: number;
  name: string;
  ministry_id: number;
}

export default function EventsPage() {
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
        <EventsManagement />
      </SidebarInset>
    </SidebarProvider>
  );
}

function EventsManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<Event>({
    defaultValues: {
      ministry_id: 0,
      team_id: null,
      title: '',
      description: '',
      start_date: '',
      end_date: null,
      location: '',
      recurrence_pattern: '',
      status: 'Planned'
    }
  });

  const selectedMinistryId = watch('ministry_id');

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsResponse, ministriesResponse, teamsResponse] = await Promise.all([
        axiosInstance.get('/events'),
        axiosInstance.get('/ministry'), // Assuming you have a ministries endpoint
        axiosInstance.get('/teams') // Assuming you have a teams endpoint
      ]);

      // Handle API response structure
      const eventsData = Array.isArray(eventsResponse.data) 
        ? eventsResponse.data 
        : eventsResponse.data?.data || [];
      setEvents(eventsData);

      const ministriesData = Array.isArray(ministriesResponse.data)
        ? ministriesResponse.data
        : ministriesResponse.data?.data || [];
      setMinistries(ministriesData);

      const teamsData = Array.isArray(teamsResponse.data)
        ? teamsResponse.data
        : teamsResponse.data?.data || [];
      setTeams(teamsData);

      toast.success('Data loaded successfully');
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when editing event changes
  useEffect(() => {
    if (editingEvent) {
      reset({
        ...editingEvent,
        start_date: editingEvent.start_date.split('T')[0] + 'T' + editingEvent.start_date.split('T')[1]?.substring(0, 5),
        end_date: editingEvent.end_date ? editingEvent.end_date.split('T')[0] + 'T' + editingEvent.end_date.split('T')[1]?.substring(0, 5) : null
      });
    } else {
      reset({
        ministry_id: 0,
        team_id: null,
        title: '',
        description: '',
        start_date: '',
        end_date: null,
        location: '',
        recurrence_pattern: '',
        status: 'Planned'
      });
    }
  }, [editingEvent, reset]);

  const onSubmit = async (data: Event) => {
    try {
      if (editingEvent) {
        // Update existing event
        const response = await axiosInstance.put(`/events/${editingEvent.event_id}`, data);
        const updatedEvent = response.data.data || response.data;
        setEvents(prev => prev.map(event => 
          event.event_id === editingEvent.event_id ? updatedEvent : event
        ));
        toast.success('Event updated successfully');
      } else {
        // Create new event
        const response = await axiosInstance.post('/events', data);
        const newEvent = response.data.data || response.data;
        setEvents(prev => [...prev, newEvent]);
        toast.success('Event created successfully');
      }
      closeModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${editingEvent ? 'update' : 'create'} event`;
      toast.error(errorMessage);
      console.error('Error saving event:', error);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await axiosInstance.delete(`/events/${id}`);
      setEvents(prev => prev.filter(event => event.event_id !== id));
      toast.success('Event deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete event';
      toast.error(errorMessage);
      console.error('Error deleting event:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTeamsByMinistry = (ministryId: number) => {
    return teams.filter(team => team.ministry_id === ministryId);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Planned': return 'secondary';
      case 'Cancelled': return 'destructive';
      case 'Completed': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading events data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          Create New Event
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Ministry</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length > 0 ? (
              events.map((event) => (
                <TableRow key={event.event_id}>
                  <TableCell>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {event.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.ministry_name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(event.start_date)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {event.location || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(event.status)}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" onClick={() => handleEdit(event)}>
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(event.event_id!)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No events found. Create your first event to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ministry_id">Ministry *</Label>
              <Controller
                name="ministry_id"
                control={control}
                rules={{ required: 'Ministry is required' }}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Ministry" />
                    </SelectTrigger>
                    <SelectContent>
                      {ministries.map(ministry => (
                        <SelectItem key={ministry.ministry_id} value={ministry.ministry_id.toString()}>
                          {ministry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ministry_id && (
                <p className="text-sm text-destructive">{errors.ministry_id.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team_id">Team</Label>
              <Controller
                name="team_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ''}
                    onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                    disabled={!selectedMinistryId || selectedMinistryId === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select Team (Optional)</SelectItem>
                      {getTeamsByMinistry(Number(selectedMinistryId)).map(team => (
                        <SelectItem key={team.team_id} value={team.team_id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                {...register('start_date', { required: 'Start date is required' })}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="datetime-local"
                {...register('end_date')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                {...register('location')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
              <Controller
                name="recurrence_pattern"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingEvent ? 'Update' : 'Create'} Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}