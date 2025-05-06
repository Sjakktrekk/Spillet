import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      // Hardkodet løsning for admin-sjekk
      if (user.id === '4105763b-0041-498e-8d7f-a9448565903d') {
        console.log('Admin-bruker oppdaget');
        setIsAdmin(true);
      }
    };

    checkAdmin();
  }, [user]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      const { success, error } = await logout();
      
      if (error) {
        console.error('Feil ved utlogging:', error);
        toast.error('Det oppstod en feil ved utlogging. Vennligst prøv igjen.');
        return;
      }

      if (success) {
        // Lukk mobilmenyen hvis den er åpen
        setMobileMenuOpen(false);
        
        // Vis bekreftelse
        toast.success('Du er nå logget ut');
        
        // Naviger til innloggingssiden
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Uventet feil ved utlogging:', error);
      toast.error('Det oppstod en uventet feil ved utlogging. Vennligst prøv igjen.');
    }
  };

  return (
    <nav className="bg-gradient-to-r from-fantasy-primary to-fantasy-dark border-b-3 border-fantasy-secondary shadow-fantasy text-fantasy-light px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 border-2 border-fantasy-secondary rounded-full p-1" />
          <span className="text-xl font-medieval text-fantasy-secondary">Vokterne av Elarion</span>
        </div>
        
        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-1 overflow-x-auto">
          {user ? (
            <>
              <Link
                to="/home"
                className={`${
                  isActive('/home')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
                Kart
              </Link>
              <Link
                to="/character"
                className={`${
                  isActive('/character')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Karakter
              </Link>
              <Link
                to="/inventory"
                className={`${
                  isActive('/inventory')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                Inventar
              </Link>
              <Link
                to="/quests"
                className={`${
                  isActive('/quests')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                Oppdrag
              </Link>
              <Link
                to="/combat"
                className={`${
                  isActive('/combat')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tallenes Tårn
              </Link>
              <Link
                to="/achievements"
                className={`${
                  isActive('/achievements')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
                Prestasjoner
              </Link>
              <Link
                to="/marketplace"
                className={`${
                  isActive('/marketplace')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Markedsplass
              </Link>
              <Link
                to="/travel-journal"
                className={`${
                  isActive('/travel-journal')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                Reisedagbok
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`${
                    isActive('/admin')
                      ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                      : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                  } px-2 py-2 rounded-md text-sm font-medieval flex items-center border-2 transition-all duration-300`}
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </Link>
              )}
              {/* Button for logging out */}
              <button
                onClick={handleLogout}
                className="px-2 py-2 rounded-md text-sm font-medieval flex items-center bg-gradient-to-r from-red-800 to-red-900 text-white border-2 border-red-700 hover:from-red-900 hover:to-red-950 hover:border-red-600 transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Logg ut
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`${
                  isActive('/')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary border-transparent'
                } px-2 py-2 rounded-md text-sm font-medieval border-2 transition-all duration-300`}
              >
                Logg inn
              </Link>
              <Link
                to="/register"
                className="fantasy-button"
              >
                Registrer
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 space-y-2 bg-fantasy-dark/90 rounded-lg p-3 border-2 border-fantasy-secondary">
          {user ? (
            <>
              <Link
                to="/home"
                className={`${
                  isActive('/home')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300 flex items-center`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                </svg>
                Kart
              </Link>
              <Link
                to="/character"
                className={`${
                  isActive('/character')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Karakter
              </Link>
              <Link
                to="/inventory"
                className={`${
                  isActive('/inventory')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Inventar
              </Link>
              <Link
                to="/quests"
                className={`${
                  isActive('/quests')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Oppdrag
              </Link>
              <Link
                to="/combat"
                className={`${
                  isActive('/combat')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Tallenes Tårn
              </Link>
              <Link
                to="/chat"
                className={`${
                  isActive('/chat')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Chat
              </Link>
              <Link
                to="/achievements"
                className={`${
                  isActive('/achievements')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Prestasjoner
              </Link>
              <Link
                to="/marketplace"
                className={`${
                  isActive('/marketplace')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Markedsplass
              </Link>
              <Link
                to="/travel-journal"
                className={`${
                  isActive('/travel-journal')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Reisedagbok
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`${
                    isActive('/admin')
                      ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                      : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                  } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mt-1 w-full px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300 bg-gradient-to-r from-red-800 to-red-900 text-white border-red-700 hover:from-red-900 hover:to-red-950 hover:border-red-600"
              >
                Logg ut
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`${
                  isActive('/')
                    ? 'bg-fantasy-darker text-fantasy-secondary border-fantasy-secondary'
                    : 'text-fantasy-light hover:bg-fantasy-dark hover:text-fantasy-secondary'
                } block px-3 py-2 rounded-md text-base font-medieval border transition-all duration-300`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Logg inn
              </Link>
              <Link
                to="/register"
                className="fantasy-button block text-center mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Registrer
              </Link>
            </>
          )}
          
          <div className="fantasy-divider mt-4"></div>
        </div>
      )}
    </nav>
  );
} 