import { Outlet } from 'react-router-dom';
import BottomNav from '../components/common/BottomNav';
import DevBypassBanner from '../components/common/DevBypassBanner';

export default function MobileLayout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface-50">
      <DevBypassBanner />
      <main className="flex-1 pb-[calc(theme(spacing.bottom-nav)+env(safe-area-inset-bottom)+1.25rem)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
