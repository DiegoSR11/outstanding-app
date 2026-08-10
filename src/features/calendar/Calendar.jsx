import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { 
  LayoutDashboard, Calendar as CalendarIcon, Folder, 
  Settings, LogOut, ChevronRight, ChevronLeft, Clock,
  Edit2, Trash2, Eye, AlertTriangle, Star, X, ChevronDown 
} from 'lucide-react';
import logoOs from '../../assets/logo-os.png';
import logoName from '../../assets/logo-name.png';
import './Calendar.css';

export default function Calendar() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 

  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Estados del modal
  const [modal, setModal] = useState({ isOpen: false, mode: 'view', task: null });
  const [formData, setFormData] = useState({ title: '', status: 'PENDIENTE' });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, task: null });

  useEffect(() => {
    const handleClickOutside = (e) => {
      setContextMenu(prev => ({ ...prev, visible: false }));
      if (!e.target.closest('.custom-dropdown')) {
        setIsMonthDropdownOpen(false);
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleContextMenu = (e, task) => {
    e.preventDefault(); 
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, task });
  };

  const openViewModal = (task) => setModal({ isOpen: true, mode: 'view', task });
  
  const openEditModal = (task) => {
    setFormData({ title: task.title || task.description || '', status: task.status });
    setModal({ isOpen: true, mode: 'edit', task });
  };

  const openDeleteModal = (task) => setModal({ isOpen: true, mode: 'delete', task });
  
  // NUENO: Función para abrir creador de tareas
  const openCreateModal = () => {
    setFormData({ title: '', status: 'PENDIENTE' });
    setModal({ isOpen: true, mode: 'create', task: null });
  };

  const closeModal = () => setModal({ isOpen: false, mode: 'view', task: null });

  const saveModal = async () => {
    if (!formData.title.trim()) return;
    try {
      if (modal.mode === 'create') {
        // Guarda la tarea en el día seleccionado, pero con la hora actual
        const newTaskDate = new Date(selectedDate);
        const now = new Date();
        newTaskDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

        await addDoc(collection(db, 'tasks'), {
          title: formData.title.trim(),
          description: formData.title.trim(),
          status: formData.status,
          isStarred: false,
          createdAt: newTaskDate.toISOString(),
          userId: auth.currentUser.uid
        });
      } else if (modal.mode === 'edit' && modal.task) {
        const taskRef = doc(db, 'tasks', modal.task.id);
        await updateDoc(taskRef, {
          title: formData.title.trim(),
          description: formData.title.trim(),
          status: formData.status
        });
      }
      closeModal();
    } catch (error) { console.error('Error guardando:', error); }
  };

  const confirmDelete = async () => {
    if (!modal.task) return;
    try {
      await deleteDoc(doc(db, 'tasks', modal.task.id));
      closeModal();
    } catch (error) { console.error('Error al eliminar:', error); }
  };

  const toggleStar = async (taskId, currentStatus) => {
    try { await updateDoc(doc(db, 'tasks', taskId), { isStarred: !currentStatus }); } 
    catch (error) { console.error('Error:', error); }
  };

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const years = Array.from({length: 21}, (_, i) => new Date().getFullYear() - 10 + i);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const calendarGrid = [];
  for (let i = firstDay - 1; i >= 0; i--) calendarGrid.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(currentYear, currentMonth - 1, prevMonthDays - i) });
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push({ day: i, isCurrentMonth: true, date: new Date(currentYear, currentMonth, i) });
  const remainingCells = 42 - calendarGrid.length; 
  for (let i = 1; i <= remainingCells; i++) calendarGrid.push({ day: i, isCurrentMonth: false, date: new Date(currentYear, currentMonth + 1, i) });

  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getTasksForDate = (dateObj) => {
    return tasks.filter(t => {
      if (!t.createdAt) return false;
      const tDate = new Date(t.createdAt);
      return tDate.getDate() === dateObj.getDate() && tDate.getMonth() === dateObj.getMonth() && tDate.getFullYear() === dateObj.getFullYear();
    });
  };

  const selectedDayTasks = getTasksForDate(selectedDate);

  const getStatusClass = (status) => {
    if (status === 'PENDIENTE') return 'status-red';
    if (status === 'EN PROCESO') return 'status-yellow';
    if (status === 'COMPLETADO') return 'status-green';
    return '';
  };

  const getStatusColor = (status) => {
    if (status === 'PENDIENTE') return '#ef4444'; 
    if (status === 'EN PROCESO') return '#f59e0b'; 
    if (status === 'COMPLETADO') return '#10b981'; 
    return '#3b82f6'; 
  };

  return (
    <div className="dash-layout">

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

      {modal.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {modal.mode === 'create' ? 'Nueva Tarea' : modal.mode === 'edit' ? 'Editar Tarea' : modal.mode === 'delete' ? 'Confirmar Eliminación' : 'Detalles de la Tarea'}
              </span>
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>
            </div>

            {modal.mode === 'view' && modal.task && (
              <div className="modal-body view-mode">
                <div className="view-meta">
                  <span className={`k-code ${getStatusClass(modal.task.status)}`}>
                    #{modal.task.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="view-date">{new Date(modal.task.createdAt).toLocaleString('es-ES')}</span>
                </div>
                <h2 className="view-task-title">{modal.task.title || modal.task.description}</h2>
                <div className="view-status">
                  <span className="view-status-label">Estado:</span> <strong>{modal.task.status}</strong>
                </div>
              </div>
            )}

            {(modal.mode === 'edit' || modal.mode === 'create') && (
              <div className="modal-body form-mode">
                <div className="form-group">
                  <label>Descripción de la tarea</label>
                  <textarea 
                    autoFocus
                    placeholder="Escribe el título de tu tarea..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="EN PROCESO">EN PROCESO</option>
                    <option value="COMPLETADO">COMPLETADO</option>
                  </select>
                </div>
              </div>
            )}

            {modal.mode === 'delete' && (
              <div className="modal-body delete-mode">
                <AlertTriangle size={48} color="#f87171" style={{ marginBottom: '16px' }} />
                <h3 className="delete-title">¿Estás seguro?</h3>
                <p className="delete-text">Vas a eliminar esta tarea permanentemente.</p>
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

      <aside className="dash-sidebar">
        <div className="dash-logo-container">
          <img src={logoOs} alt="OS" className="dash-logo-icon" />
          <img src={logoName} alt="Outstanding" className="dash-logo-text" />
        </div>
        <nav className="dash-nav">
          <ul className="nav-list">
            <li className="nav-item" onClick={() => navigate('/')}><LayoutDashboard size={14} /> Dashboard</li>
            <li className="nav-item" onClick={() => navigate('/tasks')}><Folder size={14} /> Tareas</li>
            <li className="nav-item active"><CalendarIcon size={14} /> Calendario</li>
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

      <main className="dash-main calendar-main">
        <div className="calendar-header-bar">
          <div className="calendar-month-selector">
            
            <div className="month-title-wrapper">
              <div className="custom-dropdown">
                <div className="dropdown-trigger month-trigger" onClick={() => {setIsMonthDropdownOpen(!isMonthDropdownOpen); setIsYearDropdownOpen(false);}}>
                  {monthNames[currentMonth]} <ChevronDown size={14} />
                </div>
                {isMonthDropdownOpen && (
                  <div className="dropdown-menu month-menu">
                    {monthNames.map((m, i) => (
                      <div key={i} className={`dropdown-item ${i === currentMonth ? 'active' : ''}`} onClick={() => { setCurrentDate(new Date(currentYear, i, 1)); setIsMonthDropdownOpen(false); }}>
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="custom-dropdown">
                <div className="dropdown-trigger year-trigger" onClick={() => {setIsYearDropdownOpen(!isYearDropdownOpen); setIsMonthDropdownOpen(false);}}>
                  {currentYear} <ChevronDown size={12} />
                </div>
                {isYearDropdownOpen && (
                  <div className="dropdown-menu year-menu">
                    {years.map(y => (
                      <div key={y} className={`dropdown-item ${y === currentYear ? 'active' : ''}`} onClick={() => { setCurrentDate(new Date(y, currentMonth, 1)); setIsYearDropdownOpen(false); }}>
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="month-nav-buttons">
              <button onClick={prevMonth}><ChevronLeft size={14} /></button>
              <button onClick={goToToday} className="btn-today">Hoy</button>
              <button onClick={nextMonth}><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>

        <div className="calendar-content-split">
          
          <div className="calendar-grid-container">
            <div className="calendar-days-header">
              {daysOfWeek.map(day => <div key={day} className="day-name">{day}</div>)}
            </div>
            
            <div className="calendar-grid">
              {calendarGrid.map((cell, index) => {
                const dayTasks = getTasksForDate(cell.date);
                const isSelected = cell.date.toDateString() === selectedDate.toDateString();
                const isToday = cell.date.toDateString() === new Date().toDateString();

                return (
                  <div 
                    key={index} 
                    className={`calendar-cell ${!cell.isCurrentMonth ? 'faded' : ''} ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
                    onClick={() => setSelectedDate(cell.date)}
                  >
                    <span className="cell-number">{cell.day}</span>
                    {dayTasks.length > 0 && (
                      <div className="cell-dots">
                        {dayTasks.slice(0, 3).map((task, i) => (
                          <span key={i} className="task-dot" style={{ backgroundColor: getStatusColor(task.status) }}></span>
                        ))}
                        {dayTasks.length > 3 && <span className="task-dot-more">+</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="calendar-side-panel">
            <h3 className="panel-title">Lista de Tareas</h3>
            <p className="panel-subtitle">
              {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            <div className="panel-task-list">
              {selectedDayTasks.length === 0 ? (
                <div className="no-tasks">No hay tareas registradas para este día.</div>
              ) : (
                selectedDayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="panel-task-card"
                    onContextMenu={(e) => handleContextMenu(e, task)}
                    onClick={() => openViewModal(task)}
                  >
                    <div className="pt-header">
                      <span className={`k-code ${getStatusClass(task.status)}`}>
                        #{task.id.slice(-6).toUpperCase()}
                      </span>
                      {/* ESTRELLA DE DESTACADO */}
                      <Star 
                        size={14} 
                        className={`k-star ${task.isStarred ? 'active' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); toggleStar(task.id, task.isStarred); }}
                      />
                    </div>
                    <h4 className="pt-title line-clamp">{task.title || task.description}</h4>
                    <div className="pt-footer">
                      <Clock size={12} />
                      <span>{new Date(task.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* BOTÓN AL FINAL DEL PANEL */}
            <button className="k-btn-add" style={{marginTop: '16px'}} onClick={openCreateModal}>
              + Agregar tarea
            </button>
            
          </div>

        </div>
      </main>
    </div>
  );
}