import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { 
  LayoutDashboard, Calendar, Folder, Settings, LogOut, 
  Dumbbell, Activity, TrendingUp, CalendarDays
} from 'lucide-react';
import logoOs from '../../assets/logo-os.png';
import logoName from '../../assets/logo-name.png';

// Importamos los submódulos (Asegúrate de crearlos luego)
import Rutinas from './components/Rutinas';
import Ejercicios from './components/Ejercicios';
import Progreso from './components/Progreso';
import ClasesGrupales from './components/ClasesGrupales';

import './AventuraGym.css';

export default function AventuraGym() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rutina');

  const handleLogout = async () => { try { await signOut(auth); } catch (e) { console.error(e); } };

  return (
    <div className="dash-layout">
      {/* SIDEBAR UNIFICADO */}
      <aside className="dash-sidebar">
        <div className="dash-logo-container">
          <img src={logoOs} alt="OS" className="dash-logo-icon" />
          <img src={logoName} alt="Outstanding" className="dash-logo-text" />
        </div>
        <nav className="dash-nav">
          <ul className="nav-list">
            <li className="nav-item" onClick={() => navigate('/')}><LayoutDashboard size={14} /> Dashboard</li>
            <li className="nav-item" onClick={() => navigate('/tasks')}><Folder size={14} /> Tareas</li>
            <li className="nav-item" onClick={() => navigate('/calendar')}><Calendar size={14} /> Calendario</li>
            <li className="nav-item active"><Dumbbell size={14} /> Aventura Gym</li>
          </ul>
        </nav>
        <div className="dash-bottom-nav">
          <ul className="nav-list">
            <li className="nav-item"><Settings size={14} /> Configuración</li>
            <li className="nav-item logout" onClick={handleLogout}><LogOut size={14} /> Cerrar Sesión</li>
          </ul>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="dash-main" style={{ overflow: 'hidden' }}> {/* Ocultamos scroll aquí */}
        
        {/* HEADER DE PESTAÑAS (Fijo gracias a flex-shrink) */}
        <div className="gym-tabs-header">
          <button className={`gym-tab ${activeTab === 'rutina' ? 'active' : ''}`} onClick={() => setActiveTab('rutina')}><CalendarDays size={14}/> Calendario & Rutina</button>
          <button className={`gym-tab ${activeTab === 'ejercicios' ? 'active' : ''}`} onClick={() => setActiveTab('ejercicios')}><Dumbbell size={14}/> Ejercicios</button>
          <button className={`gym-tab ${activeTab === 'clases' ? 'active' : ''}`} onClick={() => setActiveTab('clases')}><Activity size={14}/> Horarios Grupales</button>
          <button className={`gym-tab ${activeTab === 'progreso' ? 'active' : ''}`} onClick={() => setActiveTab('progreso')}><TrendingUp size={14}/> Progreso</button>
        </div>

        {/* ÁREA DE CONTENIDO (Esta es la que hace Scroll) */}
        <div className="gym-content">
          {activeTab === 'rutina' && <Rutinas />}
          {activeTab === 'ejercicios' && <Ejercicios />}
          {activeTab === 'clases' && <ClasesGrupales />}
          {activeTab === 'progreso' && <Progreso />}
        </div>
      </main>
    </div>
  );
}