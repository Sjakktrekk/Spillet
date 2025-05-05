import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import loginBackground from '../assets/login.jpg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signIn(email, password)
      navigate('/home')
    } catch (error) {
      setError('Feil e-post eller passord. Prøv igjen.')
      console.error('Innloggingsfeil:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(${loginBackground})`,
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-24 h-24 mb-6 bg-contain bg-center bg-no-repeat border-3 border-fantasy-secondary rounded-full shadow-fantasy" 
          style={{ backgroundImage: 'url("https://static.vecteezy.com/system/resources/previews/009/664/031/original/shield-with-sword-game-icon-free-vector.jpg")' }}>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-500 mb-2 font-medieval">Vokterne av Elarion</h1>
          <p className="text-gray-400">Et episk fantasy-rollespill</p>
        </div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="fantasy-container relative">
          {/* Dekorative hjørner */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-fantasy-secondary"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-fantasy-secondary"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-fantasy-secondary"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-fantasy-secondary"></div>
          
          <h3 className="fantasy-header text-center mb-6">Innlogging</h3>
          
          <div className="fantasy-divider"></div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medieval text-fantasy-secondary"
              >
                E-post
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="fantasy-input w-full"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medieval text-fantasy-secondary"
              >
                Passord
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fantasy-input w-full"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/80 text-fantasy-light px-4 py-3 rounded-md text-sm border border-red-700">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                  {error}
                </span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="fantasy-button w-full flex justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-fantasy-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logger inn...
                  </span>
                ) : 'Logg inn'}
              </button>
            </div>
          </form>

          <div className="fantasy-divider my-6"></div>

          <div className="mt-6">
            <Link
              to="/register"
              className="fantasy-button bg-fantasy-dark hover:bg-fantasy-primary w-full flex justify-center"
            >
              Registrer ny konto
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 