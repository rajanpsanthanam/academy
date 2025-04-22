import { CoursesList } from '@/components/admin/CoursesList';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { PageHeader } from '@/components/layout/PageHeader';

export default function ManageCourses() {
  return (
    <ContentWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Courses"
          description="View and manage your organization's courses"
        />
        <CoursesList />
      </div>
    </ContentWrapper>
  );
} 