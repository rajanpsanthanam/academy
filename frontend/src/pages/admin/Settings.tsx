import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentWrapper } from '@/components/layout/ContentWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { ThemeSwitcher } from '@/themes/ThemeSwitcher';
import { Label } from '@/components/ui/label';

export default function Settings() {
  return (
    <ContentWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Configure system-wide settings and preferences"
        />
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <ThemeSwitcher />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentWrapper>
  );
} 