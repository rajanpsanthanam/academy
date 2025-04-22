import { useEffect, useState } from 'react';
import { apiService } from '@/lib/services/apiService';
import { Course } from '@/lib/types/course';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CourseListProps {
  filter?: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
}

export function CourseList({ filter }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesData = await apiService.courses.list();
        const filteredCourses = filter ? coursesData.filter((course: Course) => course.status === filter) : coursesData;
        setCourses(filteredCourses);
        setError(null);
      } catch (err) {
        setError('Failed to fetch courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [filter]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{course.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{course.description}</p>
              </div>
              <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {course.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={`/courses/${course.id}`}>View Course</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 