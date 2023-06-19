import { createListenerDecorator } from "nestjs-telegraf";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";
import { ISceneContext } from "../telegram.interface";

export function ActionData<T = string>(action: T) {
    return <T>(
        target: Object, 
        propertyKey: string | symbol, 
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> | void => {
        const actionDecorator = createListenerDecorator('action');
        return actionDecorator((value: string, ctx: ISceneContext) => {
            try {
                const cq = ctx.callbackQuery as CallbackQuery;
                if (!cq?.data) {
                    return;
                }
                const data = JSON.parse(cq?.data);
                if (!data || data.action !== action) {
                    return;
                }

                return /.*/i.exec(value);
            } catch (e) {
                console.error(e);
                return;
            }
        })(target, propertyKey, descriptor);
    }
}
