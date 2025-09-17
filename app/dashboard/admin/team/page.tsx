'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axiosInstance from '@/lib/axiosInstance';

// Type definitions
interface Ministry {
  ministry_id: number;
  name: string;
}

interface MinistryTeam {
  team_id: number;
  ministry_id: number;
  ministry_name?: string;
  name: string;
  description?: string;
  meeting_schedule?: string;
}

export default function MinistryTeamCRUDPage() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <MinistryTeamCRUD />
      </SidebarInset>
    </SidebarProvider>
  );
}

function MinistryTeamCRUD() {
  const [teams, setTeams] = useState<MinistryTeam[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<MinistryTeam | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [filterMinistry, setFilterMinistry] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all teams and ministries on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch teams
        const teamsResponse = await axiosInstance.get('/ministry-teams');
        setTeams(teamsResponse.data);

        // Fetch ministries (assuming an endpoint exists; adjust if necessary)
        // Note: Since ministries aren't provided in the backend, this is a placeholder
        // You may need to add a backend endpoint for ministries or fetch them differently
        const mockMinistries: Ministry[] = [
          { ministry_id: 1, name: 'Worship Ministry' },
          { ministry_id: 2, name: 'Youth Ministry' },
          { ministry_id: 3, name: 'Outreach Program' },
          { ministry_id: 4, name: 'Prayer Ministry' },
        ];
        setMinistries(mockMinistries);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load teams. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch team by ID when selectedTeam changes
  const viewTeamDetails = async (team: MinistryTeam) => {
    try {
      const response = await axiosInstance.get(`/ministry-teams/${team.team_id}`);
      setSelectedTeam(response.data);
      setViewMode('detail');
    } catch (err: any) {
      console.error('Error fetching team:', err);
      setError('Failed to load team details.');
    }
  };

  const closeTeamDetails = () => {
    setSelectedTeam(null);
    setViewMode('grid');
  };

  // Filter teams based on selected ministry
  const filteredTeams = teams.filter((team) =>
    filterMinistry === 'all' || team.ministry_id.toString() === filterMinistry
  );

  const getMinistryName = (ministryId: number) => {
    const ministry = ministries.find((m) => m.ministry_id === ministryId);
    return ministry ? ministry.name : team.ministry_name || 'Unknown Ministry';
  };

  const getMinistryVariant = (ministryId: number) => {
    const variants = ['default', 'secondary', 'outline', 'destructive'] as const;
    return variants[ministryId % variants.length];
  };

  // Team Card Component
  const TeamCard = ({ team }: { team: MinistryTeam }) => (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={() => viewTeamDetails(team)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{team.name}</CardTitle>
          <Badge variant={getMinistryVariant(team.ministry_id)}>
            {getMinistryName(team.ministry_id)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 mb-4">{team.description}</p>
        {team.meeting_schedule && (
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{team.meeting_schedule}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Team Detail View
  const TeamDetailView = () => {
    if (!selectedTeam) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Button variant="ghost" onClick={closeTeamDetails} className="mb-4 pl-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Teams
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{selectedTeam.name}</CardTitle>
                <Badge variant={getMinistryVariant(selectedTeam.ministry_id)}>
                  {getMinistryName(selectedTeam.ministry_id)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">
                {selectedTeam.description || 'No description provided.'}
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meeting Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTeam.meeting_schedule ? (
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
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
                <Label className="text-muted-foreground">Ministry ID</Label>
                <p className="font-medium">{selectedTeam.ministry_id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ministry Teams</h1>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-ministry">Ministry</Label>
              <Select value={filterMinistry} onValueChange={setFilterMinistry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Ministries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ministries</SelectItem>
                  {ministries.map((ministry) => (
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

      {loading ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">Loading teams...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard key={team.team_id} team={team} />
          ))}
        </div>
      ) : (
        <TeamDetailView />
      )}

      {filteredTeams.length === 0 && viewMode === 'grid' && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-muted-foreground mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2">No teams found</h3>
            <p className="text-muted-foreground">
              {filterMinistry === 'all'
                ? 'No ministry teams available.'
                : 'No teams found for the selected ministry.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}