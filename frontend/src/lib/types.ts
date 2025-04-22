export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  is_staff: boolean;
  organization_name?: string;
  organization_logo?: string;
} 