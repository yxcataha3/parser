import { Logger } from '@nestjs/common';
import { Hears, Wizard, WizardStep } from 'nestjs-telegraf';
import { HearsTranslate } from 'src/core/decorators/HearsTranslate.decorator';
import { ISceneBase, ISceneContext, IWizardContext } from 'src/core/telegram.interface';
import { TelegramService } from 'src/core/telegram.service';
import { UserbotService } from 'src/userbot/userbot.service';
import { Api, client } from 'telegram';
import { BotScene } from '../bot.interface';

interface InitialState extends ISceneBase {}
export interface EditProfileState extends InitialState {
    phone?: string;
    phoneCodeHash?: string;
    code?: string;
}

enum ConnectUserbotSteps {
    ENTER,
    PHONE,
    HANDLE_PHONE,
    CODE,
    HANDLE_CODE,
    SAVE,
}

@Wizard(BotScene.CONNECT_USERBOT)
export class ConnectUserbotScene {
    private readonly logger = new Logger(ConnectUserbotScene.name);
    constructor(
        private readonly userbotService: UserbotService,
    ) {}

    async enter(ctx: ISceneContext<InitialState>, state: InitialState) {
        await ctx.scene.enter(BotScene.CONNECT_USERBOT, {
            prev: ctx.scene.current.id,
        });
    }

    @WizardStep(ConnectUserbotSteps.ENTER)
    async sceneEnter(ctx: IWizardContext<EditProfileState>) {
        await TelegramService.wizardNextStep(ctx, true);
    }

    @WizardStep(ConnectUserbotSteps.PHONE)
    async name(ctx: IWizardContext<EditProfileState>) {
        const text = ctx.t('bot.message.enterPhone');
        await ctx.reply(text, {
            reply_markup: {
                remove_keyboard: true
            }
        });
        await TelegramService.wizardNextStep(ctx, false);
    }
    
    @WizardStep(ConnectUserbotSteps.HANDLE_PHONE)
    @Hears(/^\+\d+/i)
    async handlePhone(ctx: IWizardContext<EditProfileState>) {
        const state = ctx.scene.session.state;
        const message = ctx.message;
        if (!TelegramService.isTextMessage(message)) {
            await TelegramService.wizardBackStep(ctx, true);
            return;
        }
        state.phone = message.text;

        try {
            const res = await this.userbotService.sendCode(this.userbotService.client, state.phone);
            state.phoneCodeHash = res.phoneCodeHash;
        } catch (e) {
            await ctx.reply(JSON.stringify(e));
            return;
        }
        
        await TelegramService.wizardNextStep(ctx, true);
    }

    @WizardStep(ConnectUserbotSteps.CODE)
    async gender(ctx: IWizardContext<EditProfileState>) {
        await ctx.reply(ctx.t('bot.message.enterCode'), {
            reply_markup: {
                keyboard: [[
                    {
                        text: ctx.t('bot.button.cancel')
                    },
                ]],
                resize_keyboard: true,
            }
        });
        await TelegramService.wizardNextStep(ctx, false);
    }
    
    @WizardStep(ConnectUserbotSteps.HANDLE_CODE)
    @Hears(/^\d+/i)
    async handleGender(ctx: IWizardContext<EditProfileState>) {
        const state = ctx.scene.session.state;
        const message = ctx.message;
        if (!TelegramService.isTextMessage(message)) {
            await TelegramService.wizardBackStep(ctx, true);
            return;
        }
        state.code = message.text;
        await TelegramService.wizardNextStep(ctx, true);
    }

    @WizardStep(ConnectUserbotSteps.SAVE)
    async save(ctx: IWizardContext<EditProfileState>) {
        const state = ctx.scene.session.state;
        const { phone, code, phoneCodeHash } = state;
        await this.userbotService.signIn(this.userbotService.client, phone, code, phoneCodeHash).catch(async (e) => {
            await ctx.reply(JSON.stringify(e));
            ctx.wizard.selectStep(ConnectUserbotSteps.ENTER);
            const wizard = ctx.wizard as any;
            await wizard.steps[ConnectUserbotSteps.ENTER](ctx)
        });
        const me = await this.userbotService.client.getMe();
        if (me instanceof Api.User) {
            await this.userbotService.createUserbot({
                id: me.id.valueOf(),
                first_name: me.firstName,
                last_name: me.lastName,
                session: this.userbotService.client.session.save() as any,
                username: me.username,
            })
        }
        await ctx.scene.enter(ctx.scene.session.state.prev ?? BotScene.MAIN);
    }

}

