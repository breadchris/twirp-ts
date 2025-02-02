var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// chains multiple Interceptors into a single Interceptor.
// The first interceptor wraps the second one, and so on.
// Returns null if interceptors is empty.
export function chainInterceptors(...interceptors) {
    if (interceptors.length === 0) {
        return;
    }
    if (interceptors.length === 1) {
        return interceptors[0];
    }
    const first = interceptors[0];
    return (ctx, request, handler) => __awaiter(this, void 0, void 0, function* () {
        let next = handler;
        for (let i = interceptors.length - 1; i > 0; i--) {
            next = ((next) => (ctx, typedRequest) => {
                return interceptors[i](ctx, typedRequest, next);
            })(next);
        }
        return first(ctx, request, next);
    });
}
