import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../services/firebaseConfig';
import { Plus, Trash2, ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react';
import { EJERCICIOS_DB, CLASES_DB, DIAS_COMPLETOS, DIAS_NOMBRES_CORTOS } from '../data/gymDatabase';
import './Rutinas.css';

export default function Rutinas() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [routines, setRoutines] = useState([]); 
  const [userExercises, setUserExercises] = useState({}); 

  // Estados de Modales
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [modalType, setModalType] = useState('ejercicio'); 
  const [modalItemId, setModalItemId] = useState('');
  const [modalClassTime, setModalClassTime] = useState('');
  const [dropdownSearch, setDropdownSearch] = useState('');
  
  const [modalFreq, setModalFreq] = useState('rutina');
  const [modalTargetDate, setModalTargetDate] = useState(new Date());

  // Estados para Eliminar y Visor de Imágenes
  const [itemToDelete, setItemToDelete] = useState(null); 
  const [viewImage, setViewImage] = useState(null); // Nuevo estado para ver la imagen a pantalla completa

  const user = auth.currentUser;

  // Lógica de Calendario Semanal
  const getDaysOfWeek = (date) => {
    const days = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const weekDays = getDaysOfWeek(currentDate);
  const formatDateStr = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const selectedDateStr = formatDateStr(currentDate); 
  const targetDayName = DIAS_COMPLETOS[modalTargetDate.getDay()]; 

  useEffect(() => {
    if (!user) return;
    const unSubEx = onSnapshot(query(collection(db, 'gym_user_exercises'), where('userId', '==', user.uid)), (snap) => {
      const exMap = {};
      snap.docs.forEach(doc => { exMap[doc.data().exerciseId] = doc.data(); });
      setUserExercises(exMap);
    });
    const unSubRout = onSnapshot(query(collection(db, 'gym_routines'), where('userId', '==', user.uid)), (snap) => {
      setRoutines(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unSubEx(); unSubRout(); };
  }, [user]);

  const openModalForDate = (dateObj) => {
    setModalTargetDate(dateObj);
    setModalItemId('');
    setModalClassTime(''); 
    setDropdownSearch('');
    setShowRoutineModal(true);
  };

  const handleSaveToCalendar = async () => {
    if (!user || !modalItemId) return;
    const targetDateStrForSave = formatDateStr(modalTargetDate);
    
    setShowRoutineModal(false); 
    
    try {
      await addDoc(collection(db, 'gym_routines'), {
        userId: user.uid,
        type: modalType,
        itemId: modalItemId,
        isRoutine: modalFreq === 'rutina',
        dayOfWeek: modalFreq === 'rutina' ? targetDayName : null,
        dateStr: modalFreq === 'solo_hoy' ? targetDateStrForSave : null,
        classTime: modalType === 'clase' ? modalClassTime : null, 
        excludedDates: [],
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error guardando:", error);
    }
    setModalItemId('');
  };

  const confirmDelete = async (deleteType) => {
    if (!itemToDelete || !user) return;
    const docRef = doc(db, 'gym_routines', itemToDelete.rout.id);
    const dateClickedStr = formatDateStr(itemToDelete.dateObj);

    if (itemToDelete.rout.isRoutine && deleteType === 'solo_hoy') {
      await updateDoc(docRef, { excludedDates: arrayUnion(dateClickedStr) });
    } else {
      await deleteDoc(docRef);
    }
    setItemToDelete(null);
  };

  const getDayItems = (dateObj) => {
    const dStr = formatDateStr(dateObj);
    const dName = DIAS_COMPLETOS[dateObj.getDay()];
    return routines.filter(rout => {
      if (rout.isRoutine) return rout.dayOfWeek === dName && !(rout.excludedDates || []).includes(dStr);
      return rout.dateStr === dStr;
    });
  };

  const getDropdownOptions = () => {
    if (modalType === 'ejercicio') {
      let list = EJERCICIOS_DB;
      if (dropdownSearch) {
        list = list.filter(item => item.nombre.toLowerCase().includes(dropdownSearch.toLowerCase()) || item.grupo.toLowerCase().includes(dropdownSearch.toLowerCase()));
      }
      return list;
    } else {
      return CLASES_DB.filter(c => c.horarios.some(h => h.dias.includes(targetDayName)));
    }
  };

  const selectedClass = modalType === 'clase' ? CLASES_DB.find(c => c.id === modalItemId) : null;
  const availableSchedulesForDay = selectedClass ? selectedClass.horarios.filter(h => h.dias.includes(targetDayName)) : [];

  return (
    <>
      <div className="routine-calendar-strip">
        <button className="gym-btn-outline" onClick={() => setCurrentDate(new Date())}>Hoy</button>
        <div className="strip-controls">
          <button className="strip-nav" onClick={() => {const d = new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d);}}><ChevronLeft size={16}/></button>
          <span className="desktop-only week-label">Semana del {weekDays[0].getDate()} de {weekDays[0].toLocaleString('es-ES', {month: 'long'})}</span>
          <div className="strip-days mobile-only">
            {weekDays.map((date, idx) => {
              const isSelected = formatDateStr(date) === selectedDateStr;
              const isToday = formatDateStr(date) === formatDateStr(new Date());
              return (
                <div key={idx} className={`strip-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => setCurrentDate(date)}>
                  <span className="s-name">{DIAS_NOMBRES_CORTOS[idx]}</span>
                  <span className="s-number">{date.getDate()}</span>
                </div>
              );
            })}
          </div>
          <button className="strip-nav" onClick={() => {const d = new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d);}}><ChevronRight size={16}/></button>
        </div>
      </div>

      <div className="week-grid">
        {weekDays.map((dateObj, idx) => {
          const dStr = formatDateStr(dateObj);
          const isSelected = dStr === selectedDateStr;
          const isToday = dStr === formatDateStr(new Date());
          const items = getDayItems(dateObj);

          return (
            <div key={idx} className={`day-column ${isSelected ? 'active-mobile' : ''} ${isToday ? 'is-today' : ''}`}>
              <div className="day-col-header">
                <div className="dch-info">
                  <span className="dch-name">{DIAS_COMPLETOS[dateObj.getDay()]}</span>
                  <span className="dch-number">{dateObj.getDate()}</span>
                </div>
                <button className="dch-add-btn" onClick={() => openModalForDate(dateObj)}><Plus size={16}/></button>
              </div>

              <div className="day-col-body">
                {items.length === 0 ? (
                  <div className="empty-day-state">Descanso</div>
                ) : (
                  items.map(rout => {
                    if (rout.type === 'ejercicio') {
                      const ej = EJERCICIOS_DB.find(e => e.id === rout.itemId);
                      if (!ej) return null;
                      const config = userExercises[rout.itemId] || { series: '-', reps: '-', tiempo: '-' };
                      
                      return (
                        <div key={rout.id} className="compact-card">
                          <div className="cc-body">
                            <h4 className="cc-title">{ej.nombre}</h4>
                            <div className="cc-tags">
                              <span className="cc-tag tag-blue">{ej.grupo}</span>
                            </div>
                            {ej.tipo === 'tiempo' ? (
                              <span className="cc-stat">{config.tiempo} min</span>
                            ) : (
                              <span className="cc-stat">{config.series} x {config.reps}</span>
                            )}
                          </div>
                          
                          {/* Nuevo Footer con el Ojo y la Basura alineados */}
                          <div className="cc-footer">
                            {rout.isRoutine ? <span className="cc-badge">Rutina</span> : <span className="cc-badge once">Adicional</span>}
                            <div className="cc-actions">
                              <button className="cc-btn-icon view" onClick={() => setViewImage(ej.imagen)} title="Ver Imagen">
                                <Eye size={13}/>
                              </button>
                              <button className="cc-btn-icon delete" onClick={() => setItemToDelete({ rout, dateObj })} title="Eliminar">
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const cls = CLASES_DB.find(c => c.id === rout.itemId);
                      if (!cls) return null;
                      return (
                        <div key={rout.id} className="compact-card">
                           <div className="cc-body">
                            <h4 className="cc-title">{cls.nombre}</h4>
                            <div className="cc-tags">
                              <span className={`cc-tag tag-${cls.color}`}>Clase Grupal</span>
                            </div>
                            <span className="cc-stat">{rout.classTime || "Horario por definir"}</span>
                          </div>
                          <div className="cc-footer">
                            {rout.isRoutine ? <span className="cc-badge">Rutina</span> : <span className="cc-badge once">Adicional</span>}
                            <div className="cc-actions">
                              <button className="cc-btn-icon delete" onClick={() => setItemToDelete({ rout, dateObj })} title="Eliminar">
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: VISOR DE IMÁGENES (Ojo) */}
      {viewImage && (
        <div className="gym-modal-overlay" onClick={() => setViewImage(null)}>
          <div className="image-viewer-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn floating" onClick={() => setViewImage(null)}>✕</button>
            <img src={`/ejercicios/${viewImage}`} alt="Vista previa del ejercicio" className="viewer-image" />
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {showRoutineModal && (
        <div className="gym-modal-overlay" onClick={() => setShowRoutineModal(false)}>
          <div className="gym-modal add-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar para el {targetDayName} {modalTargetDate.getDate()}</h3>
              <button className="close-btn" onClick={() => setShowRoutineModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-tabs">
                <button className={`m-tab ${modalType === 'ejercicio' ? 'active' : ''}`} onClick={() => {setModalType('ejercicio'); setModalItemId(''); setDropdownSearch('');}}>Ejercicios</button>
                <button className={`m-tab ${modalType === 'clase' ? 'active' : ''}`} onClick={() => {setModalType('clase'); setModalItemId(''); setDropdownSearch('');}}>Clases Grupales</button>
              </div>
              
              <label className="modal-label">Buscar {modalType}</label>
              
              <div className="searchable-dropdown">
                {modalType === 'ejercicio' && (
                  <div className="sd-search">
                    <Search size={14} />
                    <input type="text" placeholder="Buscar ejercicio..." value={dropdownSearch} onChange={e => setDropdownSearch(e.target.value)} />
                  </div>
                )}
                
                <div className="sd-list">
                  {getDropdownOptions().length === 0 ? (
                    <div className="sd-empty">No hay {modalType}s para este día</div>
                  ) : (
                    getDropdownOptions().map(item => (
                      <div key={item.id} className={`sd-item ${modalItemId === item.id ? 'selected' : ''}`} onClick={() => setModalItemId(item.id)}>
                        <span className="sdi-name">{item.nombre}</span>
                        {item.grupo && <span className="sdi-tag">{item.grupo}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {modalType === 'clase' && selectedClass && (
                <div style={{marginTop: '12px'}}>
                  <label className="modal-label">Seleccionar Horario Disponible</label>
                  <div className="schedule-pills">
                    {availableSchedulesForDay.map((horario, idx) => (
                      <button key={idx} className={`schedule-pill ${modalClassTime === horario.info ? 'active' : ''}`} onClick={() => setModalClassTime(horario.info)}>
                        {horario.info}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="modal-label" style={{marginTop: '12px'}}>Tipo de programación</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" checked={modalFreq === 'rutina'} onChange={() => setModalFreq('rutina')} /> 
                  Rutina Fija (Todos los {targetDayName})
                </label>
                <label className="radio-label">
                  <input type="radio" checked={modalFreq === 'solo_hoy'} onChange={() => setModalFreq('solo_hoy')} /> 
                  Adicional (Solo por este día)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="gym-btn-outline" onClick={() => setShowRoutineModal(false)}>Cancelar</button>
              <button className="gym-btn-primary" onClick={handleSaveToCalendar} disabled={!modalItemId || (modalType === 'clase' && !modalClassTime)}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {itemToDelete && (
        <div className="gym-modal-overlay" onClick={() => setItemToDelete(null)}>
          <div className="gym-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Eliminar del Calendario</h3><button className="close-btn" onClick={() => setItemToDelete(null)}>✕</button></div>
            <div className="modal-body">
              {itemToDelete.rout.isRoutine ? (
                <>
                  <p style={{fontSize: '12px', color: '#71717a'}}>Este elemento es parte de tu rutina. ¿Qué deseas hacer?</p>
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    <button className="gym-btn-outline" onClick={() => confirmDelete('solo_hoy')}>No lo haré / Quitar SOLO hoy</button>
                    <button className="gym-btn-danger" onClick={() => confirmDelete('definitivo')}>Quitar definitivamente</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{fontSize: '12px', color: '#71717a'}}>Elemento adicional. ¿Eliminar?</p>
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    <button className="gym-btn-danger" onClick={() => confirmDelete('definitivo')}>Eliminar registro</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}