import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import ReactGA from 'react-ga4'; // Google Analytics
import { AuthContext } from './context/AuthContext';
import { CartContext } from './context/CartContext';

// Páginas y Componentes
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Carrito from './pages/Carrito';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import Arrepentimiento from './pages/Arrepentimiento';
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

    const success = await login(email, password);
    setLoadingLogin(false);

    if (success) {
      navigate('/admin');
    } else {
      setLoginError('Credenciales incorrectas. Verificá tu correo y contraseña.');
    }
  };

  const isAdmin = user && (user.role === 'admin' || user.isAdmin);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col font-sans">
      
      {/* CONTENIDO PRINCIPAL Y RUTAS */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/arrepentimiento" element={<Arrepentimiento />} />

          <Route 
            path="/login" 
            element={
              isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <div className="max-w-md mx-auto my-12 p-6 bg-white border border-stone-200 shadow-md rounded-xl">
                  <h2 className="text-xl font-bold mb-4 text-center text-stone-900 uppercase tracking-wide">
                    Panel de Administración
                  </h2>

                  {loginError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg text-center font-medium">
                      {loginError}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        placeholder="luisinnapilcheria@gmail.com"
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