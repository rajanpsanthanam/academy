import { useEffect, useState } from 'react';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiService } from '@/lib/services/apiService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Download, Check, ChevronDown, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/lib/types/course';

interface FileSubmission {
  id: string;
  assessment: string;
  user: number;
  user_email: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_url: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

interface CourseWithSubmissions {
  id: string;
  title: string;
  submissions: FileSubmission[];
  expanded: boolean;
  user: {
    id: number;
    email: string;
  };
}

export default function CourseSubmissions() {
  const [courses, setCourses] = useState<CourseWithSubmissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // Get all courses
      const coursesList = await apiService.courses.list();
      const coursesWithSubmissions: CourseWithSubmissions[] = [];

      // For each course, get its assessments and their submissions
      for (const course of coursesList) {
        if (course.assessments) {
          const courseSubmissions: FileSubmission[] = [];
          for (const assessment of course.assessments) {
            if (assessment.assessment_type === 'FILE_SUBMISSION') {
              const submissionsResponse = await apiService.assessments.getSubmission(assessment.id);
              courseSubmissions.push(...submissionsResponse);
            }
          }
          
          // Only add courses that have submissions
          if (courseSubmissions.length > 0) {
            // Group submissions by user
            const userSubmissions = courseSubmissions.reduce((acc, submission) => {
              const userId = submission.user;
              if (!acc[userId]) {
                acc[userId] = {
                  user: {
                    id: userId,
                    email: submission.user_email
                  },
                  submissions: []
                };
              }
              acc[userId].submissions.push(submission);
              return acc;
            }, {} as Record<number, { user: { id: number; email: string }; submissions: FileSubmission[] }>);

            // Create a course entry for each user
            const enrollmentChecks = await Promise.all(
              Object.values(userSubmissions).map(async ({ user, submissions }) => {
                if (user.id) {
                  try {
                    // Check if the course is completed for this user
                    const enrollment = await apiService.courses.getEnrollment(course.id, user.id);
                    if (enrollment && enrollment.status !== 'COMPLETED') {
                      return {
                        id: course.id,
                        title: course.title,
                        submissions,
                        expanded: false,
                        user
                      };
                    }
                  } catch (err) {
                    console.error(`Failed to check enrollment for user ${user.id} in course ${course.id}:`, err);
                  }
                }
                return null;
              })
            );

            // Filter out null values and add valid courses
            const validCourses = enrollmentChecks.filter((course): course is CourseWithSubmissions => course !== null);
            coursesWithSubmissions.push(...validCourses);
          }
        }
      }
      setCourses(coursesWithSubmissions);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
      setError('Failed to fetch submissions');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (!fileUrl) {
      toast.error('File URL is not available');
      return;
    }
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleComplete = async (courseId: string, userId: string) => {
    try {
      if (!userId) {
        toast.error('User ID is missing');
        return;
      }

      console.log('Marking course as complete:', { courseId, userId });
      setProcessing(prev => ({ ...prev, [courseId]: true }));
      
      // Log the request details
      console.log('Making API request to:', `/courses/${courseId}/admin_complete/`);
      const payload = { user_id: userId };
      console.log('Request payload:', JSON.stringify(payload, null, 2));
      
      await apiService.courses.complete(courseId, payload);
      console.log('Course marked as complete successfully');
      
      toast.success('Course marked as complete');
      await fetchSubmissions(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to mark course as complete:', err);
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data,
          url: err.config?.url,
          requestData: err.config?.data
        });
      }
      toast.error(err.response?.data?.error?.message || 'Failed to mark course as complete');
    } finally {
      setProcessing(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const toggleCourseExpansion = (courseId: string) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, expanded: !course.expanded }
        : course
    ));
  };

  if (loading) {
    return (
      <ContentWrapper>
        <div className="space-y-6">
          <PageHeader
            title="Course Submissions"
            description="Review and manage course file submissions"
          />
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  if (error) {
    return (
      <ContentWrapper>
        <div className="space-y-6">
          <PageHeader
            title="Course Submissions"
            description="Review and manage course file submissions"
          />
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Course Submissions"
          description="Review and manage course file submissions"
        />

        {courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending course submissions found
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <>
                    <TableRow key={`${course.id}-${course.user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleCourseExpansion(course.id)}
                          >
                            {course.expanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          {course.title}
                        </div>
                      </TableCell>
                      <TableCell>{course.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {course.submissions.length} submission{course.submissions.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={processing[course.id]}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Mark Complete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark Course as Complete</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark this course as complete for {course.user.email}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleComplete(course.id, course.user.id.toString())}
                              >
                                Mark Complete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                    {course.expanded && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <div className="pl-8">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>File</TableHead>
                                  <TableHead>Submitted At</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {course.submissions.map((submission) => (
                                  <TableRow key={submission.id}>
                                    <TableCell>{submission.file_name}</TableCell>
                                    <TableCell>{format(new Date(submission.submitted_at), 'PPpp')}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDownload(submission.file_url, submission.file_name)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </ContentWrapper>
  );
} 