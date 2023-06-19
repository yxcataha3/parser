import { Logger } from '@nestjs/common';
import { Hears, Scene, SceneEnter } from 'nestjs-telegraf';
import { HearsTranslate } from 'src/core/decorators/HearsTranslate.decorator';
import { ISceneBase, ISceneContext } from 'src/core/telegram.interface';
import { TelegramService } from 'src/core/telegram.service';
import { UserbotService } from 'src/userbot/userbot.service';
import { Api } from 'telegram';
import { BotScene } from '../bot.interface';
import { BotService } from '../bot.service';

interface InitialState extends ISceneBase {}

@Scene(BotScene.ADD_CHANNELS)
export class AddChannelScene {
    private readonly logger = new Logger(AddChannelScene.name);
    constructor (
        private readonly userbotService: UserbotService,
        private readonly botService: BotService,
    ) {}

    async enter(ctx: ISceneContext<InitialState>, state: InitialState) {
        await ctx.scene.enter(BotScene.ADD_CHANNELS, {
            prev: ctx.scene.current.id,
        });
    }

    @SceneEnter()
    async sceneEnter(ctx: ISceneContext<InitialState>) {
        await ctx.reply(ctx.t('bot.message.addChannels'), {
            reply_markup: {
                keyboard: [
                    [{
                        text: ctx.t('bot.button.cancel')
                    }],
                ],
                resize_keyboard: true,
            }
        });
    }

    @HearsTranslate('bot.button.cancel')
    async cancel(ctx: ISceneContext) {
        await ctx.scene.enter(BotScene.MAIN);
    }

    @Hears(/^(?!(\/start)).*/i)
    async addChannel(ctx: ISceneContext) {
        const { message, user } = ctx;
        if (!TelegramService.isTextMessage(message)) {
            return;
        }
        
        const links = await this.botService.parseText(message.text);
        if (!links.length) {
            ctx.reply('Ссылок не найдено');
            return;
        }
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            try {
                const channel = await this.userbotService.findChannelByLink(this.userbotService.client, link);
                let res;
                if (!!channel) {
                    res = await this.userbotService.joinToChannel(this.userbotService.client, {
                        id: channel.id,
                        accessHash: channel.accessHash,
                    });
                } else {
                    res = await this.userbotService.importChatInvite(this.userbotService.client, link);
                }
                if (res instanceof Api.Updates) {
                    const { chats } = res;
                    const chat = chats[0];
                    if (chat instanceof Api.Channel) {
                        await this.botService.createChannel({
                            id: chat.id,
                            access_hash: chat.accessHash,
                            title: chat.title,
                            username: chat.username,
                            link,
                        });
                    }
                }
                await ctx.reply(`${link} добавлен в очередь`)
            } catch (e) {
                this.logger.error(e);
                ctx.reply(`При добавлении ${link} произошла ошибка`)
            }
        }
        await ctx.scene.enter(BotScene.MAIN);
    }

}
