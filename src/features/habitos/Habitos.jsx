import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { 
  LayoutDashboard, Calendar, Folder, Settings, LogOut, 
  ChevronRight, Plus, Trash2, X, Minus, ChevronLeft,
  Sparkles, CheckCircle2, Circle, TrendingUp, Target
} from 'lucide-react';
import logoOs from '../../assets/logo-os.png';
import logoName from '../../assets/logo-name.png';
import './Habitos.css';

const EMOJIS = ['💧', '📖', '🏃‍♂️', '🥗', '💻', '🧘‍♀️', '💊', '💰', '🧹', '🌙', '🏋️‍♂️', '🍎', '🎨', '🎸', '🚭', '☕'];

export default function Habitos() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [semanaOffset, setSemanaOffset] = useState(0); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  
  const [newHabit, setNewHabit] = useState({ 
    name: '', emoji: '💧', type: 'check', frequency: 'daily', goal: 1, unit: 'veces'
  });
  
  const emojiRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setIsEmojiOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'habitos'), where('userId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHabits(data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    });
  }, []);

  const getWeekDates = () => {
    const curr = new Date();
    curr.setDate(curr.getDate() + (semanaOffset * 7));
    const day = curr.getDay();
    const first = curr.getDate() - day + (day === 0 ? -6 : 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(curr);
      d.setDate(first + i);
      return d;
    });
  };

  const weekDates = getWeekDates();
  const weekDaysShort = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  
  const formatLocalValue = (d) => {
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d - offset)).toISOString().split('T')[0];
  };
  
  const todayStr = formatLocalValue(new Date());

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error('Error', error); }
  };

  const createHabit = async () => {
    if (!newHabit.name.trim()) return;
    try {
      await addDoc(collection(db, 'habitos'), {
        name: newHabit.name.trim(),
        emoji: newHabit.emoji,
        type: newHabit.type, 
        frequency: newHabit.frequency, 
        goal: Number(newHabit.goal),
        unit: newHabit.type === 'counter' ? newHabit.unit : '',
        logs: {}, 
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
      });
      setNewHabit({ name: '', emoji: '💧', type: 'check', frequency: 'daily', goal: 1, unit: 'veces' });
      setIsModalOpen(false);
    } catch (error) { console.error('Error creando hábito:', error); }
  };

  const deleteHabit = async (habitId) => {
    if (window.confirm('¿Eliminar este hábito permanentemente?')) {
      await deleteDoc(doc(db, 'habitos', habitId));
    }
  };

  const modifyProgress = async (habit, dateStr, amount) => {
    if (semanaOffset < 0 || new Date(dateStr) > new Date(todayStr)) return;
    
    const logs = { ...(habit.logs || {}) };
    const currentVal = logs[dateStr] || 0;
    
    if (habit.type === 'check') {
      if (currentVal > 0) delete logs[dateStr];
      else logs[dateStr] = 1;
    } else {
      const newVal = currentVal + amount;
      if (newVal <= 0) delete logs[dateStr];
      else logs[dateStr] = newVal;
    }
    
    await updateDoc(doc(db, 'habitos', habit.id), { logs });
  };

  const getWeeklyTotal = (habit) => {
    return weekDates.reduce((acc, d) => acc + ((habit.logs || {})[formatLocalValue(d)] || 0), 0);
  };

  // --- LÓGICA CORREGIDA: Solo evalúa hábitos DIARIOS para el % de hoy ---
  const getTodayProgressMetrics = () => {
    const dailyHabits = habits.filter(h => h.frequency === 'daily');
    if (dailyHabits.length === 0) return { completed: 0, total: 0, percent: 0 };
    
    let completed = 0;
    dailyHabits.forEach(h => {
      const val = (h.logs || {})[todayStr] || 0;
      if (val >= h.goal) completed++;
    });

    return {
      completed,
      total: dailyHabits.length,
      percent: Math.round((completed / dailyHabits.length) * 100)
    };
  };

  const progressToday = getTodayProgressMetrics();
  const mejorHabito = [...habits].sort((a, b) => getWeeklyTotal(b) - getWeeklyTotal(a))[0];

  const renderHabitUI = (habit, dateStr) => {
    const val = (habit.logs || {})[dateStr] || 0;
    const isCompleted = val >= habit.goal;
    const isPast = semanaOffset < 0;

    if (habit.type === 'check' && habit.frequency === 'daily') {
      return (
        <div className="h-action-binary">
          <button className={`btn-binary ${isCompleted ? 'done' : ''}`} onClick={() => modifyProgress(habit, dateStr, 1)} disabled={isPast}>
            {isCompleted ? <><CheckCircle2 size={18}/> Completado</> : <><Circle size={18}/> Marcar como hecho</>}
          </button>
        </div>
      );
    }

    if (habit.type === 'counter') {
      const percent = Math.min((val / habit.goal) * 100, 100);
      let colorClass = 'bar-red';
      if (percent >= 50) colorClass = 'bar-yellow';
      if (percent >= 100) colorClass = 'bar-green';

      return (
        <div className="h-action-counter">
          <div className="counter-stats">
            <span className="c-current">{val} <small>{habit.unit}</small></span>
            <span className="c-goal">/ {habit.goal}</span>
          </div>
          <div className="counter-progress-bar">
            <div className={`c-fill ${colorClass}`} style={{ width: `${percent}%` }}></div>
          </div>
          <div className="counter-controls">
            <button className="c-btn" onClick={() => modifyProgress(habit, dateStr, -1)} disabled={isPast || val === 0}><Minus size={14}/></button>
            <div className="c-quick-adds">
              <button className="c-btn-quick" onClick={() => modifyProgress(habit, dateStr, 1)} disabled={isPast}>+1</button>
              {habit.goal >= 10 && <button className="c-btn-quick" onClick={() => modifyProgress(habit, dateStr, 5)} disabled={isPast}>+5</button>}
            </div>
          </div>
        </div>
      );
    }

    if (habit.frequency === 'weekly') {
      const weeklyVal = getWeeklyTotal(habit);
      const isWeeklyDone = weeklyVal >= habit.goal;
      
      return (
        <div className="h-action-weekly">
          <div className="w-dots">
            {Array.from({length: habit.goal}).map((_, i) => (
              <div key={i} className={`w-dot ${i < weeklyVal ? 'filled' : ''}`}></div>
            ))}
          </div>
          <div className="w-controls">
            <span className="w-status">{weeklyVal} de {habit.goal} sesiones</span>
            <button className="c-btn-quick primary" onClick={() => modifyProgress(habit, dateStr, 1)} disabled={isPast || isWeeklyDone}>
              Registrar Hoy
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="dash-layout">
      {/* MODAL CREAR HÁBITO */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content compact-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nueva Meta de Productividad</span>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body form-mode">
              <div className="row-group">
                <div className="custom-emoji-wrapper" ref={emojiRef}>
                  <button className="emoji-trigger" onClick={() => setIsEmojiOpen(!isEmojiOpen)}>{newHabit.emoji}</button>
                  {isEmojiOpen && (
                    <div className="emoji-popover">
                      {EMOJIS.map(e => <div key={e} className="emoji-option" onClick={() => { setNewHabit({ ...newHabit, emoji: e }); setIsEmojiOpen(false); }}>{e}</div>)}
                    </div>
                  )}
                </div>
                <input autoFocus type="text" placeholder="Ej: Leer libro, Meditar, Agua..." value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} className="habit-input flex-1" />
              </div>
              
              <div className="form-group mt-2">
                <label>Frecuencia</label>
                <div className="segmented-control">
                  <button className={newHabit.frequency === 'daily' ? 'active' : ''} onClick={() => setNewHabit({...newHabit, frequency: 'daily', goal: 1})}>Diaria</button>
                  <button className={newHabit.frequency === 'weekly' ? 'active' : ''} onClick={() => setNewHabit({...newHabit, frequency: 'weekly', type: 'check', goal: 3})}>Semanal</button>
                </div>
              </div>

              {newHabit.frequency === 'daily' && (
                <div className="form-group mt-2">
                  <label>Tipo de Progreso</label>
                  <div className="segmented-control">
                    <button className={newHabit.type === 'check' ? 'active' : ''} onClick={() => setNewHabit({...newHabit, type: 'check', goal: 1})}>1 Vez (✓)</button>
                    <button className={newHabit.type === 'counter' ? 'active' : ''} onClick={() => setNewHabit({...newHabit, type: 'counter', goal: 5})}>Acumulativo (+)</button>
                  </div>
                </div>
              )}

              {(newHabit.type === 'counter' || newHabit.frequency === 'weekly') && (
                <div className="form-group mt-2 row-group">
                  <div className="flex-1">
                    <label>Meta Objetivo</label>
                    <input type="number" min="1" value={newHabit.goal} onChange={e => setNewHabit({ ...newHabit, goal: e.target.value })} className="habit-input" />
                  </div>
                  {newHabit.type === 'counter' && (
                    <div className="flex-1">
                      <label>Unidad (Ej: ml, min)</label>
                      <input type="text" value={newHabit.unit} onChange={e => setNewHabit({ ...newHabit, unit: e.target.value })} className="habit-input" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-modal-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn-modal-primary" onClick={createHabit}>Crear Hábito</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="dash-sidebar">
        <div className="dash-logo-container">
          <img src={logoOs} alt="OS" className="dash-logo-icon" />
          <img src={logoName} alt="Outstanding" className="dash-logo-text" />
        </div>
        <nav className="dash-nav">
          <ul className="nav-list">
            <li className="nav-item" onClick={() => navigate('/')}><LayoutDashboard size={14} /> Dashboard</li>
            <li className="nav-item" onClick={() => navigate('/tasks')}><Folder size={14} /> Tareas</li>
            <li className="nav-item active"><Calendar size={14} /> Calendario</li>
          </ul>
        </nav>
        <div className="dash-bottom-nav">
          <ul className="nav-list logout" onClick={handleLogout}>
            <li className="nav-item"><LogOut size={14} /> Cerrar Sesión</li>
          </ul>
        </div>
      </aside>

      <main className="dash-main habitos-main">
        
        {/* CABECERA */}
        <header className="habitos-header">
          <div className="header-greeting">
            <h2 className="habitos-title">Hola Diego,</h2>
            <p className="habitos-subtitle">
              Hoy es <strong>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>. Has completado {progressToday.completed} de {progressToday.total} metas diarias.
            </p>
          </div>
          
          <div className="header-actions-pro">
            <div className="timeline-nav">
              <button className="t-nav-btn" onClick={() => setSemanaOffset(p => p - 1)}><ChevronLeft size={16} /></button>
              <button className="t-nav-btn btn-hoy" onClick={() => setSemanaOffset(0)} disabled={semanaOffset === 0}>
                {semanaOffset === 0 ? "Hoy" : "Volver a Hoy"}
              </button>
              <button className="t-nav-btn" onClick={() => setSemanaOffset(p => Math.min(0, p + 1))} disabled={semanaOffset === 0}><ChevronRight size={16} /></button>
            </div>
            <button className="btn-nuevo-pro" onClick={() => setIsModalOpen(true)}><Plus size={16} /> Agregar</button>
          </div>
        </header>

        {/* OUTSTANDING INSIGHTS (Ahora arriba) */}
        {habits.length > 0 && (
          <div className="ai-insights-panel">
            <div className="ai-header">
              <Sparkles size={16} color="#eab308" />
              <h3>Outstanding Insights</h3>
            </div>
            <div className="ai-cards">
              <div className="ai-card">
                <p>Eficiencia en metas diarias: <strong>{progressToday.percent}%</strong>. {progressToday.percent === 100 ? '¡Día perfecto!' : '¡Mantén el ritmo!'}</p>
              </div>
              <div className="ai-card">
                <p>Tu hábito más consistente de la semana es <strong>{mejorHabito ? mejorHabito.name : 'N/A'}</strong>.</p>
              </div>
              <div className="ai-card">
                <p>Sugerencia: Agrupar tus hábitos diarios en la mañana aumenta la retención un 30%.</p>
              </div>
            </div>
          </div>
        )}

        {/* GRID DE TARJETAS */}
        <div className="habits-card-grid">
          {habits.length === 0 ? (
            <div className="h-empty-state">
              <Target size={40} color="#3f3f46" />
              <h3>El diseño de tu rutina</h3>
              <p>Agrega hábitos y observa tu progreso en tiempo real.</p>
            </div>
          ) : (
            habits.map(habit => (
              <div key={habit.id} className="habit-card">
                <div className="hc-top">
                  <div className="hc-icon">{habit.emoji}</div>
                  <div className="hc-info">
                    <h3 className="hc-name">{habit.name}</h3>
                    <span className="hc-type">{habit.frequency === 'weekly' ? 'Meta Semanal' : 'Hábito Diario'}</span>
                  </div>
                  <button className="hc-menu" onClick={() => deleteHabit(habit.id)}><Trash2 size={14}/></button>
                </div>

                <div className="hc-middle">
                  {renderHabitUI(habit, semanaOffset === 0 ? todayStr : formatLocalValue(weekDates[6]))}
                </div>

                <div className="hc-bottom">
                  <div className="mini-week-cal">
                    {weekDates.map((d, i) => {
                      const dStr = formatLocalValue(d);
                      const val = (habit.logs || {})[dStr] || 0;
                      const isFuture = d > new Date() && dStr !== todayStr;
                      const isDone = habit.frequency === 'weekly' ? val > 0 : val >= habit.goal;
                      
                      return (
                        <div key={i} className={`mini-day ${isFuture ? 'future' : ''} ${dStr === todayStr ? 'today' : ''}`}>
                          <span className="md-label">{weekDaysShort[i]}</span>
                          {/* Círculo ahora se pinta verde (#10b981) para hacer match con la barra */}
                          <div className={`md-bubble ${isDone ? 'done' : ''} ${val > 0 && !isDone ? 'partial' : ''}`}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}