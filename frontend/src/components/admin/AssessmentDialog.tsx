import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiService } from '@/lib/services/apiService';
import { toast } from 'sonner';

interface AssessmentDialogProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssessmentDialog({ courseId, isOpen, onClose, onSuccess }: AssessmentDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allowedFileTypes, setAllowedFileTypes] = useState(['pdf', 'doc', 'docx']);
  const [maxFileSize, setMaxFileSize] = useState(10);
  const [submissionInstructions, setSubmissionInstructions] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      const data = {
        assessable_type: 'Course',
        assessable_id: courseId,
        title,
        description,
        assessment_type: 'FILE_SUBMISSION',
        file_submission_data: {
          allowed_file_types: allowedFileTypes,
          max_file_size_mb: maxFileSize,
          submission_instructions: submissionInstructions
        }
      };
      console.log('Creating assessment with data:', data);
      
      await apiService.assessments.create(data);

      // Reset form
      setTitle('');
      setDescription('');
      setAllowedFileTypes(['pdf', 'doc', 'docx']);
      setMaxFileSize(10);
      setSubmissionInstructions('');
      onClose();
      onSuccess();
      toast.success('Assessment created successfully');
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Assessment</DialogTitle>
          <DialogDescription>
            Add a new assessment to this course
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={allowedFileTypes.join(', ')}
                onChange={(e) => setAllowedFileTypes(e.target.value.split(',').map(type => type.trim()))}
                placeholder="pdf, doc, docx"
                required
              />
            </div>
            <div>
              <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={maxFileSize}
                onChange={(e) => setMaxFileSize(Number(e.target.value))}
                min="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="submissionInstructions">Submission Instructions</Label>
              <Textarea
                id="submissionInstructions"
                value={submissionInstructions}
                onChange={(e) => setSubmissionInstructions(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Assessment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 