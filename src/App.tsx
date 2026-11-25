import { useEffect } from 'react';
import { Footer, Header, PassModal, TabBar, Toast } from './components/Chrome';
import { Browse } from './screens/Browse';
import { DealPage } from './screens/DealPage';
import { Directory } from './screens/Directory';
import { Home } from './screens/Home';
import { Saved } from './screens/Saved';
import { Submit } from './screens/Submit';
import { Things } from './screens/Things';
import { Privacy } from './screens/Privacy';
import { HowItWorks } from './screens/HowItWorks';
import { useStore } from './store';
import { DEALS } from './data';
import { trackDeal } from './analytics';

const TITLES: Record<string, string> = {
  home: 'EventoryTT · Today’s best deals in T&T',
  browse: 'All deals in Trinidad & Tobago | EventoryTT',
  things: 'Things to do in Trinidad & Tobago: events calendar | EventoryTT',
  directory: 'Business directory | EventoryTT',
  saved: 'Saved deals | EventoryTT',
  submit: 'List your deal for free | EventoryTT',
  privacy: 'Privacy | EventoryTT',
  'how-it-works': 'How it works: list your deal free | EventoryTT',
};

export function App() {
  const { screen, dealId, isMobile, pass, closePass } = useStore();

  useEffect(() => {
    if (!pass) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePass();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pass, closePass]);

  // Keep the tab title in step with the page (search engines and analytics read it).
  useEffect(() => {
    const d = screen === 'deal' ? DEALS.find((x) => x.id === dealId) : undefined;
    if (d) trackDeal('view_deal', d);
    document.title = d ? `${d.title}${d.eventDate ? '' : ` at ${d.biz}`} | EventoryTT` : TITLES[screen] ?? TITLES.home;
    const c = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (c) c.href = `https://www.eventorytt.com${location.pathname}`;
  }, [screen, dealId]);

  const showTabBar = isMobile && screen !== 'deal';
  const showFooter = screen !== 'deal' || !isMobile;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: isMobile ? 96 : 0 }}>
      <Header />
      <main>
        {screen === 'home' && <Home />}
        {screen === 'browse' && <Browse />}
        {screen === 'privacy' && <Privacy />}
        {screen === 'how-it-works' && <HowItWorks />}
        {screen === 'deal' && <DealPage key={dealId} />}
        {screen === 'things' && <Things />}
        {screen === 'directory' && <Directory />}
        {screen === 'saved' && <Saved />}
        {screen === 'submit' && <Submit />}
      </main>
      {showFooter && <Footer />}
      {showTabBar && <TabBar />}
      <PassModal />
      <Toast bottom={isMobile ? 96 : 28} />
    </div>
  );
}
