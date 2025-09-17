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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Music, 
  Heart, 
  BookOpen,
  Sparkles,
  Loader2,
  Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";

// Type definitions
interface Ministry {
  ministry_id: number;
  name: string;
  type: string;
  description: string;
  member_count?: number;
}

export default function MinistryCRUDPage() {
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
        <MinistryCRUD />
      </SidebarInset>
    </SidebarProvider>
  );
}

function MinistryCRUD() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [filteredMinistries, setFilteredMinistries] = useState<Ministry[]>([]);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ministryToDelete, setMinistryToDelete] = useState<Ministry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<Ministry>({
    mode: 'onChange'
  });

  // Watch type for real-time validation feedback
  const ministryType = watch("type");

  // Fetch ministries
  useEffect(() => {
    fetchMinistries();
  }, []);

  // Filter ministries when search query or filter changes
  useEffect(() => {
    let result = ministries;
    
    if (searchQuery) {
      result = result.filter(ministry => 
        ministry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ministry.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== "all") {
      result = result.filter(ministry => ministry.type.toLowerCase() === filterType.toLowerCase());
    }
    
    setFilteredMinistries(result);
  }, [ministries, searchQuery, filterType]);

  const fetchMinistries = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/ministry");

      console.log("Fetched ministries:", res.data); 
      // Add mock member count for demonstration
      const ministriesWithMembers = (res.data || []).map((ministry: Ministry) => ({
        ...ministry,
        member_count: Math.floor(Math.random() * 100) + 10
      }));
      setMinistries(ministriesWithMembers);
      setFilteredMinistries(ministriesWithMembers);
    } catch (err) {
      console.error("Failed to fetch ministries:", err);
      toast.error("Failed to load ministries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (editingMinistry) {
      reset(editingMinistry);
    } else {
      reset({ ministry_id: 0, name: '', type: '', description: '' });
    }
  }, [editingMinistry, reset]);

  const onSubmit = async (data: Ministry) => {
    try {
      setIsSubmitting(true);
      if (editingMinistry) {
        await axiosInstance.put(`/ministry/${editingMinistry.ministry_id}`, data);
        toast.success("Ministry updated successfully");
      } else {
        await axiosInstance.post("/ministry", data);
        toast.success("Ministry created successfully");
      }
      fetchMinistries();
      setIsModalOpen(false);
      setEditingMinistry(null);
    } catch (err) {
      console.error("Error saving ministry:", err);
      toast.error("Failed to save ministry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!ministryToDelete) return;
    try {
      setIsSubmitting(true);
      await axiosInstance.delete(`/ministry/${ministryToDelete.ministry_id}`);
      toast.success("Ministry deleted successfully");
      fetchMinistries();
      setIsDeleteConfirmOpen(false);
      setMinistryToDelete(null);
    } catch (err) {
      console.error("Error deleting ministry:", err);
      toast.error("Failed to delete ministry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinistryTypeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'music': return 'secondary';
      case 'youth': return 'default';
      case 'community': return 'outline';
      case 'spiritual': return 'destructive';
      case 'education': return 'default';
      default: return 'outline';
    }
  };

  const getMinistryIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'music': return <Music className="h-4 w-4" />;
      case 'youth': return <Sparkles className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      case 'spiritual': return <Heart className="h-4 w-4" />;
      case 'education': return <BookOpen className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const MinistryTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-gray-50 transition-colors duration-200">
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead className="text-right"><Skeleton className="h-4 w-12" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16 rounded" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded" /></TableCell>
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
            Ministry Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and organize church ministries to grow your community
          </p>
        </div>
        <Button 
          onClick={() => { setEditingMinistry(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <Plus className="h-4 w-4" />
          Create New Ministry
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-8 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search ministries by name or description..."
                className="pl-10 border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Youth">Youth</SelectItem>
                  <SelectItem value="Community">Community</SelectItem>
                  <SelectItem value="Spiritual">Spiritual</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Ministries</p>
              <p className="text-2xl font-bold">{ministries.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-200">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Worship Ministries</p>
              <p className="text-2xl font-bold">{ministries.filter(m => m.type === 'Music').length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-200">
              <Music className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Pastoral Ministries</p>
              <p className="text-2xl font-bold">{ministries.filter(m => m.type === 'Spiritual').length}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-200">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Youth Ministries</p>
                            <p className="text-2xl font-bold">{ministries.filter(m => m.type === 'Youth').length}</p>

            </div>
            <div className="p-3 rounded-full bg-amber-200">
              <Heart className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ministries Table */}
      <Card className="shadow-lg border-none bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Ministries List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <MinistryTableSkeleton />
          ) : filteredMinistries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-gray-50 transition-colors duration-200">
                  <TableHead className="text-gray-700 font-medium">Name</TableHead>
                  <TableHead className="text-gray-700 font-medium">Type</TableHead>
                  <TableHead className="text-gray-700 font-medium">Description</TableHead>
                  <TableHead className="text-gray-700 font-medium">Members</TableHead>
                  <TableHead className="text-right text-gray-700 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMinistries.map((ministry) => (
                  <TableRow 
                    key={ministry.ministry_id} 
                    className="hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <TableCell className="font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          {getMinistryIcon(ministry.type)}
                        </div>
                        {ministry.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getMinistryTypeVariant(ministry.type)}
                        className="transition-colors duration-200 flex items-center gap-1"
                      >
                        {getMinistryIcon(ministry.type)}
                        {ministry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <div className="line-clamp-2">{ministry.description}</div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {/* {ministry.member_count || 0} */}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity rounded-full hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMinistry(ministry);
                              setIsDetailModalOpen(true);
                            }}
                            className="flex items-center gap-2 cursor-pointer focus:bg-blue-50"
                          >
                            <Info className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMinistry(ministry);
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-2 cursor-pointer focus:bg-green-50"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setMinistryToDelete(ministry);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="flex items-center gap-2 text-destructive focus:text-destructive focus:bg-red-50"
                          >
                            Delete
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
                <CardTitle className="text-xl mb-2 text-gray-500">No ministries found</CardTitle>
                <CardDescription className="mb-6 text-gray-400">
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first ministry"
                  }
                </CardDescription>
                <Button 
                  onClick={() => { 
                    setSearchQuery(""); 
                    setFilterType("all");
                    setEditingMinistry(null); 
                    setIsModalOpen(true); 
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Ministry
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
              {editingMinistry ? <Users className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingMinistry ? "Edit Ministry" : "Create New Ministry"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingMinistry 
                ? "Update the details of your ministry below." 
                : "Add a new ministry to your church community."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1 text-gray-700">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="name"
                {...register("name", { required: "Ministry name is required" })} 
                className={`transition-all duration-200 ${errors.name ? "border-destructive focus-visible:ring-destructive" : "border-gray-300 focus:ring-2 focus:ring-blue-500"}`}
                placeholder="e.g. Youth Worship Band"
              />
              {errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="text-xs">!</span>
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-1 text-gray-700">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                defaultValue={editingMinistry?.type || ""}
                onValueChange={(val) => setValue("type", val)}
              >
                <SelectTrigger 
                  id="type"
                  className={`transition-all duration-200 ${errors.type ? "border-destructive focus:ring-destructive" : "border-gray-300 focus:ring-2 focus:ring-blue-500"}`}
                >
                  <SelectValue placeholder="Select ministry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Youth">Youth</SelectItem>
                  <SelectItem value="Community">Community</SelectItem>
                  <SelectItem value="Spiritual">Spiritual</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="text-xs">!</span>
                  Ministry type is required
                </p>
              )}
              {ministryType && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Preview:</span>
                  <Badge variant={getMinistryTypeVariant(ministryType)} className="flex items-center gap-1">
                    {getMinistryIcon(ministryType)}
                    {ministryType}
                  </Badge>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">Description</Label>
              <Textarea 
                id="description"
                rows={4} 
                {...register("description")} 
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                placeholder="Describe the purpose and activities of this ministry..."
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="border-gray-300 hover:bg-gray-100 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 min-w-24"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Processing..." : (editingMinistry ? "Update" : "Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Ministry Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Detailed information about {selectedMinistry?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedMinistry && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Name</Label>
                <p className="text-gray-900 font-semibold">{selectedMinistry.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Type</Label>
                <Badge variant={getMinistryTypeVariant(selectedMinistry.type)} className="flex items-center gap-1 w-fit">
                  {getMinistryIcon(selectedMinistry.type)}
                  {selectedMinistry.type}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Description</Label>
                <p className="text-gray-600">{selectedMinistry.description || "No description provided."}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Members</Label>
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="h-4 w-4" />
                  {selectedMinistry.member_count || 0} members
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailModalOpen(false)}
              className="border-gray-300 hover:bg-gray-100 transition-colors duration-200"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive flex items-center gap-2">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete the ministry <span className="font-semibold text-foreground">"{ministryToDelete?.name}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isSubmitting}
              className="border-gray-300 hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center gap-2 min-w-24"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}