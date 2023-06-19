import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Middleware, Context } from 'telegraf';

@Injectable()
export class CheckUserIdMiddleware {
    private readonly logger = new Logger(CheckUserIdMiddleware.name);
    private acceptableIds: number[];
    constructor(
        private readonly configService: ConfigService,
    ) {}

    onModuleInit() {
        const ids = this.configService.get("ADMIN_ID");
        
        try {
            this.acceptableIds = ids ? JSON.parse(ids) : null;
        } catch (e) {
            this.logger.error("Неверно указана настройка 'ADMIN_ID' в файле .env");
            throw e;
        }
    }

    middleware(): Middleware<Context> {
        return async (ctx, next) => {
            if (!!this.acceptableIds?.length && !this.acceptableIds.includes(ctx.from.id)) {
                this.logger.log(`User access is denied! id:${ctx.from.id}`)
                return;
            }

            return next();
        };
    }
}