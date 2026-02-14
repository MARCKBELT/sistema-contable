export interface User {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: 'super_admin' | 'admin' | 'contador' | 'auditor' | 'usuario';
  cargo?: string;
  empresa: {
    id: string;
    nombre: string;
    nit: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}
