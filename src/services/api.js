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
