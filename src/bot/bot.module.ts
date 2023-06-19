import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserbotModule } from 'src/userbot/userbot.module';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { Channel } from './entity/channel.entity';
import { Message } from './entity/message.entity';
import { CheckUserIdMiddleware } from './middleware/check-user-id.middleware';
import { ConnectUserbotMiddleware } from './middleware/userbot-connected.middleware';
import { AddChannelScene } from './scene/add-channel.scene';
import { ConnectUserbotScene } from './scene/connect-userbot.scene';
import { MainScene } from './scene/main.scene';

@Module({
    imports: [
        TypeOrmModule.forFeature([Channel, Message]),
        UserbotModule,
    ],
    providers: [
        BotUpdate,
        MainScene,
        ConnectUserbotScene,
        AddChannelScene,
        BotService,
        CheckUserIdMiddleware,
        ConnectUserbotMiddleware,
    ],
    exports: [
        CheckUserIdMiddleware,
        ConnectUserbotMiddleware,
    ]
})
export class BotModule {}
