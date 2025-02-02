var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as http from 'http';
import supertest from 'supertest';
import { createHaberdasherServer } from "../__mocks__/service.twirp";
import { Hat } from "../__mocks__/service";
import { TwirpError, TwirpErrorCode } from "../errors";
describe("Server twirp specification", () => {
    let server;
    let twirpServer;
    beforeEach(() => {
        twirpServer = createHaberdasherServer({
            MakeHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return Hat.create({
                        name: "cap",
                        color: "blue",
                        inches: 3,
                    });
                });
            },
            FindHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return request;
                });
            },
            ListHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return request;
                });
            }
        });
        server = http.createServer(twirpServer.httpHandler());
    });
    it("support only POST requests", () => __awaiter(void 0, void 0, void 0, function* () {
        const unsupportedMethods = ["get", "put", "patch", "delete", "options"];
        const tests = unsupportedMethods.map((method) => __awaiter(void 0, void 0, void 0, function* () {
            const dynamicSupertest = supertest(server);
            const resp = yield dynamicSupertest[method]("/invalid-url")
                .set('Content-Type', 'application/json')
                .expect('Content-Type', "application/json")
                .expect(404);
            expect(resp.body).toEqual({
                code: TwirpErrorCode.BadRoute,
                msg: `unsupported method ${method.toUpperCase()} (only POST is allowed)`,
                meta: {
                    twirp_invalid_route: `${method.toUpperCase()} /invalid-url`,
                }
            });
        }));
        yield Promise.all(tests);
        yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHat")
            .set('Content-Type', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200);
    }));
    it("support only application/json and application/protobuf content-type", () => __awaiter(void 0, void 0, void 0, function* () {
        const resp = yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHat")
            .set('Content-Type', 'invalid/json')
            .expect('Content-Type', "application/json")
            .expect(404);
        expect(resp.body).toEqual({
            code: "bad_route",
            meta: {
                twirp_invalid_route: "POST /twirp/twirp.example.haberdasher.Haberdasher/MakeHat"
            },
            msg: "unexpected Content-Type: invalid/json"
        });
        yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHat")
            .set('Content-Type', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200);
        yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHat")
            .set('Content-Type', 'application/protobuf')
            .expect('Content-Type', "application/protobuf")
            .expect(200);
    }));
    describe("url must match [<prefix>]/[<package>.]<Service>/<Method>", () => {
        it("will error if url is malformed", () => __awaiter(void 0, void 0, void 0, function* () {
            const resp = yield supertest(server).post("/invalid-url-format")
                .expect('Content-Type', "application/json")
                .expect(404);
            expect(resp.body).toEqual({
                code: TwirpErrorCode.BadRoute,
                msg: `no handler for path /invalid-url-format`,
                meta: {
                    twirp_invalid_route: `POST /invalid-url-format`,
                }
            });
        }));
        it("succeeds when url is properly constructed", () => __awaiter(void 0, void 0, void 0, function* () {
            yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHat")
                .set('Content-Type', 'application/json')
                .expect('Content-Type', "application/json")
                .expect(200);
        }));
        it("must respect the prefix", () => __awaiter(void 0, void 0, void 0, function* () {
            const resp = yield supertest(server).post("/twirp-not-existing/twirp.example.haberdasher.Haberdasher/MakeHat")
                .set('Content-Type', 'application/json')
                .expect('Content-Type', "application/json")
                .expect(404);
            expect(resp.body).toEqual({
                code: "bad_route",
                meta: {
                    twirp_invalid_route: "POST /twirp-not-existing/twirp.example.haberdasher.Haberdasher/MakeHat"
                },
                msg: "invalid path prefix /twirp-not-existing, expected /twirp, on path /twirp-not-existing/twirp.example.haberdasher.Haberdasher/MakeHat"
            });
        }));
        it("must have a specified handler", () => __awaiter(void 0, void 0, void 0, function* () {
            const resp = yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHatDoesntExists")
                .set('Content-Type', 'application/json')
                .expect('Content-Type', "application/json")
                .expect(404);
            expect(resp.body).toEqual({
                code: "bad_route",
                meta: {
                    twirp_invalid_route: "POST /twirp/twirp.example.haberdasher.Haberdasher/MakeHatDoesntExists"
                },
                msg: "no handler for path /twirp/twirp.example.haberdasher.Haberdasher/MakeHatDoesntExists"
            });
        }));
        it("support rawBody Buffer", () => __awaiter(void 0, void 0, void 0, function* () {
            server = http.createServer((req, res) => __awaiter(void 0, void 0, void 0, function* () {
                req.rawBody = Buffer.from(JSON.stringify({
                    hatId: '1234',
                }));
                yield twirpServer.httpHandler()(req, res);
            }));
            const response = yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/FindHat")
                .set('Content-Type', 'application/json')
                .expect('Content-Type', "application/json")
                .expect(200);
            expect(response.body).toEqual({
                hat_id: '1234'
            });
        }));
    });
});
describe("Hooks & Interceptors", () => {
    let server;
    let twirpServer;
    beforeEach(() => {
        twirpServer = createHaberdasherServer({
            MakeHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return Hat.create({
                        name: "cap",
                        color: "blue",
                        inches: 3,
                    });
                });
            },
            FindHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return request;
                });
            },
            ListHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return request;
                });
            }
        });
        server = http.createServer(twirpServer.httpHandler());
    });
    it("can add interceptors", () => __awaiter(void 0, void 0, void 0, function* () {
        const interceptorSpy = jest.fn();
        twirpServer.use((ctx, req, next) => __awaiter(void 0, void 0, void 0, function* () {
            interceptorSpy();
            const resp = yield next(ctx, next);
            interceptorSpy();
            return resp;
        }));
        yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHat")
            .set('Content-Type', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200);
        expect(interceptorSpy).toBeCalledTimes(2);
    }));
    it("can add hooks", () => __awaiter(void 0, void 0, void 0, function* () {
        const hookSpy = jest.fn();
        twirpServer.use({
            requestReceived: (ctx) => {
                hookSpy("received");
            },
            requestRouted: (ctx) => {
                hookSpy("routed");
            },
            requestPrepared: (ctx) => {
                hookSpy("prepared");
            },
            requestSent: (ctx) => {
                hookSpy("sent");
            },
            error: (ctx, err) => {
                hookSpy("error"); // will not be called
            }
        });
        yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHat")
            .set('Content-Type', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200);
        expect(hookSpy).toBeCalledTimes(4);
        expect(hookSpy).toBeCalledWith("received");
        expect(hookSpy).toBeCalledWith("routed");
        expect(hookSpy).toBeCalledWith("prepared");
        expect(hookSpy).toBeCalledWith("sent");
    }));
    it("will invoke the error hook when an error occurs", () => __awaiter(void 0, void 0, void 0, function* () {
        twirpServer = createHaberdasherServer({
            MakeHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    throw new TwirpError(TwirpErrorCode.Internal, "test error");
                });
            },
            FindHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return request;
                });
            },
            ListHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return request;
                });
            }
        });
        const hookSpy = jest.fn();
        twirpServer.use({
            error: (ctx, err) => {
                hookSpy("error"); // will not be called
            }
        });
        server = http.createServer(twirpServer.httpHandler());
        yield supertest(server).post("/twirp/twirp.example.haberdasher.Haberdasher/MakeHat")
            .set('Content-Type', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(500);
        expect(hookSpy).toBeCalledWith("error");
    }));
});
