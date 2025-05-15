import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiService } from '@/lib/services/apiService';
import { Upload, FileText, Trash2, RefreshCw } from 'lucide-react';

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
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSubmissions, setCurrentSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentSubmissions();
  }, [assessment.id]);

  const fetchCurrentSubmissions = async () => {
    try {
      const response = await apiService.assessments.getSubmission(assessment.id);
      setCurrentSubmissions(response || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Only validate file type and size for FILE_SUBMISSION type
    if (assessment.assessment_type === 'FILE_SUBMISSION' && assessment.file_submission) {
      const validFiles = selectedFiles.filter(file => {
        // Validate file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !assessment.file_submission?.allowed_file_types.includes(fileExtension)) {
          toast.error(`Invalid file type for ${file.name}. Allowed types: ${assessment.file_submission.allowed_file_types.join(', ')}`);
          return false;
        }

        // Validate file size
        const maxSizeInBytes = assessment.file_submission.max_file_size_mb * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          toast.error(`File size exceeds the maximum limit of ${assessment.file_submission.max_file_size_mb}MB for ${file.name}`);
          return false;
        }

        return true;
      });

      setFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file to submit');
      return;
    }

    setIsSubmitting(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await apiService.assessments.submit(assessment.id, formData);
      }
      
      toast.success('Files submitted successfully');
      setFiles([]);
      await fetchCurrentSubmissions();
      onSubmissionComplete?.();
    } catch (error: any) {
      console.error('Error submitting files:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit files. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    try {
      await apiService.assessments.deleteSubmission(assessment.id, submissionId);
      toast.success('File deleted successfully');
      setCurrentSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
      onSubmissionComplete?.();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete file. Please try again.');
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
        ) : (
          <div className="space-y-4">
            {/* Current Submissions */}
            {currentSubmissions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Submitted Files</h3>
                {currentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{submission.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(submission.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="files">Upload Files</Label>
              <div className="space-y-2">
                <Input
                  id="files"
                  type="file"
                  onChange={handleFileChange}
                  accept={assessment.file_submission?.allowed_file_types.map(ext => `.${ext}`).join(',')}
                  disabled={isSubmitting}
                  multiple
                />
                
                {/* Selected Files List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={files.length === 0 || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 