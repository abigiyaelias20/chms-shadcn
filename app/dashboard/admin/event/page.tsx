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
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { Controller } from 'react-hook-form';
import { Calendar, Clock, MapPin, Users, RefreshCw, Activity } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
      ministry_id: 1, // Placeholder; replace with valid ministry_id
      team_id: null,
      title: 'Song Night',
      description: 'Describe your event...',
      start_date: '2025-09-16',
      end_date: '2025-09-24',
      location: 'Enter event location',
      recurrence_pattern: 'none',
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
        axiosInstance.get('/ministry'),
        axiosInstance.get('/teams')
      ]);

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
        start_date: editingEvent.start_date.split('T')[0],
        end_date: editingEvent.end_date ? editingEvent.end_date.split('T')[0] : null,
        recurrence_pattern: editingEvent.recurrence_pattern || 'none'
      });
    } else {
      reset({
        ministry_id: 1,
        team_id: null,
        title: 'Song Night',
        description: 'Describe your event...',
        start_date: '2025-09-16',
        end_date: '2025-09-24',
        location: 'Enter event location',
        recurrence_pattern: 'none',
        status: 'Planned'
      });
    }
  }, [editingEvent, reset]);

  const onSubmit = async (data: Event) => {
    try {
      const submitData = {
        ...data,
        recurrence_pattern: data.recurrence_pattern === 'none' ? '' : data.recurrence_pattern
      };

      if (editingEvent) {
        const response = await axiosInstance.put(`/events/${editingEvent.event_id}`, submitData);
        const updatedEvent = response.data.data || response.data;
        setEvents(prev => prev.map(event =>
          event.event_id === editingEvent.event_id ? updatedEvent : event
        ));
        toast.success('Event updated successfully');
      } else {
        const response = await axiosInstance.post('/events', submitData);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Events
          </h1>
          <p className="text-muted-foreground mt-2">
            All events in ministries and teams
          </p>
        </div>
       
      </div>

      <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground/80 py-4">Event Details</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-4">Ministry</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-4">Date & Time</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-4">Location</TableHead>
                <TableHead className="font-semibold text-foreground/80 py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length > 0 ? (
                events.map((event) => (
                  <TableRow
                    key={event.event_id}
                    className="border-b border-muted/20 hover:bg-muted/10 transition-colors duration-200"
                  >
                    <TableCell>
                      <div className="font-semibold text-foreground">{event.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {event.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{event.ministry_name}</span>
                      </div>
                      {event.team_name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Team: {event.team_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(event.start_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{event.location || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(event.status)}
                        className="rounded-full px-3 py-1 font-medium"
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                   
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground font-medium">No events found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create your first event to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-0">
          <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {editingEvent ? 'Update your event details' : 'Fill in the details to create a new event'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold text-sm">Event Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    className="w-full border-muted-foreground/20 focus:border-primary transition-colors h-11"
                    placeholder="Enter event title"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-semibold text-sm">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    className="w-full border-muted-foreground/20 focus:border-primary transition-colors resize-none"
                    placeholder="Describe your event..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ministry_id" className="font-semibold text-sm">Ministry *</Label>
                  <Controller
                    name="ministry_id"
                    control={control}
                    rules={{ required: 'Ministry is required' }}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger className="w-full border-muted-foreground/20 focus:border-primary transition-colors h-11">
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
                    <p className="text-sm text-destructive mt-1">{errors.ministry_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team_id" className="font-semibold text-sm">Team</Label>
                  <Controller
                    name="team_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value === null ? "null" : field.value?.toString()}
                        onValueChange={(value) => field.onChange(value === "null" ? null : Number(value))}
                        disabled={!selectedMinistryId || selectedMinistryId === 0}
                      >
                        <SelectTrigger className="w-full border-muted-foreground/20 focus:border-primary transition-colors h-11">
                          <SelectValue placeholder="Select Team (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">No Team</SelectItem>
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
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="font-semibold text-sm">Start Date *</Label>
                    <Controller
                      name="start_date"
                      control={control}
                      rules={{ required: 'Start date is required' }}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value ? new Date(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          dateFormat="yyyy-MM-dd"
                          className="w-full border-muted-foreground/20 focus:border-primary transition-colors h-11 rounded-md px-3"
                          placeholderText="Select start date"
                          showPopperArrow={false}
                          wrapperClassName="w-full"
                        />
                      )}
                    />
                    {errors.start_date && (
                      <p className="text-sm text-destructive mt-1">{errors.start_date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="font-semibold text-sm">End Date</Label>
                    <Controller
                      name="end_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value ? new Date(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          dateFormat="yyyy-MM-dd"
                          className="w-full border-muted-foreground/20 focus:border-primary transition-colors h-11 rounded-md px-3"
                          placeholderText="Select end date"
                          showPopperArrow={false}
                          wrapperClassName="w-full"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="font-semibold text-sm">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    {...register('location')}
                    className="w-full border-muted-foreground/20 focus:border-primary transition-colors h-11"
                    placeholder="Enter event location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrence_pattern" className="font-semibold text-sm">Recurrence Pattern</Label>
                  <Controller
                    name="recurrence_pattern"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full border-muted-foreground/20 focus:border-primary transition-colors h-11">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" />
                            <SelectValue placeholder="None" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
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
                  <Label htmlFor="status" className="font-semibold text-sm">Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full border-muted-foreground/20 focus:border-primary transition-colors h-11">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <SelectValue placeholder="Select Status" />
                          </div>
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
              </div>
            </div>

            <DialogFooter className="border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className="border-muted-foreground/20 hover:bg-muted/10 transition-colors h-11 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl h-11 px-8"
              >
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}