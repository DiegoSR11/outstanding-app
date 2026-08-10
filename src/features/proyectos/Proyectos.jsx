import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { 
  LayoutDashboard, Calendar, Folder, Settings, LogOut, 
  Plus, Trash2, X, Briefcase, ArrowLeft, CheckSquare, 
  AlignLeft, Edit2, FileText, Eye, Search
} from 'lucide-react';
import logoOs from '../../assets/logo-os.png';
import logoName from '../../assets/logo-name.png';
import './Proyectos.css';

export default function Proyectos() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [globalTasks, setGlobalTasks] = useState([]); 
  
  const [activeProject, setActiveProject] = useState(null);
  
  // Filtros Globales
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); 
  const [taskStatusFilter, setTaskStatusFilter] = useState('all'); 

  // Modales
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '' });

  const [taskModal, setTaskModal] = useState({ isOpen: false, mode: 'create', data: null });
  const [taskFormData, setTaskFormData] = useState({ title: '', status: 'PENDIENTE', projectId: '' });

  const [noteModal, setNoteModal] = useState({ isOpen: false, mode: 'create', data: null });
  const [noteFormData, setNoteFormData] = useState({ title: '', content: '' });

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null, type: '' });

  // Estados para editar el Proyecto en línea
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempProjectDesc, setTempProjectDesc] = useState('');

  useEffect(() => {
    if (activeFilter !== 'task') setTaskStatusFilter('all');
  }, [activeFilter]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ visible: false, x: 0, y: 0, item: null, type: '' });
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'proyectos'), where('userId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
      if (activeProject) {
        const updated = data.find(p => p.id === activeProject.id);
        if (updated) setActiveProject(updated);
      }
    });
  }, [activeProject?.id]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snap) => {
      setGlobalTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error('Error', error); }
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, item, type });
  };

  const createProject = async () => {
    if (!newProject.name.trim() || !newProject.deadline) return;
    try {
      await addDoc(collection(db, 'proyectos'), {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        deadline: newProject.deadline,
        notes: [], 
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
      });
      setNewProject({ name: '', description: '', deadline: '' });
      setIsProjectModalOpen(false);
    } catch (error) { console.error('Error creando proyecto:', error); }
  };

  const deleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este proyecto? Las tareas quedarán sin proyecto.')) {
      const projectTasks = globalTasks.filter(t => t.projectId === projectId);
      projectTasks.forEach(async (t) => {
        await updateDoc(doc(db, 'tasks', t.id), { projectId: '' });
      });
      await deleteDoc(doc(db, 'proyectos', projectId));
      if (activeProject?.id === projectId) setActiveProject(null);
    }
  };

  // Funciones para guardar la edición en línea del proyecto
  const saveProjectTitle = async () => {
    if(tempProjectName.trim() && tempProjectName !== activeProject.name) {
        await updateDoc(doc(db, 'proyectos', activeProject.id), { name: tempProjectName.trim() });
    }
    setIsEditingTitle(false);
  };

  const saveProjectDesc = async () => {
    if(tempProjectDesc !== activeProject.description) {
        await updateDoc(doc(db, 'proyectos', activeProject.id), { description: tempProjectDesc.trim() });
    }
    setIsEditingDesc(false);
  };

  const openTaskModal = (task = null, mode = 'create') => {
    if (task) {
      setTaskFormData({ title: task.title || task.description, status: task.status, projectId: task.projectId || activeProject.id });
      setTaskModal({ isOpen: true, mode, data: task });
    } else {
      setTaskFormData({ title: '', status: 'PENDIENTE', projectId: activeProject?.id || '' });
      setTaskModal({ isOpen: true, mode: 'create', data: null });
    }
  };

  const saveTask = async () => {
    if (!taskFormData.title.trim()) return;
    try {
      if (taskModal.mode === 'create') {
        await addDoc(collection(db, 'tasks'), {
          title: taskFormData.title.trim(),
          description: taskFormData.title.trim(),
          status: taskFormData.status,
          projectId: taskFormData.projectId,
          createdAt: new Date().toISOString(),
          userId: auth.currentUser.uid,
          isStarred: false
        });
      } else {
        await updateDoc(doc(db, 'tasks', taskModal.data.id), {
          title: taskFormData.title.trim(),
          description: taskFormData.title.trim(),
          status: taskFormData.status,
          projectId: taskFormData.projectId
        });
      }
      setTaskModal({ isOpen: false, mode: 'create', data: null });
    } catch (error) { console.error('Error guardando tarea:', error); }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('¿Eliminar esta tarea permanentemente?')) {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTaskModal({ isOpen: false, mode: 'create', data: null });
    }
  };

  const openNoteModal = (note = null, mode = 'create') => {
    if (note) {
      setNoteFormData({ title: note.title, content: note.content });
      setNoteModal({ isOpen: true, mode, data: note });
    } else {
      setNoteFormData({ title: '', content: '' });
      setNoteModal({ isOpen: true, mode: 'create', data: null });
    }
  };

  const saveNote = async () => {
    if (!noteFormData.title.trim()) return;
    const currentNotes = Array.isArray(activeProject.notes) ? activeProject.notes : [];
    let updatedNotes;

    if (noteModal.mode === 'create') {
      updatedNotes = [...currentNotes, {
        id: Date.now().toString(),
        title: noteFormData.title.trim(),
        content: noteFormData.content.trim(),
        createdAt: new Date().toISOString()
      }];
    } else {
      updatedNotes = currentNotes.map(n => n.id === noteModal.data.id ? { ...n, title: noteFormData.title.trim(), content: noteFormData.content.trim() } : n);
    }

    await updateDoc(doc(db, 'proyectos', activeProject.id), { notes: updatedNotes });
    setNoteModal({ isOpen: false, mode: 'create', data: null });
  };

  const deleteNote = async (noteId) => {
    if (window.confirm('¿Eliminar esta nota?')) {
      const updatedNotes = activeProject.notes.filter(n => n.id !== noteId);
      await updateDoc(doc(db, 'proyectos', activeProject.id), { notes: updatedNotes });
      setNoteModal({ isOpen: false, mode: 'create', data: null });
    }
  };

  const getProjectTasks = (projectId) => globalTasks.filter(t => t.projectId === projectId);
  
  const getProgress = (projectId) => {
    const pTasks = getProjectTasks(projectId);
    if (pTasks.length === 0) return 0;
    const completed = pTasks.filter(t => t.status === 'COMPLETADO').length;
    return Math.round((completed / pTasks.length) * 100);
  };

  const getStatusClass = (status) => {
    if (status === 'PENDIENTE') return 'status-red';
    if (status === 'EN PROCESO') return 'status-yellow';
    if (status === 'COMPLETADO') return 'status-green';
    return '';
  };

  const generateGroupedTimeline = () => {
    if (!activeProject) return [];
    
    let pTasks = getProjectTasks(activeProject.id).map(t => ({ ...t, type: 'task', timestamp: new Date(t.createdAt) }));
    let pNotes = (Array.isArray(activeProject.notes) ? activeProject.notes : []).map(n => ({ ...n, type: 'note', timestamp: new Date(n.createdAt) }));
    
    let allEvents = [...pTasks, ...pNotes].sort((a, b) => b.timestamp - a.timestamp);
    
    if (activeFilter !== 'all') {
      allEvents = allEvents.filter(ev => ev.type === activeFilter);
    }

    if (activeFilter === 'task' && taskStatusFilter !== 'all') {
      allEvents = allEvents.filter(ev => ev.status === taskStatusFilter);
    }

    if (searchTerm) {
      allEvents = allEvents.filter(ev => {
        const text = (ev.title || ev.content || ev.description || '').toLowerCase();
        return text.includes(searchTerm.toLowerCase());
      });
    }

    const grouped = {};
    allEvents.forEach(ev => {
      const dayStr = ev.timestamp.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      if(!grouped[dayStr]) grouped[dayStr] = [];
      grouped[dayStr].push(ev);
    });

    return Object.keys(grouped).map(date => ({ date, events: grouped[date] }));
  };

  const groupedTimeline = generateGroupedTimeline();

  return (
    <div className="dash-layout">
      
      {/* MENÚ CONTEXTUAL */}
      {contextMenu.visible && contextMenu.item && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className="ctx-item" onClick={() => { contextMenu.type === 'task' ? openTaskModal(contextMenu.item, 'view') : openNoteModal(contextMenu.item, 'view'); }}>
            <Eye size={14} /> Ver detalles
          </div>
          <div className="ctx-item" onClick={() => { contextMenu.type === 'task' ? openTaskModal(contextMenu.item, 'edit') : openNoteModal(contextMenu.item, 'edit'); }}>
            <Edit2 size={14} /> Editar
          </div>
          <div className="ctx-item danger" onClick={() => { contextMenu.type === 'task' ? deleteTask(contextMenu.item.id) : deleteNote(contextMenu.item.id); }}>
            <Trash2 size={14} /> Eliminar
          </div>
        </div>
      )}

      {/* MODAL PROYECTO */}
      {isProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProjectModalOpen(false)}>
          <div className="modal-content compact-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Proyecto</span>
              <button className="modal-close" onClick={() => setIsProjectModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body form-mode">
              <input autoFocus type="text" placeholder="Nombre del Proyecto..." value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="pro-input mb-3" />
              <textarea rows="3" placeholder="Descripción breve..." value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="pro-input mb-3" style={{resize:'none'}} />
              <label className="input-label">Fecha de Entrega (Deadline)</label>
              <input type="date" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} className="pro-input" />
            </div>
            <div className="modal-footer">
              <button className="btn-modal-secondary" onClick={() => setIsProjectModalOpen(false)}>Cancelar</button>
              <button className="btn-modal-primary" onClick={createProject}>Crear Proyecto</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAREAS */}
      {taskModal.isOpen && (
        <div className="modal-overlay" onClick={() => setTaskModal({ isOpen: false, mode: 'create', data: null })}>
          <div className="modal-content compact-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {taskModal.mode === 'create' ? 'Nueva Tarea' : taskModal.mode === 'edit' ? 'Editar Tarea' : 'Detalles de la Tarea'}
              </span>
              <button className="modal-close" onClick={() => setTaskModal({ isOpen: false, mode: 'create', data: null })}><X size={18} /></button>
            </div>
            
            {taskModal.mode === 'view' ? (
              <div className="modal-body view-mode">
                <div className="view-meta">
                  <span className={`k-code ${getStatusClass(taskModal.data.status)}`}>{taskModal.data.status}</span>
                  <span className="view-date">{new Date(taskModal.data.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <h2 className="view-title">{taskModal.data.title || taskModal.data.description}</h2>
              </div>
            ) : (
              <div className="modal-body form-mode">
                <div className="form-group mb-3">
                  <label className="input-label">Descripción de la Tarea</label>
                  <textarea autoFocus rows="3" placeholder="¿Qué hay que hacer?" value={taskFormData.title} onChange={e => setTaskFormData({ ...taskFormData, title: e.target.value })} className="pro-input" style={{resize:'none'}} />
                </div>
                <div className="row-group">
                  <div className="form-group flex-1">
                    <label className="input-label">Estado</label>
                    <select className="pro-input" value={taskFormData.status} onChange={e => setTaskFormData({ ...taskFormData, status: e.target.value })}>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN PROCESO">En Proceso</option>
                      <option value="COMPLETADO">Completado</option>
                    </select>
                  </div>
                  <div className="form-group flex-1">
                    <label className="input-label">Asignar a Proyecto</label>
                    <select className="pro-input" value={taskFormData.projectId} onChange={e => setTaskFormData({ ...taskFormData, projectId: e.target.value })}>
                      <option value="">Ninguno</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-footer">
              {taskModal.mode === 'view' ? (
                <>
                  <button className="btn-modal-danger mr-auto" onClick={() => deleteTask(taskModal.data.id)}>Eliminar</button>
                  <button className="btn-modal-primary" onClick={() => openTaskModal(taskModal.data, 'edit')}>Editar</button>
                </>
              ) : (
                <>
                  <button className="btn-modal-secondary" onClick={() => setTaskModal({ isOpen: false, mode: 'create', data: null })}>Cancelar</button>
                  <button className="btn-modal-primary" onClick={saveTask}>Guardar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTAS */}
      {noteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setNoteModal({ isOpen: false, mode: 'create', data: null })}>
          <div className="modal-content compact-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {noteModal.mode === 'create' ? 'Nuevo Documento' : noteModal.mode === 'edit' ? 'Editar Documento' : 'Detalles del Documento'}
              </span>
              <button className="modal-close" onClick={() => setNoteModal({ isOpen: false, mode: 'create', data: null })}><X size={18} /></button>
            </div>
            
            {noteModal.mode === 'view' ? (
              <div className="modal-body view-mode">
                <div className="view-meta">
                  <span className="k-code status-note">NOTA</span>
                  <span className="view-date">{new Date(noteModal.data.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <h2 className="view-title">{noteModal.data.title}</h2>
                <div className="view-content-box">{noteModal.data.content}</div>
              </div>
            ) : (
              <div className="modal-body form-mode">
                <div className="form-group mb-3">
                  <label className="input-label">Título del Documento</label>
                  <input autoFocus type="text" placeholder="Ej: Minuta de reunión..." value={noteFormData.title} onChange={e => setNoteFormData({ ...noteFormData, title: e.target.value })} className="pro-input" />
                </div>
                <div className="form-group">
                  <label className="input-label">Contenido</label>
                  <textarea rows="6" placeholder="Escribe aquí los detalles..." value={noteFormData.content} onChange={e => setNoteFormData({ ...noteFormData, content: e.target.value })} className="pro-input" style={{resize:'none'}} />
                </div>
              </div>
            )}

            <div className="modal-footer">
              {noteModal.mode === 'view' ? (
                <>
                  <button className="btn-modal-danger mr-auto" onClick={() => deleteNote(noteModal.data.id)}>Eliminar</button>
                  <button className="btn-modal-primary" onClick={() => openNoteModal(noteModal.data, 'edit')}>Editar</button>
                </>
              ) : (
                <>
                  <button className="btn-modal-secondary" onClick={() => setNoteModal({ isOpen: false, mode: 'create', data: null })}>Cancelar</button>
                  <button className="btn-modal-primary" onClick={saveNote}>Guardar Documento</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR UNIFICADA */}
      <aside className="dash-sidebar">
        <div className="dash-logo-container">
          <img src={logoOs} alt="OS" className="dash-logo-icon" />
          <img src={logoName} alt="Outstanding" className="dash-logo-text" />
        </div>
        <nav className="dash-nav">
          <ul className="nav-list">
            <li className="nav-item" onClick={() => navigate('/')}><LayoutDashboard size={14} /> Dashboard</li>
            <li className="nav-item" onClick={() => navigate('/tasks')}><CheckSquare size={14} /> Tareas</li>
            <li className="nav-item" onClick={() => navigate('/calendar')}><Calendar size={14} /> Calendario</li>
            <li className="nav-item active"><Briefcase size={14} /> Proyectos</li>
          </ul>
        </nav>
        <div className="dash-bottom-nav">
          <ul className="nav-list logout" onClick={handleLogout}>
            <li className="nav-item"><LogOut size={14} /> Cerrar Sesión</li>
          </ul>
        </div>
      </aside>

      <main className="dash-main proyectos-main">
        
        {/* VISTA 1: PORTAFOLIO DE PROYECTOS */}
        {!activeProject ? (
          <>
            <header className="proyectos-header compact">
              <div className="header-greeting">
                <h2 className="proyectos-title">Proyectos</h2>
                <p className="proyectos-subtitle">Espacios de trabajo interconectados.</p>
              </div>
              <button className="btn-nuevo-pro" onClick={() => setIsProjectModalOpen(true)}><Plus size={14} /> Crear Proyecto</button>
            </header>

            <div className="projects-grid-modern">
              {projects.length === 0 ? (
                <div className="p-empty-state">
                  <Briefcase size={40} color="#3f3f46" />
                  <h3>Sin proyectos activos</h3>
                  <p>Inicia un proyecto para agrupar tareas y notas en un solo espacio.</p>
                </div>
              ) : (
                projects.map(project => {
                  const progress = getProgress(project.id);
                  const isDone = progress === 100 && getProjectTasks(project.id).length > 0;

                  return (
                    <div key={project.id} className="pro-card" onClick={() => setActiveProject(project)}>
                      <div className="pro-card-header">
                        <span className={`pro-status ${isDone ? 'done' : 'active'}`}>{isDone ? 'Completado' : 'En progreso'}</span>
                        <button className="pc-menu" onClick={(e) => deleteProject(project.id, e)}><Trash2 size={14}/></button>
                      </div>
                      
                      <h3 className="pro-card-title">{project.name}</h3>
                      <p className="pro-card-desc">{project.description || 'Sin descripción.'}</p>
                      
                      <div className="pro-card-progress">
                        <div className="prog-bar-bg">
                          <div className="prog-bar-fill" style={{ width: `${progress}%`, backgroundColor: isDone ? '#10b981' : '#6366f1' }}></div>
                        </div>
                        <span className="prog-text">{progress}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          
          /* VISTA 2: WORKSPACE DEL PROYECTO (FEED UNIFICADO) */
          <div className="project-workspace">
            
            {/* HEADER CENTRADO (Editable) */}
            <header className="workspace-header-centered">
              <button className="btn-back-absolute" onClick={() => setActiveProject(null)}>
                <ArrowLeft size={16}/> <span className="btn-back-text">Volver</span>
              </button>
              
              <div className="ws-title-container">
                {isEditingTitle ? (
                  <input
                    autoFocus
                    className="ws-title-input"
                    value={tempProjectName}
                    onChange={(e) => setTempProjectName(e.target.value)}
                    onBlur={saveProjectTitle}
                    onKeyDown={(e) => e.key === 'Enter' && saveProjectTitle()}
                  />
                ) : (
                  <h2 className="ws-title-centered" onClick={() => {setTempProjectName(activeProject.name); setIsEditingTitle(true);}} title="Clic para editar">
                    {activeProject.name} <Edit2 size={12} className="edit-hint-icon"/>
                  </h2>
                )}

                {isEditingDesc ? (
                  <textarea
                    autoFocus
                    className="ws-desc-input"
                    value={tempProjectDesc}
                    onChange={(e) => setTempProjectDesc(e.target.value)}
                    onBlur={saveProjectDesc}
                  />
                ) : (
                  <p className="ws-desc-centered" onClick={() => {setTempProjectDesc(activeProject.description); setIsEditingDesc(true);}} title="Clic para editar">
                    {activeProject.description || 'Añadir descripción al proyecto...'} <Edit2 size={10} className="edit-hint-icon"/>
                  </p>
                )}
              </div>
            </header>

            {/* SUB-HEADER DELGADO (TOOLBAR) */}
            <div className="workspace-toolbar">
              
              <div className="toolbar-left">
                <div className="search-wrapper">
                  <Search size={14} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Buscar en el proyecto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="toolbar-center">
                <div className="filter-pills main-pills">
                  <button className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>Todo</button>
                  <button className={`filter-pill ${activeFilter === 'task' ? 'active' : ''}`} onClick={() => setActiveFilter('task')}>Tareas</button>
                  <button className={`filter-pill ${activeFilter === 'note' ? 'active' : ''}`} onClick={() => setActiveFilter('note')}>Notas</button>
                </div>
              </div>

              <div className="toolbar-right">
                <button className="btn-action-outline" onClick={() => openTaskModal()}><CheckSquare size={14}/> <span className="hide-mobile">Nueva Tarea</span></button>
                <button className="btn-action-outline" onClick={() => openNoteModal()}><FileText size={14}/> <span className="hide-mobile">Nueva Nota</span></button>
              </div>

            </div>

            {/* SUB-FILTRO DE ESTADOS DE TAREA */}
            {activeFilter === 'task' && (
              <div className="sub-filters-bar">
                 <span className="sub-filter-label">Estado:</span>
                 <div className="filter-pills small">
                    <button className={`filter-pill ${taskStatusFilter === 'all' ? 'active' : ''}`} onClick={() => setTaskStatusFilter('all')}>Todas</button>
                    <button className={`filter-pill ${taskStatusFilter === 'PENDIENTE' ? 'active' : ''}`} onClick={() => setTaskStatusFilter('PENDIENTE')}>Pendientes</button>
                    <button className={`filter-pill ${taskStatusFilter === 'EN PROCESO' ? 'active' : ''}`} onClick={() => setTaskStatusFilter('EN PROCESO')}>En Proceso</button>
                    <button className={`filter-pill ${taskStatusFilter === 'COMPLETADO' ? 'active' : ''}`} onClick={() => setTaskStatusFilter('COMPLETADO')}>Completadas</button>
                 </div>
              </div>
            )}

            {/* FEED PRINCIPAL UNIFICADO */}
            <div className="workspace-content">
              <div className="grouped-timeline">
                {groupedTimeline.length === 0 ? (
                  <p className="empty-text text-center mt-5">No se encontraron elementos que coincidan.</p>
                ) : (
                  groupedTimeline.map((group, gIndex) => (
                    <div key={gIndex} className="tl-day-group">
                      <h4 className="tl-day-header-centered">{group.date}</h4>
                      
                      <div className="tl-cards-container">
                        {group.events.map(event => {
                          const timeStr = event.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                          const shortDateStr = event.timestamp.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                          
                          return (
                            <div 
                              key={event.id} 
                              className={`tl-card-wrapper ${event.type}`}
                              onClick={() => event.type === 'task' ? openTaskModal(event, 'view') : openNoteModal(event, 'view')}
                              onContextMenu={(e) => handleContextMenu(e, event, event.type)}
                            >
                              {/* LA PESTAÑA ANCHA (FECHA Y HORA) OSCURA */}
                              <div className={`tl-card-tab-top ${event.type}`}>
                                {shortDateStr} - {timeStr}
                              </div>
                              
                              <div className="tl-card-dark">
                                <div className="tl-c-head">
                                  {event.type === 'task' ? (
                                    <span className={`k-code ${getStatusClass(event.status)}`}>{event.status}</span>
                                  ) : (
                                    <span className="k-code status-note">NOTA</span>
                                  )}
                                </div>
                                <h4 className="tl-item-title line-clamp-2">{event.title || event.description || event.content}</h4>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}