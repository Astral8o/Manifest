import { useEffect } from 'react';
import { Footer, Header, PassModal, TabBar, Toast } from './components/Chrome';
import { Browse } from './screens/Browse';
import { DealPage } from './screens/DealPage';
import { DesignSystem } from './screens/DesignSystem';
import { Home } from './screens/Home';
import { Saved } from './screens/Saved';
import { Submit } from './screens/Submit';
import { Things } from './screens/Things';
import { useStore } from './store';

export function App() {
  const { screen, dealId, isMobile, pass, closePass } = useStore();

  useEffect(() => {
    if (!pass) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePass();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pass, closePass]);

  const showTabBar = isMobile && screen !== 'deal';
  const showFooter = screen !== 'deal' || !isMobile;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: isMobile ? 96 : 0 }}>
      <Header />
      <main>
        {screen === 'home' && <Home />}
        {screen === 'browse' && <Browse />}
        {screen === 'deal' && <DealPage key={dealId} />}
        {screen === 'things' && <Things />}
        {screen === 'saved' && <Saved />}
        {screen === 'submit' && <Submit />}
        {screen === 'system' && <DesignSystem />}
      </main>
      {showFooter && <Footer />}
      {showTabBar && <TabBar />}
      <PassModal />
      <Toast bottom={isMobile ? 96 : 28} />
    </div>
  );
}
