import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Api, TelegramClient } from 'telegram';
import { TelegramClientParams } from 'telegram/client/telegramBaseClient';
import { StringSession } from 'telegram/sessions';
import { IsNull, Repository } from 'typeorm';
import { CreateUserbotDto } from './dto/create-userbot.dto';
import { Userbot } from './entity/userbot.entity';

@Injectable()
export class UserbotService {
    client: TelegramClient;
    constructor (
        @InjectRepository(Userbot) private userbotRepository: Repository<Userbot>,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit() {
        const userbot = await this.getUserbot();
        this.client = this.createClient(userbot?.session || '');
        await this.client.connect();
    }
    async onModuleDestroy() {
        await this.client.disconnect();
    }

    async createUserbot(dto: CreateUserbotDto) {
        const userbot = this.userbotRepository.create(dto);
        return await this.userbotRepository.save(userbot);
    }
    async deleteUserbot(id: number) {
        return await this.userbotRepository.softDelete(id);
    }
    async getUserbot() {
        return await this.userbotRepository.findOne({
            where: {
                deleted_at: IsNull(),
            },
            order: {
                created_at: 'DESC'
            }
        });
    }

    async sendCode(client: TelegramClient, phoneNumber: string) {
        const res = await client.invoke(new Api.auth.SendCode({
            phoneNumber,
            apiId: client.apiId,
            apiHash: client.apiHash,
            settings: new Api.CodeSettings({
                // allowFlashcall: false,
                // currentNumber: true,
                // allowAppHash: true,
                // allowMissedCall: false,
            }),
        }));
        return res;
    }

    async signIn(client: TelegramClient, phoneNumber: string, phoneCode: string, phoneCodeHash: string, params: TelegramClientParams = {testServers: true}): Promise<TelegramClient> {
        try {
            const res = await client.invoke(new Api.auth.SignIn({
                phoneNumber,
                phoneCode,
                phoneCodeHash
            }));
        } catch (e) {
            throw e;
        }
        this.client = client;
        console.log(client.session.save());
        return client;
    }
    async logOut(client: TelegramClient) {
        try {
            const res = await client.invoke(new Api.auth.LogOut());
            await this.userbotRepository.delete({
                deleted_at: IsNull(),
            })
        } catch (e) {
            throw e;
        }
    }

    createClient(sessionString: string, params: TelegramClientParams = {testServers: true}): TelegramClient {
        const apiId = +this.configService.get("API_ID");
        const apiHash = this.configService.get('API_HASH');
        if (!apiId || !apiHash) {
            throw new Error(`API_ID or API_HASH not provided`);
        }
        const session = new StringSession(sessionString);
        const client = new TelegramClient(session, apiId, apiHash, params);
        this.client = client;
        return client;
    }

    async connect(client: TelegramClient) {
        await client.connect();
    }

    async disconnect(client: TelegramClient) {
        await client.disconnect();
    }

    async findChannelByLink(client: TelegramClient, link: string) {
        if (!link.match(/^https?:\/\/t.me\/.*$/i)) {
            throw new Error(`link must match https://t.me/...`)
        }

        let chat: Api.Channel;
        if (link.match(/^https?:\/\/t.me\/(joinchat)|(\+).*$/i)) {
            chat = await this.getChatByInvite(client, link);
        } else if (link.match(/^https?:\/\/t.me\/.*$/i)) {
            chat = await this.getChatByUsername(client, link);
        } else {
            throw new Error(`unsupported link`)
        }
        return chat;
    }

    async joinToChannel(client: TelegramClient, channel: {
        id: bigInt.BigInteger,
        accessHash: bigInt.BigInteger,
    }) {
        return await client.invoke(new Api.channels.JoinChannel({
            channel: new Api.InputChannel({
                channelId: channel.id,
                accessHash: channel.accessHash
            }),
        }));
    }
    async leaveChannel(client: TelegramClient, channelId: bigInt.BigInteger) {
        return await client.invoke(new Api.channels.LeaveChannel({
            channel: new Api.PeerChannel({
                channelId,
            })
        }));
    }

    async importChatInvite(client: TelegramClient, link: string) {
        const hash = link.match(/(?<=^https?:\/\/t.me\/(joinchat\/)|(\+)).*$/i)[0];
        return await client.invoke(new Api.messages.ImportChatInvite({
            hash,
        }));
    }
    async getChatByInvite(client: TelegramClient, link: string) {
        const hash = link.match(/(?<=^https?:\/\/t.me\/(joinchat\/)|(\+)).*$/i)[0];
        const chatInvite = await client.invoke(new Api.messages.CheckChatInvite({
            hash,
        }));
        let chat;
        if (chatInvite instanceof Api.ChatInvitePeek) {
            chat = chatInvite.chat;
        } else if (chatInvite instanceof Api.ChatInviteAlready) {
            chat = chatInvite.chat;
        }
        if (!!chat && chat instanceof Api.Channel) {
            return chat;
        }
        return null;
    }
    async getChatByUsername(client: TelegramClient, link: string) {
        const username = link.match(/(?<=^https?:\/\/t.me\/)[_a-zA-Z0-9]*$/i)[0];
        const res = await client.invoke(new Api.contacts.ResolveUsername({
            username,
        }));
        if (res instanceof Api.contacts.ResolvedPeer) {
            if (res.chats?.length) {
                const chat = res.chats[0];
                if (chat instanceof Api.Channel) {
                    return chat;
                }
            }
        }
        return null;
    }

    async getAdmins(client: TelegramClient, channelId: bigInt.BigInteger): Promise<Api.TypeChannelParticipant[]> {

        const res = await client.invoke(new Api.channels.GetParticipants({
            channel: new Api.PeerChannel({ channelId }),
            filter: new Api.ChannelParticipantsAdmins(),
        }));
        if (res instanceof Api.channels.ChannelParticipantsNotModified) {
            return;
        }
        return res.participants;
    }
    async loadMessages(client: TelegramClient, channelId: bigInt.BigInteger) {

        const res = await client.getMessages(new Api.PeerChannel({
            channelId
        }), {
            // limit: 100,
            reverse: true
        });
        return res;
    }
}
