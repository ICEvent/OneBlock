import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGlobalContext, useSetAgent } from './Store';
import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent, Identity } from '@dfinity/agent';
import { HOST } from '../lib/canisters';
import { ONE_WEEK_NS, IDENTITY_PROVIDER, DERIVATION_ORIGION } from '../lib/constants';
import '../styles/Navbar.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAgent = useSetAgent();
  const { state: { isAuthed } } = useGlobalContext();
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAuthenticated = async (client: AuthClient) => {
    const identity: Identity = client.getIdentity();
    await setAgent({
      agent: new HttpAgent({ identity, host: HOST }),
      isAuthed: true,
    });
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const client = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
          disableDefaultIdleCallback: true,
        },
      });
      if (!active) return;
      setAuthClient(client);
      if (await client.isAuthenticated()) await handleAuthenticated(client);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const login = async () => {
    if (!authClient) return;
    await authClient.login({
      derivationOrigin: DERIVATION_ORIGION,
      identityProvider: IDENTITY_PROVIDER,
      maxTimeToLive: ONE_WEEK_NS,
      onSuccess: async () => {
        await handleAuthenticated(authClient);
        navigate('/console');
      },
    });
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout();
    await setAgent({ agent: null });
    navigate('/');
  };

  return (
    <>
      <nav className="navbar" aria-label="Primary navigation">
        <div className="nav-brand">
          <img src="/logo.webp" alt="" className="nav-logo" />
          <Link to="/"><span>OneBlock</span></Link>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
          aria-controls="primary-nav-links"
        >
          <span aria-hidden="true">☰</span>
        </button>

        <div id="primary-nav-links" className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          {isAuthed ? (
            <>
              <Link to="/console" className={location.pathname === '/console' ? 'active' : ''}>Console</Link>
              <Link to="/policy" className={location.pathname === '/policy' ? 'active' : ''}>Policy</Link>
              <Link to="/oip" className={location.pathname === '/oip' ? 'active' : ''}>Identity model</Link>
              <button onClick={logout} className="logout-btn">Logout</button>
            </>
          ) : (
            <button onClick={login} className="login-btn" disabled={!authClient}>Login</button>
          )}
        </div>
      </nav>
      <ToastContainer />
    </>
  );
};

export default Navbar;
