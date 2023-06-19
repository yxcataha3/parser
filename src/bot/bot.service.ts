import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { UserbotService } from 'src/userbot/userbot.service';
import { IsNull, Like, Not, Repository } from 'typeorm';
import { ChannelStatus } from './bot.interface';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Channel } from './entity/channel.entity';
import { Message } from './entity/message.entity';
import { ConfigService } from '@nestjs/config';
import { Api } from 'telegram';

@Injectable()
export class BotService {
    constructor (
        @InjectRepository(Channel) private channelRepository: Repository<Channel>,
        @InjectRepository(Message) private messageRepository: Repository<Message>,
        @InjectBot() private readonly bot: Telegraf<Context>,
        private readonly userbotService: UserbotService,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit() {
        setImmediate(this.cycle.bind(this));
    }

    async createChannel(dto: CreateChannelDto) {
        const channel = this.channelRepository.create(dto);
        return await this.channelRepository.save(channel);
    }
    async removeChannel(channel: Channel) {
        await this.messageRepository.delete({
            channel: channel as any,
        });
        return await this.channelRepository.remove(channel);
    }
    async getChannelByStatus(status: ChannelStatus) {
        return await this.channelRepository.findOne({
            where: {
                status
            }
        });
    }
    async getChannel() {
        return await this.channelRepository.find({
            where: {
                deleted_at: IsNull()
            }
        });
    }
    async setChannelStatus(id: bigInt.BigInteger, status: ChannelStatus) {
        return await this.channelRepository.update(
            { id: id as any }, 
            { status }
        );
    }
    async isBusy() {
        const res = await this.channelRepository.count({
            where: {
                status: Not(ChannelStatus.NEW)
            }
        });
        return !!res;
    }

    async createMessage(dto: CreateMessageDto) {
        const message = this.messageRepository.create(dto);
        return await this.messageRepository.save(message);
    }
    async createMessagesBulk(dto: CreateMessageDto[]) {
        const messages = this.messageRepository.create(dto);
        return await this.messageRepository.save(messages);
    }
    async getMessagesWithLinks(channel: Channel) {
        const links = this.messageRepository.find({
            where: [
                {
                    channel: {id: channel.id as any},
                    text: Like('%http%://%'),
                },
                {
                    channel: {id: channel.id as any},
                    reply_markup: Like('%http%://%'),
                },
                {
                    channel: {id: channel.id as any},
                    entities: Like('%http%://%'),
                },
            ],
        });
        return links;
    }

    parseText(input: string): string[] {
        const arr = input.split('\n');
        const res: string[] = [];
        
        for (let i = 0; i < arr.length; i++) {
            const str = arr[i];

            const usernameMatch = str.match(/(@[\+\-\_0-9A-Za-z]*)/ig) ?? [];
            const usernameLinks = usernameMatch.map(u => `https://t.me/${u.slice(1)}`)
            const linkMatch = str.match(/(https?:\/\/t\.me\/[\+\-\_0-9A-Za-z]*)/ig) ?? [];

            res.push(...usernameLinks, ...linkMatch);
        }
        
        if (!res.length) {
            throw new Error('Не найдено ссылок и юзернеймов');
        }
        return res;
    }
    parseLinks(input: string): string[] {
        const arr = input.split('\n');
        const res: string[] = [];
        
        for (let i = 0; i < arr.length; i++) {
            const str = arr[i];

            const usernameMatch = str.match(/(@[\+\-\_0-9A-Za-z]*)/ig) ?? [];
            const usernameLinks = usernameMatch.map(u => `https://t.me/${u.slice(1)}`)
            const linkMatch = str.match(/(https?:\/\/[=%&$#!?@^:;,\(\)\[\]\{\}\.\+\-\_\/0-9A-Za-z]*)/ig) ?? [];

            res.push(...usernameLinks, ...linkMatch);   
        }

        return res;
    }

    async sendMessageToAdmins(text: string) {
        const admins: number[] = JSON.parse(this.configService.get("ADMIN_ID"));
        await Promise.allSettled(admins.map(async (admin) => {
            await this.bot.telegram.sendMessage(admin, text);
        }));
    }
    async sendDocumentToAdmins(buffer: Buffer, filename: string) {
        const admins: number[] = JSON.parse(this.configService.get("ADMIN_ID"));
        await Promise.allSettled(admins.map(async (admin) => {
            await this.bot.telegram.sendDocument(admin, {
                filename,
                source: buffer,
            });
        }));
    }

    async main() {
        if (!this.userbotService.client) {
            return;
        }
        let channel = 
            await this.getChannelByStatus(ChannelStatus.MESSAGES_LOADED)
            ?? await this.getChannelByStatus(ChannelStatus.LOADING_MESSAGES)
            ?? await this.getChannelByStatus(ChannelStatus.NEW);
        if (!channel) {
            return;
        }
        if (channel.status === ChannelStatus.NEW) {
            await this.sendMessageToAdmins(`Начинаю загрузку сообщений ${channel.link}`);
            const messages = await this.userbotService.loadMessages(this.userbotService.client, channel.id);
            const msgs = await this.createMessagesBulk(messages.map(m => ({
                id: m.id,
                channel,
                text: m.text,
                reply_markup: JSON.stringify(m.replyMarkup),
                entities: JSON.stringify(m.entities),
            })));
            await this.setChannelStatus(channel.id, ChannelStatus.MESSAGES_LOADED);
        }
        if (channel.status === ChannelStatus.MESSAGES_LOADED) {
            await this.sendMessageToAdmins(`Ищу ссылки в ${channel.link}`);
            const links = await this.getMessagesWithLinks(channel);
            const arr: string[] = [];
            links.forEach(ln => {
                arr.push(...this.parseLinks(ln.text));
                arr.push(...this.parseLinks(ln.entities));
                arr.push(...this.parseLinks(ln.reply_markup));
            })
            if (arr.length === 0) {
                arr.push('Ссылок не найдено');
            }
            await this.sendDocumentToAdmins(Buffer.from(arr.join('\n')), channel.link + '.txt');
            const admins = await this.userbotService.getAdmins(this.userbotService.client, channel.id).catch(e => {});
            if (!!admins && admins.length) {
                const text = admins.reduce((prev, cur) => {
                    if (cur instanceof Api.ChannelParticipantAdmin || cur instanceof Api.ChannelParticipantCreator) {
                        
                        return prev += cur.userId + '\n'
                    }
    
                    return prev;
                }, '');
                await this.sendMessageToAdmins(`ID админов: \n${text}`);
            }
            await this.userbotService.leaveChannel(this.userbotService.client, channel.id).catch(e => console.error(e));
            await this.removeChannel(channel);
        }
    }

    async cycle() {
        await this.main();
        setTimeout(this.cycle.bind(this), 10000)
    }
}
