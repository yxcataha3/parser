import { Channel } from "../entity/channel.entity";

export class CreateMessageDto {
    id: number;
    channel: Channel;
    text: string;
    reply_markup: string
    entities: string
}