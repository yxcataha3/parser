import { Logger } from '@nestjs/common';
import { Scene, SceneEnter } from 'nestjs-telegraf';
import { HearsTranslate } from 'src/core/decorators/HearsTranslate.decorator';
import { ISceneBase, ISceneContext } from 'src/core/telegram.interface';
import { CONFIRM_SCENE } from '../telegram.constants';

interface InitialState extends ISceneBase {
    yesScene: string;
    yesState?: any;
    text?: string;
    cb?: (...args: any) => unknown;
}
interface ConfirmState extends InitialState {
    prev?: string;
    prevState?: any;
}

@Scene(CONFIRM_SCENE)
export class ConfirmScene {
    private readonly logger = new Logger(ConfirmScene.name);
    constructor() {}

    async enter(ctx: ISceneContext, initialState: InitialState) {
        await ctx.scene.enter(CONFIRM_SCENE, {
            prevState: ctx.scene.session.state, 
            prev: ctx.scene.current.id, 
            ...initialState,
        });
    }

    @SceneEnter()
    async sceneEnter(ctx: ISceneContext<ConfirmState>) {
        const state = ctx.scene.session.state;
        const user = ctx.user;

        const text = state.text ?? ctx.t('core.message.confirm', {lang: user.lang});
        await ctx.reply(text, {
            reply_markup: {
                keyboard: [
                    [
                        { text: ctx.t('core.button.yes')},
                        { text: ctx.t('core.button.no')}
                    ],
                    [
                        { text: ctx.t('core.button.cancel')}
                    ],
                ],
                resize_keyboard: true,
            },
        });
    }

    @HearsTranslate('core.button.yes')
    async cancel(ctx: ISceneContext<ConfirmState>) {
        const { yesScene, yesState = {} } = ctx.scene.session.state;

        await ctx.scene.enter(yesScene, { ...yesState });
    }

    @HearsTranslate(['core.button.no', 'core.button.cancel'])
    async receiveCheckYes(ctx: ISceneContext<ConfirmState>) {
        const { scene, user } = ctx;
        const state = scene.session.state;
        await ctx.scene.enter(state.prev, state.prevState);
    }

}
