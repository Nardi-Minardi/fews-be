import { Injectable, HttpException, Inject } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { CmsUserRepository } from './user.repository';
import { User, UserRole } from 'src/auth/interface/auth.interface';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as bcrypt from 'bcrypt';
import { CmsUserValidation } from './user.validation';

// Public user DTO without sensitive fields
type PublicUser = Omit<User, 'password'>;

@Injectable()
export class CmsUserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private readonly validationService: ValidationService,
    private readonly cmsUserRepository: CmsUserRepository,
  ) {}

  async getUsers(request: {
    role_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<{ data: PublicUser[]; total: number }> {
    this.logger.info('Request get users with params', { request });

    // Ambil data user
    const users = await this.cmsUserRepository.findAllUser({
      role_id: request.role_id,
      search: request.search,
      limit: request.limit,
      offset: request.offset,
      orderBy: request.orderBy,
      orderDirection: request.orderDirection,
    });

    // Hitung total user
    const total = await this.cmsUserRepository.countAllUser({
      role_id: request.role_id,
      search: request.search,
    });

    // Mapping user supaya password tidak ikut
    const mappedUsers: PublicUser[] = users.map((raw: any) => {
      const { password, m_jabatan, m_roles, ...rest } = raw;

      return {
        ...rest,
        jabatan: (rest as any).jabatan ?? m_jabatan?.name ?? '',
        role: (rest.role ?? m_roles?.name) as UserRole,
      };
    });

    return {
      data: mappedUsers,
      total: total ?? 0,
    };
  }

  async createUser(request: any & {}): Promise<any> {
    this.logger.info('Request create user', {
      username: request.username,
      email: request.email,
    });

    // Validate input
    const createRequest = this.validationService.validate(
      CmsUserValidation.createSchema,
      request,
    );

    // Check if username already exists
    const existingUsername = await this.cmsUserRepository.findByUsername(
      createRequest.username,
    );
    if (existingUsername) {
      throw new HttpException('Username already exists', 400);
    }

    // Check if email already exists
    const existingEmail = await this.cmsUserRepository.findByEmail(
      createRequest.email,
    );
    if (existingEmail) {
      throw new HttpException('Email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createRequest.password, 10);

    const createData = {
      email: createRequest.email,
      username: createRequest.username,
      password: hashedPassword,
      full_name: createRequest.full_name,
      role_id: createRequest.role_id,
      wilayah_kerja: createRequest.wilayah_kerja,
      instansi_id: createRequest.instansi_id,
      jabatan_id: createRequest.jabatan_id,
    };

    // Save user
    const newUser = await this.cmsUserRepository.saveUser({
      ...createData,
      password: hashedPassword,
    });

    // Map to public user
    const mappedUser: any = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      full_name: newUser.full_name ?? '',
      jabatan: newUser.m_jabatan?.name ?? '',
      role: newUser.m_roles?.name as UserRole,
      instansi_id: newUser.instansi_id,
      wilayah_kerja: newUser.wilayah_kerja,
      is_active: newUser.is_active ?? true,
      created_at: newUser.created_at ?? new Date(),
      updated_at: newUser.updated_at ?? new Date(),
    };
    return mappedUser;
  }

  async updateUser(id: number, request: any & {}): Promise<any> {
    this.logger.info('Request update user', {
      id,
      request,
    });
    const updateRequest = this.validationService.validate(
      CmsUserValidation.updateSchema,
      request,
    );

    const existingUser = await this.cmsUserRepository.findUserById(id);
    if (!existingUser) {
      throw new HttpException(`Module dengan id ${id} tidak ditemukan`, 404);
    }

    //cek jika nama diupdate, pastikan tidak ada user lain dengan username atau email yang sama
    if (
      updateRequest.username &&
      updateRequest.username !== existingUser.username
    ) {
      const userWithSameUsername = await this.cmsUserRepository.findByUsername(
        updateRequest.username,
      );
      if (userWithSameUsername) {
        throw new HttpException(
          `Username ${updateRequest.username} sudah digunakan oleh user lain`,
          400,
        );
      }
    }

    if (updateRequest.email && updateRequest.email !== existingUser.email) {
      const userWithSameEmail = await this.cmsUserRepository.findByEmail(
        updateRequest.email,
      );
      if (userWithSameEmail) {
        throw new HttpException(
          `Email ${updateRequest.email} sudah digunakan oleh user lain`,
          400,
        );
      }
    }

    const updatedData = {
      username: updateRequest.username ?? existingUser.username,
      email: updateRequest.email ?? existingUser.email,
      password: updateRequest.password
        ? await bcrypt.hash(updateRequest.password, 10)
        : existingUser.password,
      full_name: updateRequest.full_name ?? existingUser.full_name,
      role_id: updateRequest.role_id ?? existingUser.role_id,
      wilayah_kerja: updateRequest.wilayah_kerja ?? existingUser.wilayah_kerja,
      instansi_id: updateRequest.instansi_id ?? existingUser.instansi_id,
      jabatan_id: updateRequest.jabatan_id ?? existingUser.jabatan_id,
    };

    const result = await this.cmsUserRepository.updateUser(id, updatedData);

    const mappedUser: any = {
      id: result.id,
      username: result.username,
      email: result.email,
      full_name: result.full_name ?? '',
      jabatan: result.m_jabatan?.name ?? '',
      role: result.m_roles?.name as UserRole,
      instansi_id: result.instansi_id,
      wilayah_kerja: result.wilayah_kerja,
      is_active: result.is_active ?? true,
      created_at: result.created_at ?? new Date(),
      updated_at: result.updated_at ?? new Date(),
    };
    return mappedUser;
  }

  //delete user
  async deleteUser(id: number): Promise<void> {
    this.logger.info('Request delete user', { id });
    const existingUser = await this.cmsUserRepository.findUserById(id);
    if (!existingUser) {
      throw new HttpException(`User dengan id ${id} tidak ditemukan`, 404);
    }
    const result = await this.cmsUserRepository.deleteUser(id);
    return result;
  }
}
