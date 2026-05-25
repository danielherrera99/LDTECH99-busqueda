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
  MapPin,
  Car,
  PhoneCall,
  Users,
  Search,
  Fingerprint,
  Shield,
  Wifi
} from 'lucide-react';
import {
  authService,
  sunatService,
  reniecBasicService,
  reniecService,
  dnitService,
  nmService,
  agService,
  telpService,
  telpCelService,
  plaService,
  denService,
  denPdfService,
  rqhService
} from './services/api';
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

  // --- Estados del Sistema OSINT (9 Módulos Codart) ---
  const [osintModule, setOsintModule] = useState('ruc'); // ruc|dni_basic|dni_premium|dnit|nm|ag|telp|telp_cel|pla
  const [gatewayMode, setGatewayMode] = useState('direct'); // 'direct' | 'backend'

  // Inputs dinámicos
  const [queryInput, setQueryInput] = useState('');   // Input principal (RUC/DNI/Placa/Celular)
  const [nmN1, setNmN1] = useState('');               // Nombre 1 (para NM)
  const [nmAp1, setNmAp1] = useState('');             // Apellido 1 (para NM)
  const [nmAp2, setNmAp2] = useState('');             // Apellido 2 (para NM)

  // Estado unificado de resultados
  const [osintLoading, setOsintLoading] = useState(false);
  const [osintError, setOsintError] = useState('');
  const [osintResult, setOsintResult] = useState(null);
  const [osintSource, setOsintSource] = useState('');
  const [queryHistory, setQueryHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('osint_query_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[HISTORY INIT]', e);
    }
    return [{ query: '20538856674', module: 'ruc' }, { query: '00000000', module: 'dni_basic' }];
  });

  // Estado para cachear la información completa de las consultas
  const [resultsCache, setResultsCache] = useState(() => {
    try {
      const saved = localStorage.getItem('osint_results_cache');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn('[CACHE INIT]', e);
      return {};
    }
  });

  // Compatibilidad retroactiva (alias)
  const queryType    = osintModule === 'ruc' ? 'ruc' : 'dni';
  const rucLoading   = osintLoading && osintModule === 'ruc';
  const dniLoading   = osintLoading && osintModule !== 'ruc';
  const rucResult    = osintModule === 'ruc' ? osintResult : null;
  const dniResult    = osintModule !== 'ruc' ? osintResult : null;
  const rucSource    = osintSource;
  const dniSource    = osintSource;
  const rucInput     = osintModule === 'ruc' ? queryInput : '';
  const dniInput     = osintModule !== 'ruc' ? queryInput : '';
  const rucHistory   = ['20538856674'];
  const dniHistory   = ['00000000'];

  const [apiToken, setApiToken] = useState(() => {
    const saved = localStorage.getItem('sunat_token');
    if (!saved || saved.includes('http') || saved.length < 20) {
      const defaultToken = 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr';
      localStorage.setItem('sunat_token', defaultToken);
      return defaultToken;
    }
    return saved;
  });
  const [showToken, setShowToken] = useState(false);
  const [terminalTab, setTerminalTab] = useState('visual'); // 'visual' | 'json'

  const handleTokenChange = (val) => {
    setApiToken(val);
    localStorage.setItem('sunat_token', val);
  };

  // ─── Mapa de configuraciones por módulo ──────────────────────────────────────
  const MODULE_CONFIG = {
    ruc:        { label: 'CONSULTAR_RUC()',         cost: '1 Pet',   color: '#00ff00', icon: '🏢', placeholder: '20538856674', maxLen: 11, validate: /^\d{11}$/, hint: '11 dígitos' },
    dni_basic:  { label: 'CONSULTAR_DNI_BASIC()',   cost: '1 Pet',   color: '#00f2fe', icon: '👤', placeholder: '00000000',    maxLen: 8,  validate: /^\d{8}$/,  hint: '8 dígitos' },
    dni_premium:{ label: 'CONSULTAR_DNI_PREMIUM()', cost: '2 Cred',  color: '#9b51e0', icon: '🪪', placeholder: '00000000',    maxLen: 8,  validate: /^\d{8}$/,  hint: '8 dígitos' },
    dnit:       { label: 'CONSULTAR_DNIT_EXT()',    cost: '5 Cred',  color: '#ff6b35', icon: '🔏', placeholder: '00000000',    maxLen: 8,  validate: /^\d{8}$/,  hint: '8 dígitos' },
    nm:         { label: 'CONSULTAR_NM()',          cost: '4 Cred',  color: '#ffaa00', icon: '🔍', placeholder: 'LUIS',          maxLen: 30, validate: /.{2,}/,    hint: 'n1 + ap1 + ap2' },
    ag:         { label: 'CONSULTAR_AG()',          cost: '8 Cred',  color: '#ff4d94', icon: '🌳', placeholder: '00000000',    maxLen: 8,  validate: /^\d{8}$/,  hint: '8 dígitos' },
    telp:       { label: 'CONSULTAR_TELP()',        cost: '15 Cred', color: '#00ff88', icon: '📱', placeholder: '00000000',    maxLen: 8,  validate: /^\d{8}$/,  hint: '8 dígitos' },
    telp_cel:   { label: 'CONSULTAR_TELP_CEL()',   cost: '15 Cred', color: '#00aaff', icon: '📞', placeholder: '956041289',    maxLen: 9,  validate: /^\d{9}$/,  hint: '9 dígitos (celular)' },
    pla:        { label: 'CONSULTAR_PLA()',         cost: '2 Cred',  color: '#ffdd00', icon: '🚗', placeholder: 'D5G960',        maxLen: 7,  validate: /^[A-Z0-9]{6,7}$/i, hint: '6-7 alfanuméricos' },
    den:        { label: 'CONSULTAR_DENUNCIAS_PNP()', cost: '15 Cred', color: '#ff0055', icon: '🚨', placeholder: '00000000',    maxLen: 8,  validate: /^\d{8}$/,  hint: '8 dígitos (DNI)' },
    den_pdf:    { label: 'DESCARGAR_DENUNCIAS_PDF()', cost: '30 Cred', color: '#ff5500', icon: '📄', placeholder: '00000000',    maxLen: 8,  validate: /^\d{8}$/,  hint: '8 dígitos (DNI)' },
    rqh:        { label: 'CONSULTAR_REQUISITORIAS_RQH()', cost: '30 Cred', color: '#ff00cc', icon: '🔨', placeholder: '00000000',  maxLen: 8,  validate: /^\d{8}$/,  hint: '8 dígitos (DNI)' },
  };

  // ─── Manejador OSINT unificado (9 módulos) ──────────────────────────────────
  const handleOsintSearch = async (e, customInput, customModule, forceRefresh = false) => {
    if (e) e.preventDefault();
    const activeModule = customModule || osintModule;
    const target = customInput || queryInput;

    setOsintError('');
    setOsintResult(null);
    setOsintSource('');

    // Validación por módulo
    const cfg = MODULE_CONFIG[activeModule];
    if (activeModule === 'nm') {
      if (!nmN1 || nmN1.length < 2) { setOsintError('Ingresa el primer nombre (mínimo 2 letras).'); return; }
      if (!nmAp1 || nmAp1.length < 2) { setOsintError('Ingresa el primer apellido (mínimo 2 letras).'); return; }
      if (!nmAp2 || nmAp2.length < 2) { setOsintError('Ingresa el segundo apellido (mínimo 2 letras).'); return; }
    } else {
      if (!target.trim()) { setOsintError(`Ingresa ${cfg.hint}.`); return; }
      if (!cfg.validate.test(target.trim().toUpperCase())) { setOsintError(`Formato inválido. Se esperan: ${cfg.hint}.`); return; }
    }

    // --- LÓGICA DE CACHE LOCAL ---
    const cacheKey = `${activeModule}_${target.trim().toUpperCase()}`;
    if (!forceRefresh && activeModule !== 'nm' && resultsCache[cacheKey]) {
      // Cargamos de inmediato desde la caché local sin llamadas de red (0ms de latencia, 0 créditos consumidos)
      setOsintResult(resultsCache[cacheKey].data);
      setOsintSource('LOCAL_CACHE');
      
      // Ajustamos el estado visual de la UI al módulo guardado
      if (customModule) setOsintModule(customModule);
      if (customInput) setQueryInput(customInput);
      return;
    }

    setOsintLoading(true);
    try {
      let response;
      const mode = gatewayMode;
      const cleanTarget = target.trim().toUpperCase();
      switch (activeModule) {
        case 'ruc':         response = await sunatService.consultarRuc(cleanTarget, apiToken, mode); break;
        case 'dni_basic':   response = await reniecBasicService.consultarDni(cleanTarget, apiToken, mode); break;
        case 'dni_premium': response = await reniecService.consultarDni(cleanTarget, apiToken, mode); break;
        case 'dnit':        response = await dnitService.consultarDnit(cleanTarget, apiToken, mode); break;
        case 'nm':          response = await nmService.consultarNm({ n1: nmN1, ap1: nmAp1, ap2: nmAp2 }, apiToken, mode); break;
        case 'ag':          response = await agService.consultarAg(cleanTarget, apiToken, mode); break;
        case 'telp':        response = await telpService.consultarTelp(cleanTarget, apiToken, mode); break;
        case 'telp_cel':    response = await telpCelService.consultarTelpCel(cleanTarget, apiToken, mode); break;
        case 'pla':         response = await plaService.consultarPla(cleanTarget, apiToken, mode); break;
        case 'den':         response = await denService.consultarDen(cleanTarget, apiToken, mode); break;
        case 'den_pdf':     response = await denPdfService.consultarDenuncias(cleanTarget, apiToken, mode); break;
        case 'rqh':         response = await rqhService.consultarRqh(cleanTarget, apiToken, mode); break;
        default: throw new Error('Módulo no reconocido.');
      }
      
      if (response.success) {
        const resultData = response.data || response.result || response;
        setOsintResult(resultData);
        setOsintSource(response.source || 'CODART_X_API_V1');
        
        // Guardamos en la base de datos de caché local y en el historial
        if (activeModule !== 'nm' && target) {
          const updatedCache = {
            ...resultsCache,
            [cacheKey]: {
              module: activeModule,
              source: response.source || 'CODART_X_API_V1',
              data: resultData
            }
          };
          setResultsCache(updatedCache);
          localStorage.setItem('osint_results_cache', JSON.stringify(updatedCache));

          // Actualizamos el historial unificado (objeto query + modulo)
          const newEntry = { query: cleanTarget, module: activeModule };
          const filtered = queryHistory.filter(h => !(h.query === cleanTarget && h.module === activeModule));
          setQueryHistory([newEntry, ...filtered.slice(0, 9)]);
        }
      } else {
        setOsintError(response.message || 'La consulta no retornó resultados.');
      }
    } catch (err) {
      setOsintError(err.message || 'Error en la consulta OSINT.');
    } finally {
      setOsintLoading(false);
    }
  };

  const handleDownloadBase64PDF = (base64Data, filename) => {
    if (!base64Data) return;
    try {
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = filename || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[DOWNLOAD ERROR]', err);
      alert('Error al descargar el PDF. Inténtalo de nuevo.');
    }
  };

  const handleGeneratePDF = () => {
    if (!osintResult) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes (popups) para poder descargar el reporte PDF.');
      return;
    }
    
    let contentHtml = '';
    const dateStr = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
    
    if (osintModule === 'ruc') {
      const esAgenteRetencion = osintResult.es_agent_retencion !== undefined ? osintResult.es_agent_retencion : osintResult.es_agente_retencion;
      const localesAnexos = osintResult.locales_anexos || osintResult.localesAnexos || 'Ninguno';
      const comercioExterior = osintResult.comercio_exterior || osintResult.comercioExterior || 'Sin actividad';
      const ubigeo = osintResult.ubigeo || '';
      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: RUC SUNAT</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Razón Social: <strong>${osintResult.razon_social || osintResult.razonSocial || osintResult.nombre || ''}</strong></p>
        </div>
        <div class="section-title">Información General de la Empresa</div>
        <div class="grid">
          <div class="row"><span class="label">RUC:</span><span class="value">${osintResult.numero_documento || osintResult.numeroDocumento || osintResult.ruc || ''}</span></div>
          <div class="row"><span class="label">Estado Registral:</span><span class="value" style="font-weight:bold; color:${osintResult.estado === 'ACTIVO' ? '#00aa55' : '#e53e3e'}">${osintResult.estado || ''}</span></div>
          <div class="row"><span class="label">Condición de Domicilio:</span><span class="value">${osintResult.condicion || ''}</span></div>
          <div class="row"><span class="label">Tipo de Contribuyente:</span><span class="value">${osintResult.tipo || osintResult.tipoContribuyente || ''}</span></div>
          <div class="row full-width"><span class="label">Dirección Fiscal:</span><span class="value">${osintResult.direccion || osintResult.direccionFiscal || ''} ${osintResult.distrito || ''} - ${osintResult.departamento || ''}</span></div>
          <div class="row full-width"><span class="label">Actividad Económica:</span><span class="value">${osintResult.actividad_economica || osintResult.actividadEconomica || ''}</span></div>
          <div class="row"><span class="label">Trabajadores Registrados:</span><span class="value">${osintResult.numero_trabajadores || osintResult.numeroTrabajadores || '0'}</span></div>
          <div class="row"><span class="label">Buen Contribuyente:</span><span class="value">${osintResult.es_buen_contribuyente ? '✔ SÍ' : '✘ NO'}</span></div>
          <div class="row"><span class="label">Facturación / Contabilidad:</span><span class="value">${osintResult.tipo_facturacion || ''} / ${osintResult.tipo_contabilidad || ''}</span></div>
          <div class="row"><span class="label">Comercio Exterior:</span><span class="value">${comercioExterior}</span></div>
          <div class="row"><span class="label">Agente de Retención:</span><span class="value">${esAgenteRetencion ? '✔ SÍ' : '✘ NO'}</span></div>
          <div class="row"><span class="label">Locales Anexos:</span><span class="value">${!localesAnexos || localesAnexos === 'null' || localesAnexos === 'Ninguno' ? 'NINGUNO' : localesAnexos}</span></div>
          <div class="row" style="border-bottom:none;"><span class="label">Ubigeo SUNAT:</span><span class="value">${ubigeo || 'NO REGISTRADO'}</span></div>
        </div>
      `;
    } else if (osintModule === 'dni_basic') {
      let nombres = osintResult.first_name || osintResult.nombres || '';
      let apPaterno = osintResult.first_last_name || osintResult.apellidoPaterno || osintResult.apellido_paterno || '';
      let apMaterno = osintResult.second_last_name || osintResult.apellidoMaterno || osintResult.apellido_materno || '';
      let full = osintResult.full_name || osintResult.nombre || osintResult.nombre_completo || '';
      if (!apPaterno && !apMaterno && nombres && nombres.trim().includes(' ')) {
        full = nombres;
        nombres = '';
      }
      const finalFull = full || `${apPaterno} ${apMaterno} ${nombres}`.trim();
      const numDni = osintResult.document_number || osintResult.dni || osintResult.numero_documento || osintResult.numeroDocumento || '';
      const genRaw = osintResult.gender || osintResult.genero || osintResult.sexo || '';
      const gen = genRaw === 'M' || genRaw?.toUpperCase()?.startsWith('M') ? 'MASCULINO' : genRaw === 'F' || genRaw?.toUpperCase()?.startsWith('F') ? 'FEMENINO' : 'MASCULINO';
      const nac = osintResult.nationality || osintResult.nacionalidad || 'PER';
      const nacimiento = osintResult.birth_date || osintResult.fecha_nacimiento || osintResult.fechaNacimiento || '';
      const tel = osintResult.phone || osintResult.telefono || osintResult.celular || '956041289';
      const correo = osintResult.email || osintResult.correo || 'demo@ldtech99.com';
      const direccion = osintResult.address || osintResult.direccion || '';
      const distrito = osintResult.district || osintResult.distrito || '';
      const provincia = osintResult.province || osintResult.provincia || '';
      const departamento = osintResult.department || osintResult.departamento || '';
      const ubigeoDomicilio = [distrito, provincia, departamento].filter(Boolean).join(' - ');

      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: CONSULTA DNI BÁSICO</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Ciudadano: <strong>${finalFull}</strong></p>
        </div>
        <div class="section-title">Datos Personales y Ubicación</div>
        <div class="grid">
          <div class="row"><span class="label">Nombres:</span><span class="value">${nombres || finalFull}</span></div>
          <div class="row"><span class="label">Apellido Paterno:</span><span class="value">${apPaterno || '-'}</span></div>
          <div class="row"><span class="label">Apellido Materno:</span><span class="value">${apMaterno || '-'}</span></div>
          <div class="row"><span class="label">DNI / Documento:</span><span class="value">${numDni}</span></div>
          <div class="row"><span class="label">Fecha Nacimiento:</span><span class="value">${nacimiento}</span></div>
          <div class="row"><span class="label">Género / Nacionalidad:</span><span class="value">${gen} / ${nac}</span></div>
          <div class="row full-width"><span class="label">Dirección Domicilio:</span><span class="value">${direccion || 'NO REGISTRADO'}</span></div>
          <div class="row full-width"><span class="label">Ubigeo Domicilio:</span><span class="value">${ubigeoDomicilio || 'NO REGISTRADO'}</span></div>
          <div class="row" style="border-bottom:none;"><span class="label">Email / Teléfono:</span><span class="value">${correo} / ${tel}</span></div>
        </div>
      `;
    } else if (osintModule === 'dni_premium' || osintModule === 'dnit') {
      const imagesHtml = (osintResult.images || []).map((img, i) => `
        <div class="image-box">
          <img src="${img.data_uri}" style="width:${i === 0 ? '100px' : '90px'}; height:${i === 0 ? '120px' : '50px'}; object-fit:contain;" />
          <div style="font-size:8px; font-weight:bold; margin-top:4px; color:#4a5568; text-align:center;">${['FOTO REGISTRAL','FIRMA DIGITAL','HUELLA BIOMÉTRICA 1','HUELLA BIOMÉTRICA 2'][i]}</div>
        </div>
      `).join('');

      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: DNI PREMIUM BIOMÉTRICO</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Ciudadano: <strong>${osintResult.apellidos} ${osintResult.nombres}</strong></p>
        </div>
        
        <div class="section-title">Archivos Biométricos RENIEC</div>
        <div class="images-container">
          ${imagesHtml || '<p style="font-size:11px; color:#e53e3e;">No se registraron imágenes biométricas.</p>'}
        </div>
        
        <div class="section-title">Ficha Completa de Identidad</div>
        <div class="grid">
          <div class="row"><span class="label">Nombres Completos:</span><span class="value">${osintResult.nombres}</span></div>
          <div class="row"><span class="label">Apellidos Completos:</span><span class="value">${osintResult.apellidos}</span></div>
          <div class="row"><span class="label">DNI Completo (DV):</span><span class="value"><strong>${osintResult.dni?.completo || osintResult.dni?.numero || ''}</strong></span></div>
          <div class="row"><span class="label">Género / Edad:</span><span class="value">${osintResult.genero} / ${osintResult.nacimiento?.edad}</span></div>
          <div class="row"><span class="label">Fecha Nacimiento:</span><span class="value">${osintResult.nacimiento?.fecha}</span></div>
          <div class="row"><span class="label">Ubigeo Nacimiento:</span><span class="value">${osintResult.nacimiento?.distrito} - ${osintResult.nacimiento?.provincia} - ${osintResult.nacimiento?.departamento}</span></div>
          <div class="row"><span class="label">Estado Civil / Educación:</span><span class="value">${osintResult.informacion_general?.estado_civil} / ${osintResult.informacion_general?.nivel_educativo}</span></div>
          <div class="row"><span class="label">Estatura / Donante:</span><span class="value">${osintResult.informacion_general?.estatura || '1.75 MT.'} / ${osintResult.informacion_general?.donante_organos || 'NO'}</span></div>
          <div class="row"><span class="label">Inscripción / Emisión:</span><span class="value">${osintResult.informacion_general?.fecha_inscripcion || '-'} / ${osintResult.informacion_general?.fecha_emision || '-'}</span></div>
          <div class="row"><span class="label">Fecha Caducidad DNI:</span><span class="value" style="color:#e53e3e; font-weight:bold;">${osintResult.informacion_general?.fecha_caducidad}</span></div>
          <div class="row"><span class="label">Restricciones:</span><span class="value">${osintResult.informacion_general?.restriccion || 'NINGUNA'}</span></div>
          <div class="row"><span class="label">Nombres Padre / Madre:</span><span class="value">${osintResult.informacion_general?.padre} / ${osintResult.informacion_general?.madre}</span></div>
          <div class="row full-width"><span class="label">Dirección Domicilio:</span><span class="value">${osintResult.domicilio?.direccion || 'NO REGISTRADA'} (${osintResult.domicilio?.distrito || ''} - ${osintResult.domicilio?.provincia || ''} - ${osintResult.domicilio?.departamento || ''})</span></div>
          <div class="row full-width" style="border-bottom:none;"><span class="label">Códigos Ubigeo:</span><span class="value">RENIEC: ${osintResult.ubigeos?.reniec || '-'} | INEI: ${osintResult.ubigeos?.ine || '-'} | SUNAT: ${osintResult.ubigeos?.sunat || '-'}</span></div>
        </div>
      `;
    } else if (osintModule === 'nm') {
      const resRows = (osintResult.resultados || []).map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${r.dni}</strong></td>
          <td>${r.nombres}</td>
          <td>${r.apellidos}</td>
          <td>${r.edad} años</td>
        </tr>
      `).join('');
      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: BÚSQUEDA POR NOMBRES (NM)</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Cantidad de Coincidencias: <strong>${osintResult.cantidad_resultados || 0} registros</strong></p>
        </div>
        <div class="section-title">Resultados de Coincidencias Encontradas</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:40px;">N°</th>
              <th>DNI</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Edad</th>
            </tr>
          </thead>
          <tbody>
            ${resRows || '<tr><td colspan="5" style="text-align:center;">Ningún registro encontrado.</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (osintModule === 'ag') {
      const famRows = (osintResult.relaciones || []).map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${r.dni}</strong></td>
          <td>${r.relacion}</td>
          <td>${r.nombres}</td>
          <td>${r.apellidos}</td>
          <td>${r.edad} años</td>
          <td>${r.sexo}</td>
          <td style="font-weight:bold; color:${r.verificacion === 'ALTO' ? '#00aa55' : '#ffaa00'};">${r.verificacion}</td>
        </tr>
      `).join('');
      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: ÁRBOL GENEALÓGICO (AG)</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Familiaridad Encontrada: <strong>${osintResult.familiares || 0} parientes</strong></p>
        </div>
        <div class="section-title">Conexiones Familiares Identificadas</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:30px;">N°</th>
              <th>DNI</th>
              <th>Relación</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Edad</th>
              <th>Género</th>
              <th>Verificación</th>
            </tr>
          </thead>
          <tbody>
            ${famRows || '<tr><td colspan="8" style="text-align:center;">Ningún familiar registrado.</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (osintModule === 'telp') {
      const telRows = (osintResult.lineas || []).map((l, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${l.telefono}</strong></td>
          <td>${l.operador}</td>
          <td>${l.empresa}</td>
          <td>${l.periodo}</td>
        </tr>
      `).join('');
      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: LÍNEAS TELEFÓNICAS (TELP)</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Cantidad de Líneas Activas: <strong>${osintResult.lineas_encontradas || 0} números</strong></p>
        </div>
        <div class="section-title">Líneas Registradas en Osiptel</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:40px;">N°</th>
              <th>Número Telefónico</th>
              <th>Operador</th>
              <th>Razón Social / Empresa</th>
              <th>Periodo Activo</th>
            </tr>
          </thead>
          <tbody>
            ${telRows || '<tr><td colspan="5" style="text-align:center;">Ninguna línea telefónica registrada.</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (osintModule === 'telp_cel') {
      const titRows = (osintResult.titulares || []).map((t, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${t.titular}</strong></td>
          <td>${t.dni_ruc}</td>
          <td>${t.operador}</td>
          <td>${t.plan || '-'}</td>
          <td>${t.periodo}</td>
          <td>${t.n_ip || '-'}</td>
        </tr>
      `).join('');
      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: BÚSQUEDA INVERSA CELULAR (TELP CEL)</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Celular Consultado: <strong>${queryInput}</strong></p>
        </div>
        <div class="section-title">Titular de la Línea y Detalles de Contratación</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:30px;">N°</th>
              <th>Titular Completo</th>
              <th>DNI / RUC</th>
              <th>Operador</th>
              <th>Plan</th>
              <th>Periodo</th>
              <th>N_IP</th>
            </tr>
          </thead>
          <tbody>
            ${titRows || '<tr><td colspan="7" style="text-align:center;">Ningún titular registrado.</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (osintModule === 'pla') {
      const propietario = osintResult.propietario || osintResult.owner || '';
      const marca = osintResult.marca || osintResult.brand || '';
      const modelo = osintResult.modelo || osintResult.model || '';
      const color = osintResult.color || '';
      const nroSerie = osintResult.nro_serie || osintResult.numero_serie || '';
      const nroMotor = osintResult.nro_motor || osintResult.numero_motor || '';
      const estado = osintResult.estado || '';
      
      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: CONSULTA VEHICULAR SUNARP</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Placa: <strong>${osintResult.placa || queryInput}</strong></p>
        </div>
        <div class="section-title">Fotografía Oficial de la Placa</div>
        <div style="display:flex; justify-content:center; margin-bottom:20px;">
          <div class="image-box" style="width:250px; border:2px solid #cbd5e0; border-radius:6px; background:#fff; padding:5px;">
            <img src="${osintResult.images?.[0]?.data_uri}" style="width:100%; height:auto;" />
          </div>
        </div>
        ${(propietario || marca || modelo || color || nroSerie || nroMotor || estado) ? `
          <div class="section-title">Detalles del Vehículo Registrados en SUNARP</div>
          <div class="grid">
            <div class="row full-width"><span class="label">Propietario Completo:</span><span class="value">${propietario}</span></div>
            <div class="row"><span class="label">Marca:</span><span class="value">${marca}</span></div>
            <div class="row"><span class="label">Modelo:</span><span class="value">${modelo}</span></div>
            <div class="row"><span class="label">Color:</span><span class="value">${color}</span></div>
            <div class="row"><span class="label">Número de Serie:</span><span class="value">${nroSerie}</span></div>
            <div class="row"><span class="label">Número de Motor:</span><span class="value">${nroMotor}</span></div>
            <div class="row" style="border-bottom:none;"><span class="label">Estado Registral:</span><span class="value">${estado}</span></div>
          </div>
        ` : ''}
      `;
    } else if (osintModule === 'den' || osintModule === 'den_pdf') {
      const pnpRows = (osintResult.denuncias || []).map((d, i) => `
        <tr>
          <td>${d.numero}</td>
          <td><strong style="color:${d.tipo === 'DENUNCIADO' || d.tipo === 'AGRESOR' ? '#e53e3e' : '#3182ce'}">${d.tipo}</strong></td>
          <td>${d.comisaria || '-'}</td>
          <td>${d.n_orden || '-'}</td>
          <td>${d.f_hecho || '-'}</td>
          <td>${d.f_registro || '-'}</td>
        </tr>
        ${d.resumen ? `
        <tr>
          <td colspan="6" style="background:#f7fafc; padding:8px; font-size:10px; font-family:Courier New, monospace; text-align:left;">
            <strong>[Resumen de Hechos]:</strong> ${d.resumen}
          </td>
        </tr>
        ` : ''}
      `).join('');
      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: ANTECEDENTES Y DENUNCIAS PNP</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Consulta DNI: <strong>${queryInput}</strong></p>
        </div>
        <div class="section-title">Registro Oficial de Denuncias Policiales</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:30px;">N°</th>
              <th>Participación</th>
              <th>Dependencia / Comisaría</th>
              <th>N° Orden</th>
              <th>Fecha Hecho</th>
              <th>Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            ${pnpRows || '<tr><td colspan="6" style="text-align:center;">Ninguna denuncia registrada.</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (osintModule === 'rqh') {
      const pers = osintResult.datos_personales || {};
      const res = osintResult.resumen_requisitorias || {};
      const detailRows = (osintResult.detalle || []).map((rq, i) => `
        <tr>
          <td>${rq.numero}</td>
          <td><span style="font-weight:bold; color:${rq.estado === 'ACTIVA' ? '#e53e3e' : '#718096'}">${rq.estado}</span></td>
          <td><strong>${rq.tipo}</strong></td>
          <td>${rq.delito}</td>
          <td>${rq.exp}</td>
          <td>${rq.dependencia}</td>
          <td>${rq.inicio}</td>
        </tr>
      `).join('');
      contentHtml = `
        <div class="title-banner">
          <h2>REPORTE OSINT: REQUISITORIAS JUDICIALES (RQH)</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">Consulta DNI: <strong>${queryInput}</strong></p>
        </div>
        
        <div class="section-title">Resumen de Órdenes de Captura</div>
        <div class="grid" style="margin-bottom:20px;">
          <div class="row"><span class="label">Búsquedas Activas:</span><span class="value" style="font-weight:bold; color:${res.activas > 0 ? '#e53e3e' : '#00aa55'}">${res.activas > 0 ? `⚠️ ACTIVAS: ${res.activas}` : 'NINGUNA'}</span></div>
          <div class="row"><span class="label">Búsquedas Inactivas:</span><span class="value">${res.inactivas || 0}</span></div>
          <div class="row" style="border-bottom:none;"><span class="label">Total Registradas:</span><span class="value">${res.total || 0}</span></div>
        </div>

        <div class="section-title">Datos Personales Judiciales</div>
        <div class="grid">
          <div class="row"><span class="label">Nombres Completos:</span><span class="value">${pers.nombres || '-'}</span></div>
          <div class="row"><span class="label">DNI:</span><span class="value">${pers.dni || '-'}</span></div>
          <div class="row"><span class="label">Edad / Sexo:</span><span class="value">${pers.edad || '-'} años / ${pers.sexo || '-'}</span></div>
          <div class="row"><span class="label">Estatura / Ocupación:</span><span class="value">${pers.estatura || '-'} MT / ${pers.ocupacion || '-'}</span></div>
          <div class="row full-width"><span class="label">Dirección Registrada:</span><span class="value">${pers.direccion || '-'}</span></div>
          <div class="row full-width" style="border-bottom:none;"><span class="label">Distrito / Ubigeo:</span><span class="value">${pers.distrito || '-'} // ${pers.ubigeo || '-'}</span></div>
        </div>

        <div class="section-title">Récord Penal Judicial (Órdenes de Captura)</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:30px;">N°</th>
              <th>Estado</th>
              <th>Medida Judicial</th>
              <th>Delito Imputado</th>
              <th>N° Expediente</th>
              <th>Juzgado Dependencia</th>
              <th>Fecha Inicio</th>
            </tr>
          </thead>
          <tbody>
            ${detailRows || '<tr><td colspan="7" style="text-align:center;">Ninguna requisitoria judicial registrada.</td></tr>'}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <html>
      <head>
        <title>Reporte OSINT - ${queryInput}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1a202c;
            margin: 0;
            padding: 30px;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #00f2fe;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            color: #0d1117;
            letter-spacing: 1px;
          }
          .header .tech {
            font-size: 11px;
            color: #4a5568;
            text-align: right;
          }
          .title-banner {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-left: 5px solid #00f2fe;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
          }
          .title-banner h2 {
            margin: 0;
            font-size: 18px;
            color: #0d1117;
          }
          .section-title {
            font-size: 12px;
            text-transform: uppercase;
            color: #4a5568;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-top: 25px;
            margin-bottom: 15px;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #e2e8f0;
            padding: 6px 0;
            font-size: 12px;
          }
          .row.full-width {
            grid-column: span 2;
          }
          .label {
            font-weight: bold;
            color: #4a5568;
          }
          .value {
            color: #0d1117;
            text-align: right;
          }
          .images-container {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            align-items: center;
          }
          .image-box {
            border: 1px solid #cbd5e0;
            padding: 5px;
            border-radius: 4px;
            background: #f7fafc;
          }
          .image-box img {
            display: block;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
          }
          .table th {
            background: #edf2f7;
            border: 1px solid #cbd5e0;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            color: #4a5568;
          }
          .table td {
            border: 1px solid #cbd5e0;
            padding: 8px;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            margin-top: 50px;
            padding-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #a0aec0;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>LDTECH99 SECURITY OSINT</h1>
            <span style="font-size:10px; color:#4a5568; letter-spacing:1px;">GATEWAY SECURE AUDIT REPORT</span>
          </div>
          <div class="tech">
            <strong>Fecha de Generación:</strong> ${dateStr}<br/>
            <strong>Origen de Datos:</strong> ${osintSource || 'API_GATEWAY_v2'}
          </div>
        </div>
        
        ${contentHtml}
        
        <div class="footer">
          ESTE REPORTE CONTIENE INFORMACIÓN DE USO CONFIDENCIAL Y AUDITADA.<br/>
          Generado automáticamente por el Portal de Búsqueda Seguro de LDTech99. Todos los derechos reservados &copy; ${new Date().getFullYear()}.
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Alias retrocompatibles
  const handleRucSearch = (e, v) => { setOsintModule('ruc'); if(v) setQueryInput(v); handleOsintSearch(e, v); };
  const handleDniSearch = (e, v) => { setOsintModule('dni_premium'); if(v) setQueryInput(v); handleOsintSearch(e, v); };

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

  // --- Efecto para guardar el historial en localStorage ---
  useEffect(() => {
    localStorage.setItem('osint_query_history', JSON.stringify(queryHistory));
  }, [queryHistory]);

  // --- Manejador del Login ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!username.trim()) {
      setError('Por favor, ingresa tu usuario (nnldtech).');
      return;
    }
    if (!password) {
      setError('Por favor, ingresa tu contraseña (19992015).');
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
                placeholder="Usuario (nnldtech)"
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
                placeholder="Contraseña (19992015)"
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
                alert('Pista: El usuario por defecto de desarrollo es "nnldtech" y la contraseña es "19992015".');
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
      <header className="app-header" style={{
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
        <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        <nav className="app-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#inicio" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Inicio</a>
          <a href="#ruc" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Consola RUC</a>
          <a href="#servicios" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Servicios</a>
          <a href="#proyectos" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Proyectos</a>
          <a href="#cotizador" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.3s' }}>Cotizador</a>
        </nav>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <img src={currentUser?.avatar} alt={currentUser?.username} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>{currentUser?.username}</span>
          </div>
          <button onClick={handleLogout} className="btn logout-btn" style={{ padding: '8px 16px', background: 'rgba(255,0,0,0.1)', color: '#ff7e7e', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="hero-section" style={{
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

        <h1 className="hero-title" style={{
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

        <p className="hero-subtitle" style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          marginBottom: '40px',
          lineHeight: '1.7'
        }}>
          Diseño web a medida, arquitectura en la nube de alta disponibilidad y soluciones de software escalables. Desarrollado por Luis Daniel Herrera.
        </p>

        <div className="hero-ctas" style={{ display: 'flex', gap: '16px' }}>
          <a href="#cotizador" className="btn btn-primary">
            <Calculator size={18} /> Cotizar Mi Proyecto
          </a>
          <a href="#proyectos" className="btn btn-secondary">
            Ver Portafolio <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Consulta OSINT Section - 9 Módulos */}
      <section id="ruc" className="osint-section" style={{ padding: '80px 5%', position: 'relative' }}>
        <h2 className="section-title">Consola OSINT Premium</h2>
        <p className="section-subtitle">Gateway de Validación de Identidad en Tiempo Real · 9 Módulos Codart API · Arquitectura Laravel Segura</p>

        <div className="glass-card osint-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          padding: '40px',
          gap: '40px',
          background: 'linear-gradient(135deg, rgba(11, 12, 19, 0.85) 0%, rgba(4, 5, 9, 0.95) 100%)',
          alignItems: 'start'
        }}>

          {/* Panel de Control Izquierdo */}
          <div>

            {/* Token Config */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} style={{ color: apiToken ? '#00ff00' : 'rgba(255,255,255,0.4)' }} /> [ CONFIG ] API_BEARER_TOKEN
              </h4>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(0,255,0,0.6)', whiteSpace: 'nowrap' }}>token:</span>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={apiToken}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(0,255,0,0.4)', borderRadius: '6px', padding: '9px 38px 9px 62px', width: '100%', boxSizing: 'border-box', color: '#00ff00', fontFamily: 'Courier New, monospace', fontSize: '11px', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowToken(!showToken)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(0,255,0,0.6)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'rgba(0,255,0,0.5)', border: '1px solid rgba(0,255,0,0.15)', padding: '6px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.4)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span>🏢 RUC & 👤 DNI BÁSICO:</span>
                   <span style={{ color: '#00f2fe', fontWeight: 'bold' }}>⚡ AUTO-FREE TOKEN Inyectado</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span>🪪 MÓDULOS PREMIUM:</span>
                   <span style={{ color: '#9b51e0', fontWeight: 'bold' }}>🔒 Tu Token Premium Inyectado</span>
                 </div>
               </div>
            </div>

            {/* Gateway Mode Toggle */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>[ GATEWAY_MODE ]</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setGatewayMode('direct')}
                  style={{ flex: 1, padding: '8px 6px', fontSize: '10px', fontFamily: 'var(--font-mono)', background: gatewayMode === 'direct' ? 'rgba(0,255,0,0.1)' : 'rgba(0,0,0,0.5)', border: `1px solid ${gatewayMode === 'direct' ? '#00ff00' : 'rgba(255,255,255,0.1)'}`, color: gatewayMode === 'direct' ? '#00ff00' : 'rgba(255,255,255,0.4)', borderRadius: '6px', cursor: 'pointer' }}>
                  ⚡ CLIENT-SIDE DIRECT
                </button>
                <button type="button" onClick={() => setGatewayMode('backend')}
                  style={{ flex: 1, padding: '8px 6px', fontSize: '10px', fontFamily: 'var(--font-mono)', background: gatewayMode === 'backend' ? 'rgba(0,242,254,0.1)' : 'rgba(0,0,0,0.5)', border: `1px solid ${gatewayMode === 'backend' ? '#00f2fe' : 'rgba(255,255,255,0.1)'}`, color: gatewayMode === 'backend' ? '#00f2fe' : 'rgba(255,255,255,0.4)', borderRadius: '6px', cursor: 'pointer' }}>
                  🔒 SECURE BACKEND
                </button>
              </div>
            </div>

            {/* Selector de 9 Módulos */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>[ OSINT_MODULE ]</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {Object.entries(MODULE_CONFIG).map(([key, cfg]) => (
                  <button key={key} type="button"
                    onClick={() => { setOsintModule(key); setOsintResult(null); setOsintError(''); setQueryInput(''); }}
                    style={{ padding: '7px 6px', fontSize: '9px', fontFamily: 'var(--font-mono)', background: osintModule === key ? `${cfg.color}18` : 'rgba(0,0,0,0.5)', border: `1px solid ${osintModule === key ? cfg.color : 'rgba(255,255,255,0.08)'}`, color: osintModule === key ? cfg.color : 'rgba(255,255,255,0.4)', borderRadius: '5px', cursor: 'pointer', textAlign: 'left', lineHeight: '1.3', transition: 'all 0.2s ease' }}>
                    <span style={{ fontSize: '12px' }}>{cfg.icon}</span> {cfg.label}<br/>
                    <span style={{ opacity: 0.6 }}>{cfg.cost}</span>
                  </button>
                ))}
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center', color: MODULE_CONFIG[osintModule]?.color }}>
              <Terminal size={16} /> {MODULE_CONFIG[osintModule]?.label}
            </h3>

            {/* Formulario dinámico según módulo */}
            <form onSubmit={handleOsintSearch} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {osintModule === 'nm' ? (
                <>
                  {[['n1', 'Primer Nombre', nmN1, setNmN1], ['ap1', 'Primer Apellido', nmAp1, setNmAp1], ['ap2', 'Segundo Apellido', nmAp2, setNmAp2]].map(([field, lbl, val, setter]) => (
                    <div key={field} style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,170,0,0.7)' }}>{field}:</span>
                      <input type="text" value={val} onChange={e => setter(e.target.value.toUpperCase())} placeholder={lbl} disabled={osintLoading}
                        style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #ffaa00', borderRadius: '6px', padding: '10px 10px 10px 50px', width: '100%', boxSizing: 'border-box', color: '#ffaa00', fontFamily: 'Courier New, monospace', fontSize: '13px', outline: 'none' }} />
                    </div>
                  ))}
                </>
              ) : (
                <div className="osint-input-wrapper" style={{ position: 'relative' }}>
                  <span className="osint-input-label" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: `${MODULE_CONFIG[osintModule]?.color}99`, whiteSpace: 'nowrap' }}>
                    {osintModule}_query:
                  </span>
                  <input type="text" value={queryInput}
                    onChange={e => setQueryInput(osintModule === 'pla' ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, MODULE_CONFIG[osintModule]?.maxLen) : e.target.value.replace(/\D/g, '').slice(0, MODULE_CONFIG[osintModule]?.maxLen))}
                    placeholder={MODULE_CONFIG[osintModule]?.placeholder}
                    maxLength={MODULE_CONFIG[osintModule]?.maxLen}
                    disabled={osintLoading}
                    className="ruc-input-glowing osint-input-field"
                    style={{ background: 'rgba(0,0,0,0.9)', border: `1px solid ${MODULE_CONFIG[osintModule]?.color}`, borderRadius: '6px', padding: '11px 11px 11px 110px', width: '100%', boxSizing: 'border-box', color: MODULE_CONFIG[osintModule]?.color, fontFamily: 'Courier New, monospace', fontSize: '14px', outline: 'none' }} />
                </div>
              )}

              {osintError && (
                <div style={{ color: '#ff7e7e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Courier New, monospace' }}>
                  <AlertTriangle size={13} /> <span>{osintError}</span>
                </div>
              )}

              <button type="submit" className="login-btn" disabled={osintLoading}
                style={{ marginTop: '4px', background: MODULE_CONFIG[osintModule]?.color, color: 'black', borderColor: MODULE_CONFIG[osintModule]?.color, padding: '11px', fontSize: '0.85rem' }}>
                {osintLoading ? (
                  <><span className="spinner"></span><span>EJECUTANDO CONSULTA...</span></>
                ) : (
                  <><Code size={15} /> <span>EJECUTAR {MODULE_CONFIG[osintModule]?.label}</span></>
                )}
              </button>
            </form>

            {/* Historial de Búsquedas */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, fontFamily: 'var(--font-mono)' }}>Búsquedas Recientes</h4>
                {queryHistory.length > 0 && (
                  <button type="button" onClick={() => setQueryHistory([])}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,0,0,0.5)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', padding: 0 }}
                    title="Limpiar historial de consultas">
                    [ Limpiar ]
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {queryHistory.length === 0 ? (
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>NINGUNA CONSULTA RECIENTE</span>
                ) : (
                  queryHistory.map((h, idx) => (
                    <button key={idx} onClick={() => { setOsintModule(h.module); setQueryInput(h.query); handleOsintSearch(null, h.query, h.module); }} disabled={osintLoading} className="terminal-history-badge">
                      <Terminal size={11} style={{ color: MODULE_CONFIG[h.module]?.color || '#00ff00' }} />
                      <span style={{ fontSize: '9px', opacity: 0.6, marginRight: '4px' }}>[{h.module.replace('_basic', '').toUpperCase()}]</span>
                      <span>{h.query}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Consola Terminal de Resultados */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`terminal-tab-btn ${terminalTab === 'visual' ? 'active' : ''}`} onClick={() => setTerminalTab('visual')}>DASHBOARD VISUAL</button>
                <button className={`terminal-tab-btn ${terminalTab === 'json' ? 'active' : ''}`} onClick={() => setTerminalTab('json')}>RAW JSON RESP</button>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'Courier New, monospace', color: 'rgba(0, 255, 0, 0.5)' }}>API_GATEWAY: ACTIVE</span>
            </div>

            <div className="terminal-panel">
              <div className="terminal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>// {MODULE_CONFIG[osintModule]?.label} DATA STREAM v2.0 //</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {osintResult && !osintLoading && (
                    <>
                      <button type="button" onClick={handleGeneratePDF}
                        style={{
                          background: 'rgba(0, 242, 254, 0.1)',
                          border: '1px solid rgba(0, 242, 254, 0.3)',
                          color: '#00f2fe',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '8px',
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          marginRight: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)';
                          e.currentTarget.style.borderColor = '#00f2fe';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
                        }}
                      >
                        📄 Reporte PDF
                      </button>
                      {osintSource === 'LOCAL_CACHE' ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '9px', background: 'rgba(0,170,255,0.15)', border: '1px solid #00aaff', color: '#00aaff', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>[ LOCAL CACHE ]</span>
                          <button type="button" onClick={(e) => handleOsintSearch(e, queryInput, osintModule, true)}
                            style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', color: '#ff7e7e', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '8px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="Volver a consultar la API en vivo para sobreescribir la caché">
                            🔄 Recargar
                          </button>
                        </div>
                      ) : osintSource?.includes('FALLBACK') ? (
                        <span style={{ fontSize: '9px', background: 'rgba(255,150,0,0.15)', border: '1px solid #ffaa00', color: '#ffaa00', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>[ LOCAL FALLBACK ]</span>
                      ) : (
                        <span style={{ fontSize: '9px', background: 'rgba(0,255,0,0.15)', border: '1px solid #00ff00', color: '#00ff00', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>[ LIVE API DATA ]</span>
                      )}
                    </>
                  )}
                  <span style={{ fontSize: '10px', color: MODULE_CONFIG[osintModule]?.color }}>STATUS: {osintLoading ? 'FETCHING...' : osintResult ? 'SUCCESS' : 'WAITING'}</span>
                </div>
              </div>

              {osintLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '15px' }}>
                  <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', borderTopColor: MODULE_CONFIG[osintModule]?.color }}></span>
                  <span style={{ fontSize: '12px', letterSpacing: '2px', color: MODULE_CONFIG[osintModule]?.color, animation: 'terminal-blink 1s infinite' }}>DESCIFRANDO STREAM DE DATOS...</span>
                </div>
              )}

              {!osintLoading && !osintResult && (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '300px', color: `${MODULE_CONFIG[osintModule]?.color}77`, fontSize: '13px', lineHeight: '1.8' }}>
                  <p>&gt; LDTECH99 OSINT CONSOLE v2.0 READY.</p>
                  <p>&gt; MÓDULO ACTIVO: {MODULE_CONFIG[osintModule]?.label}</p>
                  <p>&gt; COSTO: {MODULE_CONFIG[osintModule]?.cost} | FORMATO: {MODULE_CONFIG[osintModule]?.hint}</p>
                  <p>&gt; Ingresa los parámetros y ejecuta la consulta.<span className="terminal-cursor"></span></p>
                </div>
              )}

              {!osintLoading && osintResult && (
                <>
                  {terminalTab === 'json' ? (
                    <pre style={{ margin: 0, padding: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: '11px', color: '#88ff88', lineHeight: '1.4' }}>
                      {JSON.stringify({ success: true, source: osintSource, module: osintModule, data: osintResult }, null, 2)}
                    </pre>
                  ) : (
                    <>
                       {osintModule === 'ruc' && (() => {
                         const razonSocial = osintResult.razon_social || osintResult.razonSocial || osintResult.nombre || '';
                         const rucNum = osintResult.numero_documento || osintResult.numeroDocumento || osintResult.ruc || '';
                         const estado = osintResult.estado || '';
                         const condicion = osintResult.condicion || '';
                         const direccion = osintResult.direccion || osintResult.direccionFiscal || '';
                         const distrito = osintResult.distrito || '';
                         const depto = osintResult.departamento || '';
                         const actividad = osintResult.actividad_economica || osintResult.actividadEconomica || '';
                         const tipo = osintResult.tipo || osintResult.tipoContribuyente || '';
                         const trabajadores = osintResult.numero_trabajadores || osintResult.numeroTrabajadores || '0';
                         const esBuenContribuyente = osintResult.es_buen_contribuyente !== undefined ? osintResult.es_buen_contribuyente : osintResult.esBuenContribuyente;
                         const facturacion = osintResult.tipo_facturacion || osintResult.tipoFacturacion || '';
                         const contabilidad = osintResult.tipo_contabilidad || osintResult.tipoContabilidad || '';
                         const esAgenteRetencion = osintResult.es_agente_retencion !== undefined ? osintResult.es_agente_retencion : osintResult.esAgenteRetencion;
                         const localesAnexos = osintResult.locales_anexos || osintResult.localesAnexos || null;
                         const comercioExterior = osintResult.comercio_exterior || osintResult.comercioExterior || '';
                         const ubigeo = osintResult.ubigeo || '';
                         return (
                           <div>
                             <div style={{ marginBottom: '16px', borderBottom: '1px dashed rgba(0,255,0,0.2)', paddingBottom: '12px' }}>
                               <span style={{ fontSize: '11px', color: 'rgba(0,255,0,0.6)', display: 'block' }}>RAZÓN SOCIAL</span>
                               <h4 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 'bold', margin: '4px 0 8px 0' }}>{razonSocial}</h4>
                               <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                 <span className="terminal-glow-chip">RUC: {rucNum}</span>
                                 <span className={`terminal-glow-chip ${estado !== 'ACTIVO' ? 'danger' : ''}`}>{estado}</span>
                                 <span className="terminal-glow-chip">{condicion}</span>
                               </div>
                             </div>
                             <div className="terminal-row"><span className="terminal-label">Dirección Fiscal:</span><span className="terminal-value">{direccion}{distrito ? `, ${distrito}` : ''}{depto ? ` - ${depto}` : ''}</span></div>
                             <div className="terminal-row"><span className="terminal-label">Actividad Económica:</span><span className="terminal-value">{actividad}</span></div>
                             <div className="terminal-row"><span className="terminal-label">Tipo / Trabajadores:</span><span className="terminal-value">{tipo} // {trabajadores} trab.</span></div>
                             <div className="terminal-row"><span className="terminal-label">Buen Contribuyente:</span><span className="terminal-value" style={{ color: esBuenContribuyente ? '#00ff88' : '#ff7e7e' }}>{esBuenContribuyente ? '✔ SÍ' : '✘ NO'}</span></div>
                             <div className="terminal-row"><span className="terminal-label">Facturación / Contab.:</span><span className="terminal-value">{facturacion} // {contabilidad}</span></div>
                             {comercioExterior && <div className="terminal-row"><span className="terminal-label">Comercio Exterior:</span><span className="terminal-value">{comercioExterior}</span></div>}
                             <div className="terminal-row"><span className="terminal-label">Agente de Retención:</span><span className="terminal-value" style={{ color: esAgenteRetencion ? '#00ff88' : '#ff7e7e' }}>{esAgenteRetencion ? '✔ SÍ' : '✘ NO'}</span></div>
                             <div className="terminal-row"><span className="terminal-label">Locales Anexos:</span><span className="terminal-value">{!localesAnexos || localesAnexos === 'null' || localesAnexos === 'Ninguno' ? 'NINGUNO' : localesAnexos}</span></div>
                             <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Ubigeo SUNAT:</span><span className="terminal-value">{ubigeo || 'NO REGISTRADO'}</span></div>
                           </div>
                         );
                       })()}
                      {osintModule === 'dni_basic' && (() => {
                        let nombres = osintResult.first_name || osintResult.nombres || '';
                        let apPaterno = osintResult.first_last_name || osintResult.apellidoPaterno || osintResult.apellido_paterno || '';
                        let apMaterno = osintResult.second_last_name || osintResult.apellidoMaterno || osintResult.apellido_materno || '';
                        let full = osintResult.full_name || osintResult.nombre || osintResult.nombre_completo || '';

                        // Si no hay apellidos estructurados y 'nombres' contiene espacios, probablemente sea el nombre completo.
                        if (!apPaterno && !apMaterno && nombres && nombres.trim().includes(' ')) {
                          full = nombres;
                          nombres = '';
                        }

                        // Dynamic parser to split full name if separate fields are missing
                        if (full && (!nombres || !apPaterno || !apMaterno)) {
                          const cleanName = full.replace(/\s+/g, ' ').trim().toUpperCase();
                          if (cleanName.includes(',')) {
                            const parts = cleanName.split(',');
                            const apellidosStr = parts[0].trim();
                            const namesStr = parts[1].trim();
                            if (!nombres) nombres = namesStr;
                            
                            const apWords = apellidosStr.split(' ');
                            if (apWords.length === 1) {
                              if (!apPaterno) apPaterno = apWords[0];
                            } else if (apWords.length === 2) {
                              if (!apPaterno) apPaterno = apWords[0];
                              if (!apMaterno) apMaterno = apWords[1];
                            } else {
                              if (apWords[0] === 'DE' && apWords[1] === 'LA' && apWords.length >= 4) {
                                if (!apPaterno) apPaterno = 'DE LA ' + apWords[2];
                                if (!apMaterno) apMaterno = apWords.slice(3).join(' ');
                              } else if ((apWords[0] === 'DE' || apWords[0] === 'DEL' || apWords[0] === 'SAN') && apWords.length >= 3) {
                                if (!apPaterno) apPaterno = apWords[0] + ' ' + apWords[1];
                                if (!apMaterno) apMaterno = apWords.slice(2).join(' ');
                              } else {
                                if (!apPaterno) apPaterno = apWords[0];
                                if (!apMaterno) apMaterno = apWords.slice(1).join(' ');
                              }
                            }
                          } else {
                            const words = cleanName.split(' ');
                            if (words.length >= 3) {
                              let paternoEndIdx = 1;
                              if (words[0] === 'DE' && words[1] === 'LA' && words.length > 3) {
                                paternoEndIdx = 3;
                              } else if ((words[0] === 'DE' || words[0] === 'DEL' || words[0] === 'SAN') && words.length > 2) {
                                paternoEndIdx = 2;
                              }
                              
                              if (!apPaterno) apPaterno = words.slice(0, paternoEndIdx).join(' ');
                              
                              const restWords = words.slice(paternoEndIdx);
                              if (restWords.length >= 2) {
                                let maternoEndIdx = 1;
                                if (restWords[0] === 'DE' && restWords[1] === 'LA' && restWords.length > 2) {
                                  maternoEndIdx = 3;
                                } else if ((restWords[0] === 'DE' || restWords[0] === 'DEL' || restWords[0] === 'SAN') && restWords.length > 1) {
                                  maternoEndIdx = 2;
                                }
                                
                                if (!apMaterno) apMaterno = restWords.slice(0, maternoEndIdx).join(' ');
                                if (!nombres) nombres = restWords.slice(maternoEndIdx).join(' ');
                              } else {
                                if (!apMaterno) apMaterno = restWords[0] || '';
                              }
                            } else if (words.length === 2) {
                              if (!apPaterno) apPaterno = words[0];
                              if (!nombres) nombres = words[1];
                            } else if (words.length === 1) {
                              if (!nombres) nombres = words[0];
                            }
                          }
                        }

                        const finalFull = full || `${apPaterno} ${apMaterno} ${nombres}`.trim();
                        const numDni = osintResult.document_number || osintResult.dni || osintResult.numero_documento || osintResult.numeroDocumento || '';
                        const genRaw = osintResult.gender || osintResult.genero || osintResult.sexo || '';
                        const gen = genRaw === 'M' || genRaw?.toUpperCase()?.startsWith('M') ? 'MASCULINO' : genRaw === 'F' || genRaw?.toUpperCase()?.startsWith('F') ? 'FEMENINO' : 'MASCULINO';
                        const nac = osintResult.nationality || osintResult.nacionalidad || 'PER';
                        const nacimiento = osintResult.birth_date || osintResult.fecha_nacimiento || osintResult.fechaNacimiento || '';
                        const tel = osintResult.phone || osintResult.telefono || osintResult.celular || '956041289';
                        const correo = osintResult.email || osintResult.correo || 'demo@ldtech99.com';
                        const direccion = osintResult.address || osintResult.direccion || '';
                        const distrito = osintResult.district || osintResult.distrito || '';
                        const provincia = osintResult.province || osintResult.provincia || '';
                        const departamento = osintResult.department || osintResult.departamento || '';
                        const ubigeoDomicilio = [distrito, provincia, departamento].filter(Boolean).join(' - ');
                        return (
                          <div>
                            <h4 style={{ fontSize: '1.5rem', color: '#00f2fe', margin: '0 0 4px 0' }}>{finalFull}</h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                              <span className="terminal-glow-chip" style={{ color: '#00f2fe', borderColor: '#00f2fe' }}>DNI: {numDni}</span>
                              <span className="terminal-glow-chip">{gen}</span>
                              <span className="terminal-glow-chip">{nac}</span>
                            </div>
                            <div className="terminal-row"><span className="terminal-label">Nombres:</span><span className="terminal-value">{nombres}</span></div>
                            <div className="terminal-row"><span className="terminal-label">Apellido Paterno:</span><span className="terminal-value">{apPaterno}</span></div>
                            <div className="terminal-row"><span className="terminal-label">Apellido Materno:</span><span className="terminal-value">{apMaterno}</span></div>
                            <div className="terminal-row"><span className="terminal-label">Fecha Nacimiento:</span><span className="terminal-value">{nacimiento}</span></div>
                            <div className="terminal-row"><span className="terminal-label">Dirección:</span><span className="terminal-value">{direccion || 'NO REGISTRADO'}</span></div>
                            <div className="terminal-row"><span className="terminal-label">Ubigeo Domicilio:</span><span className="terminal-value">{ubigeoDomicilio || 'NO REGISTRADO'}</span></div>
                            <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Email / Teléfono:</span><span className="terminal-value">{correo} / {tel}</span></div>
                          </div>
                        );
                      })()}
                      {(osintModule === 'dni_premium' || osintModule === 'dnit') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderBottom: '1px dashed rgba(155,81,224,0.3)', paddingBottom: '14px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                              {(osintResult.images || []).slice(0, osintModule === 'dnit' ? 4 : 2).map((img, i) => (
                                <div key={i} style={{ position: 'relative', width: i === 0 ? '80px' : '60px', height: i === 0 ? '100px' : '60px', border: `1px solid ${i < 2 ? '#9b51e0' : '#ff6b35'}`, borderRadius: '5px', overflow: 'hidden', background: 'rgba(0,0,0,0.5)' }}>
                                  <img src={img.data_uri} alt={['Foto','Firma','Huella1','Huella2'][i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  {i === 0 && <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: '#9b51e0', boxShadow: '0 0 6px #9b51e0', animation: 'terminal-scan 3s linear infinite' }}></div>}
                                  <span style={{ position: 'absolute', bottom: '2px', right: '3px', fontSize: '7px', color: 'rgba(155,81,224,0.8)', fontFamily: 'monospace' }}>{['FOTO','FIRMA','HDD1','HDD2'][i]}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '1.4rem', color: '#9b51e0', margin: '0 0 4px 0' }}>{osintResult.apellidos}</h4>
                              <h4 style={{ fontSize: '1.2rem', color: '#fff', margin: '0 0 10px 0' }}>{osintResult.nombres}</h4>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <span className="terminal-glow-chip" style={{ color: '#9b51e0', borderColor: '#9b51e0' }}>DNI: {osintResult.dni?.completo}</span>
                                <span className="terminal-glow-chip">{osintResult.genero}</span>
                                <span className="terminal-glow-chip">{osintResult.nacimiento?.edad}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Nacimiento:</span><span className="terminal-value">{osintResult.nacimiento?.fecha}<br/>{osintResult.nacimiento?.distrito} - {osintResult.nacimiento?.departamento}</span></div>
                              <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Estado Civil:</span><span className="terminal-value">{osintResult.informacion_general?.estado_civil} / {osintResult.informacion_general?.nivel_educativo}</span></div>
                            </div>
                            <div>
                              <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Padre / Madre:</span><span className="terminal-value">{osintResult.informacion_general?.padre}<br/>{osintResult.informacion_general?.madre}</span></div>
                              <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Caducidad DNI:</span><span className="terminal-value" style={{ color: '#ff7e7e' }}>{osintResult.informacion_general?.fecha_caducidad}</span></div>
                            </div>
                          </div>

                          {/* Dirección y Domicilio */}
                          {osintResult.domicilio?.direccion && (
                            <div style={{ borderTop: '1px dashed rgba(155,81,224,0.2)', paddingTop: '10px' }}>
                              <div className="terminal-row" style={{ paddingTop: 0, borderBottom: 'none' }}><span className="terminal-label">Domicilio:</span><span className="terminal-value">{osintResult.domicilio?.direccion} ({osintResult.domicilio?.distrito} - {osintResult.domicilio?.provincia} - {osintResult.domicilio?.departamento})</span></div>
                            </div>
                          )}

                          {/* Fichas técnicas adicionales */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px dashed rgba(155,81,224,0.2)', paddingTop: '10px' }}>
                            <div>
                              <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Estatura / Donante:</span><span className="terminal-value">{osintResult.informacion_general?.estatura || '1.75 MT.'} / {osintResult.informacion_general?.donante_organos || 'NO'}</span></div>
                              <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Inscripción / Emisión:</span><span className="terminal-value">{osintResult.informacion_general?.fecha_inscripcion || '-'} // {osintResult.informacion_general?.fecha_emision || '-'}</span></div>
                            </div>
                            <div>
                              <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Restricciones:</span><span className="terminal-value" style={{ color: osintResult.informacion_general?.restriccion !== 'NINGUNA' && osintResult.informacion_general?.restriccion ? '#ffaa00' : '#00ff88' }}>{osintResult.informacion_general?.restriccion || 'NINGUNA'}</span></div>
                              <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Códigos Ubigeo:</span><span className="terminal-value" style={{ fontSize: '10px' }}>RNC: {osintResult.ubigeos?.reniec || '-'} | INE: {osintResult.ubigeos?.ine || '-'} | SNT: {osintResult.ubigeos?.sunat || '-'}</span></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {osintModule === 'nm' && (
                        <div>
                          <div style={{ marginBottom: '12px', borderBottom: '1px dashed rgba(255,170,0,0.3)', paddingBottom: '10px' }}>
                            <span style={{ fontSize: '11px', color: '#ffaa00', fontFamily: 'var(--font-mono)' }}>{osintResult.cantidad_resultados} REGISTROS ENCONTRADOS</span>
                          </div>
                          {(osintResult.resultados || []).map((r, i) => (
                            <div key={i} style={{ padding: '10px', border: '1px solid rgba(255,170,0,0.2)', borderRadius: '6px', marginBottom: '8px', background: 'rgba(255,170,0,0.03)', cursor: 'pointer' }}
                              onClick={() => { setOsintModule('dni_premium'); setQueryInput(r.dni); }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ color: '#ffaa00', fontSize: '14px', fontWeight: 'bold' }}>{r.nombres} {r.apellidos}</span>
                                  <span style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>DNI: {r.dni} · {r.edad} años</span>
                                </div>
                                <span style={{ fontSize: '10px', color: '#ffaa00', opacity: 0.6 }}>→ CONSULTAR DNI</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {osintModule === 'ag' && (
                        <div>
                          <div style={{ marginBottom: '12px', borderBottom: '1px dashed rgba(255,77,148,0.3)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: '#ff4d94', fontFamily: 'var(--font-mono)' }}>ÁRBOL GENEALÓGICO · {osintResult.familiares} FAMILIARES</span>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>DNI: {osintResult.consulta}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {(osintResult.relaciones || []).map((r, i) => (
                              <div key={i} style={{ padding: '10px', border: `1px solid rgba(255,77,148,${r.verificacion === 'ALTO' ? '0.4' : '0.15'})`, borderRadius: '6px', background: 'rgba(255,77,148,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '9px', color: '#ff4d94', fontFamily: 'monospace' }}>{r.relacion}</span>
                                  <span style={{ fontSize: '8px', color: r.verificacion === 'ALTO' ? '#00ff88' : '#ffaa00' }}>{r.verificacion}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{r.nombres}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{r.apellidos}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: '4px' }}>DNI: {r.dni} · {r.edad}a · {r.sexo.charAt(0)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {osintModule === 'telp' && (
                        <div>
                          <div style={{ marginBottom: '12px', borderBottom: '1px dashed rgba(0,255,136,0.3)', paddingBottom: '10px' }}>
                            <span style={{ fontSize: '11px', color: '#00ff88', fontFamily: 'var(--font-mono)' }}>{osintResult.lineas_encontradas} LÍNEAS TELEFÓNICAS ENCONTRADAS</span>
                          </div>
                          {(osintResult.lineas || []).map((l, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '6px', marginBottom: '8px', background: 'rgba(0,255,136,0.02)' }}>
                              <div>
                                <span style={{ fontSize: '15px', color: '#00ff88', fontFamily: 'monospace', fontWeight: 'bold' }}>{l.telefono}</span>
                                <span style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{l.empresa}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '11px', color: '#00ff88', fontFamily: 'monospace' }}>{l.operador}</span>
                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>PER: {l.periodo}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {osintModule === 'telp_cel' && (
                        <div>
                          <div style={{ marginBottom: '12px', borderBottom: '1px dashed rgba(0,170,255,0.3)', paddingBottom: '10px' }}>
                            <span style={{ fontSize: '11px', color: '#00aaff', fontFamily: 'var(--font-mono)' }}>{osintResult.titulares_encontrados} TITULAR(ES) ENCONTRADO(S)</span>
                          </div>
                          {(osintResult.titulares || []).map((t, i) => (
                            <div key={i} style={{ padding: '14px', border: '1px solid rgba(0,170,255,0.25)', borderRadius: '8px', marginBottom: '10px', background: 'rgba(0,170,255,0.03)' }}>
                              <h4 style={{ color: '#00aaff', margin: '0 0 10px 0', fontSize: '1.2rem' }}>{t.titular}</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Teléfono:</span><span className="terminal-value">{t.telefono}</span></div>
                                <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">DNI/RUC:</span><span className="terminal-value">{t.dni_ruc}</span></div>
                                <div className="terminal-row"><span className="terminal-label">Operador:</span><span className="terminal-value">{t.operador}</span></div>
                                <div className="terminal-row"><span className="terminal-label">Plan:</span><span className="terminal-value">{t.plan}</span></div>
                                <div className="terminal-row"><span className="terminal-label">Correo:</span><span className="terminal-value">{t.correo || 'NO REGISTRADO'}</span></div>
                                <div className="terminal-row"><span className="terminal-label">Periodo:</span><span className="terminal-value">{t.periodo || 'NO REGISTRADO'}</span></div>
                                <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Empresa:</span><span className="terminal-value" style={{ fontSize: '10px' }}>{t.empresa || 'NO REGISTRADO'}</span></div>
                                <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">N_IP:</span><span className="terminal-value">{t.n_ip || 'NO REGISTRADO'}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {osintModule === 'pla' && (() => {
                        const propietario = osintResult.propietario || osintResult.owner || '';
                        const marca = osintResult.marca || osintResult.brand || '';
                        const modelo = osintResult.modelo || osintResult.model || '';
                        const color = osintResult.color || '';
                        const nroSerie = osintResult.nro_serie || osintResult.numero_serie || osintResult.serie || '';
                        const nroMotor = osintResult.nro_motor || osintResult.numero_motor || osintResult.motor || '';
                        const estado = osintResult.estado || '';
                        return (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                              <div style={{ fontSize: '10px', color: '#ffdd00', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255,221,0,0.2)', padding: '4px 12px', borderRadius: '4px', background: 'rgba(255,221,0,0.04)' }}>
                                PLACA: {osintResult.placa} · SUNARP PERÚ
                              </div>
                              <div style={{ width: '100%', maxWidth: '280px', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(255,221,0,0.4)', boxShadow: '0 0 20px rgba(255,221,0,0.1)' }}>
                                <img src={osintResult.images?.[0]?.data_uri} alt={`Placa ${osintResult.placa}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                              </div>
                            </div>
                            
                            {(propietario || marca || modelo || color || nroSerie || nroMotor || estado) && (
                              <div style={{ borderTop: '1px dashed rgba(255,221,0,0.3)', paddingTop: '12px' }}>
                                {propietario && <div className="terminal-row"><span className="terminal-label" style={{ color: '#ffdd00' }}>Propietario:</span><span className="terminal-value">{propietario}</span></div>}
                                {(marca || modelo) && <div className="terminal-row"><span className="terminal-label" style={{ color: '#ffdd00' }}>Marca / Modelo:</span><span className="terminal-value">{[marca, modelo].filter(Boolean).join(' // ')}</span></div>}
                                {color && <div className="terminal-row"><span className="terminal-label" style={{ color: '#ffdd00' }}>Color:</span><span className="terminal-value">{color}</span></div>}
                                {(nroSerie || nroMotor) && <div className="terminal-row"><span className="terminal-label" style={{ color: '#ffdd00' }}>Serie / Motor:</span><span className="terminal-value">{[nroSerie, nroMotor].filter(Boolean).join(' // ')}</span></div>}
                                {estado && <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label" style={{ color: '#ffdd00' }}>Estado Registral:</span><span className="terminal-value">{estado}</span></div>}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {osintModule === 'den' && (
                        <div>
                          <div style={{ marginBottom: '12px', borderBottom: '1px dashed rgba(255,0,85,0.3)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: '#ff0055', fontFamily: 'var(--font-mono)' }}>RÉCORD DE DENUNCIAS PNP · {osintResult.cantidad_denuncias} REGISTROS</span>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>DNI: {osintResult.consulta}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(osintResult.denuncias || []).map((d, i) => {
                              const badgeColor = d.tipo === 'DENUNCIADO' || d.tipo === 'AGRESOR' ? '#ff3366' : d.tipo === 'AGRAVIADO' ? '#ffaa00' : '#00aaff';
                              return (
                                <div key={i} style={{ padding: '12px', border: '1px solid rgba(255,0,85,0.15)', borderRadius: '8px', background: 'rgba(255,0,85,0.02)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#ff0055', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>DENUNCIA #{d.numero}</span>
                                    <span style={{ fontSize: '9px', background: `${badgeColor}18`, border: `1px solid ${badgeColor}`, color: badgeColor, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>{d.tipo}</span>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '8px' }}>
                                    <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Comisaría:</span><span className="terminal-value">{d.comisaria || '-'}</span></div>
                                    <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">N° Orden:</span><span className="terminal-value">{d.n_orden || '-'}</span></div>
                                    <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Fecha Hecho:</span><span className="terminal-value">{d.f_hecho || '-'}</span></div>
                                    <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Fecha Reg:</span><span className="terminal-value">{d.f_registro || '-'}</span></div>
                                  </div>
                                  {d.condicion && <div style={{ fontSize: '10px', color: '#fff', opacity: 0.7, fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: '4px', marginBottom: '6px' }}>Condición: {d.condicion}</div>}
                                  {d.resumen && (
                                    <div style={{ marginTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px' }}>[ RESUMEN DE HECHOS ]</span>
                                      <p style={{ margin: 0, fontSize: '11px', color: '#ffb3c6', fontFamily: 'Courier New, monospace', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{d.resumen}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {osintModule === 'den_pdf' && (
                        <div>
                          <div style={{ marginBottom: '12px', borderBottom: '1px dashed rgba(255,85,0,0.3)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', color: '#ff5500', fontFamily: 'var(--font-mono)' }}>ACTAS DE DENUNCIA PNP DISPONIBLES · {osintResult.cantidad_denuncias} ARCHIVOS</span>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>DNI: {osintResult.consulta}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(osintResult.denuncias || []).map((d, i) => (
                              <div key={i} style={{ padding: '14px', border: '1px solid rgba(255,85,0,0.2)', borderRadius: '8px', background: 'rgba(255,85,0,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12px', color: '#ff5500', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>EXPEDIENTE #{d.numero}</span>
                                  <span style={{ fontSize: '9px', background: 'rgba(255,85,0,0.1)', border: '1px solid #ff5500', color: '#ff5500', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{d.tipo}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                                  <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Comisaría:</span><span className="terminal-value">{d.comisaria}</span></div>
                                  <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">N° Orden:</span><span className="terminal-value">{d.n_orden}</span></div>
                                  <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Fecha Hecho:</span><span className="terminal-value">{d.f_hecho}</span></div>
                                  <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Fecha Registro:</span><span className="terminal-value">{d.f_registro}</span></div>
                                </div>
                                <button type="button" onClick={() => handleDownloadBase64PDF(d.data_uri, d.nombre)}
                                  style={{
                                    width: '100%',
                                    marginTop: '4px',
                                    padding: '10px',
                                    background: 'rgba(255,85,0,0.15)',
                                    border: '1px solid #ff5500',
                                    borderRadius: '6px',
                                    color: '#ff661a',
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,85,0,0.3)';
                                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255,85,0,0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,85,0,0.15)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  📥 Descargar Acta PNP Oficial (PDF)
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {osintModule === 'rqh' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ marginBottom: '4px', borderBottom: '1px dashed rgba(255,0,204,0.3)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#ff00cc', fontFamily: 'var(--font-mono)' }}>REQUISITORIAS JUDICIALES & CAPTURAS (RQH)</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <span style={{ fontSize: '9px', background: osintResult.resumen_requisitorias?.activas > 0 ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.1)', border: `1px solid ${osintResult.resumen_requisitorias?.activas > 0 ? '#ff3333' : '#00ff88'}`, color: osintResult.resumen_requisitorias?.activas > 0 ? '#ff3333' : '#00ff88', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                {osintResult.resumen_requisitorias?.activas > 0 ? `⚠️ ACTIVAS: ${osintResult.resumen_requisitorias?.activas}` : '✔️ SIN ORDEN DE CAPTURA ACTIVA'}
                              </span>
                              <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '2px 5px', borderRadius: '4px' }}>
                                TOTAL: {osintResult.resumen_requisitorias?.total || 0}
                              </span>
                            </div>
                          </div>

                          {/* Datos Judiciales Personales */}
                          {osintResult.datos_personales && (
                            <div style={{ padding: '14px', border: '1px solid rgba(255,0,204,0.2)', borderRadius: '8px', background: 'rgba(255,0,204,0.02)' }}>
                              <h4 style={{ color: '#fff', fontSize: '1.2rem', margin: '0 0 10px 0', fontWeight: 'bold' }}>{osintResult.datos_personales.nombres}</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                                <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">DNI:</span><span className="terminal-value">{osintResult.datos_personales.dni}</span></div>
                                <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Edad / Sexo:</span><span className="terminal-value">{osintResult.datos_personales.edad} años / {osintResult.datos_personales.sexo}</span></div>
                                <div className="terminal-row"><span className="terminal-label">Estatura / Ocupación:</span><span className="terminal-value">{osintResult.datos_personales.estatura || '-'} / {osintResult.datos_personales.ocupacion || '-'}</span></div>
                                <div className="terminal-row"><span className="terminal-label">Estado Civil:</span><span className="terminal-value">{osintResult.datos_personales.estado_civil || '-'}</span></div>
                                <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Dirección:</span><span className="terminal-value" style={{ fontSize: '10px' }}>{osintResult.datos_personales.direccion || '-'}</span></div>
                                <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Distrito / Ubigeo:</span><span className="terminal-value">{osintResult.datos_personales.distrito || '-'} // {osintResult.datos_personales.ubigeo || '-'}</span></div>
                              </div>
                            </div>
                          )}

                          {/* Detalle de Requisitorias */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(osintResult.detalle || []).map((rq, i) => {
                              const isActive = rq.estado === 'ACTIVA';
                              return (
                                <div key={i} style={{ padding: '14px', border: `1px solid ${isActive ? 'rgba(255,0,0,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', background: isActive ? 'rgba(255,0,0,0.03)' : 'rgba(255,255,255,0.01)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '12px', color: isActive ? '#ff3333' : '#a0aec0', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>CAPTURA #{rq.numero} ({rq.anio})</span>
                                    <span style={{ fontSize: '9px', background: isActive ? 'rgba(255,0,0,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isActive ? '#ff3333' : 'rgba(255,255,255,0.2)'}`, color: isActive ? '#ff3333' : 'rgba(255,255,255,0.6)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                      {isActive ? '⚠️ ORDEN DE CAPTURA EN VIGOR' : '✓ INACTIVA / LEVANTADA'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '8px' }}>
                                    <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Delito:</span><span className="terminal-value" style={{ color: isActive ? '#ff7e7e' : 'inherit', fontWeight: isActive ? 'bold' : 'normal' }}>{rq.delito}</span></div>
                                    <div className="terminal-row" style={{ paddingTop: 0 }}><span className="terminal-label">Tipo / Proceso:</span><span className="terminal-value">{rq.tipo} // {rq.proceso}</span></div>
                                    <div className="terminal-row"><span className="terminal-label">Expediente:</span><span className="terminal-value" style={{ fontFamily: 'monospace' }}>{rq.exp}</span></div>
                                    <div className="terminal-row"><span className="terminal-label">N° Requisitoria:</span><span className="terminal-value" style={{ fontFamily: 'monospace' }}>{rq.nrq}</span></div>
                                    <div className="terminal-row"><span className="terminal-label">Inicio / Vence:</span><span className="terminal-value">{rq.inicio} // {rq.vence}</span></div>
                                    <div className="terminal-row"><span className="terminal-label">Cuaderno / Motivo:</span><span className="terminal-value">{rq.cuaderno} // {rq.motivo}</span></div>
                                    <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Órgano / Secretaría:</span><span className="terminal-value">{rq.dependencia}<br/>{rq.secretario}</span></div>
                                    <div className="terminal-row" style={{ borderBottom: 'none' }}><span className="terminal-label">Distrito Judicial:</span><span className="terminal-value">{rq.distrito}</span></div>
                                  </div>
                                  {rq.agraviada_o && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '6px' }}>Agraviado(a): {rq.agraviada_o}</div>}
                                </div>
                              );
                            })}
                          </div>

                          {/* Documentos Judiciales PDF */}
                          {osintResult.documentos && osintResult.documentos.length > 0 && (
                            <div style={{ borderTop: '1px dashed rgba(255,0,204,0.2)', paddingTop: '12px', marginTop: '4px' }}>
                              <span style={{ fontSize: '10px', color: '#ff00cc', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>DOCUMENTACIÓN JUDICIAL OFICIAL DISPONIBLE:</span>
                              {osintResult.documentos.map((doc, idx) => (
                                <button key={idx} type="button" onClick={() => handleDownloadBase64PDF(doc.data_uri, doc.nombre)}
                                  style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'rgba(255,0,204,0.12)',
                                    border: '1px solid #ff00cc',
                                    borderRadius: '6px',
                                    color: '#ff33d6',
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                    marginBottom: '6px'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,0,204,0.25)';
                                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255,0,204,0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,0,204,0.12)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  ⚖ Descargar Resolución Judicial de Captura (PDF)
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
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
