import { TopHeader } from '@/components/top-header';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { IosInstallPrompt } from '@/components/ios-install-prompt';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopHeader />
      <main className="pb-20 max-w-lg mx-auto">
        {children}
      </main>
      <BottomTabBar />
      <IosInstallPrompt />
    </div>
  );
}
