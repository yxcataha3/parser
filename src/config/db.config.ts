import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as sqlite3 from "sqlite3";
import { Channel } from "src/bot/entity/channel.entity";
import { Message } from "src/bot/entity/message.entity";
import { Userbot } from "src/userbot/entity/userbot.entity";
import { User } from "src/users/entity/user.entity";
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const getDbConfig = async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
    name: 'db',
    type: 'sqlite',
    driver: sqlite3,
    database: configService.get<string>('DATABASE'),
    entities: [User, Userbot, Channel, Message],
    synchronize: true,
    namingStrategy: new SnakeNamingStrategy(),
    logging: configService.get('NODE_ENV') === 'production' ? ['error', 'schema'] : ['error', 'schema'],
});
