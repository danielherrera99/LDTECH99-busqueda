import { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  LogOut, 
  Calculator, 
  Laptop, 
  Layers, 
  Globe, 
  Phone, 
  ExternalLink, 
  Code, 
  Database, 
  Sparkles, 
  Smartphone, 
  Terminal, 
  ArrowRight, 
  MapPin
} from 'lucide-react';
import { authService } from './services/api';
import './App.css';

// Componentes SVG Inline para Redes Sociales y Marcas
const Facebook = ({ size = 24, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Twitter = ({ size = 24, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Github = ({ size = 24, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Linkedin = ({ size = 24, ...props }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);


function App() {
  // --- Estados de Autenticación ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- Estados de la Calculadora de Presupuesto ---
  const [selectedService, setSelectedService] = useState('webapp');
  const [addons, setAddons] = useState(['database', 'admin']);

  // --- Efecto inicial para recuperar la sesión ---
  useEffect(() => {
    const checkSession = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
      }
    };
    checkSession();
  }, []);

  // --- Manejador del Login ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!username.trim()) {
      setError('Por favor, ingresa tu usuario (admin).');
      return;
    }
    if (!password) {
      setError('Por favor, ingresa tu contraseña (admin123).');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(username, password);
      if (response.success) {
        setSuccess('¡Acceso concedido! Descifrando portal...');
        setCurrentUser(response.user);
        
        // Retardo para mostrar la animación de éxito antes de redirigir
        setTimeout(() => {
          setIsAuthenticated(true);
          setLoading(false);
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
      setLoading(false);
    }
  };

  // --- Manejador de Logout ---
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setSuccess('');
  };

  // --- Lógica del Cotizador ---
  const services = {
    landing: { name: 'Landing Page Corporativa', price: 300, days: 5 },
    webapp: { name: 'Aplicación Web Completa (SaaS)', price: 800, days: 15 },
    mobile: { name: 'Aplicación Móvil Híbrida (iOS/Android)', price: 1200, days: 20 },
    ecommerce: { name: 'Sistema a Medida / E-commerce', price: 1000, days: 18 }
  };

  const addonOptions = [
    { id: 'database', name: 'Base de datos en la nube & Autenticación', price: 250, days: 4, icon: Database },
    { id: 'realtime', name: 'Sincronización en tiempo real (WebSockets)', price: 200, days: 3, icon: Sparkles },
    { id: 'multilang', name: 'Soporte Multi-idioma (i18n)', price: 100, days: 2, icon: Globe },
    { id: 'maps', name: 'Mapas interactivos & Geolocalización (GIS)', price: 150, days: 3, icon: MapPin },
    { id: 'apis', name: 'Integración con APIs externas', price: 180, days: 3, icon: Code },
    { id: 'admin', name: 'Panel de Administración Avanzado (Dashboard)', price: 300, days: 5, icon: Layers }
  ];

  const handleAddonToggle = (addonId) => {
    if (addons.includes(addonId)) {
      setAddons(addons.filter(id => id !== addonId));
    } else {
      setAddons([...addons, addonId]);
    }
  };

  // Cálculos dinámicos de cotización
  const basePrice = services[selectedService].price;
  const baseDays = services[selectedService].days;

  const addonsPrice = addons.reduce((sum, id) => {
    const option = addonOptions.find(opt => opt.id === id);
    return sum + (option ? option.price : 0);
  }, 0);

  const addonsDays = addons.reduce((sum, id) => {
    const option = addonOptions.find(opt => opt.id === id);
    return sum + (option ? option.days : 0);
  }, 0);

  const totalPrice = basePrice + addonsPrice;
  const totalDays = baseDays + addonsDays;

  // Enlace dinámico a WhatsApp
  const generateWhatsAppLink = () => {
    const targetPhone = '51956041289'; // Número celular de Luis Daniel Herrera
    const serviceName = services[selectedService].name;
    const selectedAddonNames = addons
      .map(id => addonOptions.find(opt => opt.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const text = `Hola Luis Daniel, he calculado una cotización en LDTech99 para mi nuevo desarrollo:
- *Proyecto Base*: ${serviceName}
- *Adicionales*: ${selectedAddonNames || 'Ninguno'}
- *Costo Estimado*: $${totalPrice} USD
- *Tiempo Estimado*: ${totalDays} días.
¡Me gustaría conversar más al respecto para comenzar el proyecto!`;

    return `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`;
  };

  // --- RENDER DE LA PANTALLA DE LOGIN (TEMÁTICA CYBER) ---
  if (!isAuthenticated) {
    return (
      <div className="login-view-wrapper">
        <div className="login-container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <Terminal size={40} className="glow-icon" style={{ color: '#00FF00' }} />
          </div>
          <h1>LDTech99<span className="terminal-cursor"></span></h1>
          <p className="subtitle">Console Login - Secure API Gateway</p>
          
          {error && (
            <div className="error-box">
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-box">
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="input-wrapper">
              <User size={18} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Usuario (admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="input-wrapper">
              <Lock size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="input-field password-input" 
                placeholder="Contraseña (admin123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                title={showPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="options">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label-text">Recordarme</span>
              </label>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                alert('Pista: El usuario por defecto de desarrollo es "admin" y la contraseña es "admin123".');
              }}>¿Olvidaste Contraseña?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>PROCESANDO CREDENCIALES...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN / INICIAR SESIÓN</span>
                </>
              )}
            </button>
          </form>

          <p className="divider">— Or Sign In With —</p>

          <div className="social-login">
            <a href="#" className="social-btn" onClick={(e) => {
              e.preventDefault();
              alert('Autenticación mediante Facebook no configurada. Use el inicio de sesión de consola.');
            }}>
              <Facebook size={16} /> Facebook
            </a>
            <a href="#" className="social-btn" onClick={(e) => {
              e.preventDefault();
              alert('Autenticación mediante Twitter no configurada. Use el inicio de sesión de consola.');
            }}>
              <Twitter size={16} /> Twitter
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DEL PORTAL PREMIUM LDTECH99 (DASHBOARD & PORTAFOLIO) ---
  return (
    <>
      <div className="grid-overlay"></div>
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Cabecera / Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(4, 5, 9, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '16px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal style={{ color: 'var(--accent-cyan)' }} size={24} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.3rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px'
          }}>LDTECH99</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#inicio" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Inicio</a>
          <a href="#servicios" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Servicios</a>
          <a href="#proyectos" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Proyectos</a>
          <a href="#cotizador" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Cotizador</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <img src={currentUser?.avatar} alt={currentUser?.username} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>{currentUser?.username}</span>
          </div>
          <button onClick={handleLogout} className="btn" style={{ padding: '8px 16px', background: 'rgba(255,0,0,0.1)', color: '#ff7e7e', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" style={{
        padding: '100px 5% 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="badge-tech" style={{ marginBottom: '24px', background: 'rgba(0, 242, 254, 0.08)', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
          <Sparkles size={14} /> LISTO PARA EL DESARROLLO DE TU NUEVA API
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          lineHeight: 1.1,
          maxWidth: '1000px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #ffffff 30%, var(--text-main) 70%, var(--accent-cyan) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '24px'
        }}>
          Transformamos Ideas en Software Premium & Experiencias Digitales
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          marginBottom: '40px',
          lineHeight: '1.7'
        }}>
          Diseño web a medida, arquitectura en la nube de alta disponibilidad y soluciones de software escalables. Desarrollado por Luis Daniel Herrera.
        </p>

        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#cotizador" className="btn btn-primary">
            <Calculator size={18} /> Cotizar Mi Proyecto
          </a>
          <a href="#proyectos" className="btn btn-secondary">
            Ver Portafolio <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Servicios Section */}
      <section id="servicios" style={{ padding: '80px 5%', background: 'rgba(0, 0, 0, 0.2)' }}>
        <h2 className="section-title">Nuestros Servicios Premium</h2>
        <p className="section-subtitle">Soluciones de software de primer nivel diseñadas para escalar tu negocio a escala global.</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          marginTop: '20px'
        }}>
          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 242, 254, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'var(--accent-cyan)' }}>
              <Laptop size={24} />
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.25rem' }}>Desarrollo Web Premium</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Plataformas SPA y SSR de alta performance utilizando React, Next.js y Vite. Interfaces responsivas y animaciones fluidas a medida.</p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(138, 43, 226, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'var(--accent-violet)' }}>
              <Smartphone size={24} />
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.25rem' }}>Aplicaciones Móviles</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Construcción de aplicaciones móviles cross-platform para iOS y Android con arquitecturas fluidas de alto rendimiento y conexión API nativa.</p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 255, 136, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'var(--accent-green)' }}>
              <Database size={24} />
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.25rem' }}>Sistemas Cloud & Backend</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Arquitecturas de servidor robustas basadas en Node.js, Express, bases de datos relacionales y no relacionales, con APIs RESTful seguras.</p>
          </div>

          <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 126, 95, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'var(--accent-orange)' }}>
              <Code size={24} />
            </div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.25rem' }}>Automatización y APIs</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Conexión e integraciones complejas de servicios web, Webhooks, pasarelas de pago y sincronización de datos en tiempo real.</p>
          </div>
        </div>
      </section>

      {/* Proyectos Section */}
      <section id="proyectos" style={{ padding: '80px 5%' }}>
        <h2 className="section-title">Portafolio Premium</h2>
        <p className="section-subtitle">Explora los últimos desarrollos exitosos lanzados en entornos de producción real.</p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
          marginTop: '20px'
        }}>
          {/* Proyecto Jufra */}
          <div className="glass-card" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            padding: '40px',
            gap: '30px',
            background: 'linear-gradient(135deg, rgba(11, 12, 19, 0.85) 0%, rgba(4, 5, 9, 0.95) 100%)',
            alignItems: 'center'
          }}>
            <div>
              <div className="badge-tech" style={{ marginBottom: '15px', color: '#ffb47b', borderColor: '#ffb47b', background: 'rgba(254, 180, 123, 0.05)' }}>PRODUCCIÓN ACTIVA</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                JUFRA Perú Portal Comunitario <Globe size={20} />
              </h3>
              <p style={{ color: 'var(--text-main)', marginBottom: '20px', lineHeight: '1.7' }}>
                Plataforma web comunitaria integrada con base de datos en la nube que cuenta con un mapa interactivo GIS del Perú para la visualización de 4 regiones oficiales. Sistema de registro automático de fraternidades y panel administrativo para la exportación de reportes y solicitudes de incorporación.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                <span className="badge-tech">React.js</span>
                <span className="badge-tech">Node.js</span>
                <span className="badge-tech">MongoDB</span>
                <span className="badge-tech">GIS Leaflet</span>
                <span className="badge-tech">TailwindCSS</span>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => alert('Visualización interna del proyecto: Contiene mapa GIS responsivo y control de fraternidades en producción.')} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>

          {/* Proyecto Catequesis */}
          <div className="glass-card" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            padding: '40px',
            gap: '30px',
            background: 'linear-gradient(135deg, rgba(11, 12, 19, 0.85) 0%, rgba(4, 5, 9, 0.95) 100%)',
            alignItems: 'center'
          }}>
            <div>
              <div className="badge-tech" style={{ marginBottom: '15px', color: '#00ff88', borderColor: '#00ff88', background: 'rgba(0, 255, 136, 0.05)' }}>COMPLETADO</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Catequesis Parroquial Pomalca <Layers size={20} />
              </h3>
              <p style={{ color: 'var(--text-main)', marginBottom: '20px', lineHeight: '1.7' }}>
                Sistema de control de registros sacramentales, asistencia automatizada y emisión de constancias digitales. Permite a los catequistas llevar un control estructurado en tiempo real del progreso de confirmación y comunión de los jóvenes locales.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                <span className="badge-tech">React.js</span>
                <span className="badge-tech">Express</span>
                <span className="badge-tech">MongoDB</span>
                <span className="badge-tech">JWT Auth</span>
                <span className="badge-tech">Cloudinary API</span>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => alert('Visualización interna: Sistema CRUD robusto con niveles de rol administrador y catequista.')} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section style={{ padding: '60px 5%', textAlign: 'center', background: 'rgba(0,0,0,0.15)' }}>
        <h2 className="section-title">Pila Tecnológica Avanzada</h2>
        <p className="section-subtitle" style={{ marginBottom: '2.5rem' }}>Las herramientas de alta gama y arquitecturas de código en las que nos especializamos.</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
          <span className="badge-tech" style={{ padding: '12px 24px', fontSize: '1rem' }}><Code size={18} /> React & Vite</span>
          <span className="badge-tech" style={{ padding: '12px 24px', fontSize: '1rem' }}><Laptop size={18} /> Next.js (SSR)</span>
          <span className="badge-tech" style={{ padding: '12px 24px', fontSize: '1rem' }}><Terminal size={18} /> Node.js & Express</span>
          <span className="badge-tech" style={{ padding: '12px 24px', fontSize: '1rem' }}><Database size={18} /> MongoDB</span>
          <span className="badge-tech" style={{ padding: '12px 24px', fontSize: '1rem' }}><Layers size={18} /> RESTful API Design</span>
          <span className="badge-tech" style={{ padding: '12px 24px', fontSize: '1rem' }}><Globe size={18} /> Leaflet GIS</span>
          <span className="badge-tech" style={{ padding: '12px 24px', fontSize: '1rem' }}><Sparkles size={18} /> CSS Glassmorphism</span>
          <span className="badge-tech" style={{ padding: '12px 24px', fontSize: '1rem' }}><Github size={18} /> Git & CI/CD</span>
        </div>
      </section>

      {/* Cotizador Section */}
      <section id="cotizador" style={{ padding: '80px 5%', background: 'linear-gradient(rgba(0,0,0,0) 0%, rgba(4,5,9,0.7) 100%)' }}>
        <h2 className="section-title">Calculadora de Presupuesto</h2>
        <p className="section-subtitle">Calcula el precio y plazo estimado para tu nuevo desarrollo en tiempo real.</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          marginTop: '30px',
          alignItems: 'start'
        }}>
          {/* Configuración */}
          <div className="glass-card" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Layers size={18} style={{ color: 'var(--accent-cyan)' }} /> 1. TIPO DE PROYECTO
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              {Object.keys(services).map((key) => {
                const isSelected = selectedService === key;
                return (
                  <div 
                    key={key} 
                    onClick={() => setSelectedService(key)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(0, 242, 254, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-glass)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '1rem', color: isSelected ? 'var(--text-bright)' : 'var(--text-main)' }}>{services[key].name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Estimado base: {services[key].days} días</p>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: isSelected ? 'var(--accent-cyan)' : 'var(--text-bright)'
                    }}>${services[key].price} USD</span>
                  </div>
                );
              })}
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Code size={18} style={{ color: 'var(--accent-purple)' }} /> 2. MÓDULOS ADICIONALES
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {addonOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isChecked = addons.includes(opt.id);
                return (
                  <div 
                    key={opt.id} 
                    onClick={() => handleAddonToggle(opt.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      background: isChecked ? 'rgba(138, 43, 226, 0.06)' : 'rgba(255, 255, 255, 0.01)',
                      border: `1px solid ${isChecked ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '6px', 
                        background: isChecked ? 'rgba(138,43,226,0.1)' : 'rgba(255,255,255,0.03)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: isChecked ? 'var(--accent-purple)' : 'var(--text-muted)'
                      }}>
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: isChecked ? 'var(--text-bright)' : 'var(--text-main)', display: 'block' }}>{opt.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{opt.days} días</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>+${opt.price} USD</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resultados */}
          <div className="glass-card" style={{
            padding: '40px',
            border: '1px solid rgba(0, 242, 254, 0.15)',
            background: 'linear-gradient(135deg, rgba(11, 12, 19, 0.9) 0%, rgba(4, 5, 9, 0.98) 100%)',
            position: 'sticky',
            top: '100px'
          }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Calculator size={20} style={{ color: 'var(--accent-cyan)' }} /> Resumen de Presupuesto
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '35px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>Costo Estimado</span>
                <span style={{ fontSize: '3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0, 242, 254, 0.2)' }}>
                  ${totalPrice} <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 400 }}>USD</span>
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>Plazo Aproximado</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-bright)' }}>
                  {totalDays} días hábiles
                </span>
              </div>

              {/* Barra de progreso de tiempo */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Complejidad de Integración</span>
                  <span>{totalDays > 25 ? 'Alta' : totalDays > 12 ? 'Media' : 'Estándar'}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min((totalDays / 45) * 100, 100)}%`, 
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease'
                  }}></div>
                </div>
              </div>
            </div>

            <a 
              href={generateWhatsAppLink()} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '16px 0',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <Phone size={18} /> Enviar Cotización por WhatsApp
            </a>
            
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '15px' }}>
              Genera un mensaje pre-formateado directo al chat del programador Luis Daniel.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(4,5,9,0.98)',
        borderTop: '1px solid var(--border-glass)',
        padding: '50px 5% 30px',
        marginTop: '60px'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '30px',
          borderBottom: '1px solid var(--border-glass)',
          paddingBottom: '30px',
          marginBottom: '30px'
        }}>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>LDTech99</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>Desarrollos de Software de Alta Gama & Integración Tecnológica</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <a href="https://github.com/danielherrera99" target="_blank" rel="noopener noreferrer" className="badge-tech" style={{ padding: '8px 16px' }}>
              <Github size={16} /> GitHub
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="badge-tech" style={{ padding: '8px 16px' }}>
              <Linkedin size={16} /> LinkedIn
            </a>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>© 2026 LDTech99. Todos los derechos reservados.</span>
          <span>Desarrollado en Chiclayo, Perú.</span>
        </div>
      </footer>
    </>
  );
}

export default App;
