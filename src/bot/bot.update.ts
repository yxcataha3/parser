import { InjectBot, Start, Update } from "nestjs-telegraf";
import { Context, Telegraf } from 'telegraf';
import { Logger } from "@nestjs/common";
import { ISceneContext } from "src/core/telegram.interface";
import { UserbotService } from "src/userbot/userbot.service";
import { BotScene } from "./bot.interface";

@Update()
export class BotUpdate {
    private logger = new Logger(BotUpdate.name);
    constructor (
        private readonly userbotService: UserbotService,
        @InjectBot() private readonly bot: Telegraf<Context>
    ) {
        this.bot.catch(async (e) => {
            this.logger.error(e);
            try {
                this.bot.stop()
            } catch (e) {
                this.logger.error(e);
            }
            await this.bot.launch().then(() => {
                this.logger.log('bot has been relaunched');
            });
        });
    }

    @Start()
    async startCommand(ctx: ISceneContext) {
        const client = this.userbotService.client;
        const isAuthorized = await client.checkAuthorization();
        if (!isAuthorized) {
            await ctx.scene.enter(BotScene.CONNECT_USERBOT);
            return;
        }
        await ctx.scene.enter(BotScene.MAIN)
    }

}