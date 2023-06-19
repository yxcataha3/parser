import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { getTelegrafConfig } from './config/telegraf.config';
import { BotModule } from './bot/bot.module';
import { getDbConfig } from './config/db.config';
import { I18nJsonLoader, I18nModule } from 'nestjs-i18n';
import { UserModule } from './users/user.module';
import { CoreModule } from './core/core.module';
import { UserMiddleware } from './users/middleware/user.middleware';
import { I18nMiddleware } from './core/middlewares/i18n.middleware';
import { ConnectUserbotMiddleware } from './bot/middleware/userbot-connected.middleware';
import { CheckUserIdMiddleware } from './bot/middleware/check-user-id.middleware';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: [path.resolve('.env')],
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: getDbConfig,
		}),
		I18nModule.forRoot({
			fallbackLanguage: 'ru',
			loader: I18nJsonLoader,
			loaderOptions: {
			    path: path.resolve(__dirname, '../i18n/'),
			},
			logging: false,
		}),
        TelegrafModule.forRootAsync({
			imports: [
				ConfigModule,
				UserModule,
				CoreModule,
				BotModule,
			],
			inject: [
				ConfigService,
				I18nMiddleware,
				UserMiddleware,
				ConnectUserbotMiddleware,
				CheckUserIdMiddleware,
			],
			useFactory: getTelegrafConfig,
		}),
		BotModule,
	],
	providers: [],
})
export class AppModule {}
