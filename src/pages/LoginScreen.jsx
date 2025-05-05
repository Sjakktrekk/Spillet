import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import loginBackground from '../assets/login.jpg'

export default function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: `${username}@example.com`, // Bruker fake e-post for Supabase
          password: password,
        })
        if (error) throw error
        navigate('/character-creation')
      } else {
        const { error } = await supabase.auth.signUp({
          email: `${username}@example.com`,
          password: password,
        })
        if (error) throw error
        setIsLogin(true)
      }
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(${loginBackground})`,
      }}
    >
      <div className="bg-gray-900 bg-opacity-80 p-8 rounded-lg shadow-md w-96 border border-yellow-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-yellow-400">
          {isLogin ? 'Logg inn' : 'Registrer deg'}
        </h2>
        
        {error && (
          <div className="bg-red-900 bg-opacity-80 border border-red-700 text-white px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-yellow-300 text-sm font-bold mb-2">
              Brukernavn
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border border-gray-700 bg-gray-800 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-yellow-300 text-sm font-bold mb-2">
              Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border border-gray-700 bg-gray-800 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {isLogin ? 'Logg inn' : 'Registrer'}
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-yellow-400 hover:text-yellow-300"
            >
              {isLogin ? 'Ny bruker? Registrer deg' : 'Har du konto? Logg inn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 