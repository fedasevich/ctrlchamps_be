import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from 'src/common/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor (
        @InjectRepository(User)
        private readonly authRepository: Repository<User>,
    ) { }

    async getUsers(): Promise<User[]> {
        return this.authRepository.find({ select: [ 'id', 'name' ] });
    }

    async login(credentials: { name: string; password: string; }): Promise<string> {
        const { name, password } = credentials;
        const user = await this.authRepository.findOne({ where: { name } });

        if (!user || user.password != password) {
            throw new Error('Invalid credentials');
        }

        console.log(`Welcome, ${ user.name }!`);

        return 'jwt_token'; // Consider using a token generation library like jsonwebtoken or other suitable method
    }

    async register(newUser: { name: string; password: string, age: number; }): Promise<void> {
        const { name, password, age } = newUser;

        const existingUser = await this.authRepository.findOne({ where: { name } });

        if (existingUser) {
            throw new Error('Username already exists');
        }

        const user = this.authRepository.create({ name, password, age });

        console.log(`Created user ${ name }`);

        await this.authRepository.save(user);
    }
}
