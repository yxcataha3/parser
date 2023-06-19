import { Logger } from "@nestjs/common";
import { fromMilliseconds } from "src/helpers/app.helpers";
import { Context } from "telegraf";

const logger = new Logger('Logging middleware');

export const logging = async (ctx: Context, next: () => Promise<any>) => {
    const dateStart = Date.now();
    logger.log({message: `${JSON.stringify(ctx.update)}`});

    await next().catch(e => {
        logger.error({message: e, update: ctx.update});
    });

    const timeSpent = fromMilliseconds(Date.now() - dateStart, 'sec');
    logger.log({message: `finished request in ${timeSpent} seconds`});
}
