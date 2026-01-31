import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Home, BarChart2, PlusCircle } from 'lucide-react';
import { I18N } from './i18n/es';
import './App.css';

// Pages
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Stats from './pages/Stats';
import ManageKanji from './pages/ManageKanji';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="container">
      <header className="glass-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {I18N.appTitle}
            </h2>
          </Link>

          <nav className="desktop-nav">
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 'bold' }}>{I18N.home}</Link>
            <Link to="/manage" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 'bold' }}>{I18N.createSet}</Link>
            <Link to="/stats" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 'bold' }}>{I18N.statsTitle}</Link>
          </nav>
        </div>

        <button onClick={toggleTheme} className="btn-icon">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <main style={{ flex: 1, position: 'relative' /* for absolute positioning if needed */ }}>
        {children}
      </main>

      <nav className="mobile-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-secondary)',
        borderTop: '2px solid var(--border)', /* Thicker border */
        justifyContent: 'space-around',
        padding: '1rem',
        zIndex: 100,
        paddingBottom: 'safe-area-inset-bottom' /* Handle iPhone Notch/Home Bar */
      }}>
        <NavLink to="/" icon={<Home size={28} />} active={location.pathname === '/'} />
        <NavLink to="/manage" icon={<PlusCircle size={28} />} active={location.pathname === '/manage'} />
        <NavLink to="/stats" icon={<BarChart2 size={28} />} active={location.pathname === '/stats'} />
      </nav>
      {/* Spacer for bottom nav */}
      <div className="mobile-nav" style={{ height: '100px' }} />
    </div>
  );
};

const NavLink = ({ to, icon, active }: { to: string, icon: React.ReactNode, active: boolean }) => (
  <Link to={to} style={{
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    transition: 'color 0.2s',
  }}>
    {icon}
  </Link>
);

import Study from './pages/Study';

// ... inside Layout ...

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/study" element={<Study />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/manage" element={<ManageKanji />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
