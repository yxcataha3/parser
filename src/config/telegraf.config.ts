import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TelegrafModuleOptions } from "nestjs-telegraf";
import { CheckUserIdMiddleware } from "src/bot/middleware/check-user-id.middleware";
import { ConnectUserbotMiddleware } from "src/bot/middleware/userbot-connected.middleware";
import { I18nMiddleware } from "src/core/middlewares/i18n.middleware";
import { logging } from "src/core/middlewares/logging.middleware";
import { rateLimit } from "src/core/middlewares/ratelimit.middleware";
import { UserMiddleware } from "src/users/middleware/user.middleware";

export const getTelegrafConfig = async (
    configService: ConfigService,
    i18nMiddleware: I18nMiddleware, 
    userMiddleware: UserMiddleware, 
    connectUserbotMiddleware: ConnectUserbotMiddleware,
    adminMiddleware: CheckUserIdMiddleware, 
): Promise<TelegrafModuleOptions> => ({
    token: configService.get('BOT_TOKEN'),
    options: {
        // contextType: Ctx
    },
    middlewares: [
        rateLimit({
            window: +configService.get('RATE_LIMIT_WINDOW'),
            limit: +configService.get('RATE_LIMIT_COUNT'),
            logger: new Logger('Rate Limiter'),
        }),
        logging,
        adminMiddleware.middleware(),
        userMiddleware.userMiddleware(),
        i18nMiddleware.middleware(),
        connectUserbotMiddleware.middleware(),
    ],
});
