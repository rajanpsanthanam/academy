import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { DarkModeToggle } from '@/themes/DarkModeToggle';

export default function Settings() {
  return (
    <ContentWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Configure your account settings and preferences"
        />
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <DarkModeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentWrapper>
  );
} 