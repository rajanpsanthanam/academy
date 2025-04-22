import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService } from '@/lib/services/apiService';

interface Stats {
  overview: {
    total_courses: number;
    published_courses: number;
    draft_courses: number;
    total_enrollments: number;
    completed_enrollments: number;
    active_enrollments: number;
    total_users: number;
    active_users: number;
    completion_rate: number;
  };
  course_stats: Array<{
    course_id: string;
    title: string;
    status: string;
    total_enrollments: number;
    completed_enrollments: number;
    active_enrollments: number;
    completion_rate: number;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiService.stats.get();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <ContentWrapper>
        <div className="space-y-6">
          <PageHeader
            title="Admin Console"
            description="Welcome to the admin console. Here you can manage your organization's settings and users."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[50px]" />
                  <Skeleton className="h-4 w-[100px] mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Admin Console"
          description="Welcome to the admin console. Here you can manage your organization's settings and users."
        />
        
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.total_users}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.overview.active_users} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.total_courses}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.overview.published_courses} published, {stats?.overview.draft_courses} draft
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.total_enrollments}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.overview.active_enrollments} active, {stats?.overview.completed_enrollments} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.completion_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                of all enrollments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ContentWrapper>
  );
} 