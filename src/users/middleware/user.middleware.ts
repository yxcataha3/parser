import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { TelegramService } from 'src/core/telegram.service';
import { Context, Middleware } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { SceneContext } from 'telegraf/typings/scenes';
import { User } from '../entity/user.entity';
import { EMPTY_SESSION } from '../user.constants';
import { UpdateUserDto, UserService } from '../user.service';

@Injectable()
export class UserMiddleware {
    constructor(
        private readonly usersService: UserService,
    ) {}
    
    async getUser(id: number): Promise<User | null> {
        return await this.usersService.findOne(id);
    }

    async initUser(ctx: Context<Update>): Promise<User> {
        const id = TelegramService.getUserId(ctx);
        if (!id) {
            return;
        }
        let user = await this.getUser(id);
        const message = ctx.message as Message.TextMessage;
        if (!user) {
            user = await this.createUser(ctx);
        } else if (!user.started && message && message.text.match(/^\/start/i)) {
            user = await this.startUser(ctx as Context);
        }
        return user;
    }

    async createUser(ctx: Context): Promise<User> {
        const { from } = ctx;
        const message = ctx.message as Message.TextMessage;
        return await this.usersService.create({
            id: from.id,
            first_name: from.first_name, 
            last_name: from.last_name,
            username: from.username,
            start_deep_link: TelegramService.getDeepLink(ctx) || '',
            last_message_id: message?.message_id,
            started: !!message,
            start_date: !!message ? new Date() : null,
            last_activity_date: new Date(),
            lang: 'ru',
            session: EMPTY_SESSION,
        });
    }

    async startUser(ctx: Context): Promise<User> {
        const { from } = ctx;
        const message = ctx.message as Message.TextMessage;
        const update: UpdateUserDto = {
            id: from.id,
            first_name: from.first_name, 
            last_name: from.last_name,
            username: from.username,
            last_message_id: message?.message_id,
            started: true,
            start_date: new Date(),
            last_activity_date: new Date(),
            lang: 'ru',
            session: EMPTY_SESSION,
        }
        const deepLink = TelegramService.getDeepLink(ctx) || '';
        if (!!deepLink) {
            update.last_deep_link = deepLink;
        }
        return await this.usersService.update(update);
    }

    userMiddleware(): Middleware<SceneContext> {
        return async (ctx, next) => {
            const user: User = await this.initUser(ctx);
            let session = user.session ?? EMPTY_SESSION;
            // let session = EMPTY_SESSION;
            user.last_activity_date = new Date();

            Object.defineProperty(ctx, 'session', {
                get: function () { 
                    return session;
                },
                set: function (newValue) {
                    session = Object.assign({}, newValue);
                },
            });
            Object.defineProperty(ctx, 'user', {
                get: function () { 
                    return user;
                },
            });

            await next(); // wait all other middlewares

            await this.usersService.updateSession({
                id: user.id,
                session: ctx.session,
            });
        };
    }
}
