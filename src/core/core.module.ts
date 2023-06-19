import { Module } from '@nestjs/common';
import { I18nMiddleware } from './middlewares/i18n.middleware';
import { ConfirmScene } from './scene/confirm.scene';
import { TelegramService } from './telegram.service';

@Module({
  providers: [
    TelegramService,
    I18nMiddleware,
    ConfirmScene,
  ],
  exports: [
    I18nMiddleware,
    TelegramService,
    ConfirmScene,
  ]
})
export class CoreModule {}
