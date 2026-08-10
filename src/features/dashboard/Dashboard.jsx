import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { 
  LayoutDashboard, Calendar, Folder, 
  Settings, LogOut, Bell,
  CheckCircle2, Clock, AlertCircle, ChevronRight, TrendingUp, BarChart2,
  Search, ArrowDownAZ, ArrowUpZA
} from 'lucide-react';
import logoOs from '../../assets/logo-os.png';
import logoName from '../../assets/logo-name.png';
import './Dashboard.css';

// Lista de herramientas para renderizado dinámico y filtrado
const initialTools = [
  { id: 'perfil', name: 'Editar Perfil', path: '/perfil', className: 'card-perfil' },
  { id: 'tareas', name: 'Tareas', path: '/tasks', className: 'card-tareas' },
  { id: 'calendario', name: 'Calendario', path: '/calendar', className: 'card-calendario' },
  { id: 'alimenticio', name: 'Calendario Alimenticio', path: '/alimenticio', className: 'card-food' },
  { id: 'proyectos', name: 'Proyectos', path: '/proyectos', className: 'card-proyectos' },
  { id: 'social', name: 'Social', path: '/social', className: 'card-social' },
  { id: 'ruleta', name: 'Ruleta', path: '/ruleta', className: 'card-ruleta' },
  { id: 'notas', name: 'Notas Rápidas', path: '/notas', className: 'card-notas' },
  { id: 'habitos', name: 'Hábitos', path: '/habitos', className: 'card-habitos' },
  { id: 'aventuragym', name: 'Aventura Gym', path: '/aventuragym', className: 'card-aventuragym' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  
  // Estados para búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksArray);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error('Error', error); }
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDIENTE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'EN PROCESO').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETADO').length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const registeredThisMonth = tasks.filter(t => {
    if (!t.createdAt) return false;
    const d = new Date(t.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const completedThisMonth = tasks.filter(t => {
    if (t.status !== 'COMPLETADO' || !t.createdAt) return false;
    const d = new Date(t.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Lógica de Filtrado y Ordenamiento
  let displayedTools = initialTools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortOrder === 'asc') {
    displayedTools.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOrder === 'desc') {
    displayedTools.sort((a, b) => b.name.localeCompare(a.name));
  }

  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder('none'); // Resetea al orden original
  };

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-logo-container">
          <img src={logoOs} alt="OS" className="dash-logo-icon" />
          <img src={logoName} alt="Outstanding" className="dash-logo-text" />
        </div>
        <nav className="dash-nav">
          <ul className="nav-list">
            <li className="nav-item active"><LayoutDashboard size={14} /> Dashboard</li>
            <li className="nav-item" onClick={() => navigate('/tasks')}><Folder size={14} /> Tareas</li>
            <li className="nav-item" onClick={() => navigate('/calendar')}><Calendar size={14} /> Calendario</li>
          </ul>
        </nav>
        <div className="dash-bottom-nav">
          <ul className="nav-list">
            <li className="nav-item"><Settings size={14} /> Configuración</li>
            <li className="nav-item logout" onClick={handleLogout}><LogOut size={14} /> Cerrar Sesión</li>
          </ul>
        </div>
      </aside>

      <main className="dash-main">
        <header className="main-header">
          <div className="header-greeting"><h2>Hola Diego</h2></div>
          <div className="user-avatar">DR</div>
        </header>

        <div className="main-content">
          <div className="summary-panel">
            <div className="summary-left">
              <h3 className="summary-title">Estado Actual</h3>
              <div className="summary-stats-row">
                <div className="stat-item"><div className="stat-icon red"><AlertCircle size={16} /></div><div className="stat-data"><span className="stat-label">Pendientes</span><span className="stat-value">{pendingTasks}</span></div></div>
                <div className="stat-item"><div className="stat-icon yellow"><Clock size={16} /></div><div className="stat-data"><span className="stat-label">En Proceso</span><span className="stat-value">{inProgressTasks}</span></div></div>
                <div className="stat-item completed-highlight"><div className="stat-icon green"><CheckCircle2 size={16} /></div><div className="stat-data"><span className="stat-label">Completadas</span><span className="stat-value">{completedTasks}</span></div></div>
              </div>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-right">
              <h3 className="summary-title">{monthNames[currentMonth]}</h3>
              <div className="month-stats-container">
                <div className="month-sub-box"><div className="month-sub-info"><BarChart2 size={14} color="#71717a" /><span>Registrados</span></div><span className="month-sub-value">{registeredThisMonth}</span></div>
                <div className="month-sub-box highlight-blue"><div className="month-sub-info"><TrendingUp size={14} color="#60a5fa" /><span>Completados</span></div><span className="month-sub-value">{completedThisMonth}</span></div>
              </div>
            </div>
          </div>

          <div className="files-header">
            <h3 className="sub-title">Todas mis herramientas</h3>
            
            {/* CONTROLES DE BÚSQUEDA Y ORDEN */}
            <div className="tools-controls">
              <div className="tools-search">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className={`tools-sort-btn ${sortOrder !== 'none' ? 'active' : ''}`} 
                onClick={toggleSort}
                title="Ordenar alfabéticamente"
              >
                {sortOrder === 'desc' ? <ArrowUpZA size={14} /> : <ArrowDownAZ size={14} />}
              </button>
            </div>
          </div>

          {/* GRID DE HERRAMIENTAS DINÁMICO */}
          <div className="tools-grid">
            {displayedTools.length > 0 ? (
              displayedTools.map(tool => (
                <div key={tool.id} className={`tool-card ${tool.className}`} onClick={() => navigate(tool.path)}>
                  <h4>{tool.name}</h4>
                </div>
              ))
            ) : (
              <div className="tools-empty">
                No se encontraron herramientas con "{searchTerm}"
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}