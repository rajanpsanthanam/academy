import { useEffect, useState } from 'react';
import { apiService } from '@/lib/services/apiService';
import { AccessRequest } from '@/lib/types/accessRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export function AccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.accessRequests.list();
      setRequests(response.data.filter(request => request.status === 'pending'));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch pending access requests:', err);
      setError('Failed to fetch pending access requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await apiService.accessRequests.approve(id);
      await fetchRequests();
      toast.success('Access request approved successfully');
    } catch (err) {
      console.error('Failed to approve access request:', err);
      toast.error('Failed to approve access request');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiService.accessRequests.reject(id);
      await fetchRequests();
      toast.success('Access request rejected successfully');
    } catch (err) {
      console.error('Failed to reject access request:', err);
      toast.error('Failed to reject access request');
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
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={() => handleApprove(request.id)}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(request.id)}
                >
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No pending access requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending Access Requests</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.email}</TableCell>
              <TableCell>{format(new Date(request.created_at), 'PPpp')}</TableCell>
              <TableCell>
                <div className="space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleApprove(request.id)}
                          disabled={processing[request.id]}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Approve request</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleReject(request.id)}
                          disabled={processing[request.id]}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reject request</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 