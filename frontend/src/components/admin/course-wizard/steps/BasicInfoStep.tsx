import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useImperativeHandle, forwardRef } from 'react';

interface BasicInfoStepProps {
  data: {
    title: string;
    description: string;
  };
  onChange: (data: Partial<BasicInfoStepProps['data']>) => void;
}

export interface BasicInfoStepRef {
  validate: () => boolean;
}

export const BasicInfoStep = forwardRef<BasicInfoStepRef, BasicInfoStepProps>(({ data, onChange }, ref) => {
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const validate = () => {
    const newErrors: { title?: string; description?: string } = {};
    if (!data.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!data.description.trim()) {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useImperativeHandle(ref, () => ({
    validate,
  }));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ title: e.target.value });
    if (errors.title) {
      setErrors({ ...errors, title: undefined });
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ description: e.target.value });
    if (errors.description) {
      setErrors({ ...errors, description: undefined });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement file upload
      // For now, we'll just use a placeholder URL
      onChange({ thumbnail_url: URL.createObjectURL(file) });
    }
  };

  return (
    <Card id="basic-info-step">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title</Label>
          <Input
            id="title"
            value={data.title}
            onChange={handleTitleChange}
            placeholder="Enter course title"
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Course Description</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={handleDescriptionChange}
            placeholder="Enter course description"
            className={`min-h-[200px] ${errors.description ? 'border-destructive' : ''}`}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}); 