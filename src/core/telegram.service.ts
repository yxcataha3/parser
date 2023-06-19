import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf, TelegramError } from 'telegraf';
import { CommonMessageBundle, Message, MessageEntity, User } from 'telegraf/typings/core/types/typegram';
import { FAKE_UPDATE_ID, FAKE_UPDATE_MESSAGE_ID } from './telegram.constants';
import { ISceneContext, IWizardContext, Post, SavedPost } from './telegram.interface';

@Injectable()
export class TelegramService {
    private logger = new Logger(TelegramService.name);
    constructor(
        @InjectBot() private readonly bot: Telegraf<Context>
    ) {
        this.bot.catch(async (e) => {
            this.logger.error(e);
            this.bot.telegram.sendMessage(70116478, 'бот перезапущен!');
            try {
                this.bot.stop()
            } catch (e) {
                this.logger.error(e);
            }
            await this.bot.launch();
            this.logger.log('bot has been relaunched');
        });
    }

    async sendFakeMessageUpdate(user: Partial<User>, text: string) {
        const bot = this.bot as any;
        return await bot.__proto__.handleUpdate.call(bot, {
            "update_id": FAKE_UPDATE_ID,
            "message": {
                "message_id": FAKE_UPDATE_MESSAGE_ID,
                "from": {
                    "id": user.id,
                    "is_bot": false,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "username": user.username,
                    "language_code": user.language_code,
                },
                "chat": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "username": user.username,
                    "type": "private"
                },
                "date": (Date.now() / 1000).toFixed(0),
                "text": text,
            }
        });
    }
    
    static getUserId(ctx: Context): number { 
        let chat_id: number;
        if ('callback_query' in ctx.update) {
            const cb = ctx.update.callback_query;
            chat_id = cb.message?.chat.id ?? cb.from.id;
        } else if ('inline_query' in ctx.update){
            const iq = ctx.update.inline_query;
            chat_id = iq.from.id;
        } else if ('my_chat_member' in ctx.update) {
            return ctx.update.my_chat_member.from.id;
        }
        if (!ctx.from && !chat_id) {
            return null;
        }
        return chat_id ?? ctx.from.id;
    }
    
    static getDeepLink(ctx: Context): string | null { 
        const message = ctx.message as Message.TextMessage;
        return message?.text?.replace(/^\S*\s*/s, '') ?? null;
    }

    async sendPost(chatId: number, post: SavedPost) {
        let res: Message.TextMessage | Message.PhotoMessage | Message.VideoMessage | Message.AnimationMessage | Message.LocationMessage;
        try {
            if ('text' in post) {
                const { text, ...msg } = post;
                res = await this.bot.telegram.sendMessage(chatId, text, msg);
            } else if ('photo' in post) {
                const { photo, ...msg } = post;
                res = await this.bot.telegram.sendPhoto(chatId, photo, msg);
            } else if ('video' in post) {
                const { video, ...msg } = post;
                res = await this.bot.telegram.sendVideo(chatId, video, msg);
            } else if ('animation' in post) {
                const { animation, ...msg } = post;
                res = await this.bot.telegram.sendAnimation(chatId, animation, msg);
            } else if ('voice' in post) {
                const { voice, ...msg } = post;
                res = await this.bot.telegram.sendAnimation(chatId, voice, msg);
            } else if ('audio' in post) {
                const { audio, ...msg } = post;
                res = await this.bot.telegram.sendAnimation(chatId, audio, msg);
            } else if ('document' in post) {
                const { document, ...msg } = post;
                res = await this.bot.telegram.sendAnimation(chatId, document, msg);
            } else if ('video_note' in post) {
                const { video_note, ...msg } = post;
                res = await this.bot.telegram.sendAnimation(chatId, video_note, msg);
            } else if ('sticker' in post) {
                const { sticker, ...msg } = post;
                res = await this.bot.telegram.sendAnimation(chatId, sticker, msg);
            } else if ('latitude' in post && 'longitude' in post) {
                const { latitude, longitude, ...msg } = post;
                res = await this.bot.telegram.sendLocation(chatId, latitude, longitude, msg);
            } else {
                throw new Error('Unsupported message type!!');
            }
        } catch (e) {
            this.logger.error({
                chatId,
                post,
                e,
            });
            throw e;
        }
        this.logger.log({
            chatId,
            post,
            res,
        });
        return res;
    }

    public static getMediaMessage(ctx: IWizardContext | ISceneContext) {
        const { 
            from, 
            chat, 
            date, 
            author_signature, 
            edit_date, 
            message_id, 
            sender_chat, 
            forward_date, 
            forward_from, 
            forward_from_chat, 
            forward_from_message_id, 
            forward_sender_name, 
            forward_signature,
            reply_to_message,
            via_bot,
            ...msg 
        } = ctx.message as CommonMessageBundle;

        let post: Post<"sendMessage"> 
            | Post<"sendPhoto"> 
            | Post<"sendVideo"> 
            | Post<"sendAnimation"> 
            | Post<"sendAudio"> 
            | Post<"sendVoice"> 
            | Post<"sendDocument"> 
            | Post<"sendVideoNote"> 
            | Post<"sendSticker"> 
            | Post<"sendLocation">;
        if ('text' in msg) {
            const p: Post<'sendMessage'> = {
                text: msg.text,
                entities: msg.entities,
                disable_web_page_preview: false,
            };
            post = p;
        } else if ('photo' in msg) {
            const p: Post<'sendPhoto'> = {
                photo: msg.photo[0].file_id,
                caption: msg.caption,
                caption_entities: msg.caption_entities,
            };
            post = p;
        } else if ('video' in msg) {
            const p: Post<'sendVideo'> = {
                video: msg.video.file_id,
                // thumb: msg.video.thumb.file_id,
                caption: msg.caption,
                caption_entities: msg.caption_entities,
            };
            post = p;
        } else if ('animation' in msg) {
            const p: Post<'sendAnimation'> = {
                animation: msg.animation.file_id,
                // thumb: msg.animation.thumb.file_id,
                caption: msg.caption,
                caption_entities: msg.caption_entities,
            };
            post = p;
        } else if ('audio' in msg) {
            const p: Post<'sendAudio'> = {
                audio: msg.audio.file_id,
                title: msg.audio.title,
                //  ошибка в типах
                // thumb: msg.audio.thumb.file_id,
                caption: msg.caption,
                caption_entities: msg.caption_entities,
            };
            post = p;
        } else if ('voice' in msg) {
            const p = {
                voice: msg.voice.file_id,
                caption: msg.caption,
                caption_entities: msg.caption_entities,
            } as Post<'sendVoice'>;
            post = p;
        } else if ('document' in msg) {
            const p: Post<'sendDocument'> = {
                document: msg.document.file_id,
                // thumb: msg.document.thumb.file_id,
                caption: msg.caption,
                caption_entities: msg.caption_entities,
            };
            post = p;
        } else if ('video_note' in msg) {
            const p: Post<'sendVideoNote'> = {
                video_note: msg.video_note.file_id,
            };
            post = p;
        } else if ('sticker' in msg) {
            const p: Post<'sendSticker'> = {
                sticker: msg.sticker.file_id,
            };
            post = p;
        } else if ('location' in msg) {
            const p: Post<'sendLocation'> = {
                latitude: msg.location.latitude,
                longitude: msg.location.longitude,
                horizontal_accuracy: msg.location.horizontal_accuracy,
            };
            post = p;
        } else {
            return null;
        }
        post.reply_markup = msg.reply_markup;
        return post;
    }

    static async wizardNextStep(ctx: IWizardContext, call: boolean = true) {
        ctx.wizard.next();
        if (call) {
            const wizard = ctx.wizard as any;
            await wizard.steps[ctx.wizard.cursor](ctx);
        }
    }
    static async wizardBackStep(ctx: IWizardContext, call: boolean = true) {
        ctx.wizard.back();
        if (call) {
            const wizard = ctx.wizard as any;
            await wizard.steps[ctx.wizard.cursor](ctx);
        }
    }

    static isTelegramError(e: unknown): e is TelegramError {
        return e instanceof TelegramError;
    }

    static isCommonMessageBundle(message: Message): message is CommonMessageBundle {
        return 'animation' in message
            ?? 'audio' in message
            ?? 'contact' in message
            ?? 'dice' in message
            ?? 'document' in message
            ?? 'game' in message
            ?? 'location' in message
            ?? 'photo' in message
            ?? 'poll' in message
            ?? 'sticker' in message
            ?? 'text' in message
            ?? 'venue' in message
            ?? 'video' in message
            ?? 'video_note' in message
            ?? 'voice' in message;
    }

    static isCaptionableMessage(message: Message): message is CommonMessageBundle {
        return 'caption' in message;
    }
    static isTextMessage(message: Message): message is Message.TextMessage {
        return 'text' in message;
    }
    static isPhotoMessage(message: Message): message is Message.PhotoMessage {
        return 'photo' in message;
    }
    static isVideoMessage(message: Message): message is Message.VideoMessage {
        return 'video' in message;
    }
    static isMediaGroupMessage(message: Message): message is CommonMessageBundle {
        return 'media_group_id' in message;
    }
}
