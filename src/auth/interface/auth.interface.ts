export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  USER = 'USER',
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  full_name: string;
  jabatan: string;
  role: UserRole;
  instansi_id: number | null;
  wilayah_kerja?: string[]; // Array of area IDs that user can access
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface JwtPayload {
  sub: number; // user id
  username: string;
  email: string;
  role: UserRole;
  jabatan: string;
  instansi_id: number | null;
  wilayah_kerja?: string[];
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: UserRole;
    jabatan: string;
    instansi_id: number | null;
    wilayah_kerja?: string[];
  };
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    dashboard: ['read', 'write', 'manage'],
    users: ['read', 'write', 'manage'],
    sensors: ['read', 'write', 'manage'],
    reports: ['read', 'write', 'manage'],
    system: ['read', 'write', 'manage'],
  },
  [UserRole.OPERATOR]: {
    dashboard: ['read', 'write'],
    users: ['read'],
    sensors: ['read', 'write'],
    reports: ['read', 'write'],
    system: ['read'],
  },
  [UserRole.USER]: {
    dashboard: ['read'],
    users: [],
    sensors: ['read'],
    reports: ['read'],
    system: [],
  },
};

export const hasPermission = (
  userRole: UserRole,
  resource: string,
  action: string,
): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole]?.[resource];
  return permissions ? permissions.includes(action) : false;
};
