import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Course, Module, Lesson } from "@/lib/types/course";
import { apiService } from "@/lib/services/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { AxiosError } from "axios";
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export function LessonDetail() {
  const { courseId, moduleId, lessonId } = useParams<{ courseId: string; moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!courseId || !moduleId || !lessonId) {
        setError("Missing required parameters");
        setLoading(false);
        return;
      }

      try {
        // First fetch the lesson directly
        const lessonData = await apiService.courses.lessons.get(courseId, moduleId, lessonId);
        setLesson(lessonData);

        // Then fetch the module to get its details
        const moduleData = await apiService.courses.modules.get(courseId, moduleId);
        setModule(moduleData);

        // Finally fetch the course for navigation
        const courseData = await apiService.courses.get(courseId);
        setCourse(courseData);

        setError(null);
      } catch (err) {
        console.error("Error fetching lesson:", err);
        const error = err as AxiosError;
        if (error.response?.status === 404) {
          setError("Lesson not found. It may have been deleted or moved.");
        } else if (error.response?.status === 403) {
          setError("You don't have permission to access this lesson.");
        } else {
          setError("Failed to load lesson. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [courseId, moduleId, lessonId]);

  const handlePreviousLesson = () => {
    if (!course || !module || !lesson) return;

    const currentModuleIndex = course.modules.findIndex(m => m.id === module.id);
    const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);

    if (currentLessonIndex > 0) {
      // If not the first lesson in module, go to previous lesson
      const prevLesson = module.lessons[currentLessonIndex - 1];
      navigate(`/portal/courses/${courseId}/modules/${moduleId}/lessons/${prevLesson.id}`);
    } else if (currentModuleIndex > 0) {
      // If first lesson but not first module, go to last lesson of previous module
      const prevModule = course.modules[currentModuleIndex - 1];
      const lastLesson = prevModule.lessons[prevModule.lessons.length - 1];
      navigate(`/portal/courses/${courseId}/modules/${prevModule.id}/lessons/${lastLesson.id}`);
    }
  };

  const handleNext = () => {
    if (!course || !module || !lesson) return;

    const currentModuleIndex = course.modules.findIndex(m => m.id === module.id);
    const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);

    if (currentLessonIndex < module.lessons.length - 1) {
      // If not the last lesson in module, go to next lesson
      const nextLesson = module.lessons[currentLessonIndex + 1];
      navigate(`/portal/courses/${courseId}/modules/${moduleId}/lessons/${nextLesson.id}`);
    } else if (currentModuleIndex < course.modules.length - 1) {
      // If last lesson but not last module, go to first lesson of next module
      const nextModule = course.modules[currentModuleIndex + 1];
      const firstLesson = nextModule.lessons[0];
      navigate(`/portal/courses/${courseId}/modules/${nextModule.id}/lessons/${firstLesson.id}`);
    }
  };

  const navigateToNextLesson = () => {
    if (!course || !module || !lesson) return;

    const currentModuleIndex = course.modules.findIndex(m => m.id === module.id);
    const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);

    if (currentLessonIndex < module.lessons.length - 1) {
      // If not the last lesson in module, go to next lesson
      const nextLesson = module.lessons[currentLessonIndex + 1];
      navigate(`/portal/courses/${courseId}/modules/${moduleId}/lessons/${nextLesson.id}`);
    }
  };

  const navigateToPreviousLesson = () => {
    if (!course || !module || !lesson) return;

    const currentModuleIndex = course.modules.findIndex(m => m.id === module.id);
    const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);

    if (currentLessonIndex > 0) {
      // If not the first lesson in module, go to previous lesson
      const prevLesson = module.lessons[currentLessonIndex - 1];
      navigate(`/portal/courses/${courseId}/modules/${moduleId}/lessons/${prevLesson.id}`);
    }
  };

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

  if (!lesson || !module || !course) {
    return <div className="text-center">Lesson not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { type: 'dashboard', onClick: () => navigate('/portal') },
          { type: 'course', onClick: () => navigate(`/portal/courses/${courseId}`) },
          { type: 'module', onClick: () => navigate(`/portal/courses/${courseId}/modules/${moduleId}`) },
          { type: 'lesson' }
        ]}
      />

      {/* Lesson Content */}
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6">
          <MarkdownRenderer content={lesson.content} />
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePreviousLesson}
            disabled={
              module.lessons.findIndex(l => l.id === lesson.id) === 0 &&
              course.modules.findIndex(m => m.id === module.id) === 0
            }
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Lesson
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={
              !course || !module || !lesson ||
              (module.lessons.findIndex(l => l.id === lesson.id) === module.lessons.length - 1 &&
               (course.modules.findIndex(m => m.id === module.id) === course.modules.length - 1 ||
                !course.modules[course.modules.findIndex(m => m.id === module.id) + 1]?.lessons.length))
            }
          >
            Next Lesson
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 