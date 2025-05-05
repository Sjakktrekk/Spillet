import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Navbar from './components/Navigation/Navbar'
import Character from './pages/Character'
import CharacterCreation from './pages/CharacterCreation'
import City from './pages/City'
import Quests from './pages/Quests'
import Inventory from './pages/Inventory'
import Chat from './pages/Chat'
import Achievements from './pages/Achievements'
import Shop from './pages/Shop'
import Marketplace from './pages/Marketplace'
import TravelJournal from './pages/TravelJournal'
import CombatArena from './pages/CombatArena'
import AdminDashboard from './components/Admin/AdminDashboard'
import { AchievementProvider } from './components/Achievements/AchievementContext'
import { LevelUpProvider } from './hooks/useLevelUpModal'
import LevelUpModal from './components/LevelUpModal'
import { ItemProvider } from './components/Items/ItemContext'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LevelUpProvider>
          <AchievementProvider>
            <ItemProvider>
              <div className="min-h-screen bg-gray-900 flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                      path="/home" 
                      element={
                        <ProtectedRoute>
                          <Home />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/character" 
                      element={
                        <ProtectedRoute>
                          <Character />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/character-creation" 
                      element={
                        <ProtectedRoute>
                          <CharacterCreation />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/city/:cityId" 
                      element={
                        <ProtectedRoute>
                          <City />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/shop/:cityId" 
                      element={
                        <ProtectedRoute>
                          <Shop />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/quests" 
                      element={
                        <ProtectedRoute>
                          <Quests />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/quests/:questId" 
                      element={
                        <ProtectedRoute>
                          <Quests />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/inventory" 
                      element={
                        <ProtectedRoute>
                          <Inventory />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/chat" 
                      element={
                        <ProtectedRoute>
                          <Chat />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/achievements" 
                      element={
                        <ProtectedRoute>
                          <Achievements />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/marketplace" 
                      element={
                        <ProtectedRoute>
                          <Marketplace />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/travel-journal" 
                      element={
                        <ProtectedRoute>
                          <TravelJournal />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/combat" 
                      element={
                        <ProtectedRoute>
                          <CombatArena />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/combat/:monsterLevel" 
                      element={
                        <ProtectedRoute>
                          <CombatArena />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </main>
                <footer className="bg-gray-800 text-gray-400 py-4 text-center">
                  <div className="container mx-auto">
                    <p>© 2024 Vokterne av Elarion. Alle rettigheter forbeholdt.</p>
                  </div>
                </footer>
                
                {/* Level Up Modal */}
                <LevelUpModal />
              </div>
            </ItemProvider>
          </AchievementProvider>
        </LevelUpProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
