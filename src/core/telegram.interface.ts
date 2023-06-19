import { Context, Telegram } from "telegraf";
import { InlineKeyboardButton, KeyboardButton, Opts, ResponseParameters } from "telegraf/typings/core/types/typegram";
import { User } from "src/users/entity/user.entity";
import { I18nService, TranslateOptions } from "nestjs-i18n";
import { SceneContext, SceneSessionData, WizardContext, WizardSessionData } from "telegraf/typings/scenes";
import { TelegramService } from "./telegram.service";

export interface ErrorPayload {
    error_code: number;
    description: string;
    parameters?: ResponseParameters;
}
export interface TelegramResponseSuccess<T> {
    ok: true, 
    result: T
}
export interface TelegramResponseError extends ErrorPayload {
    ok: false, 
}
export type TelegramResponse<T> = TelegramResponseSuccess<T> | TelegramResponseError;

export interface ISceneBase {
    prev?: string;
}
export interface ISceneSessionData<T extends ISceneBase = ISceneBase> extends SceneSessionData {
    state: T;
}
export interface IWizzardSessionData<T extends ISceneBase = ISceneBase> extends WizardSessionData {
    state: T;
}
export class Ctx extends Context {
    user: User;
    session: ISceneSessionData | IWizzardSessionData;
    i18n: I18nService;
    t: (key: string, options?: TranslateOptions) => string;
}

export type ApiSendMessage = Pick<Telegram, 
    'sendAnimation'
    | 'sendAudio'
    | 'sendContact'
    | 'sendDice'
    | 'sendDocument'
    | 'sendMediaGroup'
    | 'sendMessage'
    | 'sendLocation'
    | 'sendPhoto'
    | 'sendPoll'
    | 'sendSticker'
    | 'sendVenue'
    | 'sendVideo'
    | 'sendVideoNote'
    | 'sendVoice'
    | 'sendGame'
>

export type Post<M extends keyof ApiSendMessage> = Omit<Opts<M>, 'chat_id'>

export type SavedPost = Awaited<ReturnType<typeof TelegramService["getMediaMessage"]>>;

export type IContext = Ctx;
export type ISceneContext<T extends ISceneBase = ISceneBase> = Ctx & SceneContext<ISceneSessionData<T>>;
export type IWizardContext<T extends ISceneBase = ISceneBase> = Ctx & WizardContext<IWizzardSessionData<T>>;

export interface IInlineButtonsSet {
    [key: string]: (...args: any) => InlineKeyboardButton | Promise<InlineKeyboardButton>
}
export interface IInlineButtonsStore {
    [key: string]: IInlineButtonsSet
}
export interface KeyboardButtonSet {
    [key: string]: (...args: any) => KeyboardButton | Promise<KeyboardButton>
}
export interface IKeyboardButtonsStore {
    [key: string]: KeyboardButtonSet | IKeyboardButtonsStore | ((...args: any) => KeyboardButton | Promise<KeyboardButton>);
}

export type Action = string;
export interface ICallbackData {
    action: Action,
    data?: any;
}