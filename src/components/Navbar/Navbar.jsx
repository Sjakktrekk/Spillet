import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="bg-gray-800 bg-opacity-90 border-b border-gray-700 shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              {/* Fantasy game logo */}
              <div className="flex-shrink-0 bg-gradient-to-br from-yellow-600 to-yellow-800 p-1 rounded-full border-2 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                <svg className="h-8 w-8 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zm0 5h16m-8-8v16"
                  />
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-yellow-500 tracking-wider">SPILLET</span>
            </Link>
            
            {/* Main navigation links */}
            {user && (
              <div className="ml-10 flex items-center space-x-4">
                <Link 
                  to="/home" 
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors relative group"
                >
                  Hjem
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-yellow-500 transition-all group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/character" 
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors relative group"
                >
                  Karakter
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-yellow-500 transition-all group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/inventory" 
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors relative group"
                >
                  Inventar
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-yellow-500 transition-all group-hover:w-full"></span>
                </Link>
                <Link 
                  to="/quests" 
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors relative group"
                >
                  Oppdrag
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-yellow-500 transition-all group-hover:w-full"></span>
                </Link>
              </div>
            )}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center">
            {user ? (
              <div className="ml-4 flex items-center">
                {/* User Profile Preview */}
                <div className="flex items-center mr-4">
                  <div className="w-8 h-8 rounded-full bg-gray-700 border border-yellow-600 flex items-center justify-center overflow-hidden text-yellow-400 font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-2 text-sm font-medium text-gray-300">
                    {user.email?.split('@')[0]}
                    <div className="text-xs text-gray-500">Nivå 1 Eventyrer</div>
                  </div>
                </div>
                
                {/* Logout button */}
                <button 
                  onClick={handleLogout}
                  className="flex items-center px-3 py-1.5 bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-medium rounded border border-red-950 shadow-sm text-sm"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logg ut
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors"
                >
                  Logg inn
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 rounded-md border border-yellow-900 shadow-sm"
                >
                  Registrer
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 