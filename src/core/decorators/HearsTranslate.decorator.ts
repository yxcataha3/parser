import { createListenerDecorator } from "nestjs-telegraf";
import { ISceneContext } from "../telegram.interface";

export function HearsTranslate(keys: string | string[]) {
    return <T>(
        target: Object, 
        propertyKey: string | symbol, 
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> | void => {
        const hearsDecorator = createListenerDecorator('hears');
        return hearsDecorator((value: string, ctx: ISceneContext) => {
            try {
                if (!('i18n' in ctx) || !('user' in ctx)) {
                    return;
                }
                if (!Array.isArray(keys)) {
                    keys = [keys];
                }
                const translatedTexts = keys.map(key => ctx.i18n.t(key, {lang: ctx.user.lang}));
                return new RegExp(translatedTexts.join('|')).exec(value);
            } catch (e) {
                console.error(e);
                return;
            }
        })(target, propertyKey, descriptor);
    }
}
