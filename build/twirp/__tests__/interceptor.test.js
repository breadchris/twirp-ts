var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { chainInterceptors } from "../interceptors";
import { TwirpContentType } from "../request";
describe("Interceptor", () => {
    it("will chain interceptors", () => __awaiter(void 0, void 0, void 0, function* () {
        const spy = jest.fn();
        const interceptor0 = (ctx, typedRequest, next) => __awaiter(void 0, void 0, void 0, function* () {
            spy();
            const response = yield next(ctx, typedRequest);
            spy();
            return response;
        });
        const spy1 = jest.fn();
        const interceptor1 = (ctx, typedRequest, next) => __awaiter(void 0, void 0, void 0, function* () {
            spy1();
            return next(ctx, typedRequest);
        });
        const chain = chainInterceptors(interceptor0, interceptor1);
        const ctx = {
            req: jest.fn(),
            res: jest.fn(),
            contentType: TwirpContentType.Unknown,
            packageName: "",
            methodName: "",
            serviceName: "",
        };
        const response = yield chain(ctx, {}, (ctx1, typedRequest) => __awaiter(void 0, void 0, void 0, function* () {
            return { test: "test" };
        }));
        expect(response).toEqual({ test: "test" });
        expect(spy).toBeCalledTimes(2);
        expect(spy1).toBeCalledTimes(1);
    }));
});
