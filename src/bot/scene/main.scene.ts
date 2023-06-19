import { Logger } from '@nestjs/common';
import { Scene, SceneEnter } from 'nestjs-telegraf';
import { HearsTranslate } from 'src/core/decorators/HearsTranslate.decorator';
import { ISceneBase, ISceneContext } from 'src/core/telegram.interface';
import { UserbotService } from 'src/userbot/userbot.service';
import { BotScene } from '../bot.interface';
import { BotService } from '../bot.service';

interface InitialState extends ISceneBase {}

@Scene(BotScene.MAIN)
export class MainScene {
    private readonly logger = new Logger(MainScene.name);
    constructor (
        private readonly userbotService: UserbotService,
        private readonly botService: BotService,
    ) {}

    async enter(ctx: ISceneContext<InitialState>, state: InitialState) {
        await ctx.scene.enter(BotScene.CONNECT_USERBOT, {
            prev: ctx.scene.current.id,
        });
    }

    @SceneEnter()
    async sceneEnter(ctx: ISceneContext<InitialState>) {
        await ctx.reply(ctx.t('bot.message.start'), {
            reply_markup: {
                keyboard: [
                    [
                        {text: ctx.t('bot.button.addChannels')},
                        {text: ctx.t('bot.button.list')},
                    ],
                    [{
                        text: ctx.t('bot.button.disconnectUserbot')
                    }],
                ],
                resize_keyboard: true,
            }
        });
    }

    @HearsTranslate('bot.button.list')
    async list(ctx: ISceneContext) {
        const channels = await this.botService.getChannel();
        let text = channels.reduce((prev, cur) => {
            return prev += `${cur.link}\n`
        }, '')
        if (!text.length) {
            text = 'Список пуст';
        }
        await ctx.reply(text);
    }

    @HearsTranslate('bot.button.addChannels')
    async addChannel(ctx: ISceneContext) {
        await ctx.scene.enter(BotScene.ADD_CHANNELS);
    }

    @HearsTranslate('bot.button.disconnectUserbot')
    async disconnectUserbot(ctx: ISceneContext) {
        const res = await this.userbotService.logOut(this.userbotService.client); 
        await ctx.scene.enter(BotScene.CONNECT_USERBOT);
    }
}
