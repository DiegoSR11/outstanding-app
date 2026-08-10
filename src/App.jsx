import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebaseConfig';

// Importamos nuestras 3 vistas principales
import Auth from './features/auth/Auth';
import Dashboard from './features/dashboard/Dashboard';
import Tasks from './features/tasks/Tasks';
import Calendar from './features/calendar/Calendar';
import Ruleta from './features/ruleta/Ruleta';
import Habitos from './features/habitos/Habitos';
import Proyectos from './features/proyectos/Proyectos';
import AventuraGym from './features/aventuragym/AventuraGym';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Revisa el estado de Firebase en tiempo real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Pantalla de carga oscura y elegante
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#141416', color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
        <h2>Cargando Outstanding...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: Login/Registro */}
        <Route 
          path="/login" 
          element={!user ? <Auth /> : <Navigate to="/" />} 
        />
        <Route path="/ruleta" element={<Ruleta />} />
        <Route
          path="/habitos"
          element={<Habitos />}
        />+<Route
          path="/proyectos"
          element={<Proyectos />}
        />
        <Route 
          path="/" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route path="/aventuragym" element={<AventuraGym />} />

        <Route 
          path="/tasks" 
          element={user ? <Tasks /> : <Navigate to="/login" />} 
        /> 
        <Route
        path="/calendar"
        element={<Calendar />}
        />
        </Routes>

    </BrowserRouter>
  );
}

export default App;