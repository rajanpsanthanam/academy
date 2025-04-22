import { useEffect, useState } from 'react';
import { apiService } from '@/lib/services/apiService';
import { AccessRequest } from '@/lib/types/accessRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function ProcessedAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.accessRequests.list();
      setRequests(response.data.filter(request => request.status !== 'pending'));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch processed access requests:', err);
      setError('Failed to fetch processed access requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRevoke = async (id: number) => {
    try {
      await apiService.accessRequests.revoke(id);
      await fetchRequests();
      toast.success('Access revoked successfully');
    } catch (err) {
      console.error('Failed to revoke access:', err);
      toast.error('Failed to revoke access');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await apiService.accessRequests.restore(id);
      await fetchRequests();
      toast.success('Access restored successfully');
    } catch (err) {
      console.error('Failed to restore access:', err);
      toast.error('Failed to restore access');
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <CardTitle>{request.email}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Status: {request.status}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">Requested on: {new Date(request.created_at).toLocaleDateString()}</p>
              {request.processed_at && (
                <p className="text-sm">Processed on: {new Date(request.processed_at).toLocaleDateString()}</p>
              )}
              <div className="flex gap-2">
                {request.status === 'approved' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleRevoke(request.id)}
                  >
                    Revoke Access
                  </Button>
                )}
                {request.status === 'rejected' && (
                  <Button
                    variant="default"
                    onClick={() => handleRestore(request.id)}
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 