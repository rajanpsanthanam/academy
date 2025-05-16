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
import { ChevronDown, ChevronRight, Save, X, Pencil, Eye, EyeOff, FileText, Eye as EyeIcon, Undo2, BookOpen, Plus } from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AddContentButton } from './AddContentButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from '@/hooks/useDebounce';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AssessmentForm } from './AssessmentForm';

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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssessmentSheetOpen, setIsAssessmentSheetOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);

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

  const handleSaveAssessment = async (assessmentData: any) => {
    try {
      if (editingAssessment) {
        await apiService.courses.assessments.update(course.id, editingAssessment.id, assessmentData);
      } else {
        await apiService.courses.assessments.create(course.id, assessmentData);
      }
      await onUpdate();
    } catch (error) {
      console.error('Failed to save assessment:', error);
      throw error;
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      await apiService.courses.assessments.delete(course.id, assessmentId);
      await onUpdate();
      toast.success('Assessment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete assessment');
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full mb-4">
      <AccordionItem value={course.id} className={cn(
        "border rounded-lg",
        course.deleted_at && "opacity-60 border-dashed"
      )}>
        <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/50">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "text-base font-medium",
                course.deleted_at && "line-through"
              )}>{course.title}</span>
              {course.deleted_at && (
                <Badge variant="destructive" className="ml-2">
                  Deleted
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit course</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AddContentButton
                      type="module"
                      onAdd={handleCreateModule}
                      className="h-9 w-9 p-0"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add module</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {course.deleted_at ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restore Course</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to restore this course? This will also restore all its modules and lessons.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRestoreCourse()}>Restore</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Course</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this course? This will also delete all its modules and lessons.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCourse()}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="text-sm">{course.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Assessments</h3>
                {!course.deleted_at && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Assessment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Assessment</DialogTitle>
                        <DialogDescription>
                          Create a new assessment for this course.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const title = formData.get('title') as string;
                        const description = formData.get('description') as string;
                        const allowedFileTypes = (formData.get('fileTypes') as string).split(',').map(type => type.trim());
                        const maxFileSize = Number(formData.get('maxFileSize'));
                        const submissionInstructions = formData.get('instructions') as string;

                        if (!title.trim()) {
                          toast.error('Assessment title is required');
                          return;
                        }

                        try {
                          await apiService.assessments.create({
                            assessable_type: 'Course',
                            assessable_id: course.id,
                            title,
                            description,
                            assessment_type: 'FILE_SUBMISSION',
                            file_submission: {
                              allowed_file_types: allowedFileTypes,
                              max_file_size_mb: maxFileSize,
                              submission_instructions: submissionInstructions,
                            },
                          });
                          
                          await onUpdate();
                          toast.success('Assessment created successfully');
                          
                          const dialog = document.querySelector('[role="dialog"]');
                          if (dialog) {
                            (dialog as HTMLDialogElement).close();
                          }
                        } catch (error) {
                          toast.error('Failed to create assessment');
                        }
                      }}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              name="title"
                              placeholder="Enter assessment title"
                              className="w-full"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              name="description"
                              placeholder="Enter assessment description"
                              className="w-full"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="fileTypes">Allowed File Types</Label>
                            <Input
                              id="fileTypes"
                              name="fileTypes"
                              placeholder="pdf, doc, docx"
                              defaultValue="pdf, doc, docx"
                              className="w-full"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                            <Input
                              id="maxFileSize"
                              name="maxFileSize"
                              type="number"
                              defaultValue={10}
                              min={1}
                              max={100}
                              className="w-full"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="instructions">Submission Instructions</Label>
                            <Textarea
                              id="instructions"
                              name="instructions"
                              placeholder="Enter submission instructions"
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button"
                            variant="outline" 
                            onClick={() => {
                              const dialog = document.querySelector('[role="dialog"]');
                              if (dialog) {
                                (dialog as HTMLDialogElement).close();
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">
                            Create Assessment
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {course.assessments && course.assessments.length > 0 ? (
                <div className="space-y-2">
                  {course.assessments.map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{assessment.title}</p>
                        {assessment.description && (
                          <p className="text-sm text-muted-foreground">{assessment.description}</p>
                        )}
                      </div>
                      <Badge variant="outline">
                        {assessment.assessment_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No assessments added yet.</p>
              )}
            </div>

            <Accordion type="multiple" className="w-full space-y-2">
              {(course.modules || [])?.filter(module => showDeleted || !module.deleted_at)
                .map((module) => (
                  <AccordionItem key={module.id} value={module.id} className={cn(
                    "border rounded-lg",
                    module.deleted_at && "opacity-60 border-dashed"
                  )}>
                    <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/50">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className={cn(
                            "text-base font-medium",
                            module.deleted_at && "line-through"
                          )}>{module.title}</span>
                          {module.deleted_at && (
                            <Badge variant="destructive" className="ml-2">
                              Deleted
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AddContentButton
                                  type="lesson"
                                  onAdd={(title, description, content) => handleAddLesson(title, description, content, module.id)}
                                  className="h-9 w-9 p-0"
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Add lesson</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingModuleId(module.id);
                                  }}
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
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
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
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
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
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 p-2">
                        {(module.lessons || [])?.filter(lesson => showDeleted || !lesson.deleted_at)
                          .map((lesson) => (
                            <div key={lesson.id} className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              lesson.deleted_at && "opacity-60 border-dashed"
                            )}>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className={cn(
                                  "text-sm",
                                  lesson.deleted_at && "line-through"
                                )}>{lesson.title}</span>
                                {lesson.deleted_at && (
                                  <Badge variant="destructive" className="ml-2">
                                    Deleted
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
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
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>
        </AccordionContent>
      </AccordionItem>

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

      <AssessmentSheet
        isOpen={isAssessmentSheetOpen}
        onOpenChange={setIsAssessmentSheetOpen}
        onSave={handleSaveAssessment}
        initialData={editingAssessment}
        courseId={course.id}
      />
    </Accordion>
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
  }, [showDeleted, page, pageSize, debouncedSearchQuery, ordering]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when searching
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
          <div className="flex items-center gap-4 flex-1">
            <div className="w-64">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          <Button
            onClick={() => {
              const dialog = document.querySelector('[role="dialog"]');
              if (dialog) {
                (dialog as HTMLDialogElement).showModal();
              }
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Course
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
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="hidden">Add Course</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course for your organization. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            const description = formData.get('description') as string;

            if (!title.trim()) {
              toast.error('Course title is required');
              return;
            }

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
              const dialog = document.querySelector('[role="dialog"]');
              if (dialog) {
                (dialog as HTMLDialogElement).close();
              }
            } catch (error) {
              toast.error('Failed to create course', {
                description: 'There was an error creating the course. Please try again.',
              });
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter course title"
                  className="w-full"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter course description"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  const dialog = document.querySelector('[role="dialog"]');
                  if (dialog) {
                    (dialog as HTMLDialogElement).close();
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Add Course
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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