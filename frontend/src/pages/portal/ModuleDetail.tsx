import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Course } from "@/lib/types/course";
import { apiService } from "@/lib/services/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export function ModuleDetail() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<Course['modules'][0] | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModule = async () => {
      if (!courseId || !moduleId) return;

      try {
        const courseData = await apiService.courses.get(courseId);
        setCourse(courseData);
        const moduleData = courseData.modules.find((m: Course['modules'][0]) => m.id === moduleId);
        if (moduleData) {
          setModule(moduleData);
        } else {
          setError("Module not found");
        }
      } catch (err) {
        setError("Failed to load module. Please try again later.");
        console.error("Error fetching module:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [courseId, moduleId]);

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

  if (!module || !course) {
    return <div className="text-center">Module not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { type: 'dashboard', onClick: () => navigate('/portal') },
          { type: 'course', onClick: () => navigate(`/portal/courses/${courseId}`) },
          { type: 'module' }
        ]}
      />

      {/* Module Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{module.title}</h1>
          <p className="text-muted-foreground">{module.description}</p>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Lessons</h2>
          <div className="space-y-2">
            {module.lessons.map((lesson) => (
              <Button
                key={lesson.id}
                variant="ghost"
                className="w-full justify-start h-9 px-4"
                onClick={() =>
                  navigate(
                    `/portal/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`
                  )
                }
              >
                <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{lesson.title}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 