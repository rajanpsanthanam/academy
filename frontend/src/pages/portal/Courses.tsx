import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { apiService } from '@/lib/services/apiService';
import { Course } from '@/lib/types/course';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronRight, Tag, CheckCircle, UserPlus, UserMinus, RotateCcw, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { AssessmentSubmission } from '@/components/assessment/AssessmentSubmission';

interface CoursesProps {
  filter?: 'PUBLISHED' | 'DRAFT' | 'COMPLETED';
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    try {
      console.error(error);
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ContentWrapper>
          <Alert variant="destructive">
            <AlertDescription>
              An error occurred: {this.state.error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        </ContentWrapper>
      );
    }

    return this.props.children;
  }
}

// Wrap the main component
export default function CoursesWrapper(props: CoursesProps) {
  return (
    <ErrorBoundary>
      <Courses {...props} />
    </ErrorBoundary>
  );
}

// Main component
function Courses({ filter }: CoursesProps) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState<{ [key: string]: boolean }>({});
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const statusVariants = {
    ENROLLED: "default",
    COMPLETED: "success",
    DROPPED: "destructive"
  } as const;

  // Calculate course statistics exactly like the minified code
  const courseStats = React.useMemo(() => {
    const t = Array.isArray(courses) ? courses : [];
    return {
      total: t.length,
      enrolled: t.filter(o => o?.enrollment?.status === "ENROLLED").length,
      dropped: t.filter(o => o?.enrollment?.status === "DROPPED").length,
      completed: t.filter(o => o?.enrollment?.status === "COMPLETED").length
    };
  }, [courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.courses.list({
        page,
        page_size: pageSize,
        status: filter
      });
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from server');
      }

      if (!('results' in response)) {
        throw new Error('Response missing results property');
      }

      const results = Array.isArray(response.results) ? response.results : [];
      const count = typeof response.count === 'number' ? response.count : 0;
      
      setCourses(results);
      setTotalCount(count);
      setHasNextPage(!!response.next);
      setHasPreviousPage(!!response.previous);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(errorMessage);
      setCourses([]);
      setTotalCount(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, pageSize, filter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEnroll = async (courseId: string) => {
    try {
      setIsEnrolling(prev => ({ ...prev, [courseId]: true }));
      await apiService.courses.enroll(courseId);
      await fetchCourses();
      toast.success("Successfully enrolled in the course!");
    } catch (err) {
      console.error('Error enrolling:', err);
      toast.error("Failed to enroll in the course. Please try again.");
    } finally {
      setIsEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleUnenroll = async (courseId: string) => {
    try {
      setIsEnrolling(prev => ({ ...prev, [courseId]: true }));
      await apiService.courses.unenroll(courseId);
      await fetchCourses();
      toast.success("Successfully dropped out of the course!");
    } catch (err) {
      console.error('Error dropping out:', err);
      toast.error("Failed to drop out of the course. Please try again.");
    } finally {
      setIsEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleMarkComplete = async (courseId: string) => {
    try {
      setIsEnrolling(prev => ({ ...prev, [courseId]: true }));
      await apiService.courses.complete(courseId, { user_id: 'current' });
      await fetchCourses();
      toast.success("Course marked as complete!");
    } catch (err: any) {
      console.error('Error marking complete:', err);
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to mark course as complete. Please try again.");
      }
    } finally {
      setIsEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleLessonClick = (courseId: string, moduleId: string, lessonId: string) => {
    navigate(`/portal/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
  };

  const getDefaultTab = () => {
    if (location.pathname.includes('/enrolled')) return 'enrolled';
    if (location.pathname.includes('/dropped')) return 'dropped';
    if (location.pathname.includes('/completed')) return 'completed';
    return 'all';
  };

  const getFilteredCourses = (status?: string) => {
    if (!Array.isArray(courses)) {
      return [];
    }
    
    if (!status) {
      return courses;
    }
    
    return courses.filter(course => {
      var s;
      return ((s = course.enrollment) == null ? void 0 : s.status) === status;
    });
  };

  const renderEnrollmentStatus = (course: Course) => {
    if (!course.enrollment) {
      return (
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEnroll(course.id)}
                  disabled={isEnrolling[course.id]}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enroll in course</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    if (course.enrollment.status === 'DROPPED') {
      return (
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEnroll(course.id)}
                  disabled={isEnrolling[course.id]}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Re-enroll in course</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        {course.enrollment.status === 'ENROLLED' && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMarkComplete(course.id)}
                    disabled={isEnrolling[course.id]}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark course as complete</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isEnrolling[course.id]}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Drop out of course</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Drop out of course?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to drop out of this course? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleUnenroll(course.id)}>
                    Drop Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    );
  };

  const renderModulesList = (course: Course) => {
    if (!course.enrollment) {
      return (
        <div className="text-sm text-muted-foreground text-center py-4">
          Enroll in this course to access {course.modules?.length || 0} modules
          {course.assessments && course.assessments.length > 0 && (
            <span> and {course.assessments.length} assessment{course.assessments.length > 1 ? 's' : ''}</span>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Modules Section */}
        <Accordion type="single" collapsible className="w-full space-y-3">
          {(course.modules || []).map((module) => (
            <AccordionItem key={module.id} value={module.id.toString()} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base font-medium">{module.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {module.lessons.length} lessons
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 p-2">
                  {module.lessons.map((lesson) => (
                    <Button
                      key={lesson.id}
                      variant="ghost"
                      className="w-full justify-start h-9 px-4"
                      onClick={() => handleLessonClick(course.id, module.id, lesson.id)}
                    >
                      <span className="text-sm">{lesson.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Assessments Section */}
        {course.assessments && course.assessments.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-2">Assessments</h3>
            <div className="space-y-4">
              {course.assessments.map((assessment) => (
                <AssessmentSubmission
                  key={assessment.id}
                  assessment={assessment}
                  onSubmissionComplete={() => {
                    // Refresh course data after submission
                    fetchCourses();
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCoursesList = (coursesToRender: Course[]) => {
    if (!Array.isArray(coursesToRender)) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No courses available
        </div>
      );
    }
    
    if (coursesToRender.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No courses found
        </div>
      );
    }
    
    return (
      <Accordion type="single" collapsible className="w-full space-y-2">
        {coursesToRender.map((course) => {
          if (!course?.id) return null;
          return (
            <AccordionItem key={course.id} value={course.id} className="border rounded-md overflow-hidden">
              <div className="flex items-center justify-between w-full px-3 py-2 bg-muted/50">
                <AccordionTrigger className="hover:no-underline flex-1 [&>svg]:hidden">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium text-foreground">{course.title}</span>
                    {course.enrollment && (
                      <Badge variant={statusVariants[course.enrollment.status]}>
                        {course.enrollment.status}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      {course.modules?.length || 0} modules
                    </span>
                    {course.assessments && course.assessments.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span className="text-xs">{course.assessments.length}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Course has {course.assessments.length} assessment{course.assessments.length > 1 ? 's' : ''}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </AccordionTrigger>
                <div className="ml-4">
                  {renderEnrollmentStatus(course)}
                </div>
              </div>
              <AccordionContent>
                <Card className="border-0 shadow-none">
                  <CardHeader className="pb-2">
                    <CardDescription>{course.description}</CardDescription>
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {course.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {renderModulesList(course)}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  return (
    <ContentWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Courses"
          description="Explore our collection of courses and start learning today"
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseStats.enrolled}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseStats.completed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dropped</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseStats.dropped}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue={getDefaultTab()} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Courses</TabsTrigger>
                <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="dropped">Dropped</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-6">
                {renderCoursesList(courses)}
              </TabsContent>
              <TabsContent value="enrolled" className="mt-6">
                {renderCoursesList(getFilteredCourses('ENROLLED'))}
              </TabsContent>
              <TabsContent value="completed" className="mt-6">
                {renderCoursesList(getFilteredCourses('COMPLETED'))}
              </TabsContent>
              <TabsContent value="dropped" className="mt-6">
                {renderCoursesList(getFilteredCourses('DROPPED'))}
              </TabsContent>
            </Tabs>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {courses.length} of {totalCount} courses
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!hasPreviousPage}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {Math.ceil(totalCount / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </ContentWrapper>
  );
} 