import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entity/user.entity';
import { SceneSession } from 'telegraf/typings/scenes';
import { FindManyOptions, In, IsNull, Like, MoreThan, Not, Repository, UpdateResult } from 'typeorm';

export class CreateUserDto {
    id: number;
    last_message_id: number;
    first_name: string;
    last_activity_date: Date;
    started: boolean;
    lang: string;
    last_name?: string;
    username?: string;
    start_deep_link?: string;
    last_deep_link?: string;
    session?: SceneSession;
    start_date?: Date;
}
export class UpdateUserDto {
    id: number;
    last_message_id?: number;
    last_activity_date?: Date;
    first_name?: string;
    last_name?: string;
    username?: string;
    lang?: string;
    last_deep_link?: string;
    last_inline_query?: string;
    started?: boolean;
    start_date?: Date;
    state?: string;
    session?: SceneSession;
    state_date?: Date | null;
}
export class UpdateSessionDto {
    id: number;
    session: SceneSession;
}
export interface IUserSource {
    start_deep_link: string,
    count: number
}
@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) {}

    async findOne(id: number): Promise<User> {
        return await this.userRepository.findOne({
            where: { id }
        });
    }

    async findMany(find: FindManyOptions<User>): Promise<any> {
        return await this.userRepository.find(find);
    }

    async getAll(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async count(find: FindManyOptions<User>): Promise<number> {
        return await this.userRepository.count(find);
    }

    async administratorsList(): Promise<User[]> {
        return await this.findMany({
            select: ['id'],
            where: {
                start_date: Not(IsNull()),
                // roles: UserRole.ADMIN,
            },
            order: {
                id: "ASC"
            }
        });
    }

    async create(user: CreateUserDto): Promise<User> {
        const check = await this.findOne(user.id);
        if (!!check) {
            throw new Error("This user already exist!");
        }
        const newUser = this.userRepository.create(user);

        await this.userRepository.save(newUser);

        newUser.parseSession();
        return newUser;
    }

    async update(updateUser: UpdateUserDto): Promise<User> {
        const { id, ...update } = updateUser;
        await this.userRepository.update({id}, update);
        return this.findOne(updateUser.id);
    }

    async updateSession(session: UpdateSessionDto): Promise<UpdateResult> {
        const { id, ...update } = session;
        return await this.userRepository.update({id}, {
            session: JSON.stringify(update.session)
        });
    }

    async deactivate(user: User): Promise<UpdateResult> {
        return await this.userRepository.update({id: user.id}, {started: false});
    }
}
