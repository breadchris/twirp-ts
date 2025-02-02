var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// ChainHooks creates a new ServerHook which chains the callbacks in
// each of the constituent hooks passed in. Each hook function will be
// called in the order of the ServerHooks values passed in.
//
// For the erroring hooks, RequestReceived and RequestRouted, any returned
// errors prevent processing by later hooks.
export function chainHooks(...hooks) {
    if (hooks.length === 0) {
        return null;
    }
    if (hooks.length === 1) {
        return hooks[0];
    }
    const serverHook = {
        requestReceived(ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const hook of hooks) {
                    if (!hook.requestReceived) {
                        continue;
                    }
                    yield hook.requestReceived(ctx);
                }
            });
        },
        requestPrepared(ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const hook of hooks) {
                    if (!hook.requestPrepared) {
                        continue;
                    }
                    console.warn("hook requestPrepared is deprecated and will be removed in the next release. " +
                        "Please use responsePrepared instead.");
                    yield hook.requestPrepared(ctx);
                }
            });
        },
        responsePrepared(ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const hook of hooks) {
                    if (!hook.responsePrepared) {
                        continue;
                    }
                    yield hook.responsePrepared(ctx);
                }
            });
        },
        requestSent(ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const hook of hooks) {
                    if (!hook.requestSent) {
                        continue;
                    }
                    console.warn("hook requestSent is deprecated and will be removed in the next release. " +
                        "Please use responseSent instead.");
                    yield hook.requestSent(ctx);
                }
            });
        },
        responseSent(ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const hook of hooks) {
                    if (!hook.responseSent) {
                        continue;
                    }
                    yield hook.responseSent(ctx);
                }
            });
        },
        requestRouted(ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const hook of hooks) {
                    if (!hook.requestRouted) {
                        continue;
                    }
                    yield hook.requestRouted(ctx);
                }
            });
        },
        error(ctx, err) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const hook of hooks) {
                    if (!hook.error) {
                        continue;
                    }
                    yield hook.error(ctx, err);
                }
            });
        },
    };
    return serverHook;
}
export function isHook(object) {
    return ("requestReceived" in object ||
        "requestPrepared" in object ||
        "requestSent" in object ||
        "requestRouted" in object ||
        "responsePrepared" in object ||
        "responseSent" in object ||
        "error" in object);
}
