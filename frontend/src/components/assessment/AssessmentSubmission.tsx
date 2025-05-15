import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiService } from '@/lib/services/apiService';
import { Upload, FileText, X, RefreshCw } from 'lucide-react';

interface AssessmentSubmissionProps {
  assessment: {
    id: string;
    title: string;
    description: string;
    assessment_type: string;
    file_submission?: {
      allowed_file_types: string[];
      max_file_size_mb: number;
      submission_instructions: string;
    };
  };
  onSubmissionComplete?: () => void;
}

interface Submission {
  id: string;
  file_name: string;
  file_url: string;
  submitted_at: string;
}

export function AssessmentSubmission({ assessment, onSubmissionComplete }: AssessmentSubmissionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentSubmission();
  }, [assessment.id]);

  const fetchCurrentSubmission = async () => {
    try {
      const response = await apiService.assessments.getSubmission(assessment.id);
      // Get the most recent submission from the array
      setCurrentSubmission(response[0] || null);
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Only validate file type and size for FILE_SUBMISSION type
    if (assessment.assessment_type === 'FILE_SUBMISSION' && assessment.file_submission) {
      // Validate file type
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !assessment.file_submission.allowed_file_types.includes(fileExtension)) {
        toast.error(`Invalid file type. Allowed types: ${assessment.file_submission.allowed_file_types.join(', ')}`);
        return;
      }

      // Validate file size
      const maxSizeInBytes = assessment.file_submission.max_file_size_mb * 1024 * 1024;
      if (selectedFile.size > maxSizeInBytes) {
        toast.error(`File size exceeds the maximum limit of ${assessment.file_submission.max_file_size_mb}MB`);
        return;
      }
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file to submit');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiService.assessments.submit(assessment.id, formData);
      toast.success(response.message || 'Assessment submitted successfully');
      setFile(null);
      await fetchCurrentSubmission();
      onSubmissionComplete?.();
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentSubmission) return;

    try {
      await apiService.assessments.deleteSubmission(assessment.id);
      toast.success('Submission deleted successfully');
      setCurrentSubmission(null);
      onSubmissionComplete?.();
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete submission. Please try again.');
    }
  };

  // Only show file submission UI for FILE_SUBMISSION type
  if (assessment.assessment_type !== 'FILE_SUBMISSION') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{assessment.title}</CardTitle>
          {assessment.description && (
            <CardDescription>{assessment.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">This assessment type is not supported yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assessment.title}</CardTitle>
        {assessment.description && (
          <CardDescription>{assessment.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {assessment.file_submission && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <p>Allowed file types: {assessment.file_submission.allowed_file_types.join(', ')}</p>
              <p>Maximum file size: {assessment.file_submission.max_file_size_mb}MB</p>
              {assessment.file_submission.submission_instructions && (
                <p className="mt-2">{assessment.file_submission.submission_instructions}</p>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : currentSubmission ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{currentSubmission.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(currentSubmission.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCurrentSubmission(null)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Submit New File
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept={assessment.file_submission?.allowed_file_types.map(ext => `.${ext}`).join(',')}
                disabled={isSubmitting}
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!file || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Assessment
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 