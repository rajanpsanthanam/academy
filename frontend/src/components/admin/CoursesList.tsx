import { useEffect, useState } from 'react';
import { apiService } from '@/lib/services/apiService';
import { Course, Module, Lesson } from '@/lib/types/course';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronRight, Save, X, Pencil, Eye, EyeOff, FileText, Eye as EyeIcon, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AddContentButton } from './AddContentButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from '@/hooks/useDebounce';

interface EditFormProps {
  title: string;
  description: string;
  content?: string;
  onSave: (title: string, description: string, content?: string) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'course' | 'module' | 'lesson';
}

function EditForm({ 
  title: initialTitle, 
  description: initialDescription, 
  content: initialContent = '', 
  onSave, 
  onCancel, 
  isOpen, 
  onOpenChange,
  type
}: EditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onSave(title, description, content);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)}</SheetTitle>
          <SheetDescription>
            Make changes to the {type} details.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full"
            />
          </div>
          {type === 'lesson' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="content" className="text-sm font-medium">Content</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                  >
                    {viewMode === 'edit' ? (
                      <>
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Preview
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {viewMode === 'edit' ? (
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter markdown content..."
                  className="w-full h-[300px] font-mono"
                />
              ) : (
                <div className="prose prose-sm max-w-none p-4 border rounded-md h-[300px] overflow-auto">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onCancel();
                onOpenChange(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
            >
              Save changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface CourseItemProps {
  course: Course;
  onUpdate: () => Promise<void>;
  showDeleted: boolean;
}

function CourseItem({ course, onUpdate, showDeleted }: CourseItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [deleteCourseDialogOpen, setDeleteCourseDialogOpen] = useState(false);
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState<string | null>(null);
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState<{moduleId: string, lessonId: string} | null>(null);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'DRAFT' | 'PUBLISHED' | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleSaveCourse = async (title: string, description: string) => {
    try {
      await apiService.courses.update(course.id, {
        ...course,
        title,
        description,
      });
      await onUpdate();
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  const handleSaveModule = async (moduleId: string, title: string, description: string) => {
    try {
      await apiService.courses.modules.update(course.id, moduleId, {
        title,
        description,
      });
      await onUpdate();
      toast.success('Module updated successfully');
    } catch (error) {
      toast.error('Failed to update module');
    }
  };

  const handleSaveLesson = async (moduleId: string, lessonId: string, title: string, description: string, content: string) => {
    try {
      await apiService.courses.lessons.update(course.id, moduleId, lessonId, {
        title,
        description,
        content,
      });
      await onUpdate();
      toast.success('Lesson updated successfully');
    } catch (error) {
      toast.error('Failed to update lesson');
    }
  };

  const handleCreateModule = async (title: string, description: string) => {
    if (!title.trim()) {
      toast.error('Module title is required');
      return;
    }

    try {
      await apiService.courses.modules.create(course.id, {
        title,
        description,
      });
      await onUpdate();
      toast.success('Module added successfully');
    } catch (error) {
      toast.error('Failed to add module');
    }
  };

  const handleAddLesson = async (title: string, description: string, content?: string, moduleId?: string) => {
    if (!moduleId) {
      toast.error('Module ID is required');
      return;
    }

    if (!title.trim()) {
      toast.error('Lesson title is required');
      return;
    }

    try {
      await apiService.courses.lessons.create(course.id, moduleId, {
        title,
        description,
        content: content || '',
      });
      await onUpdate();
      toast.success('Lesson added successfully');
    } catch (error) {
      toast.error('Failed to add lesson');
    }
  };

  const handleToggleStatus = async () => {
    const targetStatus = course.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    setNewStatus(targetStatus);
    setIsStatusChangeDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    try {
      if (!newStatus) return;

      await apiService.courses.update(course.id, {
        ...course,
        status: newStatus,
      });
      
      // Update the course in the UI
      course.status = newStatus;
      await onUpdate();
      
      toast.success(newStatus === 'DRAFT' ? 'Course marked as draft' : 'Course published');
    } catch (error) {
      console.error('Failed to update course status:', error);
      toast.error('Failed to update course status');
    } finally {
      setIsStatusChangeDialogOpen(false);
      setNewStatus(null);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await apiService.courses.delete(course.id);
      toast.success('Course deleted successfully');
      await onUpdate();
    } catch (error) {
      toast.error('Failed to delete course');
      console.error(error);
    }
  };

  const handleRestoreCourse = async () => {
    try {
      await apiService.courses.restore(course.id);
      toast.success('Course restored successfully');
      await onUpdate();
    } catch (error) {
      toast.error('Failed to restore course');
      console.error(error);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await apiService.courses.modules.delete(course.id, moduleId);
      await onUpdate();
      toast.success('Module deleted successfully');
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  const handleRestoreModule = async (moduleId: string) => {
    try {
      await apiService.courses.modules.restore(course.id, moduleId);
      await onUpdate();
      toast.success('Module restored successfully');
    } catch (error) {
      toast.error('Failed to restore module');
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    try {
      await apiService.courses.lessons.delete(course.id, moduleId, lessonId);
      await onUpdate();
      toast.success('Lesson deleted successfully');
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

  const handleRestoreLesson = async (moduleId: string, lessonId: string) => {
    try {
      await apiService.courses.lessons.restore(course.id, moduleId, lessonId);
      await onUpdate();
      toast.success('Lesson restored successfully');
    } catch (error) {
      toast.error('Failed to restore lesson');
    }
  };

  return (
    <Card className={cn(
      "mb-4",
      course.deleted_at && "opacity-60 border-dashed"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div>
              <CardTitle className={cn(
                course.deleted_at && "line-through"
              )}>{course.title}</CardTitle>
              {course.deleted_at && (
                <Badge variant="destructive" className="mt-1">
                  Deleted
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {course.status}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleStatus()}
            >
              {course.status === 'PUBLISHED' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <EditForm
                title={course.title}
                description={course.description}
                onSave={handleSaveCourse}
                onCancel={() => setIsEditOpen(false)}
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                type="course"
              />
            </Sheet>
            {course.deleted_at ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restore Course</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to restore this course? This will make it available again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestoreCourse}>Restore</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      {(course.active_enrollments_count ?? 0) > 0 ? (
                        <>
                          <p className="text-yellow-600 mb-2">
                            Warning: This course has {course.active_enrollments_count ?? 0} active enrollment(s).
                          </p>
                          <p>
                            Deleting this course will prevent new enrollments but existing enrolled users will retain access.
                            Are you sure you want to proceed?
                          </p>
                        </>
                      ) : (
                        'Are you sure you want to delete this course?'
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCourse}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex justify-end">
              <AddContentButton
                type="module"
                onAdd={handleCreateModule}
                className="mr-2"
              />
            </div>
            {(course.modules || [])?.filter(module => showDeleted || !module.deleted_at)
              .map((module) => (
                <Card key={module.id} className={cn(
                  "ml-4",
                  module.deleted_at && "opacity-60 border-dashed"
                )}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className={cn(
                          module.deleted_at && "line-through"
                        )}>{module.title}</CardTitle>
                        {module.deleted_at && (
                          <Badge variant="destructive" className="mt-1">
                            Deleted
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <AddContentButton
                          type="lesson"
                          onAdd={handleAddLesson}
                          moduleId={module.id}
                          className="mr-2"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingModuleId(module.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit module</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {module.deleted_at ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Undo2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Restore Module</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to restore this module? This will also restore all its lessons.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRestoreModule(module.id)}>Restore</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <X className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Module</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this module? This will also delete all its lessons.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteModule(module.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(module.lessons || [])?.filter(lesson => showDeleted || !lesson.deleted_at)
                      .map((lesson) => (
                        <Card key={lesson.id} className="ml-4 mb-2">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className={cn(
                                  lesson.deleted_at && "line-through"
                                )}>{lesson.title}</CardTitle>
                                {lesson.deleted_at && (
                                  <Badge variant="destructive" className="mt-1">
                                    Deleted
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingLessonId(lesson.id)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit lesson</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {lesson.deleted_at ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Undo2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Restore Lesson</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to restore this lesson?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRestoreLesson(module.id, lesson.id)}>Restore</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this lesson? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteLesson(module.id, lesson.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      )}

      <EditForm
        title={course.title}
        description={course.description}
        onSave={handleSaveCourse}
        onCancel={() => setIsEditOpen(false)}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        type="course"
      />

      {(course.modules || [])?.map((module) => (
        <EditForm
          key={module.id}
          title={module.title}
          description={module.description}
          onSave={(title, description) => handleSaveModule(module.id, title, description)}
          onCancel={() => setEditingModuleId(null)}
          isOpen={editingModuleId === module.id}
          onOpenChange={(open) => !open && setEditingModuleId(null)}
          type="module"
        />
      ))}

      {(course.modules || [])?.map((module) =>
        (module.lessons || [])?.map((lesson) => (
          <EditForm
            key={lesson.id}
            title={lesson.title}
            description={lesson.description}
            content={lesson.content}
            onSave={(title, description, content) => handleSaveLesson(module.id, lesson.id, title, description, content || '')}
            onCancel={() => setEditingLessonId(null)}
            isOpen={editingLessonId === lesson.id}
            onOpenChange={(open) => !open && setEditingLessonId(null)}
            type="lesson"
          />
        ))
      )}

      <AlertDialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus === 'DRAFT' && (course.active_enrollments_count ?? 0) > 0 ? (
                <>
                  <p className="text-yellow-600 mb-2">
                    Warning: This course has {course.active_enrollments_count ?? 0} active enrollment(s).
                  </p>
                  <p>
                    Switching to draft mode will prevent new enrollments but existing enrolled users will retain access.
                    Are you sure you want to proceed?
                  </p>
                </>
              ) : (
                `Are you sure you want to ${newStatus?.toLowerCase()} this course?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

interface ApiError extends Error {
  response?: {
    data?: any;
  };
}

export function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 800);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [ordering, setOrdering] = useState('-created_at');

  const enrollmentStats = {
    total: courses.length,
    enrolled: courses.filter(course => course.enrollment?.status === "ENROLLED").length,
    dropped: courses.filter(course => course.enrollment?.status === "DROPPED").length,
    completed: courses.filter(course => course.enrollment?.status === "COMPLETED").length
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.courses.list({
        page,
        page_size: pageSize,
        search: debouncedSearchQuery,
        status: statusFilter,
        ordering,
        show_deleted: showDeleted
      });
      
      console.log('Courses list:', response);
      setCourses(response.results);
      setTotalCount(response.count);
    } catch (error: unknown) {
      console.error('Failed to fetch courses:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorResponse: (error as ApiError)?.response?.data
      });
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [showDeleted, page, pageSize, debouncedSearchQuery, statusFilter, ordering]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === "ALL" ? "" : status);
    setPage(1); // Reset to first page when changing filter
  };

  const handleOrdering = (field: string) => {
    setOrdering(ordering === field ? `-${field}` : field);
    setPage(1); // Reset to first page when changing ordering
  };

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="w-40">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="w-32">
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="10 per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOrdering('title')}
            className={ordering.includes('title') ? 'bg-accent' : ''}
          >
            Title {ordering === 'title' ? '↑' : ordering === '-title' ? '↓' : ''}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOrdering('created_at')}
            className={ordering.includes('created_at') ? 'bg-accent' : ''}
          >
            Created {ordering === 'created_at' ? '↑' : ordering === '-created_at' ? '↓' : ''}
          </Button>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={setShowDeleted}
            />
            <Label htmlFor="show-deleted">Show Deleted</Label>
          </div>
          <AddContentButton
            type="course"
            onAdd={async (title, description) => {
              try {
                await apiService.courses.create({
                  title,
                  description,
                  status: 'DRAFT'
                });
                await fetchCourses();
                toast.success('Course created successfully', {
                  description: 'The course has been created and is now in draft mode.',
                });
              } catch (error) {
                toast.error('Failed to create course', {
                  description: 'There was an error creating the course. Please try again.',
                });
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-4">
        {Array.isArray(courses) && courses.map((course) => (
          <CourseItem 
            key={course.id} 
            course={course} 
            onUpdate={fetchCourses} 
            showDeleted={showDeleted}
          />
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {Math.ceil(totalCount / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(totalCount / pageSize)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 