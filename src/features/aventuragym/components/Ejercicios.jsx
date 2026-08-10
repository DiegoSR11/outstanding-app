import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebaseConfig';
import { Search, Save, Image as ImageIcon, Eye } from 'lucide-react';
import { EJERCICIOS_DB } from '../data/gymDatabase';
import './Ejercicios.css';

function ExerciseConfigCard({ ejercicio, initialSeries, initialReps, initialTiempo, onSave, onViewImage }) {
  const [series, setSeries] = useState(initialSeries);
  const [reps, setReps] = useState(initialReps);
  const [tiempo, setTiempo] = useState(initialTiempo);

  // Asegura que los inputs se llenen automáticamente apenas Firebase envíe los datos guardados
  useEffect(() => {
    setSeries(initialSeries);
    setReps(initialReps);
    setTiempo(initialTiempo);
  }, [initialSeries, initialReps, initialTiempo]);

  return (
    <div className="cat-card">
      <div 
        className="cat-img-placeholder" 
        style={{ 
          backgroundImage: `url('/ejercicios/${ejercicio.imagen}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: ejercicio.imagen ? 'pointer' : 'default'
        }}
        onClick={() => ejercicio.imagen && onViewImage(ejercicio.imagen)}
      >
        {!ejercicio.imagen && <><ImageIcon size={24} /> <span>Sin Imagen</span></>}
        
        {/* Capa oscura con el ojito que aparece al pasar el ratón */}
        {ejercicio.imagen && (
          <div className="img-zoom-overlay">
            <Eye size={24} />
          </div>
        )}
      </div>

      <div className="cat-info">
        <span className="cat-grupo">{ejercicio.grupo}</span>
        <h4>{ejercicio.nombre}</h4>
        
        <div className="cat-config">
          {ejercicio.tipo === 'tiempo' ? (
            <div className="cc-box">
              <label>Minutos</label>
              <input type="text" value={tiempo} onChange={e => setTiempo(e.target.value)} placeholder="-" />
            </div>
          ) : (
            <>
              <div className="cc-box">
                <label>Series</label>
                <input type="text" value={series} onChange={e => setSeries(e.target.value)} placeholder="-" />
              </div>
              <div className="cc-box">
                <label>Reps</label>
                <input type="text" value={reps} onChange={e => setReps(e.target.value)} placeholder="-" />
              </div>
            </>
          )}

          <button className="cc-save-btn" onClick={() => onSave(ejercicio.id, series, reps, tiempo)} title="Guardar">
            <Save size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Ejercicios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('Todos');
  const [userExercises, setUserExercises] = useState({}); 
  const [viewImage, setViewImage] = useState(null); // Estado para el Visor de Imágenes a pantalla completa
  
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const unSubEx = onSnapshot(query(collection(db, 'gym_user_exercises'), where('userId', '==', user.uid)), (snap) => {
      const exMap = {};
      snap.docs.forEach(doc => { exMap[doc.data().exerciseId] = doc.data(); });
      setUserExercises(exMap);
    });
    return () => unSubEx();
  }, [user]);

  const handleSaveConfig = async (exerciseId, series, reps, tiempo) => {
    if (!user) return;
    await setDoc(doc(db, 'gym_user_exercises', `${user.uid}_${exerciseId}`), {
      userId: user.uid, 
      exerciseId, 
      series: series || '-', 
      reps: reps || '-',
      tiempo: tiempo || '-'
    }, { merge: true });
  };

  let filtered = EJERCICIOS_DB;
  if (filterGroup !== 'Todos') filtered = filtered.filter(ej => ej.grupo.includes(filterGroup));
  if (searchTerm) filtered = filtered.filter(ej => ej.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = ['Todos', 'Brazos', 'Pectorales', 'Espalda', 'Piernas y Glúteos', 'Abdomen', 'Cintura', 'Trapecio', 'Hombros', 'Calentamiento'];

  return (
    <>
      <div className="gym-toolbar">
        <div className="tools-search">
          <Search size={14} />
          <input type="text" placeholder="Buscar ejercicio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="catalog-filters">
          {categories.map(cat => <button key={cat} className={`cat-pill ${filterGroup === cat ? 'active' : ''}`} onClick={() => setFilterGroup(cat)}>{cat}</button>)}
        </div>
      </div>
      
      <div className="catalogo-grid">
        {filtered.map(ej => {
          const config = userExercises[ej.id] || { series: '', reps: '', tiempo: '' };
          return (
            <ExerciseConfigCard 
              key={ej.id} 
              ejercicio={ej} 
              initialSeries={config.series} 
              initialReps={config.reps} 
              initialTiempo={config.tiempo}
              onSave={handleSaveConfig} 
              onViewImage={setViewImage}
            />
          );
        })}
      </div>

      {/* MODAL: VISOR DE IMÁGENES */}
      {viewImage && (
        <div className="gym-modal-overlay" onClick={() => setViewImage(null)}>
          <div className="image-viewer-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn floating" onClick={() => setViewImage(null)}>✕</button>
            <img src={`/ejercicios/${viewImage}`} alt="Vista previa del ejercicio" className="viewer-image" />
          </div>
        </div>
      )}
    </>
  );
}