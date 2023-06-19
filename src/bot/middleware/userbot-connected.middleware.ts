import { Injectable } from '@nestjs/common';
import { IContext } from 'src/core/telegram.interface';
import { UserbotService } from 'src/userbot/userbot.service';
import { SceneSession } from 'telegraf/typings/scenes';
import { Middleware } from 'telegraf';
import { BotScene } from '../bot.interface';

@Injectable()
export class ConnectUserbotMiddleware {
    constructor (
        private readonly userbotService: UserbotService,
    ) {}

    middleware(): Middleware<IContext> {
        return async (ctx: IContext, next: () => Promise<void>) => {
            const { user } = ctx;
            const session = user.session as SceneSession;
            const state = {
                prev: session?.__scenes?.current,
            };
            const message = ctx.message;
            if (!!message && 'text' in message && message.text.match(/\/start.*/i)) {
                return next();
            }
            const client = this.userbotService.client;
            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized && session?.__scenes?.current !== BotScene.CONNECT_USERBOT) {
                session.__scenes = { current: BotScene.CONNECT_USERBOT, ...state };
            }
            return next();
        }
    }
}
