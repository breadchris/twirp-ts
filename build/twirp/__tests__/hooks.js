import { chainHooks } from "../hooks";
import { InternalServerError } from "../errors";
import { TwirpContentType } from "../request";
describe("Hooks behaviour", () => {
    it("can chain multiple hooks together", () => {
        const hook1Spy = jest.fn();
        const hooks1 = {
            requestReceived: (ctx) => {
                hook1Spy("received");
            },
            requestRouted: (ctx) => {
                hook1Spy("routed");
            },
            requestPrepared: (ctx) => {
                hook1Spy("prepared");
            },
            requestSent: (ctx) => {
                hook1Spy("sent");
            },
            responseSent: (ctx) => {
                hook1Spy("sent");
            },
            responsePrepared: (ctx) => {
                hook1Spy("prepared");
            },
            error: (ctx, err) => {
                hook1Spy("error");
            }
        };
        const hook2Spy = jest.fn();
        const hooks2 = {
            requestReceived: (ctx) => {
                hook2Spy("received");
            },
            requestRouted: (ctx) => {
                hook2Spy("routed");
            },
            requestPrepared: (ctx) => {
                hook2Spy("prepared");
            },
            requestSent: (ctx) => {
                hook2Spy("sent");
            },
            responseSent: (ctx) => {
                hook2Spy("sent");
            },
            responsePrepared: (ctx) => {
                hook2Spy("prepared");
            },
            error: (ctx, err) => {
                hook2Spy("error");
            }
        };
        const emptyHook = {};
        const chainedHook = chainHooks(hooks1, hooks2, emptyHook);
        expect(chainedHook).not.toBeNull();
        const hookNames = ["requestReceived", "requestRouted", "requestPrepared", "requestSent", "responseSent", "responsePrepared", "error"];
        hookNames.map(hookName => {
            const ctx = {
                req: jest.fn(),
                res: jest.fn(),
                contentType: TwirpContentType.Unknown,
                packageName: "",
                serviceName: "",
                methodName: "",
            };
            const hook = chainedHook[hookName];
            if (!hook) {
                throw new Error(`hook ${hookName} must be present`);
            }
            hook(ctx, new InternalServerError("test"));
        });
    });
});
