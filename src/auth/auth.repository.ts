import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

export type CreateUserInput = {
	username: string;
	email: string;
	password: string;
	full_name?: string | null;
	jabatan?: string | null;
	role: 'SUPERADMIN' | 'ADMIN' | 'OPERATOR' | 'USER';
	instansi?: string | null;
	wilayah_kerja?: string[];
	is_active?: boolean | null;
};

@Injectable()
export class AuthRepository {
	constructor(private readonly prisma: PrismaService) {}

	findByEmail(email: string) {
		return this.prisma.m_users.findUnique({ where: { email } });
	}

	findByUsername(username: string) {
		return this.prisma.m_users.findFirst({ where: { username } });
	}

	findById(id: number) {
		return this.prisma.m_users.findFirst({ where: { id } });
	}

	async createUser(data: CreateUserInput) {
		return this.prisma.m_users.create({
			data: {
				username: data.username,
				email: data.email,
				password: data.password,
				full_name: data.full_name ?? null,
				jabatan: data.jabatan ?? null,
				role: data.role as any,
				instansi: data.instansi ?? null,
				wilayah_kerja: data.wilayah_kerja ?? [],
				is_active: data.is_active ?? true,
			},
		});
	}

	updateLastLogin(id: number) {
		return this.prisma.m_users.update({
			where: { id },
			data: { last_login: new Date() },
		});
	}

	findAllActive() {
		return this.prisma.m_users.findMany({
			where: { OR: [{ is_active: true }, { is_active: null }] },
		});
	}

	findByRoleActive(role: 'SUPERADMIN' | 'ADMIN' | 'OPERATOR' | 'USER') {
		return this.prisma.m_users.findMany({
			where: { role: role as any, OR: [{ is_active: true }, { is_active: null }] },
		});
	}
}

