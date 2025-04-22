import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/lib/services/apiService";
import { Course, Module, Lesson } from "@/lib/types/course";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchResult {
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
}

interface SearchProps {
  onSelect?: () => void;
}

export function Search({ onSelect }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({
    courses: [],
    modules: [],
    lessons: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setResults({ courses: [], modules: [], lessons: [] });
        return;
      }

      setIsLoading(true);
      try {
        const courses = await apiService.courses.list();
        const filteredCourses = courses.filter(course => 
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const modules = filteredCourses.flatMap(course => course.modules || []);
        const lessons = modules.flatMap(module => module.lessons || []);

        setResults({
          courses: filteredCourses,
          modules: modules.filter(module => 
            module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            module.description.toLowerCase().includes(searchQuery.toLowerCase())
          ),
          lessons: lessons.filter(lesson => 
            lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        });
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleResultClick = (type: "course" | "module" | "lesson", id: string, courseId: string) => {
    if (type === "course") {
      navigate(`/portal/courses/${id}`);
    } else if (type === "module") {
      navigate(`/portal/courses/${courseId}/modules/${id}`);
    } else {
      const lesson = results.lessons.find(l => l.id === id);
      if (lesson) {
        const module = results.modules.find(m => m.lessons.some(l => l.id === id));
        if (module) {
          const course = results.courses.find(c => c.modules.some(m => m.id === module.id));
          if (course) {
            navigate(`/portal/courses/${course.id}/modules/${module.id}/lessons/${id}`);
          }
        }
      }
    }
    onSelect?.();
  };

  const hasResults = results.courses.length > 0 || 
                    results.modules.length > 0 || 
                    results.lessons.length > 0;

  return (
    <div className="w-full max-w-2xl">
      <Command className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Search courses, modules, and lessons..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : !hasResults ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <>
              {results.courses.length > 0 && (
                <CommandGroup heading="Courses">
                  {results.courses.map((course) => (
                    <CommandItem
                      key={course.id}
                      value={course.title}
                      onSelect={() => handleResultClick("course", course.id, course.id)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="font-medium">{course.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {course.description.substring(0, 100)}...
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.modules.length > 0 && (
                <CommandGroup heading="Modules">
                  {results.modules.map((module) => {
                    const course = results.courses.find(c => c.modules.some(m => m.id === module.id));
                    return (
                      <CommandItem
                        key={module.id}
                        value={module.title}
                        onSelect={() => handleResultClick("module", module.id, course?.id || '')}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="font-medium">{module.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {module.description.substring(0, 100)}...
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {results.lessons.length > 0 && (
                <CommandGroup heading="Lessons">
                  {results.lessons.map((lesson) => {
                    const module = results.modules.find(m => m.lessons.some(l => l.id === lesson.id));
                    const course = results.courses.find(c => c.modules.some(m => m.id === module?.id));
                    return (
                      <CommandItem
                        key={lesson.id}
                        value={lesson.title}
                        onSelect={() => handleResultClick("lesson", lesson.id, course?.id || '')}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="font-medium">{lesson.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {lesson.description.substring(0, 100)}...
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </div>
  );
} 