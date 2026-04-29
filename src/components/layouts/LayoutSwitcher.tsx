import React from 'react';
import { usePlatform } from '../../hooks/usePlatform';
import SidebarLayout from './SidebarLayout';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';

const LayoutSwitcher: React.FC = () => {
  const { isExtension, platform } = usePlatform();
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Extension always uses SidebarLayout (it's a fixed-width side panel)
  if (isExtension) {
    return <SidebarLayout />;
  }

  // 2. Mobile PWA or very narrow browser window
  if (platform === 'mobile-pwa' || windowWidth < 640) {
    return <MobileLayout />;
  }

  // 3. Desktop Web - Narrow/Sidebar view (e.g. user has it as a small window next to other apps)
  if (windowWidth < 1100) {
    return <SidebarLayout />;
  }

  // 4. Desktop Web - Full Dashboard view
  return <DesktopLayout />;
};

export default LayoutSwitcher;
