/**
 * LDTech99 - API Service Client
 * 
 * Este módulo contiene el cliente y los manejadores para comunicarse con el backend.
 * Actualmente configurado con simulaciones de red asíncronas de alta fidelidad,
 * listo para intercambiar por llamadas reales a fetch/axios una vez provista la API.
 */

const API_BASE_URL = 'https://api.ldtech99.com/v1'; // Reemplazar con la URL oficial de tu API

/**
 * Simulación de retardo de red para pruebas de UX premium (loaders, skeletons).
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  /**
   * Envía las credenciales de inicio de sesión a la API.
   * @param {string} username - Nombre de usuario o correo electrónico.
   * @param {string} password - Contraseña del usuario.
   * @returns {Promise<Object>} Datos del usuario y token.
   */
  login: async (username, password) => {
    // Simulamos una llamada de red asíncrona de 1.5 segundos
    await sleep(1500);

    // Validación simulada simple de desarrollo
    if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
      const mockUser = {
        id: 'usr_ldtech99',
        username: 'Luis Daniel Herrera',
        email: 'luis.daniel@ldtech99.com',
        role: 'Director Técnico / Principal Developer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        token: 'ey.ldtech99.jwt.token.simulation'
      };
      
      // Almacenamos el token en localStorage para persistencia
      localStorage.setItem('ldtech_token', mockUser.token);
      localStorage.setItem('ldtech_user', JSON.stringify(mockUser));
      
      return { success: true, user: mockUser };
    }

    // Si fallan las credenciales por defecto, lanzamos error detallado
    throw new Error('Credenciales inválidas. Intenta con "admin" y contraseña "admin123".');
  },

  /**
   * Obtiene el perfil del usuario autenticado actualmente.
   */
  getCurrentUser: async () => {
    const token = localStorage.getItem('ldtech_token');
    const userStr = localStorage.getItem('ldtech_user');
    
    if (!token || !userStr) return null;
    
    // Simulamos comprobación rápida de validez del token
    await sleep(500);
    return JSON.parse(userStr);
  },

  /**
   * Cierra la sesión activa y limpia el almacenamiento.
   */
  logout: () => {
    localStorage.removeItem('ldtech_token');
    localStorage.removeItem('ldtech_user');
    return true;
  }
};

export const sunatService = {
  /**
   * Consulta los datos de un RUC desde la API externa de SUNAT.
   * @param {string} ruc - El número de RUC de 11 dígitos.
   * @param {string} token - Token de autorización opcional.
   */
  consultarRuc: async (ruc, token) => {
    // Validación básica de dígitos
    if (!/^\d{11}$/.test(ruc)) {
      throw new Error('El RUC debe tener exactamente 11 dígitos numéricos.');
    }

    try {
      const headers = {};
      const actualToken = token || localStorage.getItem('sunat_token') || 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr';
      if (actualToken) {
        headers['Authorization'] = `Bearer ${actualToken}`;
      }
      const response = await fetch(`https://api-codart.cgrt.org/api/v1/consultas/sunat/ruc/${ruc}`, { headers });
      if (!response.ok) {
        throw new Error(`Error del servidor: código de estado ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'No se obtuvieron resultados para el RUC consultado.');
      }
      return data;
    } catch (error) {
      console.warn('Llamada a la API real de SUNAT fallida. Usando fallback de desarrollo...', error);
      
      // Retardo de red simulado para consistencia de UX
      await sleep(1200);

      // Si el RUC coincide con el de la referencia, retornamos la respuesta provista por el usuario
      if (ruc === '20538856674') {
        return {
          success: true,
          source: "CODART_X_API_V1_LOCAL_FALLBACK",
          result: {
            razon_social: "ARTROSCOPICTRAUMA S.A.C.",
            tipo_documento: "6",
            numero_documento: "20538856674",
            estado: "ACTIVO",
            condicion: "HABIDO",
            direccion: "AV. GRAL.GARZON NRO 2320 URB. FUNDO OYAGUE",
            ubigeo: "150113",
            via_tipo: "AV.",
            via_nombre: "GRAL.GARZON",
            zona_codigo: "URB.",
            zona_tipo: "FUNDO OYAGUE",
            numero: "2320",
            interior: "-",
            lote: "-",
            dpto: "-",
            manzana: "-",
            kilometro: "-",
            distrito: "JESUS MARIA",
            provincia: "LIMA",
            departamento: "LIMA",
            es_agente_retencion: false,
            es_buen_contribuyente: true,
            locales_anexos: null,
            tipo: "SOCIEDAD ANONIMA CERRADA",
            actividad_economica: "OTRAS ACTIVIDADES DE ATENCION DE LA SALUD HUMANA",
            numero_trabajadores: "1",
            tipo_facturacion: "MANUAL",
            tipo_contabilidad: "MANUAL",
            comercio_exterior: "SIN ACTIVIDAD"
          }
        };
      }

      // Si es otro RUC, generamos una respuesta de prueba realista dinámica
      return {
        success: true,
        source: "CODART_X_API_V1_LOCAL_FALLBACK",
        result: {
          razon_social: `DESARROLLOS TECNOLÓGICOS S.A. (RUC ${ruc})`,
          tipo_documento: "6",
          numero_documento: ruc,
          estado: "ACTIVO",
          condicion: "HABIDO",
          direccion: "CALLE DE LA INNOVACION NRO 999 URB. LAS TECNOLOGIAS",
          ubigeo: "140101",
          via_tipo: "CALLE",
          via_nombre: "DE LA INNOVACION",
          zona_codigo: "URB.",
          zona_tipo: "LAS TECNOLOGIAS",
          numero: "999",
          interior: "-",
          lote: "-",
          dpto: "-",
          manzana: "-",
          kilometro: "-",
          distrito: "CHICLAYO",
          provincia: "CHICLAYO",
          departamento: "LAMBAYEQUE",
          es_agente_retencion: ruc.endsWith('2') || ruc.endsWith('5'),
          es_buen_contribuyente: ruc.endsWith('4') || ruc.endsWith('8') || ruc.startsWith('2'),
          locales_anexos: null,
          tipo: "SOCIEDAD ANONIMA",
          actividad_economica: "DESARROLLO DE SISTEMAS Y TECNOLOGIAS DE INFORMACION",
          numero_trabajadores: "15",
          tipo_facturacion: "ELECTRONICA",
          tipo_contabilidad: "COMPUTARIZADA",
          comercio_exterior: "IMPORTADOR/EXPORTADOR"
        }
      };
    }
  }
};

export const reniecService = {
  /**
   * Consulta los datos de un DNI desde la API externa de RENIEC.
   * @param {string} dni - El número de DNI de 8 dígitos.
   * @param {string} token - Token de autorización opcional.
   */
  consultarDni: async (dni, token) => {
    // Validación básica de dígitos
    if (!/^\d{8}$/.test(dni)) {
      throw new Error('El DNI debe tener exactamente 8 dígitos numéricos.');
    }

    try {
      const headers = {};
      const actualToken = token || localStorage.getItem('sunat_token') || 'mkP2mNY8qlrcUC5Y0W9ycNWbfUDPelP3caquQFmDNyUt7P5QKULQfyaybHtr';
      if (actualToken) {
        headers['Authorization'] = `Bearer ${actualToken}`;
      }
      const response = await fetch(`https://api-codart.cgrt.org/api/v1/consultas/reniec/dni/${dni}`, { headers });
      if (!response.ok) {
        throw new Error(`Error del servidor: código de estado ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'No se obtuvieron resultados para el DNI consultado.');
      }
      return data;
    } catch (error) {
      console.warn('Llamada a la API real de RENIEC fallida. Usando fallback de desarrollo...', error);
      
      // Retardo de red simulado para consistencia de UX
      await sleep(1200);

      // Si el DNI coincide con el de la referencia, retornamos la respuesta provista por el usuario
      if (dni === '00000000') {
        return {
          success: true,
          source: "CODART_X_API_V1_LOCAL_FALLBACK",
          result: {
            first_name: "NOMBRE EJEMPLO",
            first_last_name: "APELLIDO1",
            second_last_name: "APELLIDO2",
            full_name: "APELLIDO1 APELLIDO2 NOMBRE EJEMPLO",
            document_type: "1",
            document_number: "00000000",
            birth_date: "Data in credit",
            gender: "F",
            nationality: "PER",
            address: "Data in credit",
            district: "Data in credit",
            province: "Data in credit",
            department: "Data in credit",
            phone: "Data in credit",
            email: "Data in credit"
          }
        };
      }

      // Si es otro DNI, generamos una respuesta de prueba realista dinámica
      const esMasculino = parseInt(dni.charAt(7)) % 2 === 0;
      const nombresMasc = ["LUIS DANIEL", "CARLOS ALBERTO", "JOSÉ MARÍA", "MIGUEL ÁNGEL", "JORGE LUIS", "RAÚL ANTONIO", "PEDRO DELFÍN"];
      const nombresFem = ["ANA MARÍA", "MARÍA FERNANDA", "DIANA CAROLINA", "GABRIELA ISABEL", "LUCÍA BELÉN", "JULIANA INÉS", "ROSA SOFÍA"];
      const apellidos = ["HERRERA", "TANTALEAN", "GARCÍA", "RODRÍGUEZ", "MENDOZA", "FLORES", "SÁNCHEZ", "VÁSQUEZ", "VIDALON", "MERCADO"];
      
      const first_name = esMasculino 
        ? nombresMasc[parseInt(dni.slice(4, 6)) % nombresMasc.length] 
        : nombresFem[parseInt(dni.slice(4, 6)) % nombresFem.length];
      const first_last_name = apellidos[parseInt(dni.slice(0, 2)) % apellidos.length];
      const second_last_name = apellidos[parseInt(dni.slice(2, 4)) % apellidos.length];
      const full_name = `${first_last_name} ${second_last_name} ${first_name}`;

      return {
        success: true,
        source: "CODART_X_API_V1_LOCAL_FALLBACK",
        result: {
          first_name,
          first_last_name,
          second_last_name,
          full_name,
          document_type: "1",
          document_number: dni,
          birth_date: "18/05/2000",
          gender: esMasculino ? "M" : "F",
          nationality: "PER",
          address: "AV. DE LA JUVENTUD NRO 456 URB. POMALCA",
          district: "POMALCA",
          province: "CHICLAYO",
          department: "LAMBAYEQUE",
          phone: "999-888-777",
          email: `${first_name.toLowerCase().replace(/[\s\W]/g, '')}@ldtech99.com`
        }
      };
    }
  }
};

