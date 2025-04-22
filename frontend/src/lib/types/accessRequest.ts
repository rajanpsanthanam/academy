export interface AccessRequest {
  id: number;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at: string | null;
  processed_by: {
    id: number;
    email: string;
  } | null;
} 