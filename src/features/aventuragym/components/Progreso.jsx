import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../services/firebaseConfig';
import { TrendingUp, Trash2 } from 'lucide-react';
import './Progreso.css';

export default function Progreso() {
  const [progressFeed, setProgressFeed] = useState([]);
  const [progressMetric, setProgressMetric] = useState('Peso');
  const [progressValue, setProgressValue] = useState('');
  const user = auth.currentUser;
  const userName = user?.displayName || 'Usuario';

  useEffect(() => {
    if (!user) return;
    const unSub = onSnapshot(query(collection(db, 'gym_progress'), where('userId', '==', user.uid)), (snap) => {
      const feed = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      feed.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setProgressFeed(feed);
    });
    return () => unSub();
  }, [user]);

  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!progressValue || isNaN(progressValue)) return;
    await addDoc(collection(db, 'gym_progress'), {
      userId: user.uid, userName, metric: progressMetric, value: Number(progressValue), createdAt: serverTimestamp()
    });
    setProgressValue('');
  };

  const handleDelete = async (id) => await deleteDoc(doc(db, 'gym_progress', id));

  return (
    <div className="layout-progreso">
      <div className="progreso-input-area">
        <h3>Registrar nuevo avance</h3>
        <form className="pi-form" onSubmit={handleAddProgress}>
          <select className="pi-select" value={progressMetric} onChange={e => setProgressMetric(e.target.value)}>
            <option value="Peso">Peso (kg)</option>
            <option value="Cintura">Cintura (cm)</option>
            <option value="Brazo">Brazo (cm)</option>
          </select>
          <input type="number" step="0.01" placeholder="Ej. 63.5" className="pi-input flex-1" value={progressValue} onChange={e => setProgressValue(e.target.value)} required />
          <button type="submit" className="gym-btn-primary">Guardar</button>
        </form>
      </div>

      <div className="progreso-feed">
        <h3>Historial de Progreso</h3>
        {progressFeed.length === 0 ? <div className="empty-state">Aún no has registrado avances.</div> : progressFeed.map(record => (
          <div key={record.id} className="feed-card">
            <div className="fc-icon"><TrendingUp size={16}/></div>
            <div className="fc-data">
              <p><strong>{record.userName}</strong> {record.metric === 'Peso' ? 'registró su peso' : `registró medida de ${record.metric}`}: <span className="fc-highlight">{record.value} {record.metric === 'Peso' ? 'kg' : 'cm'}</span></p>
              <span className="fc-date">{record.createdAt ? record.createdAt.toDate().toLocaleString('es-ES') : 'Recién ahora'}</span>
            </div>
            <button className="fc-delete-btn" onClick={() => handleDelete(record.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}