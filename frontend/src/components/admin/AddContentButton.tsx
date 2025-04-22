import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, FileText, Book } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AddContentButtonProps {
  type: 'course' | 'module' | 'lesson';
  onAdd: (title: string, description: string, content?: string, moduleId?: string) => Promise<void>;
  className?: string;
  moduleId?: string;
}

export function AddContentButton({ type, onAdd, className, moduleId }: AddContentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onAdd(title, description, content, moduleId);
      setIsOpen(false);
      setTitle('');
      setDescription('');
      setContent('');
    } finally {
      setIsSaving(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'course':
        return <Book className="h-4 w-4 mr-2" />;
      case 'module':
        return <BookOpen className="h-4 w-4 mr-2" />;
      case 'lesson':
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "group relative overflow-hidden transition-all duration-300",
            "hover:bg-primary/10 hover:text-primary",
            "focus-visible:ring-2 focus-visible:ring-primary",
            className
          )}
        >
          {getIcon()}
          Add {type.charAt(0).toUpperCase() + type.slice(1)}
          <span className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Create a new {type} for your {type === 'module' ? 'course' : type === 'lesson' ? 'module' : 'organization'}. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${type} title`}
              className="w-full"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Enter ${type} description`}
              className="w-full"
            />
          </div>
          {type === 'lesson' && (
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter lesson content (markdown supported)"
                className="w-full h-[200px] font-mono"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 