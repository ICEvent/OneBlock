import React,{ useState, useEffect} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobalContext, useOneblock, useSetAgent, useProfile } from './Store';

import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Identity } from "@dfinity/agent";
import { HOST } from "../lib/canisters";
import { ONE_WEEK_NS, IDENTITY_PROVIDER } from "../lib/constants";
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const oneblock = useOneblock();
  const setAgent = useSetAgent();
  const { state: { isAuthed, principal } } = useGlobalContext();

  const { profile, setProfile } = useProfile();
  const [authClient, setAuthClient] = useState<AuthClient>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const authClient = await AuthClient.create(
        {
          idleOptions: {
            disableIdle: true,
            disableDefaultIdleCallback: true
          }
        }
      );
      setAuthClient(authClient);

      if (await authClient.isAuthenticated()) {
        handleAuthenticated(authClient);    
      }
    })();
  }, [isAuthed]);

  const handleAuthenticated = async (authClient: AuthClient) => {
    const identity: Identity = authClient.getIdentity();
    setAgent({
      agent: new HttpAgent({
        identity,
        host: HOST,
      }),
      isAuthed: true,
    });
  };

  const login = async () => {
    authClient.login({
      identityProvider: IDENTITY_PROVIDER,
      maxTimeToLive: ONE_WEEK_NS,
      onSuccess: () => handleAuthenticated(authClient),
    });
  };

  const logout = async () => {
    await authClient.logout();
    setAgent({ agent: null });
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
      <img src="/logo.webp" alt="OneBlock" className="nav-logo" />
        <Link to="/">OneBlock</Link>
      </div>
      
      <button 
        className="menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span>☰</span>
      </button>

      <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        {isAuthed ? (
          <>
             <Link to="/console" className={location.pathname === '/console' ? 'active' : ''}>Console</Link>
             <button onClick={logout} className="logout-btn"> Logout</button>
          </>
        ) : (
          <button onClick={login} className="login-btn">
            Login with Internet Identity
          </button>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
