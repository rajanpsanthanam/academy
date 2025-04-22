import { useEffect, useState, useCallback, useRef } from 'react';
import { apiService } from '@/lib/services/apiService';
import { AccessRequest } from '@/lib/types/accessRequest';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Check, X, RotateCcw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useDebounce } from '@/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function AccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 800);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [sortBy, setSortBy] = useState<string>('-created_at');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (dateRange.from && dateRange.to) {
      params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
    }
    if (sortBy) params.append('sort_by', sortBy);
    return params.toString();
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const queryString = buildQueryString();
      const response = await apiService.accessRequests.list(`?${queryString}`);
      const data = response.data as PaginatedResponse<AccessRequest>;
      setRequests(data.results);
      setTotalCount(data.count);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch access requests:', err);
      setError('Failed to fetch access requests');
      setRequests([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when debounced search changes
  useEffect(() => {
    setPage(1);
    fetchRequests();
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Initial fetch
  useEffect(() => {
    fetchRequests();
    isFirstRender.current = false;
  }, []);

  // Fetch when other filters change
  useEffect(() => {
    if (!isFirstRender.current) {
      fetchRequests();
    }
  }, [page, pageSize, statusFilter, dateRange, sortBy]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      switch (action) {
        case 'approve':
          await apiService.accessRequests.approve(id);
          toast.success('Access request approved successfully');
          break;
        case 'reject':
          await apiService.accessRequests.reject(id);
          toast.success('Access request rejected successfully');
          break;
      }
      await fetchRequests();
    } catch (err) {
      console.error(`Failed to ${action} access request:`, err);
      toast.error(`Failed to ${action} access request`);
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const highlightMatch = (text: string) => {
    if (!debouncedSearch) return text;
    
    const searchTerms = debouncedSearch.split(' ');
    let highlightedText = text;
    
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  if (loading) {
    return (
      <ContentWrapper>
        <div className="space-y-6">
          <PageHeader
            title="Access Requests"
            description="Manage user access requests to the platform"
          />
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  if (error) {
    return (
      <ContentWrapper>
        <div className="space-y-6">
          <PageHeader
            title="Access Requests"
            description="Manage user access requests to the platform"
          />
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Access Requests"
          description="Manage user access requests to the platform"
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, organization, status, or processed by..."
                  className="pl-8"
                  value={searchInput}
                  onChange={handleSearchChange}
                />
                {searchInput && (
                  <div className="absolute right-2 top-2.5 text-xs text-muted-foreground">
                    {loading ? 'Searching...' : `${requests.length} results`}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_at">Newest First</SelectItem>
                <SelectItem value="created_at">Oldest First</SelectItem>
                <SelectItem value="email">Email (A-Z)</SelectItem>
                <SelectItem value="-email">Email (Z-A)</SelectItem>
                <SelectItem value="status">Status (A-Z)</SelectItem>
                <SelectItem value="-status">Status (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No access requests found
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{highlightMatch(request.email)}</TableCell>
                      <TableCell>{format(new Date(request.created_at), 'PPpp')}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {highlightMatch(request.status.charAt(0).toUpperCase() + request.status.slice(1))}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <AlertDialog>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          disabled={processing[request.id]}
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Approve request</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Approve Access Request</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to approve access for {request.email}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleAction(request.id, 'approve')}
                                    >
                                      Approve
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <AlertDialog>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          disabled={processing[request.id]}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Reject request</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Access Request</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to reject access for {request.email}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleAction(request.id, 'reject')}
                                    >
                                      Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {requests.length} of {totalCount} requests
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ContentWrapper>
  );
} 