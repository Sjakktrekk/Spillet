import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Sjekk autentiseringsstatus når komponenten lastes
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Feil ved henting av bruker:', error)
        // Hvis det er en refresh token feil, logg ut brukeren
        if (error.message && error.message.includes('Refresh Token Not Found')) {
          await handleLogout()
          toast.error('Din økt har utløpt. Vennligst logg inn igjen.')
          navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Lytt til autentiseringsendringer
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null)
        } else if (event === 'USER_UPDATED') {
          setUser(session?.user || null)
        }
      }
    )

    // Håndter refresh token feil
    const handleAuthError = (error) => {
      if (error.message && error.message.includes('Refresh Token Not Found')) {
        handleLogout()
        toast.error('Din økt har utløpt. Vennligst logg inn igjen.')
        navigate('/login')
      }
    }

    // Legg til global error handler for Supabase-feil
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Refresh Token Not Found')) {
        handleAuthError(event.reason)
      }
    })

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [navigate])

  const handleLogin = async (email, password) => {
    try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
      if (error) throw error
    
      return { success: true, data }
    } catch (error) {
      console.error('Innloggingsfeil:', error)
      return { success: false, error: error.message }
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      // Tøm lokal lagring for å sikre at alle tokens er fjernet
      localStorage.removeItem('supabase.auth.token')
      return { success: true }
    } catch (error) {
      console.error('Utloggingsfeil:', error)
      return { success: false, error: error.message }
    }
  }

  const handleSignup = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Registreringsfeil:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    signup: handleSignup,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth må brukes innenfor en AuthProvider')
  }
  return context
} 