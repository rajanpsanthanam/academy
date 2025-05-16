import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AssessmentSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (assessment: {
    title: string;
    description: string;
    assessment_type: string;
    assessable_type: string;
    assessable_id: string;
    file_submission?: {
      allowed_file_types: string[];
      max_file_size_mb: number;
      submission_instructions: string;
    };
  }) => Promise<void>;
  initialData?: {
    title: string;
    description: string;
    assessment_type: string;
    file_submission?: {
      allowed_file_types: string[];
      max_file_size_mb: number;
      submission_instructions: string;
    };
  };
  courseId: string;
}

export function AssessmentSheet({ isOpen, onOpenChange, onSave, initialData, courseId }: AssessmentSheetProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [assessmentType, setAssessmentType] = useState(initialData?.assessment_type || 'FILE_SUBMISSION');
  const [allowedFileTypes, setAllowedFileTypes] = useState(initialData?.file_submission?.allowed_file_types?.join(', ') || '');
  const [maxFileSize, setMaxFileSize] = useState(initialData?.file_submission?.max_file_size_mb?.toString() || '10');
  const [submissionInstructions, setSubmissionInstructions] = useState(initialData?.file_submission?.submission_instructions || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Assessment title is required');
      return;
    }

    setIsSaving(true);
    try {
      const assessmentData = {
        title,
        description,
        assessment_type: assessmentType,
        assessable_type: 'Course',
        assessable_id: courseId,
        ...(assessmentType === 'FILE_SUBMISSION' && {
          file_submission: {
            allowed_file_types: allowedFileTypes.split(',').map(type => type.trim()),
            max_file_size_mb: parseInt(maxFileSize),
            submission_instructions: submissionInstructions,
          },
        }),
      };

      await onSave(assessmentData);
      onOpenChange(false);
      toast.success('Assessment saved successfully');
    } catch (error) {
      toast.error('Failed to save assessment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>{initialData ? 'Edit Assessment' : 'Add Assessment'}</SheetTitle>
          <SheetDescription>
            {initialData ? 'Update the assessment details.' : 'Create a new assessment for this course.'}
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
            <Label htmlFor="assessmentType">Assessment Type</Label>
            <Select value={assessmentType} onValueChange={setAssessmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select assessment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FILE_SUBMISSION">File Submission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assessmentType === 'FILE_SUBMISSION' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                <Input
                  id="allowedFileTypes"
                  value={allowedFileTypes}
                  onChange={(e) => setAllowedFileTypes(e.target.value)}
                  placeholder="pdf, doc, docx"
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Enter file extensions separated by commas (e.g., pdf, doc, docx)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={maxFileSize}
                  onChange={(e) => setMaxFileSize(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submissionInstructions">Submission Instructions</Label>
                <Textarea
                  id="submissionInstructions"
                  value={submissionInstructions}
                  onChange={(e) => setSubmissionInstructions(e.target.value)}
                  placeholder="Instructions for students"
                  className="w-full"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
            >
              Save Assessment
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 