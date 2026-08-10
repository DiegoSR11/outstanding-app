import { useState } from 'react';
import './Auth.css';
import logoOs from '../../assets/logo-os.png';
import logoName from '../../assets/logo-name.png';

// Importamos nuestros servicios de Firebase
import { loginUser, registerUser } from '../../services/authService';

export default function Auth() {
  // Estado para alternar entre Login y Registro
  const [isLogin, setIsLogin] = useState(true);
  
  // Estados para los campos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Estados para dar feedback visual al usuario
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos cualquier error previo
    setIsLoading(true); // Bloqueamos el botón y mostramos "Cargando..."

    try {
      if (isLogin) {
        await loginUser(email, password);
        console.log('¡Sesión iniciada con éxito!');
        // Aquí luego redireccionaremos a la pantalla de inicio privada de Outstanding
      } else {
        await registerUser(email, password, name);
        console.log('¡Usuario registrado con éxito!');
        // Aquí luego redireccionaremos a la pantalla de inicio privada de Outstanding
      }
    } catch (err) {
      console.error(err);
      // Manejo de errores amigable en español para el usuario
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false); // Volvemos a habilitar el botón
    }
  };

  return (
    <div className="glass-wrapper">
      {/* Círculos decorativos de luz para el fondo líquido */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      <div className="glass-card">
        <div className="glass-branding">
          <img src={logoOs} alt="Outstanding Logo" className="glass-logo-icon" />
          <img src={logoName} alt="Outstanding" className="glass-logo-text" />
        </div>

        <div className="glass-header">
          <h2>{isLogin ? 'Bienvenido' : 'Únete hoy'}</h2>
          <p>{isLogin ? 'Continúa organizando tu vida.' : 'Empieza a destacar en tu día a día.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-form">
          {!isLogin && (
            <div className="glass-input-group">
              <input 
                type="text" 
                placeholder="Nombre completo (Ej. Diego)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin} 
              />
            </div>
          )}

          <div className="glass-input-group">
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="glass-input-group">
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {isLogin && <a href="#" className="glass-forgot">¿Olvidaste tu contraseña?</a>}

          {/* Mostrar mensaje de error si el usuario se equivoca */}
          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0 0 15px 0', textAlign: 'center', fontWeight: '500' }}>
              {error}
            </p>
          )}

          <button type="submit" className="glass-btn-primary" disabled={isLoading}>
            {isLoading ? 'Cargando...' : (isLogin ? 'Iniciar sesión' : 'Crear cuenta')}
          </button>
        </form>

        <div className="glass-footer">
          <p>
            {isLogin ? '¿Aún no tienes cuenta?' : '¿Ya eres miembro?'}
            <button 
              type="button" /* Evita que el formulario se envíe por accidente */
              className="glass-toggle-btn" 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(''); // Borramos los errores si el usuario cambia de vista
              }}
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}