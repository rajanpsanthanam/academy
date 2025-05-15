import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Course } from "@/lib/types/course";
import { apiService } from "@/lib/services/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen, Tag } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;

      try {
        const courseData = await apiService.courses.get(courseId);
        setCourse(courseData);
      } catch (err) {
        setError("Failed to load course. Please try again later.");
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-96 w-full" />
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

  if (!course) {
    return <div className="text-center">Course not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { type: 'dashboard', onClick: () => navigate('/portal') },
          { type: 'course' }
        ]}
      />

      {/* Course Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{course.title}</h1>
          </div>
          <p className="text-muted-foreground">{course.description}</p>
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Course Modules */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Course Modules</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {course.modules.map((module) => (
              <AccordionItem key={module.id} value={module.id} className="border-none">
                <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium">{module.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="space-y-1.5 py-2">
                    {module.lessons.map((lesson) => (
                      <Button
                        key={lesson.id}
                        variant="ghost"
                        className="w-full justify-start h-9 px-4"
                        onClick={() =>
                          navigate(
                            `/portal/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`
                          )
                        }
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
        </div>

        {/* Course Assessments */}
        {course.assessments && course.assessments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Course Assessments</h2>
            <div className="grid gap-4">
              {course.assessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <CardTitle>{assessment.title}</CardTitle>
                    {assessment.description && (
                      <CardDescription>{assessment.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 