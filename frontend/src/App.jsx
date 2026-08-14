import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import ReactGA from 'react-ga4'; // Google Analytics
import { AuthContext } from './context/AuthContext';
import { CartContext } from './context/CartContext';

// Páginas y Componentes
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Carrito from './pages/Carrito';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const { user, login, logout } = useContext(AuthContext);
  const { totalCount } = useContext(CartContext); // Badge de prendas
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // 📊 SEGUIMIENTO DE NAVEGACIÓN EN GOOGLE ANALYTICS
  useEffect(() => {
    ReactGA.send({ 
      hitType: 'pageview', 
      page: location.pathname + location.search 
    });
  }, [location]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);

    const result = await login(email, password);
    setLoadingLogin(false);

    if (!result.success) {
      setLoginError(result.message || 'Credenciales incorrectas');
    } else {
      setEmail('');
      setPassword('');
      navigate('/admin');
    }
  };

  const isAdmin = Boolean(
    user && (user.role === 'admin' || user.isAdmin || user.email)
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* NAVBAR DE NAVEGACIÓN */}
      <nav className="bg-stone-900 text-stone-300 py-2.5 px-4 sm:px-8 text-xs font-semibold uppercase tracking-[0.15em] border-b border-stone-800 sticky top-0 z-[100] flex justify-end items-center shadow-md">

        {/* NAVEGACIÓN */}
        <div className="flex items-center space-x-3 sm:space-x-5 text-[11px]">
          <button
            onClick={() => navigate('/')}
            className={`transition pb-0.5 ${
              location.pathname === '/'
                ? 'text-white border-b-2 border-white font-bold'
                : 'hover:text-white'
            }`}
          >
            Inicio
          </button>

          <button
            onClick={() => navigate('/catalogo')}
            className={`transition pb-0.5 ${
              location.pathname === '/catalogo'
                ? 'text-white border-b-2 border-white font-bold'
                : 'hover:text-white'
            }`}
          >
            Catálogo
          </button>

          {/* BOTÓN CARRITO CON CONTADOR FLOTANTE */}
          <button
            onClick={() => navigate('/carrito')}
            className={`transition pb-0.5 flex items-center gap-1.5 relative ${
              location.pathname === '/carrito'
                ? 'text-white border-b-2 border-white font-bold'
                : 'hover:text-white'
            }`}
          >
            <span>🛒 Carrito</span>
            {totalCount > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center leading-tight shadow-xs">
                {totalCount}
              </span>
            )}
          </button>

          {/* 🔒 BOTÓN PANEL LOGÍSTICA */}
          <button
            onClick={() => navigate(isAdmin ? '/admin' : '/login')}
            className={`transition px-2 py-0.5 rounded text-[9px] font-medium tracking-normal border ${
              location.pathname === '/admin' || location.pathname === '/login'
                ? 'bg-stone-800 text-rose-200 border-rose-200/50'
                : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700'
            }`}
            title="Acceso Gestión"
          >
            🔐 Panel
          </button>

          {user && (
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="text-stone-500 hover:text-rose-400 transition text-[9px]"
              title="Cerrar Sesión"
            >
              (Salir)
            </button>
          )}
        </div>
      </nav>

      {/* RENDERIZADO DE VISTAS */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/carrito" element={<Carrito />} />
          
          <Route 
            path="/login" 
            element={
              isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <div className="max-w-md mx-auto my-16 p-6 sm:p-8 bg-white rounded-xl shadow-lg border border-stone-200">
                  <div className="text-center mb-6">
                    <span className="text-4xl">🔐</span>
                    <h2 className="text-xl font-bold text-stone-800 mt-2">Acceso Exclusivo</h2>
                  </div>

                  {loginError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg text-center font-medium">
                      {loginError}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Email de Administración</label>
                      <input
                        type="email"
                        required
                        placeholder="admin@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Contraseña</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingLogin}
                      className="w-full py-3 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 transition shadow-sm uppercase tracking-wider text-[11px] disabled:opacity-50"
                    >
                      {loadingLogin ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                  </form>
                </div>
              )
            } 
          />

          <Route 
            path="/admin" 
            element={isAdmin ? <AdminPanel /> : <Navigate to="/login" replace />} 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}