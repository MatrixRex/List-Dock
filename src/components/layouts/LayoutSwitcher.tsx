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

  // 2. Mobile Layout - Only for small phone screens
  // We prioritize width over platform to allow tablets (PWAs) to use the Desktop/Sidebar UI
  if (windowWidth < 500) {
    return <MobileLayout />;
  }

  // 3. Desktop Web / Tablet - Sidebar view (Narrow dashboard)
  if (windowWidth < 1024) {
    return <SidebarLayout />;
  }

  // 4. Desktop Web - Full Dashboard view for laptops and larger screens
  return <DesktopLayout />;
};

export default LayoutSwitcher;
