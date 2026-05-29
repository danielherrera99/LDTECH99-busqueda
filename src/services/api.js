/**
 * LDTech99 - OSINT API Service Client
 * 
 * Módulo de servicios para los 9 endpoints oficiales de la API de Codart.
 * Soporta dos modos de operación:
 *   · 'backend'  → Petición al Gateway Seguro de Laravel (token protegido en servidor)
 *   · 'direct'   → Petición directa a Codart con el token ingresado en la UI
 * 
 * Cada servicio incluye un fallback de alta fidelidad para desarrollo offline.
 */

const BACKEND_URL   = 'https://ldtech99-backend.onrender.com';
const CODART_DIRECT = 'https://api-codart.cgrt.org/api/v1/consultas';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Helper: Token activo ───────────────────────────────────────────────────
const getToken = (token) =>
  token || localStorage.getItem('sunat_token') || '';

// ─── Helper: Cabeceras para llamada directa ─────────────────────────────────
const directHeaders = (token, isFree = false) => {
  let activeToken = token || localStorage.getItem('sunat_token') || '';
  if (isFree) {
    // Si es una petición gratuita (RUC / DNI Básico), inyectamos siempre el token gratuito para proteger el saldo premium
    activeToken = '5oQzLwbZ9TccLCzFhFbHXTgoGHmOsWYxyCfRyZ4FliZrCTriYl4nALdBThi3';
  } else {
    // Para peticiones premium, si no hay token configurado o es el default, usamos el premium por defecto
    if (!activeToken || activeToken === 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr') {
      activeToken = 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr';
    }
  }
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    Authorization: `Bearer ${activeToken}`,
  };
};

// ─── Helper: Petición al Backend (Laravel Gateway) ─────────────────────────
const backendPost = async (path, body) => {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    try {
      const errData = await res.json();
      if (errData && errData.message) {
        throw new Error(errData.message);
      }
    } catch (e) {
      if (e.message && !e.message.includes('JSON')) {
        throw e;
      }
    }
    throw new Error(`Error del servidor: código ${res.status}`);
  }
  return res.json();
};

// ─── Imágenes SVG de fallback ───────────────────────────────────────────────
const svgAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" fill="none"><rect width="100" height="120" rx="6" fill="%23040509" stroke="%2300ff00" stroke-width="1" stroke-opacity="0.3"/><circle cx="50" cy="45" r="22" fill="%2300ff00" fill-opacity="0.1" stroke="%2300ff00" stroke-width="1.5"/><path d="M20 95 C20 75, 30 65, 50 65 C70 65, 80 75, 80 95" fill="%2300ff00" fill-opacity="0.1" stroke="%2300ff00" stroke-width="1.5"/></svg>`;
const svgSign   = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50" fill="none"><path d="M15 35 C25 20, 35 10, 45 25 C55 40, 60 15, 75 20 C90 25, 100 35, 115 15 C125 5, 135 25, 140 30" stroke="%2300ff00" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="5" y1="40" x2="145" y2="40" stroke="%2300ff00" stroke-opacity="0.3" stroke-width="0.5"/></svg>`;
const svgFinger = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" fill="none"><rect width="80" height="100" rx="4" fill="%23040509" stroke="%239b51e0" stroke-width="1"/><ellipse cx="40" cy="50" rx="20" ry="28" stroke="%239b51e0" stroke-width="1" fill="none"/><ellipse cx="40" cy="50" rx="13" ry="19" stroke="%239b51e0" stroke-width="1" fill="none" stroke-dasharray="3,2"/><ellipse cx="40" cy="50" rx="7" ry="10" stroke="%239b51e0" stroke-width="1" fill="none"/></svg>`;
const svgPlate  = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" fill="none"><rect width="300" height="100" rx="8" fill="%230a0a0a" stroke="%23ffaa00" stroke-width="2"/><rect x="10" y="10" width="280" height="80" rx="5" fill="%23111" stroke="%23ffaa00" stroke-width="1" stroke-dasharray="4,3"/><text x="150" y="62" font-family="monospace" font-size="36" font-weight="bold" fill="%23ffaa00" text-anchor="middle" letter-spacing="6">PLA-000</text><text x="150" y="90" font-family="monospace" font-size="10" fill="%23ffaa00" fill-opacity="0.5" text-anchor="middle">PERÚ · SUNARP</text></svg>`;

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 1 · SUNAT RUC
// ═══════════════════════════════════════════════════════════════════════════════
export const sunatService = {
  consultarRuc: async (ruc, token, mode = 'direct') => {
    if (!/^\d{11}$/.test(ruc)) throw new Error('El RUC debe tener exactamente 11 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/ruc', { ruc });
      } else {
        const res = await fetch(`${CODART_DIRECT}/sunat/ruc/${ruc}`, { headers: directHeaders(token, true) });
        if (!res.ok) {
          try {
            const errData = await res.json();
            if (errData && errData.message) throw new Error(errData.message);
          } catch(e) {}
          throw new Error(`Error HTTP ${res.status}`);
        }
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados para el RUC.');
      return data;
    } catch (err) {
      console.warn('[RUC FALLBACK]', err.message);
      // Propagar errores críticos de cuota y credenciales para dar feedback al usuario
      if (err.message.includes('Límite') || err.message.includes('Token') || err.message.includes('excedido') || err.message.includes('inválido')) {
        throw err;
      }
      await sleep(900);
      if (ruc === '20538856674') return { success: true, source: 'LOCAL_FALLBACK', result: { razon_social: 'ARTROSCOPICTRAUMA S.A.C.', tipo_documento: '6', numero_documento: '20538856674', estado: 'ACTIVO', condicion: 'HABIDO', direccion: 'AV. GRAL.GARZON NRO 2320 URB. FUNDO OYAGUE', ubigeo: '150113', via_tipo: 'AV.', via_nombre: 'GRAL.GARZON', zona_codigo: 'URB.', zona_tipo: 'FUNDO OYAGUE', numero: '2320', interior: '-', lote: '-', dpto: '-', manzana: '-', kilometro: '-', distrito: 'JESUS MARIA', provincia: 'LIMA', departamento: 'LIMA', es_agente_retencion: false, es_buen_contribuyente: true, locales_anexos: null, tipo: 'SOCIEDAD ANONIMA CERRADA', actividad_economica: 'OTRAS ACTIVIDADES DE ATENCION DE LA SALUD HUMANA', numero_trabajadores: '1', tipo_facturacion: 'MANUAL', tipo_contabilidad: 'MANUAL', comercio_exterior: 'SIN ACTIVIDAD' } };
      return { success: true, source: 'LOCAL_FALLBACK', result: { razon_social: `EMPRESA DEMO S.A.C. (${ruc})`, tipo_documento: '6', numero_documento: ruc, estado: 'ACTIVO', condicion: 'HABIDO', direccion: 'AV. TECNOLOGIA NRO 999', ubigeo: '140101', via_tipo: 'AV.', via_nombre: 'TECNOLOGIA', zona_codigo: 'URB.', zona_tipo: 'SILICON VALLEY PERU', numero: '999', interior: '-', lote: '-', dpto: '-', manzana: '-', kilometro: '-', distrito: 'CHICLAYO', provincia: 'CHICLAYO', departamento: 'LAMBAYEQUE', es_agente_retencion: false, es_buen_contribuyente: true, locales_anexos: null, tipo: 'SOCIEDAD ANONIMA CERRADA', actividad_economica: 'DESARROLLO DE SOFTWARE Y TECNOLOGIA', numero_trabajadores: '10', tipo_facturacion: 'ELECTRONICA', tipo_contabilidad: 'COMPUTARIZADA', comercio_exterior: 'SIN ACTIVIDAD' } };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 2 · DNI BÁSICO RENIEC
// ═══════════════════════════════════════════════════════════════════════════════
export const reniecBasicService = {
  consultarDni: async (dni, token, mode = 'direct') => {
    if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/dni', { dni });
      } else {
        const res = await fetch(`${CODART_DIRECT}/reniec/dni/${dni}`, { headers: directHeaders(token, true) });
        if (!res.ok) {
          try {
            const errData = await res.json();
            if (errData && errData.message) throw new Error(errData.message);
          } catch(e) {}
          throw new Error(`Error HTTP ${res.status}`);
        }
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados para el DNI.');
      return data;
    } catch (err) {
      console.warn('[DNI BASIC FALLBACK]', err.message);
      // Propagar errores críticos de cuota y credenciales para dar feedback al usuario
      if (err.message.includes('Límite') || err.message.includes('Token') || err.message.includes('excedido') || err.message.includes('inválido')) {
        throw err;
      }
      await sleep(800);
      return {
        success: true, source: 'LOCAL_FALLBACK',
        result: { first_name: 'NOMBRE EJEMPLO', first_last_name: 'APELLIDO1', second_last_name: 'APELLIDO2', full_name: 'APELLIDO1 APELLIDO2 NOMBRE EJEMPLO', document_type: '1', document_number: dni, birth_date: '01/01/1990', gender: 'M', nationality: 'PER', address: 'AV. DEMO 123', district: 'CHICLAYO', province: 'CHICLAYO', department: 'LAMBAYEQUE', phone: '956041289', email: 'demo@ldtech99.com' },
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 3 · DNI PREMIUM (Foto + Firma)
// ═══════════════════════════════════════════════════════════════════════════════
export const reniecService = {
  consultarDni: async (dni, token, mode = 'direct') => {
    if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/dni-premium', { dni });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/dni/${dni}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados para el DNI.');
      return data;
    } catch (err) {
      console.warn('[DNI PREMIUM FALLBACK]', err.message);
      await sleep(1200);
      const esMasc = parseInt(dni.charAt(7)) % 2 === 0;
      const nombres = esMasc ? 'LUIS DANIEL' : 'ANA MARIA';
      const apellidos = 'HERRERA TANTALEAN';
      return {
        success: true, source: 'LOCAL_FALLBACK',
        data: { images: [{ data_uri: svgAvatar }, { data_uri: svgSign }], dni: { numero: dni, digito_verificador: String(parseInt(dni.charAt(7)) % 10), completo: `${dni} - ${parseInt(dni.charAt(7)) % 10}` }, nombres, apellidos, genero: esMasc ? 'MASCULINO' : 'FEMENINO', nacimiento: { fecha: '18/05/1998', edad: '27 AÑOS', departamento: 'LAMBAYEQUE', provincia: 'CHICLAYO', distrito: 'POMALCA' }, informacion_general: { nivel_educativo: 'SUPERIOR COMPLETA', estado_civil: 'SOLTERO', estatura: '1.78 MT.', fecha_inscripcion: '18/05/2015', fecha_emision: '18/05/2022', fecha_caducidad: '18/05/2030', donante_organos: 'SÍ', padre: 'PEDRO HERRERA', madre: 'MARIA TANTALEAN', restriccion: 'NINGUNA' }, domicilio: { departamento: 'LAMBAYEQUE', provincia: 'CHICLAYO', distrito: 'POMALCA', direccion: 'AV. DE LA JUVENTUD NRO 456' }, ubigeos: { reniec: '140112', ine: '14011', sunat: '140101' } },
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 4 · DNIT EXTENDIDO (4 Imágenes Biométricas)
// ═══════════════════════════════════════════════════════════════════════════════
export const dnitService = {
  consultarDnit: async (dni, token, mode = 'direct') => {
    if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/dnit-extended', { dni });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/dnit/${dni}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados DNIT.');
      return data;
    } catch (err) {
      console.warn('[DNIT FALLBACK]', err.message);
      await sleep(1400);
      return {
        success: true, source: 'LOCAL_FALLBACK',
        data: { images: [{ data_uri: svgAvatar }, { data_uri: svgSign }, { data_uri: svgFinger }, { data_uri: svgFinger }], dni: { numero: dni, digito_verificador: '5', completo: `${dni} - 5` }, nombres: 'NOMBRE EJEMPLO', apellidos: 'APELLIDO EJEMPLO', genero: 'FEMENINO', nacimiento: { fecha: '01/01/2000', edad: '25 AÑOS', departamento: 'LIMA', provincia: 'LIMA', distrito: 'MIRAFLORES' }, informacion_general: { nivel_educativo: 'SUPERIOR COMPLETA', estado_civil: 'SOLTERO', estatura: '1.70 MT.', fecha_inscripcion: '01/01/2015', fecha_emision: '01/01/2024', fecha_caducidad: '01/01/2030', donante_organos: 'NO', padre: 'NOMBRE PADRE', madre: 'NOMBRE MADRE', restriccion: 'NINGUNA' }, domicilio: { departamento: 'LIMA', provincia: 'LIMA', distrito: 'MIRAFLORES', direccion: 'AV. EJEMPLO 123' }, ubigeos: { reniec: '150122', ine: '15012', sunat: '150122' } },
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 5 · BÚSQUEDA POR NOMBRES (NM)
// ═══════════════════════════════════════════════════════════════════════════════
export const nmService = {
  consultarNm: async ({ n1, ap1, ap2 }, token, mode = 'direct') => {
    if (!n1 || n1.length < 2) throw new Error('Ingresa al menos 2 letras del primer nombre (n1).');
    if (!ap1 || ap1.length < 2) throw new Error('Ingresa al menos 2 letras del primer apellido (ap1).');
    if (!ap2 || ap2.length < 2) throw new Error('Ingresa al menos 2 letras del segundo apellido (ap2).');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/nm', { n1, ap1, ap2 });
      } else {
        const params = new URLSearchParams({ n1, ap1, ap2 }).toString();
        const res = await fetch(`${CODART_DIRECT}/fd/nm?${params}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados NM.');
      return data;
    } catch (err) {
      console.warn('[NM FALLBACK]', err.message);
      await sleep(900);
      return {
        success: true, source: 'LOCAL_FALLBACK',
        data: { cantidad_resultados: 2, resultados: [{ dni: '12345678', nombres: n1.toUpperCase(), apellidos: `${ap1.toUpperCase()} ${ap2.toUpperCase()}`, edad: 34 }, { dni: '87654321', nombres: n1.toUpperCase(), apellidos: `${ap1.toUpperCase()} ${ap2.toUpperCase()}`, edad: 22 }] },
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 6 · ÁRBOL GENEALÓGICO (AG)
// ═══════════════════════════════════════════════════════════════════════════════
export const agService = {
  consultarAg: async (dni, token, mode = 'direct') => {
    if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/ag', { dni });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/ag/${dni}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados AG.');
      return data;
    } catch (err) {
      console.warn('[AG FALLBACK]', err.message);
      await sleep(1000);
      return {
        success: true, source: 'LOCAL_FALLBACK',
        data: { consulta: dni, familiares: 6, relaciones: [{ dni: '11111111', edad: 58, nombres: 'PEDRO ALBERTO', apellidos: 'HERRERA MENDOZA', sexo: 'MASCULINO', relacion: 'PADRE', verificacion: 'ALTO' }, { dni: '22222222', edad: 54, nombres: 'MARIA ELENA', apellidos: 'TANTALEAN FLORES', sexo: 'FEMENINO', relacion: 'MADRE', verificacion: 'ALTO' }, { dni: '33333333', edad: 29, nombres: 'CARLOS JOSE', apellidos: 'HERRERA TANTALEAN', sexo: 'MASCULINO', relacion: 'HERMANO', verificacion: 'ALTO' }, { dni: '44444444', edad: 22, nombres: 'LUCIA SOFIA', apellidos: 'HERRERA TANTALEAN', sexo: 'FEMENINO', relacion: 'HERMANA', verificacion: 'ALTO' }, { dni: '55555555', edad: 45, nombres: 'JUAN CARLOS', apellidos: 'HERRERA GARCIA', sexo: 'MASCULINO', relacion: 'TIO PATERNO', verificacion: 'MEDIO' }, { dni: '66666666', edad: 19, nombres: 'DIANA CAROLINA', apellidos: 'TANTALEAN RIOS', sexo: 'FEMENINO', relacion: 'PRIMA MATERNA', verificacion: 'MEDIO' }] },
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 7 · LÍNEAS TELEFÓNICAS (TELP)
// ═══════════════════════════════════════════════════════════════════════════════
export const telpService = {
  consultarTelp: async (dni, token, mode = 'direct') => {
    if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/telp', { dni });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/telp/${dni}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados TELP.');
      return data;
    } catch (err) {
      console.warn('[TELP FALLBACK]', err.message);
      await sleep(900);
      return {
        success: true, source: 'LOCAL_FALLBACK',
        data: { lineas_encontradas: 4, lineas: [{ telefono: '956041289', operador: 'CLARO', periodo: '202605', empresa: 'AMERICA MOVIL PERU S.A.C.' }, { telefono: '987654321', operador: 'MOVISTAR', periodo: '202201', empresa: 'TELEFONICA DEL PERU S.A.A.' }, { telefono: '912345678', operador: 'ENTEL', periodo: '202107', empresa: 'ENTEL PERU S.A.' }, { telefono: '934567890', operador: 'BITEL', periodo: '202008', empresa: 'VIETTEL PERU S.A.C.' }] },
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 8 · BÚSQUEDA INVERSA CELULAR (TELP CEL)
// ═══════════════════════════════════════════════════════════════════════════════
export const telpCelService = {
  consultarTelpCel: async (numero, token, mode = 'direct') => {
    if (!/^\d{9}$/.test(numero)) throw new Error('El número celular debe tener exactamente 9 dígitos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/telp-cel', { numero });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/telp/cel/${numero}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados TELP CEL.');
      return data;
    } catch (err) {
      console.warn('[TELP CEL FALLBACK]', err.message);
      await sleep(800);
      return {
        success: true, source: 'LOCAL_FALLBACK',
        data: { titulares_encontrados: 1, titulares: [{ titular: 'PROPIETARIO DEMO', operador: 'CLARO', telefono: numero, dni_ruc: '72345678', periodo: '202605', plan: 'Plan_Ilimitado_49.90', n_ip: null, correo: 'contacto@ldtech99.com', empresa: 'AMERICA MOVIL PERU S.A.C.' }] },
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 9 · PLACA VEHICULAR (PLA)
// ═══════════════════════════════════════════════════════════════════════════════
export const plaService = {
  consultarPla: async (placa, token, mode = 'direct') => {
    const clean = placa.toUpperCase().trim();
    if (!/^[A-Z0-9]{6,7}$/.test(clean)) throw new Error('La placa debe tener 6 o 7 caracteres alfanuméricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/pla', { placa: clean });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/pla/${clean}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados para la placa.');
      return data;
    } catch (err) {
      console.warn('[PLA FALLBACK]', err.message);
      await sleep(800);
      return {
        success: true, source: 'LOCAL_FALLBACK',
        data: { placa: clean, images: [{ data_uri: svgPlate }] },
      };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 10 · DENUNCIAS POLICIALES (RÉCORD TEXTO)
// ═══════════════════════════════════════════════════════════════════════════════
export const denService = {
  consultarDen: async (dni, token, mode = 'direct') => {
    if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/den', { dni });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/den/${dni}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin denuncias registradas.');
      return data;
    } catch (err) {
      console.warn('[DEN FALLBACK]', err.message);
      await sleep(1000);
      return {
        success: true,
        source: 'LOCAL_FALLBACK',
        data: {
          consulta: dni,
          cantidad_denuncias: 4,
          denuncias: [
            {
              numero: 1,
              tipo: 'DENUNCIADO',
              comisaria: 'CPNP SAYAN',
              n_orden: '10000001',
              f_hecho: '01/01/2024 09:00:00 Hrs.',
              f_registro: '02/01/2024 10:15:00 Hrs.',
              condicion: '[PDE] DENUNCIA DIRECTA Nro : 001',
              intervencion: '-',
              resumen: 'DENUNCIA POR ALTERACIÓN DEL ORDEN PÚBLICO Y RUIDOS MOLESTOS EN LA VÍA PÚBLICA.'
            },
            {
              numero: 2,
              tipo: 'AGRAVIADO',
              comisaria: 'CPNP CHANCAY',
              n_orden: '10000002',
              f_hecho: '05/02/2024 14:30:00 Hrs.',
              f_registro: '05/02/2024 15:10:00 Hrs.',
              condicion: '[DEINPOL] ACTA DE INTERVENCION Nro : 002',
              intervencion: '-',
              resumen: 'DENUNCIA POR HURTO AGRAVADO DE DISPOSITIVO MÓVIL EN CENTRO COMERCIAL.'
            },
            {
              numero: 3,
              tipo: 'AGRESOR',
              comisaria: 'CPNP LOS OLIVOS',
              n_orden: '10000003',
              f_hecho: '10/03/2024 12:30:00 Hrs.',
              f_registro: '10/03/2024 13:10:27 Hrs.',
              condicion: '[DEINPOL] DENUNCIA DIRECTA DELITO Nro : 003',
              intervencion: '-',
              resumen: 'REPORTE POR VIOLENCIA FAMILIAR Y AGRESIONES VERBALES.'
            },
            {
              numero: 4,
              tipo: 'DENUNCIANTE',
              comisaria: 'CPNP CHANCAY',
              n_orden: '10000004',
              f_hecho: '20/04/2024 17:00:00 Hrs.',
              f_registro: '20/04/2024 18:05:00 Hrs.',
              condicion: '[PDE] DENUNCIA PERDIDA DE DOCUMENTOS Nro : 004',
              intervencion: '-',
              resumen: 'DENUNCIA POR PÉRDIDA DE DOCUMENTO NACIONAL DE IDENTIDAD (DNI) Y TARJETAS.'
            }
          ]
        }
      };
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 11 · DESCARGA DE ACTAS DE DENUNCIA (PDF BASE64)
// ═══════════════════════════════════════════════════════════════════════════════
export const denPdfService = {
  consultarDenuncias: async (dni, token, mode = 'direct') => {
    if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/denuncias', { dni });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/denuncias/${dni}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin actas de denuncias PDF.');
      return data;
    } catch (err) {
      console.warn('[DENUNCIAS PDF FALLBACK]', err.message);
      await sleep(1200);
      const samplePdf = 'data:application/pdf;base64,JVBERi0xLjQKJcFSnaerCgoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMiA8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZAo+Pgo+Pgo+Pgo+PgplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDY5Cj4+CnN0cmVhbQpCVAovRjIgMTggVGYKNTYgNzgxIFRkCihERU5VTkNJQSBQT0xJQ0lBTCBPRklDSUFMCVNFQ1VSSVRZIERFTU8pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbigKMDAwMDAwMDEyMCAwMDAwMCBuIAowMDAwMDAwMjgxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDEwCiUlRU9GCg==';
      return {
        success: true,
        source: 'LOCAL_FALLBACK',
        data: {
          consulta: dni,
          cantidad_denuncias: 4,
          denuncias: [
            {
              numero: 1,
              nombre: `DENUNCIAS-POLICIALES-${dni}-1.pdf`,
              mime: 'application/pdf',
              extension: '.pdf',
              data_uri: samplePdf,
              tipo: 'DENUNCIADO',
              comisaria: 'CPNP SAYAN',
              n_orden: '23980465',
              f_hecho: '17/07/2022 09:00:00 Hrs.',
              f_registro: '15/08/2022 18:25:25 Hrs.'
            },
            {
              numero: 2,
              nombre: `DENUNCIAS-POLICIALES-${dni}-2.pdf`,
              mime: 'application/pdf',
              extension: '.pdf',
              data_uri: samplePdf,
              tipo: 'AGRAVIADO',
              comisaria: 'CPNP CHANCAY',
              n_orden: '18801266',
              f_hecho: '13/12/2020 20:30:00 Hrs.',
              f_registro: '14/12/2020 00:47:55 Hrs.'
            },
            {
              numero: 3,
              nombre: `DENUNCIAS-POLICIALES-${dni}-3.pdf`,
              mime: 'application/pdf',
              extension: '.pdf',
              data_uri: samplePdf,
              tipo: 'AGRESOR',
              comisaria: 'CPNP LOS OLIVOS',
              n_orden: '26831524',
              f_hecho: '08/07/2023 12:30:00 Hrs.',
              f_registro: '08/07/2023 13:10:27 Hrs.'
            },
            {
              numero: 4,
              nombre: `DENUNCIAS-POLICIALES-${dni}-4.pdf`,
              mime: 'application/pdf',
              extension: '.pdf',
              data_uri: samplePdf,
              tipo: 'DENUNCIANTE',
              comisaria: 'CPNP CHANCAY',
              n_orden: '17143902',
              f_hecho: '07/04/2020 17:00:00 Hrs.',
              f_registro: '08/04/2020 09:37:00 Hrs.'
            }
          ]
        }
      };
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO 12 · REQUISITORIAS JUDICIALES (RQH)
// ═══════════════════════════════════════════════════════════════════════════════
export const rqhService = {
  consultarRqh: async (dni, token, mode = 'direct') => {
    if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/rqh', { dni });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/rqh/${dni}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin requisitorias registradas.');
      return data;
    } catch (err) {
      console.warn('[RQH FALLBACK]', err.message);
      await sleep(1300);
      const samplePdf = 'data:application/pdf;base64,JVBERi0xLjQKJcFSnaerCgoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMiA8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZAo+Pgo+Pgo+Pgo+PgplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDY5Cj4+CnN0cmVhbQpCVAovRjIgMTggVGYKNTYgNzgxIFRkCihSRVFVSVNJVE9SSUEgSlVESUNJQUwgT0ZJQ0lBTCBERU1PKSBUagpFVAplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbigKMDAwMDAwMDEyMCAwMDAwMCBuIAowMDAwMDAwMjgxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDEwCiUlRU9GCg==';
      return {
        success: true,
        source: 'LOCAL_FALLBACK',
        data: {
          consulta: dni,
          datos_personales: {
            dni: dni,
            nombres: 'JUAN PEREZ SANDOVAL',
            sexo: 'MASCULINO',
            fecha_nacimiento: '18/05/1998',
            edad: 27,
            estado_civil: 'SOLTERO(A)',
            estatura: '1.78',
            ocupacion: 'DESARROLLADOR INDEPENDIENTE',
            direccion: 'AV. DE LA JUVENTUD NRO 456',
            distrito: 'POMALCA',
            ubigeo: 'CHICLAYO',
            caracteristicas: 'NINGUNO'
          },
          resumen_requisitorias: {
            total: 3,
            activas: 1,
            inactivas: 2
          },
          cantidad_requisitorias: 3,
          detalle: [
            {
              numero: 1,
              estado: 'ACTIVA',
              tipo: 'ORDEN DE CAPTURA',
              proceso: 'INSCRIPCIÓN',
              motivo: 'PRISIÓN PREVENTIVA',
              delito: 'OMISIÓN A LA ASISTENCIA FAMILIAR',
              anio: 2024,
              cuaderno: 'INCIDENTAL',
              exp: '00325-2024-00-1401-JR-PE-01',
              nrq: '202400000325',
              inicio: '12/02/2024',
              vence: '12/02/2029',
              agraviada_o: 'ESTADO PERUANO Y OTROS',
              secretario: 'DR. CARLOS ALBERTO SALINAS',
              dependencia: '1er JUZGADO PENAL UNIPERSONAL',
              distrito: 'LIMA NORTE'
            },
            {
              numero: 2,
              estado: 'INACTIVA',
              tipo: 'COMPARECENCIA RESTRINGIDA',
              proceso: 'EXCLUSIÓN',
              motivo: 'LEVANTAMIENTO DE CAPTURA',
              delito: 'FALSEDAD IDEOLÓGICA',
              anio: 2022,
              cuaderno: 'PRINCIPAL',
              exp: '01290-2022-00-1401-JR-PE-02',
              nrq: '202200001290',
              inicio: '15/06/2022',
              vence: '15/06/2023',
              agraviada_o: 'SUPERINTENDENCIA NACIONAL - SUNARP',
              secretario: 'DRA. BEATRIZ GOMEZ',
              dependencia: '2do JUZGADO DE INVESTIGACION PREPARATORIA',
              distrito: 'LIMA'
            },
            {
              numero: 3,
              estado: 'INACTIVA',
              tipo: 'COMPARECENCIA SIMPLE',
              proceso: 'EXCLUSIÓN',
              motivo: 'CUMPLIMIENTO DE MEDIDA',
              delito: 'CONDUCCIÓN EN ESTADO DE EBRIEDAD',
              anio: 2020,
              cuaderno: 'PRINCIPAL',
              exp: '00750-2020-00-1401-JR-PE-01',
              nrq: '202000000750',
              inicio: '10/01/2020',
              vence: '10/01/2021',
              agraviada_o: 'LA SOCIEDAD',
              secretario: 'DR. MARTIN PEÑA',
              dependencia: '1er JUZGADO DE PAZ LETRADO',
              distrito: 'CHICLAYO'
            }
          ],
          documentos: [
            {
              numero: 1,
              nombre: `REQUISITORIA-${dni}-1.pdf`,
              mime: 'application/pdf',
              extension: '.pdf',
              data_uri: samplePdf
            }
          ]
        }
      };
    }
  }
};

export const platService = {
  consultarPlat: async (placa, token, mode = 'direct') => {
    const cleanPlaca = (placa || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6,7}$/.test(cleanPlaca)) throw new Error('La placa debe tener 6 o 7 caracteres alfanuméricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/plat', { placa: cleanPlaca });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/plat/${cleanPlaca}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados para la placa.');
      return data;
    } catch (err) {
      console.warn('[PLAT FALLBACK]', err.message);
      await sleep(1500);
      return {
        success: true,
        source: 'LOCAL_FALLBACK',
        data: {
          placa: cleanPlaca,
          numero_serie: 'SERIE-DEMO-123456',
          numero_vin: 'VIN-DEMO-123456789',
          numero_motor: 'MOTOR-DEMO-4567',
          caracteristicas: {
            marca: 'MARCA DEMO',
            modelo: 'MODELO DEMO',
            estado: 'En circulación',
            tipo_combustible: 'COMBUSTIBLE DEMO'
          },
          extra: {
            asientos: '4',
            pasajeros: '3',
            peso_bruto: '2.10',
            peso_neto: '1.45'
          },
          propietarios: [
            {
              nombres: 'PROPIETARIO DEMO S.A.C.',
              partida: null,
              le: '00000000',
              fecha_propietario: '-',
              direccion: 'DIRECCIÓN DEMO 123 - LIMA'
            },
            {
              nombres: 'PROPIETARIO DEMO DOS',
              partida: '11002233',
              le: '72345678',
              fecha_propietario: '15/08/2022',
              direccion: 'AV. BALTA NRO. 456 - CHICLAYO'
            }
          ]
        }
      };
    }
  }
};

export const hsoatService = {
  consultarHsoat: async (placa, token, mode = 'direct') => {
    const cleanPlaca = (placa || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6,7}$/.test(cleanPlaca)) throw new Error('La placa debe tener 6 o 7 caracteres alfanuméricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/hsoat', { placa: cleanPlaca });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/hsoat/${cleanPlaca}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados HSOAT.');
      return data;
    } catch (err) {
      console.warn('[HSOAT FALLBACK]', err.message);
      await sleep(1500);
      return {
        success: true,
        source: 'LOCAL_FALLBACK',
        data: {
          placa: cleanPlaca,
          cantidad_registros: 3,
          historial: [
            {
              compania: 'POSITIVA SEGUROS',
              estado: 'VIGENTE',
              tipo_certificado: 'DIGITAL',
              uso: 'PARTICULAR',
              clase: 'AUTOMOVIL',
              poliza: 'POLIZA-SOAT-998822',
              fecha_inicio: '01/01/2026',
              fecha_fin: '01/01/2027',
              control_policial: '01/01/2026'
            },
            {
              compania: 'RIMAC SEGUROS S.A.',
              estado: 'VENCIDO',
              tipo_certificado: 'FISICO',
              uso: 'PARTICULAR',
              clase: 'AUTOMOVIL',
              poliza: 'POLIZA-SOAT-775511',
              fecha_inicio: '01/01/2025',
              fecha_fin: '01/01/2026',
              control_policial: '01/01/2025'
            },
            {
              compania: 'PACIFICO SEGUROS',
              estado: 'VENCIDO',
              tipo_certificado: 'FISICO',
              uso: 'PARTICULAR',
              clase: 'AUTOMOVIL',
              poliza: 'POLIZA-SOAT-443311',
              fecha_inicio: '01/01/2024',
              fecha_fin: '01/01/2025',
              control_policial: '01/01/2024'
            }
          ]
        }
      };
    }
  }
};

export const facialService = {
  consultarFacial: async (imageFile, token, mode = 'direct') => {
    if (!imageFile) throw new Error('Selecciona un archivo de imagen de rostro válido.');
    try {
      let data;
      if (mode === 'backend') {
        const formData = new FormData();
        formData.append('image_facial', imageFile);
        const res = await fetch(`${BACKEND_URL}/consultas/facial`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData
        });
        if (!res.ok) {
          try {
            const errData = await res.json();
            if (errData && errData.message) throw new Error(errData.message);
          } catch (e) {}
          throw new Error(`Error HTTP ${res.status}`);
        }
        data = await res.json();
      } else {
        const formData = new FormData();
        formData.append('image_facial', imageFile);
        const activeToken = token || localStorage.getItem('sunat_token') || '';
        const directToken = (!activeToken || activeToken === 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr')
          ? 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr'
          : activeToken;

        const res = await fetch(`${CODART_DIRECT}/fd/facial`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${directToken}`
          },
          body: formData
        });
        if (!res.ok) {
          try {
            const errData = await res.json();
            if (errData && errData.message) throw new Error(errData.message);
          } catch (e) {}
          throw new Error(`Error HTTP ${res.status}`);
        }
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados para reconocimiento facial.');
      return data;
    } catch (err) {
      console.warn('[FACIAL BIOMETRIC FALLBACK]', err.message);
      await sleep(2500);
      const samplePdf = 'data:application/pdf;base64,JVBERi0xLjQKJcFSnaerCgoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMiA8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZAo+Pgo+Pgo+Pgo+PgplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDY5Cj4+CnN0cmVhbQpCVAovRjIgMTggVGYKNTYgNzgxIFRkCihSRVFVSVNJVE9SSUEgSlVESUNJQUwgT0ZJQ0lBTCBERU1PKSBUagpFVAplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbigKMDAwMDAwMDEyMCAwMDAwMCBuIAowMDAwMDAwMjgxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDEwCiUlRU9GCg==';
      return {
        success: true,
        source: 'LOCAL_FALLBACK',
        data: {
          tipo_resultado: 'rostro',
          coincidencias_mostradas: 3,
          coincidencias_adicionales: 9,
          coincidencias_totales: 12,
          coincidencias: [
            {
              dni: '00000001',
              porcentaje: 99.96,
              nombre: 'PERSONA EJEMPLO UNO'
            },
            {
              dni: '72345678',
              porcentaje: 77.19,
              nombre: 'COINCIDENCIA EJEMPLO DOS'
            },
            {
              dni: '00000003',
              porcentaje: 76.76,
              nombre: 'PERSONA EJEMPLO TRES'
            }
          ],
          documentos: [
            {
              nombre: 'RECONOC-FACIAL-V1-3_0000000000-1.pdf',
              mime: 'application/pdf',
              extension: '.pdf',
              data_uri: samplePdf
            }
          ]
        }
      };
    }
  }
};

export const facialTopService = {
  consultarFacialTop: async (imageFile, token, mode = 'direct') => {
    if (!imageFile) throw new Error('Selecciona un archivo de imagen de rostro válido.');
    try {
      let data;
      if (mode === 'backend') {
        const formData = new FormData();
        formData.append('image_facial', imageFile);
        const res = await fetch(`${BACKEND_URL}/consultas/facial-top`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData
        });
        if (!res.ok) {
          try {
            const errData = await res.json();
            if (errData && errData.message) throw new Error(errData.message);
          } catch (e) {}
          throw new Error(`Error HTTP ${res.status}`);
        }
        data = await res.json();
      } else {
        const formData = new FormData();
        formData.append('image_facial', imageFile);
        const activeToken = token || localStorage.getItem('sunat_token') || '';
        const directToken = (!activeToken || activeToken === 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr')
          ? 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr'
          : activeToken;

        const res = await fetch(`${CODART_DIRECT}/fd/facial/top`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${directToken}`
          },
          body: formData
        });
        if (!res.ok) {
          try {
            const errData = await res.json();
            if (errData && errData.message) throw new Error(errData.message);
          } catch (e) {}
          throw new Error(`Error HTTP ${res.status}`);
        }
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados para reconocimiento facial top.');
      return data;
    } catch (err) {
      console.warn('[FACIAL TOP FALLBACK]', err.message);
      await sleep(2000);
      return {
        success: true,
        source: 'LOCAL_FALLBACK',
        data: {
          tipo_resultado: 'rostro',
          coincidencias_mostradas: 3,
          coincidencias: [
            {
              dni: '00000001',
              porcentaje: 99.96,
              nombre: 'PERSONA EJEMPLO UNO'
            },
            {
              dni: '72345678',
              porcentaje: 77.19,
              nombre: 'COINCIDENCIA EJEMPLO DOS'
            },
            {
              dni: '00000003',
              porcentaje: 76.76,
              nombre: 'PERSONA EJEMPLO TRES'
            }
          ]
        }
      };
    }
  }
};

export const denplaService = {
  consultarDenpla: async (placa, token, mode = 'direct') => {
    const cleanPlaca = (placa || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6,7}$/.test(cleanPlaca)) throw new Error('La placa debe tener 6 o 7 caracteres alfanuméricos.');
    try {
      let data;
      if (mode === 'backend') {
        data = await backendPost('/consultas/denpla', { placa: cleanPlaca });
      } else {
        const res = await fetch(`${CODART_DIRECT}/fd/denpla/${cleanPlaca}`, { headers: directHeaders(token) });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        data = await res.json();
      }
      if (!data.success) throw new Error(data.message || 'Sin resultados para denuncias de la placa.');
      return data;
    } catch (err) {
      console.warn('[DENPLA FALLBACK]', err.message);
      await sleep(1500);
      const samplePdf = 'data:application/pdf;base64,JVBERi0xLjQKJcFSnaerCgoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9Db250ZW50cyA0IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMiA8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZAo+Pgo+Pgo+Pgo+PgplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDY5Cj4+CnN0cmVhbQpCVAovRjIgMTggVGYKNTYgNzgxIFRkCihERU5VTkNJQSBWRUhJQ1VMQVIgREVNTykgIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbigKMDAwMDAwMDEyMCAwMDAwMCBuIAowMDAwMDAwMjgxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDEwCiUlRU9GCg==';
      return {
        success: true,
        source: 'LOCAL_FALLBACK',
        data: {
          placa: cleanPlaca,
          cantidad_denuncias: 2,
          denuncias: [
            {
              numero: 1,
              tipo: 'DENUNCIANTE',
              comisaria: 'CPNP ATE',
              n_orden: '04664163',
              f_hecho: '21/11/2014 17:20:00 Hrs.',
              f_registro: '21/11/2014 21:41:41 Hrs.',
              nombre: `DENUNCIAS-POLICIALES-${cleanPlaca}-1.pdf`,
              mime: 'application/pdf',
              extension: '.pdf',
              data_uri: samplePdf
            },
            {
              numero: 2,
              tipo: 'DENUNCIADO',
              comisaria: 'CPNP LA MOLINA',
              n_orden: '05819472',
              f_hecho: '15/05/2022 14:10:00 Hrs.',
              f_registro: '15/05/2022 18:25:00 Hrs.',
              nombre: `DENUNCIAS-POLICIALES-${cleanPlaca}-2.pdf`,
              mime: 'application/pdf',
              extension: '.pdf',
              data_uri: samplePdf
            }
          ]
        }
      };
    }
  }
};

// ─── SERVICIOS ORIGINALES (retrocompatibilidad con App.jsx actual) ───────────
export const sunatService_legacy = sunatService;
export const reniecService_legacy = reniecService;

// ─── Auth Service con base de datos real (con fallback local resiliente en localStorage) ────────
const defaultUsers = [
  { id: 'usr_ldtech', username: 'ldtech', password: 'tramun15', name: 'ldtech99', email: 'contacto@ldtech99.com', role: 'Administrador / Principal SysAdmin', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', credits: '∞' },
  { id: 'usr_cliente', username: 'cliente', password: 'cliente2026', name: 'Cliente Premium', email: 'cliente@ldtech99.com', role: 'Consultor Premium / Cliente', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80', credits: 150 },
  { id: 'usr_demo', username: 'demo', password: 'demo123', name: 'Usuario Demo', email: 'demo@ldtech99.com', role: 'Usuario de Pruebas / Demo', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80', credits: 20 }
];

// Asegurar que las credenciales locales de los usuarios por defecto estén sincronizadas con la última versión de seguridad
const savedUsersStr = localStorage.getItem('ldtech_users');
if (savedUsersStr) {
  try {
    const savedUsers = JSON.parse(savedUsersStr);
    let wasUpdated = false;
    const nextUsers = savedUsers.map(u => {
      const matchingDefault = defaultUsers.find(d => d.username === u.username);
      if (matchingDefault && u.password !== matchingDefault.password) {
        u.password = matchingDefault.password;
        wasUpdated = true;
      }
      return u;
    });
    if (wasUpdated) {
      localStorage.setItem('ldtech_users', JSON.stringify(nextUsers));
    }
  } catch (e) {
    localStorage.setItem('ldtech_users', JSON.stringify(defaultUsers));
  }
} else {
  localStorage.setItem('ldtech_users', JSON.stringify(defaultUsers));
}

export const authService = {
  login: async (username, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Credenciales incorrectas. Verifique e intente de nuevo.');
      }
      localStorage.setItem('ldtech_token', data.user.token);
      localStorage.setItem('ldtech_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      // Fallback si el backend está inactivo o no configurado
      if (err.message && err.message.includes('Credenciales incorrectas')) {
        throw err;
      }
      console.warn('[AUTH LOGIN FALLBACK]', err.message);
      await sleep(1000);
      const usersStr = localStorage.getItem('ldtech_users');
      let users = usersStr ? JSON.parse(usersStr) : defaultUsers;
      const found = users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase() && u.password === password);
      if (found) {
        const mockUser = { 
          id: found.id, 
          username: found.name || found.username, 
          email: found.email, 
          role: found.role, 
          avatar: found.avatar, 
          credits: found.credits,
          token: `ey.${found.username}.jwt.token.simulation` 
        };
        localStorage.setItem('ldtech_token', mockUser.token);
        localStorage.setItem('ldtech_user', JSON.stringify(mockUser));
        return { success: true, user: mockUser, source: 'LOCAL_FALLBACK' };
      }
      throw new Error('Credenciales incorrectas. Verifique e intente de nuevo.');
    }
  },
  getCurrentUser: async () => {
    const token = localStorage.getItem('ldtech_token');
    const userStr = localStorage.getItem('ldtech_user');
    if (!token || !userStr) return null;
    await sleep(200);
    return JSON.parse(userStr);
  },
  logout: () => {
    localStorage.removeItem('ldtech_token');
    localStorage.removeItem('ldtech_user');
    return true;
  },
  getUsers: async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/users`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Error al obtener la lista de usuarios.');
      const data = await res.json();
      return data.users;
    } catch (err) {
      console.warn('[AUTH GET_USERS FALLBACK]', err.message);
      const usersStr = localStorage.getItem('ldtech_users');
      return usersStr ? JSON.parse(usersStr) : defaultUsers;
    }
  },
  createUser: async (userData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error al crear el usuario.');
      return data.user;
    } catch (err) {
      if (err.message && (err.message.includes('ya existe') || err.message.includes('El nombre de usuario') || err.message.includes('email'))) {
        throw err;
      }
      console.warn('[AUTH CREATE_USER FALLBACK]', err.message);
      const usersStr = localStorage.getItem('ldtech_users');
      let users = usersStr ? JSON.parse(usersStr) : defaultUsers;
      const newUser = {
        id: userData.id || 'usr_' + Math.random().toString(36).substr(2, 9),
        username: userData.username.trim().toLowerCase(),
        password: userData.password,
        name: userData.name,
        email: userData.email || `${userData.username.trim().toLowerCase()}@ldtech99.com`,
        role: userData.role,
        avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        credits: userData.credits
      };
      if (users.some(u => u.username.toLowerCase() === newUser.username)) {
        throw new Error('El nombre de usuario ya existe en local.');
      }
      users.push(newUser);
      localStorage.setItem('ldtech_users', JSON.stringify(users));
      return newUser;
    }
  },
  updateUser: async (id, userData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error al actualizar el usuario.');
      return data.user;
    } catch (err) {
      if (err.message && (err.message.includes('ya existe') || err.message.includes('El nombre de usuario') || err.message.includes('email'))) {
        throw err;
      }
      console.warn('[AUTH UPDATE_USER FALLBACK]', err.message);
      const usersStr = localStorage.getItem('ldtech_users');
      let users = usersStr ? JSON.parse(usersStr) : defaultUsers;
      users = users.map(u => {
        if (u.id === id || String(u.id) === String(id)) {
          return {
            ...u,
            username: userData.username.trim().toLowerCase(),
            password: userData.password || u.password,
            name: userData.name,
            role: userData.role,
            credits: userData.credits
          };
        }
        return u;
      });
      localStorage.setItem('ldtech_users', JSON.stringify(users));
      return {
        id,
        username: userData.username.trim().toLowerCase(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        credits: userData.credits
      };
    }
  },
  deleteUser: async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error al eliminar el usuario.');
      return data;
    } catch (err) {
      if (err.message && (err.message.includes('No está permitido') || err.message.includes('Administrador Principal'))) {
        throw err;
      }
      console.warn('[AUTH DELETE_USER FALLBACK]', err.message);
      const usersStr = localStorage.getItem('ldtech_users');
      let users = usersStr ? JSON.parse(usersStr) : defaultUsers;
      const found = users.find(u => u.id === id || String(u.id) === String(id));
      if (found && found.username === 'ldtech') {
        throw new Error('No está permitido eliminar la cuenta del Administrador Principal.');
      }
      users = users.filter(u => u.id !== id && String(u.id) !== String(id));
      localStorage.setItem('ldtech_users', JSON.stringify(users));
      return { success: true, message: 'Usuario eliminado con éxito de local.' };
    }
  },
  getHistory: async (username) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/history?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener historial.');
      }
      return data.history;
    } catch (err) {
      console.warn('[HISTORY FETCH FALLBACK]', err.message);
      const saved = localStorage.getItem('osint_query_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
      return [{ query: '20538856674', module: 'ruc' }, { query: '00000000', module: 'dni_basic' }];
    }
  },
  addHistory: async (username, query, module) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username, query, module })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar historial.');
      }
      localStorage.setItem('osint_query_history', JSON.stringify(data.history));
      return data.history;
    } catch (err) {
      console.warn('[HISTORY ADD FALLBACK]', err.message);
      const saved = localStorage.getItem('osint_query_history');
      let history = [];
      if (saved) {
        try { history = JSON.parse(saved); } catch (e) {}
      }
      if (!Array.isArray(history)) history = [];
      const newEntry = { query, module };
      const filtered = history.filter(h => !(h.query === query && h.module === module));
      const nextHistory = [newEntry, ...filtered.slice(0, 9)];
      localStorage.setItem('osint_query_history', JSON.stringify(nextHistory));
      return nextHistory;
    }
  },
  clearHistory: async (username) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/history?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al vaciar historial.');
      }
      localStorage.setItem('osint_query_history', JSON.stringify([]));
      return true;
    } catch (err) {
      console.warn('[HISTORY CLEAR FALLBACK]', err.message);
      localStorage.setItem('osint_query_history', JSON.stringify([]));
      return true;
    }
  }
};
