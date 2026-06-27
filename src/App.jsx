import { HashRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Matches from './pages/Matches'
import Ranking from './pages/Ranking'
import ElijoCreer from './pages/ElijoCreer'
import Knockout from './pages/Knockout'
import Profile from './pages/Profile'
import Footer from './components/Footer'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
          Cargando...
        </p>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" />
}

function Navbar() {
  const { user } = useAuth()

  const linkClassName = ({ isActive }) => [
    'rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-sm',
    isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  ].join(' ')

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <nav className="mx-auto w-full max-w-6xl px-3 py-2 sm:px-4 md:hidden">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <NavLink to="/partidos" className={linkClassName}>
            ⚽ Partidos
          </NavLink>
          <NavLink to="/eliminatorias" className={linkClassName}>
            🏅 Eliminatorias
          </NavLink>
          <NavLink to="/ranking" className={linkClassName}>
            🏆 Ranking
          </NavLink>
          <NavLink to="/elijo-creer" className={linkClassName}>
            🔥 Elijo creer
          </NavLink>

          {!user ? (
            <NavLink to="/login" className={`${linkClassName({ isActive: false })} ml-auto`}>
              Ingresar
            </NavLink>
          ) : (
            <NavLink to="/perfil" className={`${linkClassName({ isActive: false })} ml-auto max-w-[9rem] truncate`}>
              {user.user_metadata?.username ?? 'Usuario'}
            </NavLink>
          )}
        </div>

      </nav>

      <nav className="mx-auto hidden w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 md:grid lg:px-8">
        <div className="flex items-center gap-2 justify-self-start">
          <NavLink to="/partidos" className={linkClassName}>
            ⚽ Partidos
          </NavLink>
          <NavLink to="/eliminatorias" className={linkClassName}>
            🏅 Eliminatorias
          </NavLink>
          <NavLink to="/ranking" className={linkClassName}>
            🏆 Ranking
          </NavLink>
          <NavLink to="/elijo-creer" className={linkClassName}>
            🔥 Elijo creer
          </NavLink>
        </div>

        <p className="whitespace-nowrap text-center text-lg font-light text-slate-400">
          P R O D E M U N D I A L  2 0 2 6
        </p>

        <div className="justify-self-end">
          {!user ? (
            <NavLink to="/login" className={linkClassName({ isActive: false })}>
              Ingresar
            </NavLink>
          ) : (
            <NavLink to="/perfil" className={`${linkClassName({ isActive: false })} max-w-[12rem] truncate`}>
              {user.user_metadata?.username ?? 'Usuario'}
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/partidos" element={<PrivateRoute><Matches /></PrivateRoute>} />
              <Route path="/eliminatorias" element={<PrivateRoute><Knockout /></PrivateRoute>} />
              <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
              <Route path="/elijo-creer" element={<PrivateRoute><ElijoCreer /></PrivateRoute>} />
              <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/partidos" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </AuthProvider>
  )
}