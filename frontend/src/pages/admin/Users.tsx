import { UsersList } from '@/components/admin/UsersList';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { PageHeader } from '@/components/layout/PageHeader';

export default function Users() {
  return (
    <ContentWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage and monitor user accounts in your organization"
        />
        <UsersList />
      </div>
    </ContentWrapper>
  );
} 