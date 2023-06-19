import { IContext } from "src/core/telegram.interface";

export function IsAdmin() {
    return (
        target: Object, 
        propertyKey: string | symbol, 
        descriptor: TypedPropertyDescriptor<(ctx: IContext) => any>
    ) => {
        const method = descriptor.value;
        descriptor.value = function(ctx: IContext) {
            if (!ctx.user.is_admin) {
                throw new Error('user is not admin!');
            }
            return method.call(this, ...arguments);
        }
        return descriptor;
    }
}
