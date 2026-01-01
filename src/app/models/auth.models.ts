export interface RegisterRequest {
  // Organization data (maps to auth.organizations table)
  companyName: string;
  website: string; // Required field
  companySize: string; // Used to determine subscription type
  currency: string; // Organization currency code (e.g., USD, PKR, EUR) - required in backend
  
  // User data (maps to auth.users table)
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  organizationName: string;
  domain?: string;
  token: string;
  refreshToken: string;
  tokenExpiration: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

