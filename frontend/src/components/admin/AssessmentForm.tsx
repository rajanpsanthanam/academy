import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/services/apiService';

interface AssessmentFormProps {
  courseId: string;
  onAssessmentCreated: () => void;
}

export function AssessmentForm({ courseId, onAssessmentCreated }: AssessmentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>(['pdf', 'doc', 'docx']);
  const [maxFileSize, setMaxFileSize] = useState(10);
  const [submissionInstructions, setSubmissionInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Assessment title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.assessments.create({
        assessable_type: 'Course',
        assessable_id: courseId,
        title,
        description,
        assessment_type: 'FILE_SUBMISSION',
        file_submission: {
          allowed_file_types: allowedFileTypes,
          max_file_size_mb: maxFileSize,
          submission_instructions: submissionInstructions,
        },
      });
      
      toast.success('Assessment created successfully');
      setIsOpen(false);
      onAssessmentCreated();
      
      // Reset form
      setTitle('');
      setDescription('');
      setAllowedFileTypes(['pdf', 'doc', 'docx']);
      setMaxFileSize(10);
      setSubmissionInstructions('');
    } catch (error) {
      console.error('Failed to create assessment:', error);
      toast.error('Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Assessment
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Create Assessment</SheetTitle>
          <SheetDescription>
            Add a new assessment to this course.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assessment title"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Assessment description"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileTypes">Allowed File Types</Label>
            <Input
              id="fileTypes"
              value={allowedFileTypes.join(', ')}
              onChange={(e) => setAllowedFileTypes(e.target.value.split(',').map(type => type.trim()))}
              placeholder="pdf, doc, docx"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
            <Input
              id="maxFileSize"
              type="number"
              value={maxFileSize}
              onChange={(e) => setMaxFileSize(Number(e.target.value))}
              min={1}
              max={100}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Submission Instructions</Label>
            <Textarea
              id="instructions"
              value={submissionInstructions}
              onChange={(e) => setSubmissionInstructions(e.target.value)}
              placeholder="Instructions for submitting the assessment"
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
            >
              Create Assessment
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 