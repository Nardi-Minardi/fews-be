import { UserRole } from '../auth/interface/auth.interface';
import * as bcrypt from 'bcrypt';

// Hash password untuk dummy data
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Internal storage model (camelCase)
export interface StoredUser {
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  jabatan: string;
  role: UserRole;
  instansi: string;
  wilayahKerja?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

// Dummy users data - password akan di-hash saat runtime
export const USERS_DATA: Omit<StoredUser, 'password'>[] = [
  // Admin Users
  {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@fews.go.id',
    fullName: 'Administrator FEWS',
    jabatan: 'Administrator Sistem',
    role: UserRole.ADMIN,
    instansi: 'BMKG Pusat',
    wilayahKerja: ['all'], // Admin bisa akses semua wilayah
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-01'),
    lastLogin: new Date('2024-11-02T07:00:00Z')
  },
  {
    id: 'admin-002', 
    username: 'superadmin',
    email: 'superadmin@fews.go.id',
    fullName: 'Super Administrator',
    jabatan: 'Kepala Divisi IT',
    role: UserRole.ADMIN,
    instansi: 'BMKG Pusat',
    wilayahKerja: ['all'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-11-01'),
    lastLogin: new Date('2024-11-01T15:30:00Z')
  },

  // Operator Users
  {
    id: 'operator-001',
    username: 'operator_jabar',
    email: 'operator.jabar@fews.go.id', 
    fullName: 'Operator FEWS Jawa Barat',
    jabatan: 'Operator Monitoring',
    role: UserRole.OPERATOR,
    instansi: 'BMKG Jawa Barat',
    wilayahKerja: ['jabar', 'bandung', 'bogor', 'bekasi'], // Operator khusus wilayah Jabar
    isActive: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-11-01'),
    lastLogin: new Date('2024-11-02T08:15:00Z')
  },

  // Regular Users
  {
    id: 'user-001',
    username: 'user_bandung',
    email: 'user.bandung@fews.go.id',
    fullName: 'Analis Data Pemkot Bandung',
    jabatan: 'Analis Data',
    role: UserRole.USER,
    instansi: 'Pemkot Bandung - Dinas Lingkungan Hidup',
    wilayahKerja: ['bandung'], // User hanya bisa akses wilayah kerjanya
    isActive: true,
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-11-01'),
    lastLogin: new Date('2024-11-02T07:30:00Z')
  },
  {
    id: 'user-002',
    username: 'user_bpbd',
    email: 'user.bpbd@fews.go.id',
    fullName: 'Staff BPBD Jawa Barat',
    jabatan: 'Staff Mitigasi Bencana',
    role: UserRole.USER,
    instansi: 'BPBD Provinsi Jawa Barat',
    wilayahKerja: ['jabar', 'bandung', 'bogor', 'bekasi'],
    isActive: true,
    createdAt: new Date('2024-05-05'),
    updatedAt: new Date('2024-11-01'),
    lastLogin: new Date('2024-11-01T16:45:00Z')
  },
];

// Function to get user with hashed password
export const getUsersWithHashedPasswords = async (): Promise<StoredUser[]> => {
  const defaultPasswords = {
    [UserRole.ADMIN]: 'admin123',
    [UserRole.OPERATOR]: 'operator123', 
    [UserRole.USER]: 'user123'
  };

  const usersWithPasswords = await Promise.all(
    USERS_DATA.map(async (user) => ({
      ...user,
      password: await hashPassword(defaultPasswords[user.role])
    }))
  );

  return usersWithPasswords;
};

// In-memory user store (in production, this would be a database)
export class UserRepository {
  private static users: StoredUser[] = [];
  
  static async initialize() {
    if (this.users.length === 0) {
      this.users = await getUsersWithHashedPasswords();
    }
  }

  static async findByUsername(email: string): Promise<StoredUser | null> {
    await this.initialize();
    return this.users.find(user => user.email === email && user.isActive) || null;
  }

  static async findByEmail(email: string): Promise<StoredUser | null> {
    await this.initialize();
    return this.users.find(user => user.email === email && user.isActive) || null;
  }

  static async findById(id: string): Promise<StoredUser | null> {
    await this.initialize();
    return this.users.find(user => user.id === id && user.isActive) || null;
  }

  static async findAll(): Promise<StoredUser[]> {
    await this.initialize();
    return this.users.filter(user => user.isActive);
  }

  static async updateLastLogin(userId: string): Promise<void> {
    await this.initialize();
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.lastLogin = new Date();
      user.updatedAt = new Date();
    }
  }

  static async createUser(userData: Omit<StoredUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredUser> {
    await this.initialize();
    const newUser: StoredUser = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
}

// Helper function untuk mendapatkan user berdasarkan role
export const getUsersByRole = async (role: UserRole): Promise<StoredUser[]> => {
  await UserRepository.initialize();
  const users = await UserRepository.findAll();
  return users.filter(user => user.role === role);
};

// Helper function untuk mengecek akses wilayah
export const canAccessArea = (user: StoredUser, areaId: string): boolean => {
  if (!user.wilayahKerja || user.wilayahKerja.includes('all')) {
    return true; // Admin atau user dengan akses semua wilayah
  }
  return user.wilayahKerja.includes(areaId);
};
