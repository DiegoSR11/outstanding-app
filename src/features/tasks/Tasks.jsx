import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { 
  LayoutDashboard, Calendar, Folder, 
  Settings, LogOut, Star, Menu, X, Clock, Edit2, Trash2, Eye, AlertTriangle, ChevronRight 
} from 'lucide-react';
import logoOs from '../../assets/logo-os.png';
import logoName from '../../assets/logo-name.png';
import './Tasks.css';

export default function Tasks() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tasks, setTasks] = useState([]);

  // --- ESTADOS PARA BÚSQUEDA Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos'); // 'Todos' | 'Destacados'
  const [sortOrder, setSortOrder] = useState('Recientes'); // 'Recientes' | 'Antiguos'

  // --- ESTADOS DEL MODAL Y MENÚ CONTEXTUAL ---
  const [modal, setModal] = useState({ isOpen: false, mode: 'create', task: null, defaultStatus: 'PENDIENTE' });
  const [formData, setFormData] = useState({ title: '', status: 'PENDIENTE' });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, task: null });

  // Cerrar menú contextual si se hace click fuera
  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  // --- 1. LECTURA EN TIEMPO REAL DESDE FIRESTORE ---
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Consulta para traer SOLO las tareas del usuario logueado
    const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksArray = [];
      querySnapshot.forEach((doc) => {
        tasksArray.push({ id: doc.id, ...doc.data() });
      });
      setTasks(tasksArray);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error('Error:', error); }
  };

  // --- 2. LÓGICA DE FILTRADO Y BÚSQUEDA ---
  // Se calcula en tiempo real según lo que el usuario escriba o seleccione
  const filteredTasks = tasks.filter(task => {
    const searchLower = searchTerm.toLowerCase();
    
    // Extraemos los últimos 6 dígitos del ID de Firebase para usarlos como Código
    const shortCode = `#${task.id.slice(-6).toUpperCase()}`;
    const taskTitle = (task.title || task.description || '').toLowerCase();
    
    // Validar Búsqueda (por ID o por texto)
    const matchesSearch = shortCode.toLowerCase().includes(searchLower) || taskTitle.includes(searchLower);
    
    // Validar Filtro (Estrellitas)
    const matchesFilter = filterType === 'Todos' || (filterType === 'Destacados' && task.isStarred);
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    // Validar Orden (Fechas)
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return sortOrder === 'Recientes' ? dateB - dateA : dateA - dateB;
  });

  // --- 3. FUNCIONES DEL MODAL (CREAR, EDITAR, ELIMINAR) ---
  const openCreateModal = (status) => {
    setFormData({ title: '', status: status });
    setModal({ isOpen: true, mode: 'create', task: null, defaultStatus: status });
  };

  const openViewModal = (task) => {
    setModal({ isOpen: true, mode: 'view', task: task, defaultStatus: task.status });
  };

  const openEditModal = (task) => {
    setFormData({ title: task.title || task.description || '', status: task.status });
    setModal({ isOpen: true, mode: 'edit', task: task, defaultStatus: task.status });
  };

  const openDeleteModal = (task) => {
    setModal({ isOpen: true, mode: 'delete', task: task, defaultStatus: task.status });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'create', task: null, defaultStatus: 'PENDIENTE' });
  };

  const saveModal = async () => {
    if (!formData.title.trim()) return;

    try {
      if (modal.mode === 'create') {
        // YA NO CREAMOS CÓDIGO RANDOM, USAMOS EL ID DE FIRESTORE
        await addDoc(collection(db, 'tasks'), {
          title: formData.title.trim(),
          description: formData.title.trim(), // Se guarda en ambos para retrocompatibilidad
          status: formData.status,
          isStarred: false,
          createdAt: new Date().toISOString(),
          userId: auth.currentUser.uid 
        });
      } else if (modal.mode === 'edit') {
        const taskRef = doc(db, 'tasks', modal.task.id);
        await updateDoc(taskRef, {
          title: formData.title.trim(),
          description: formData.title.trim(), 
          status: formData.status
        });
      }
      closeModal();
    } catch (error) {
      console.error('Error guardando tarea:', error);
    }
  };

  const confirmDelete = async () => {
    if (!modal.task) return;
    try {
      await deleteDoc(doc(db, 'tasks', modal.task.id));
      closeModal();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const toggleStar = async (taskId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { isStarred: !currentStatus });
    } catch (error) { console.error('Error:', error); }
  };

  // --- DRAG AND DROP ---
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
    setTimeout(() => { e.target.classList.add('is-dragging'); }, 0);
  };
  const handleDragEnd = (e) => { e.target.classList.remove('is-dragging'); };
  const handleDragOver = (e) => { e.preventDefault(); };
  
  const handleDrop = async (e, newStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    // Actualización optimista (UI primero)
    setTasks(tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
    try { 
      // Base de datos después
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus }); 
    } catch (error) {}
  };

  const handleContextMenu = (e, task) => {
    e.preventDefault(); 
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, task });
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Sin fecha';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusClass = (status) => {
    if (status === 'PENDIENTE') return 'status-red';
    if (status === 'EN PROCESO') return 'status-yellow';
    if (status === 'COMPLETADO') return 'status-green';
    return '';
  };

  const renderColumn = (statusName) => {
    // Usamos filteredTasks en lugar de tasks para que la columna respete el buscador
    const columnTasks = filteredTasks.filter(task => task.status === statusName);
    
    return (
      <div className="kanban-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, statusName)}>
        <div className="kanban-col-header">
          <h3>{statusName}</h3>
          <span className="badge-count">{columnTasks.length}</span>
        </div>
        
        <div className="kanban-col-body">
          {columnTasks.map(task => {
            // MAGIA: El código ahora es los últimos 6 caracteres del ID real de la base de datos
            const displayCode = `#${task.id.slice(-6).toUpperCase()}`;

            return (
              <div 
                key={task.id}
                className="k-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                onContextMenu={(e) => handleContextMenu(e, task)}
                onClick={() => openViewModal(task)} 
              >
                <div className="k-card-top">
                  <div className="k-card-top-left">
                    <span className={`k-code ${getStatusClass(task.status)}`}>{displayCode}</span>
                    <div className="k-date">
                      <Clock size={12} />
                      <span>{formatDateTime(task.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="k-card-top-right">
                    <Star 
                      size={14} 
                      className={`k-star ${task.isStarred ? 'active' : ''}`} 
                      onClick={(e) => { e.stopPropagation(); toggleStar(task.id, task.isStarred); }}
                    />
                  </div>
                </div>
                
                <p className="k-description line-clamp">{task.title || task.description}</p>
              </div>
            );
          })}
        </div>
        
        <button className="k-btn-add" onClick={() => openCreateModal(statusName)}>
          + Agregar tarjeta
        </button>
      </div>
    );
  };

  return (
    <div className="dash-layout">
      {/* MENÚ CONTEXTUAL */}
      {contextMenu.visible && contextMenu.task && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className="ctx-item" onClick={() => openViewModal(contextMenu.task)}>
            <Eye size={16} /> Ver detalles
          </div>
          <div className="ctx-item" onClick={() => openEditModal(contextMenu.task)}>
            <Edit2 size={16} /> Editar
          </div>
          <div className="ctx-item" onClick={() => toggleStar(contextMenu.task.id, contextMenu.task.isStarred)}>
            <Star size={16} className={contextMenu.task.isStarred ? 'active-star-ctx' : ''} /> 
            {contextMenu.task.isStarred ? 'Quitar destacado' : 'Destacar'}
          </div>
          <div className="ctx-item danger" onClick={() => openDeleteModal(contextMenu.task)}>
            <Trash2 size={16} /> Eliminar
          </div>
        </div>
      )}

      {/* MODAL GLOBAL */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <span className="modal-title">
                {modal.mode === 'create' ? 'Nueva Tarea' : modal.mode === 'edit' ? 'Editar Tarea' : modal.mode === 'delete' ? 'Confirmar Eliminación' : 'Detalles de la Tarea'}
              </span>
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>
            </div>

            {/* VISTA */}
            {modal.mode === 'view' && modal.task && (
              <div className="modal-body view-mode">
                <div className="view-meta">
                  <span className={`k-code ${getStatusClass(modal.task.status)}`}>
                    #{modal.task.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="view-date">{formatDateTime(modal.task.createdAt)}</span>
                </div>
                <h2 className="view-task-title">{modal.task.title || modal.task.description}</h2>
                <div className="view-status">
                  <span className="view-status-label">Estado:</span> <strong>{modal.task.status}</strong>
                </div>
              </div>
            )}

            {/* CREAR / EDITAR */}
            {(modal.mode === 'create' || modal.mode === 'edit') && (
              <div className="modal-body form-mode">
                <div className="form-group">
                  <label>Descripción de la tarea</label>
                  <textarea 
                    autoFocus
                    placeholder="Escribe la descripción de tu tarea..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="EN PROCESO">EN PROCESO</option>
                    <option value="COMPLETADO">COMPLETADO</option>
                  </select>
                </div>
              </div>
            )}

            {/* ELIMINAR */}
            {modal.mode === 'delete' && (
              <div className="modal-body delete-mode">
                <AlertTriangle size={48} color="#f87171" style={{ marginBottom: '16px' }} />
                <h3 className="delete-title">¿Estás seguro?</h3>
                <p className="delete-text">Vas a eliminar esta tarea permanentemente. Esta acción no se puede deshacer.</p>
              </div>
            )}

            <div className="modal-footer">
              {modal.mode === 'view' ? (
                <>
                  <button className="btn-modal-danger" onClick={() => openDeleteModal(modal.task)}>Eliminar</button>
                  <button className="btn-modal-primary" onClick={() => openEditModal(modal.task)}><Edit2 size={14}/> Editar</button>
                </>
              ) : modal.mode === 'delete' ? (
                <>
                  <button className="btn-modal-secondary" onClick={closeModal}>Cancelar</button>
                  <button className="btn-modal-danger-solid" onClick={confirmDelete}>Sí, eliminar</button>
                </>
              ) : (
                <>
                  <button className="btn-modal-secondary" onClick={closeModal}>Cancelar</button>
                  <button className="btn-modal-primary" onClick={saveModal}>Guardar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR UNIFICADA E IDENTICA AL DASHBOARD */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
      <aside className={`dash-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="dash-logo-container">
          <img src={logoOs} alt="OS" className="dash-logo-icon" />
          <img src={logoName} alt="Outstanding" className="dash-logo-text" />
          <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}><X size={16} color="#8E8E93" /></button>
        </div>
        <nav className="dash-nav">
          <ul className="nav-list">
            <li className="nav-item" onClick={() => navigate('/')}><LayoutDashboard size={14} /> Dashboard</li>
            <li className="nav-item active"><Folder size={14} /> Tareas</li>
            <li className="nav-item" onClick={() => navigate('/calendar')}><Calendar size={14} /> Calendario</li>
          </ul>
          
          <p className="nav-title">RECIENTES</p>
          <ul className="nav-list">
            <li className="nav-item"><span className="dot blue"></span> Generador de Planes</li>
            <li className="nav-item"><span className="dot purple"></span> Ruleta de Decisiones</li>
            <li className="nav-item view-more">Ver más... <ChevronRight size={12}/></li>
          </ul>
        </nav>
        <div className="dash-bottom-nav">
          <ul className="nav-list">
            <li className="nav-item"><Settings size={14} /> Configuración</li>
            <li className="nav-item logout" onClick={handleLogout}><LogOut size={14} /> Cerrar Sesión</li>
          </ul>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL Y BARRA DE HERRAMIENTAS (BÚSQUEDA / FILTROS) */}
      <main className="dash-main">
        <div className="k-toolbar">
          <div className="k-search-group">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}><Menu size={16} color="#FFFFFF" /></button>
            <label>Buscar:</label>
            <input 
              type="text" 
              placeholder="Escribe un código o palabra..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="k-filters-group">
            <label className="hide-mobile">Filtro:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="Todos">Todas las tareas</option>
              <option value="Destacados">Solo Destacadas</option>
            </select>
            <label className="hide-mobile">Orden:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="Recientes">Más recientes</option>
              <option value="Antiguos">Más antiguos</option>
            </select>
          </div>
        </div>
        
        <div className="k-board-container">
          <div className="k-board">
            {renderColumn('PENDIENTE')}
            {renderColumn('EN PROCESO')}
            {renderColumn('COMPLETADO')}
          </div>
        </div>
      </main>
    </div>
  );
}