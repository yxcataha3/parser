import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Userbot } from './entity/userbot.entity';
import { SessionConverterService } from './session-converter.service';
import { UserbotService } from './userbot.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Userbot]),
    ],
    providers: [SessionConverterService, UserbotService],
    exports: [
        UserbotService,
    ]
})
export class UserbotModule {}
