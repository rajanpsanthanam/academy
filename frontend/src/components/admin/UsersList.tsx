import { useEffect, useState, useRef } from 'react';
import { apiService } from '@/lib/services/apiService';
import { User } from '@/lib/types/auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { UserPlus, UserMinus, X, RotateCcw, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Record<number, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 800);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [sortBy, setSortBy] = useState<string>('-last_login');
  const isFirstRender = useRef(true);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (statusFilter !== 'all') params.append('is_active', statusFilter === 'active' ? 'true' : 'false');
    if (roleFilter !== 'all') params.append('is_staff', roleFilter === 'admin' ? 'true' : 'false');
    if (dateRange.from && dateRange.to) {
      params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
    }
    if (sortBy) params.append('sort_by', sortBy);
    return params.toString();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryString = buildQueryString();
      const response = await apiService.users.list(`?${queryString}`);
      const data = response.data as PaginatedResponse<User>;
      setUsers(data.results);
      setTotalCount(data.count);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when debounced search changes
  useEffect(() => {
    setPage(1);
    fetchUsers();
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Initial fetch
  useEffect(() => {
    fetchUsers();
    isFirstRender.current = false;
  }, []);

  // Fetch when other filters change
  useEffect(() => {
    if (!isFirstRender.current) {
      fetchUsers();
    }
  }, [page, pageSize, statusFilter, roleFilter, dateRange, sortBy]);

  const handleAction = async (id: number, action: 'revoke' | 'restore') => {
    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      if (action === 'revoke') {
        await apiService.users.revoke(`${id}`);
        toast.success('User access revoked successfully');
      } else {
        await apiService.users.restore(`${id}`);
        toast.success('User access restored successfully');
      }
      await fetchUsers();
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      toast.error(`Failed to ${action} user`);
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
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or organization..."
              className="pl-8"
              value={searchInput}
              onChange={handleSearchChange}
            />
            {searchInput && (
              <div className="absolute right-2 top-2.5 text-xs text-muted-foreground">
                {loading ? 'Searching...' : `${users.length} results`}
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
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
            <SelectItem value="-last_login">Last Login (Recent)</SelectItem>
            <SelectItem value="last_login">Last Login (Oldest)</SelectItem>
            <SelectItem value="-date_joined">Newest First</SelectItem>
            <SelectItem value="date_joined">Oldest First</SelectItem>
            <SelectItem value="email">Email (A-Z)</SelectItem>
            <SelectItem value="-email">Email (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No users found
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{highlightMatch(user.email)}</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {user.is_staff ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {user.is_active 
                        ? (user.is_approved ? 'Active' : 'Pending Approval')
                        : 'Inactive'
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login ? format(new Date(user.last_login), 'PPpp') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.is_active ? (
                        <AlertDialog>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={processing[user.id]}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Revoke access</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Access</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to revoke access for {user.email}? This will prevent them from accessing the platform.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleAction(user.id, 'revoke')}
                              >
                                Revoke Access
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={processing[user.id]}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Restore access</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Restore Access</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to restore access for {user.email}? This will allow them to access the platform again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleAction(user.id, 'restore')}
                              >
                                Restore Access
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {users.length} of {totalCount} users
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
        </>
      )}
    </div>
  );
} 