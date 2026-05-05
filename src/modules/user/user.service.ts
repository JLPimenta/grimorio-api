import {
    ConflictException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {UserRepository} from './user.repository';
import {UpdateUserDto} from './dto/update-user.dto';
import {ChangePasswordDto} from './dto/change-password.dto';
import {UserRecord} from '../../database/schema';
import {CharacterService} from "../character/character.service";

const SALT_ROUNDS = 12;

@Injectable()
export class UserService {
    constructor(
        private readonly repo: UserRepository,
        @Inject(forwardRef(() => CharacterService))
        private readonly characterService: CharacterService) {
    }

    toPublic(user: UserRecord) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified,
            preferences: user.preferences,
            createdAt: user.createdAt,
        };
    }

    async findById(id: string): Promise<UserRecord> {
        const user = await this.repo.findById(id);
        if (!user) throw new NotFoundException('Usuário não encontrado');
        return user;
    }

    async findByEmail(email: string): Promise<UserRecord | null> {
        return this.repo.findByEmail(email);
    }

    async findByGoogleId(googleId: string): Promise<UserRecord | null> {
        return this.repo.findByGoogleId(googleId);
    }

    async emailExists(email: string): Promise<boolean> {
        const user = await this.repo.findByEmail(email);
        return !!user;
    }

    async createWithPassword(name: string, email: string, password: string, emailConfirmToken: string): Promise<UserRecord> {
        const exists = await this.emailExists(email);
        if (exists) throw new ConflictException('Este email já está em uso');

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        return this.repo.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
            emailVerified: false,
            emailConfirmToken,
        });
    }

    async createWithGoogle(name: string, email: string, googleId: string, avatarUrl?: string): Promise<UserRecord> {
        return this.repo.create({
            name,
            email: email.toLowerCase(),
            googleId,
            avatarUrl,
            emailVerified: true,    // Google já verificou o email
        });
    }

    async validatePassword(user: UserRecord, password: string): Promise<boolean> {
        if (!user.passwordHash) return false;
        return bcrypt.compare(password, user.passwordHash);
    }

    async updateProfile(id: string, dto: UpdateUserDto): Promise<UserRecord> {
        await this.findById(id);
        return this.repo.update(id, dto);
    }

    async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
        const user = await this.findById(id);

        const valid = await this.validatePassword(user, dto.currentPassword);
        if (!valid) throw new UnauthorizedException('Senha atual incorreta');

        const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
        await this.repo.update(id, {passwordHash});
    }

    async updatePreferences(id: string, dto: any): Promise<UserRecord> {
        const user = await this.findById(id);

        const currentPreferences = typeof user.preferences === 'object' && user.preferences !== null
            ? user.preferences
            : {};

        const updatedPreferences = { ...currentPreferences };
        for (const [key, value] of Object.entries(dto)) {
            if (value !== undefined) {
                updatedPreferences[key] = value;
            }
        }

        return this.repo.update(id, { preferences: updatedPreferences });
    }

    async confirmEmail(token: string): Promise<void> {
        const user = await this.repo.findByEmailConfirmToken(token);
        if (!user) throw new NotFoundException('Token inválido ou expirado');

        await this.repo.update(user.id, {
            emailVerified: true,
            emailConfirmToken: null,
        });
    }

    async updateEmailConfirmToken(id: string, token: string): Promise<void> {
        await this.repo.update(id, {
            emailConfirmToken: token,
        });
    }

    async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<UserRecord | null> {
        const user = await this.repo.findByEmail(email);
        if (!user) return null;   // Não revela se email existe

        await this.repo.update(user.id, {
            passwordResetToken: token,
            passwordResetExpiry: expiry,
        });

        return user;
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const user = await this.repo.findByPasswordResetToken(token);

        if (!user) {
            throw new NotFoundException('Token inválido ou expirado');
        }

        if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
            throw new UnauthorizedException('Token expirado');
        }

        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await this.repo.update(user.id, {
            passwordHash,
            passwordResetToken: null,
            passwordResetExpiry: null,
        });
    }

    async deleteAccount(id: string): Promise<void> {
        await Promise.all([
            this.findById(id),
            this.characterService.removeAllByUser(id),
            this.repo.delete(id)
        ])
    }

    async linkGoogleAccount(id: string, googleId: string, avatarUrl?: string): Promise<UserRecord> {
        return this.repo.update(id, {googleId, avatarUrl});
    }
}