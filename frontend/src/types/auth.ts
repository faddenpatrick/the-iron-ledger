export interface User {
  id: string;
  email: string;
  is_admin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  registration_code?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
