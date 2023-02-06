var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as http from "http";
import { createHttpTerminator } from "http-terminator";
import { createHaberdasherServer, HaberdasherClientJSON, HaberdasherClientProtobuf } from "../__mocks__/service.twirp";
import { Hat } from "../__mocks__/service";
import { NodeHttpRPC } from "../http.client";
import { InternalServerError, TwirpError, TwirpErrorCode } from "../errors";
describe("Twirp Clients", () => {
    let httpTerminator;
    let server;
    beforeEach(() => {
        const twirpServer = createHaberdasherServer({
            MakeHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return Hat.create({
                        id: "1",
                        name: "cap",
                        color: "blue",
                        inches: 100,
                        variants: [],
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
        httpTerminator = createHttpTerminator({
            server,
        });
    });
    it("can call methods using the JSON client", (done) => {
        const port = 9999;
        server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
            const client = new HaberdasherClientJSON(NodeHttpRPC({
                baseUrl: "http://localhost:9999/twirp",
            }));
            const hat = yield client.MakeHat({
                inches: 1,
            });
            expect(hat).toEqual({
                id: "1",
                color: "blue",
                inches: 100,
                name: "cap",
                variants: [],
            });
            yield httpTerminator.terminate();
            done();
        }));
    });
    it("can call methods using the Protobuf client", (done) => {
        const port = 9999;
        server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
            const client = new HaberdasherClientProtobuf(NodeHttpRPC({
                baseUrl: "http://localhost:9999/twirp",
            }));
            const hat = yield client.MakeHat({
                inches: 1,
            });
            expect(hat).toEqual({
                id: "1",
                color: "blue",
                inches: 100,
                name: "cap",
                variants: [],
            });
            yield httpTerminator.terminate();
            done();
        }));
    });
    it("will return a TwripError when a error occur", (done) => {
        const twirpServer = createHaberdasherServer({
            MakeHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    const error = new InternalServerError("error");
                    error.withMeta("test", "msg");
                    error.withMeta("test2", "msg2");
                    throw error;
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
        httpTerminator = createHttpTerminator({
            server,
        });
        const port = 9999;
        server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
            const client = new HaberdasherClientProtobuf(NodeHttpRPC({
                baseUrl: "http://localhost:9999/twirp",
            }));
            let err;
            try {
                yield client.MakeHat({
                    inches: 1,
                });
            }
            catch (e) {
                err = e;
            }
            expect(err).toBeInstanceOf(TwirpError);
            const twirpErr = err;
            expect(twirpErr.code).toEqual(TwirpErrorCode.Internal);
            expect(twirpErr.msg).toEqual("error");
            expect(twirpErr.meta).toEqual({
                test: "msg",
                test2: "msg2"
            });
            yield httpTerminator.terminate();
            done();
        }));
    });
});
