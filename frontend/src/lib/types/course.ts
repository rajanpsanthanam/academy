export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  lessons: Lesson[];
}

export interface LessonContent {
  text?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  content_type: 'TEXT' | 'VIDEO';
  order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  assessable_type: string;
  assessable_id: string;
  title: string;
  description: string;
  assessment_type: string;
  file_submission?: {
    allowed_file_types: string[];
    max_file_size_mb: number;
    submission_instructions: string;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  thumbnail_url?: string;
  modules: Module[];
  tags: Tag[];
  assessments: Assessment[];
  created_at: string;
  updated_at: string;
  enrollment?: {
    id: string;
    status: 'ENROLLED' | 'COMPLETED' | 'DROPPED';
    progress: number;
    created_at: string;
    updated_at: string;
    enrollment_history?: Array<{
      id: string;
      status: 'COMPLETED' | 'DROPPED';
      progress: number;
      enrolled_at: string;
      dropped_at?: string;
      completed_at?: string;
    }>;
  };
  deleted_at?: string | null;
  active_enrollments_count?: number;
} 