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
import { BookOpen, ChevronRight, Tag, CheckCircle, UserPlus, UserMinus, RotateCcw } from 'lucide-react';
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

interface CoursesProps {
  filter?: 'PUBLISHED' | 'DRAFT' | 'COMPLETED';
}

export default function Courses({ filter }: CoursesProps) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState<{ [key: string]: boolean }>({});
  const location = useLocation();

  const statusVariants = {
    ENROLLED: "default",
    COMPLETED: "success",
    DROPPED: "destructive"
  } as const;

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await apiService.courses.list();
      console.log('API Response:', coursesData);
      setCourses(coursesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

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
      await apiService.courses.complete(courseId);
      await fetchCourses();
      toast.success("Course marked as complete!");
    } catch (err) {
      console.error('Error marking complete:', err);
      toast.error("Failed to mark course as complete. Please try again.");
    } finally {
      setIsEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/portal/courses/${courseId}`);
  };

  const handleModuleClick = (courseId: string, moduleId: string) => {
    navigate(`/portal/courses/${courseId}/modules/${moduleId}`);
  };

  const handleLessonClick = (courseId: string, moduleId: string, lessonId: string) => {
    navigate(`/portal/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
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
        </div>
      );
    }

    return (
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
    );
  };

  const renderCoursesList = (courses: Course[]) => {
    console.log('Rendering courses:', courses);
    if (!courses || courses.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No courses found
        </div>
      );
    }
    
    return (
      <Accordion type="single" collapsible className="w-full space-y-2">
        {courses.map((course) => (
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
        ))}
      </Accordion>
    );
  };

  const getDefaultTab = () => {
    if (location.pathname.includes('/enrolled')) return 'enrolled';
    if (location.pathname.includes('/dropped')) return 'dropped';
    if (location.pathname.includes('/completed')) return 'completed';
    return 'all';
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
          <Tabs defaultValue={getDefaultTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Courses</TabsTrigger>
              <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="dropped">Dropped</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              {renderCoursesList(courses || [])}
            </TabsContent>
            <TabsContent value="enrolled" className="mt-6">
              {renderCoursesList((courses || []).filter(course => course.enrollment?.status === 'ENROLLED'))}
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              {renderCoursesList((courses || []).filter(course => course.enrollment?.status === 'COMPLETED'))}
            </TabsContent>
            <TabsContent value="dropped" className="mt-6">
              {renderCoursesList((courses || []).filter(course => course.enrollment?.status === 'DROPPED'))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ContentWrapper>
  );
} 