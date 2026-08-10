import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { 
  LayoutDashboard, Calendar, Folder, Settings, LogOut, 
  Save, Play, ChevronRight, X, Trophy 
} from 'lucide-react';
import logoOs from '../../assets/logo-os.png';
import logoName from '../../assets/logo-name.png';
import './Ruleta.css';

export default function Ruleta() {
  const navigate = useNavigate();
  
  // 1. Estado inicial leyendo de localStorage para no perder datos al cambiar de pestaña
  const [entradas, setEntradas] = useState(() => {
    return localStorage.getItem('ruleta_entradas') || "Londres\nMadrid\nLima\nTokio";
  });
  
  const [rotacion, setRotacion] = useState(0);
  const [girando, setGirando] = useState(false);
  const [ganador, setGanador] = useState(null);
  const canvasRef = useRef(null);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error('Error', error); }
  };

  // 2. Guardar automáticamente en localStorage cuando el texto cambia
  useEffect(() => {
    localStorage.setItem('ruleta_entradas', entradas);
    dibujarRuleta();
  }, [entradas]);

  // 3. Lógica experta para dibujar el Canvas dinámicamente
  const dibujarRuleta = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Filtrar líneas vacías
    const items = entradas.split('\n').filter(i => i.trim() !== '');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (items.length === 0) return;

    const arc = (Math.PI * 2) / items.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;
    
    items.forEach((item, i) => {
      const angle = i * arc;
      
      // Dibujar rebanada
      ctx.beginPath();
      ctx.fillStyle = `hsl(${(i * 360) / items.length}, 75%, 60%)`; // Colores dinámicos hermosos
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.fill();
      
      // Borde de la rebanada
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#121214";
      ctx.stroke();
      
      // Dibujar Texto
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px 'Inter', sans-serif";
      // Posicionar el texto en el medio de la rebanada
      ctx.translate(
        centerX + Math.cos(angle + arc / 2) * (radius - 30), 
        centerY + Math.sin(angle + arc / 2) * (radius - 30)
      );
      ctx.rotate(angle + arc / 2 + Math.PI); // Orientar el texto hacia el centro
      // Acortar texto si es muy largo
      const textToDraw = item.length > 15 ? item.substring(0, 15) + '...' : item;
      ctx.fillText(textToDraw, 0, 5); 
      ctx.restore();
    });

    // Dibujar el centro de la ruleta
    ctx.beginPath();
    ctx.fillStyle = "#18181b";
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fill();
  };

  // 4. Lógica Matemática del Giro
  const girarRuleta = () => {
    const items = entradas.split('\n').filter(i => i.trim() !== '');
    if (girando || items.length < 2) return;
    
    setGirando(true);
    setGanador(null); // Ocultar ganador anterior si lo hay

    // 10 vueltas completas (3600 grados) + un ángulo aleatorio extra
    const gradosAleatorios = Math.floor(Math.random() * 360);
    const nuevoGiro = rotacion + 3600 + gradosAleatorios;
    
    setRotacion(nuevoGiro);
    
    // Calcular el ganador matemáticamente basado en el ángulo final
    // El puntero está en los 0 grados (lado derecho)
    setTimeout(() => {
      setGirando(false);
      const anguloFinal = nuevoGiro % 360;
      // Cálculo para encontrar el índice inverso que se detuvo en el puntero
      const index = Math.floor(((360 - anguloFinal) % 360) / (360 / items.length));
      setGanador(items[index]);
    }, 5000); // 5 segundos, igual que la transición CSS
  };

  return (
    <div className="dash-layout">
      
      {/* MODAL DE GANADOR */}
      {ganador && (
        <div className="winner-modal-overlay" onClick={() => setGanador(null)}>
          <div className="winner-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="winner-close" onClick={() => setGanador(null)}><X size={20}/></button>
            <Trophy size={60} color="#f59e0b" className="winner-icon" />
            <h3>¡Tenemos un ganador!</h3>
            <div className="winner-name">{ganador}</div>
            <button className="btn-comenzar" onClick={() => setGanador(null)}>Aceptar</button>
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
            <li className="nav-item" onClick={() => navigate('/tasks')}><Folder size={14} /> Tareas</li>
            <li className="nav-item" onClick={() => navigate('/calendar')}><Calendar size={14} /> Calendario</li>
          </ul>
          <p className="nav-title">RECIENTES</p>
          <ul className="nav-list">
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="dash-main ruleta-main">
        <div className="ruleta-layout">
          
          {/* Panel Izquierdo: Lista de Entradas */}
          <div className="panel-entradas">
            <div className="panel-header">
              Entradas <span>({entradas.split('\n').filter(i=>i.trim()!=='').length})</span>
            </div>
            
            <textarea 
              value={entradas} 
              onChange={(e) => setEntradas(e.target.value)}
              placeholder="Escribe cada opción en una línea nueva..."
              disabled={girando}
            />
            
            <div className="acciones">
              <button className="btn-guardar"><Save size={16}/> Guardar Set</button>
              <button 
                className={`btn-comenzar ${girando ? 'disabled' : ''}`} 
                onClick={girarRuleta}
                disabled={girando}
              >
                <Play size={16}/> {girando ? 'Girando...' : 'Comenzar'}
              </button>
            </div>
          </div>

          {/* Panel Derecho: La Ruleta Visual */}
          <div className="panel-visual">
            <div className="ruleta-wrapper">
              <canvas 
                ref={canvasRef} 
                width={450} 
                height={450} 
                className="ruleta-canvas"
                style={{ 
                  transform: `rotate(${rotacion}deg)`, 
                  // Transición realista (empieza rápido, termina lento)
                  transition: 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' 
                }} 
              />
              {/* Puntero a la derecha (3 en punto) */}
              <div className="puntero"></div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}