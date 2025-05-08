import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Definer logout-funksjonen utenfor useEffect
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem('supabase.auth.token')
      return true
    } catch (error) {
      console.error('Utloggingsfeil:', error)
      throw error
    }
  }

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
          await logout()
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

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [navigate])

  const login = async (email, password) => {
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

  const signup = async (email, password) => {
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
    login,
    logout,
    signup,
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