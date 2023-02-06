var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import http from "http";
import { createHaberdasherServer } from "../__mocks__/service.twirp";
import { Hat } from "../__mocks__/service";
import { createGateway } from "../__mocks__/gateway.twirp";
import supertest from "supertest";
import { createHttpTerminator } from "http-terminator";
describe("Gateway", () => {
    let server;
    let twirpServer;
    let gateway;
    beforeEach(() => {
        twirpServer = createHaberdasherServer({
            MakeHat(ctx, request) {
                return __awaiter(this, void 0, void 0, function* () {
                    return Hat.create({
                        id: "1",
                        name: "cap",
                        color: "blue",
                        inches: request.inches,
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
        gateway = createGateway();
        const twirpRewrite = gateway.twirpRewrite();
        server = http.createServer((req, resp) => {
            twirpRewrite(req, resp, () => {
                twirpServer.httpHandler()(req, resp);
            });
        });
    });
    it("call custom POST http endpoint that maps to MakeHat", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield supertest(server)
            .post('/hat')
            .send({
            inches: 30,
        })
            .expect('Content-Type', "application/json")
            .expect(200);
        expect(response.body).toEqual({
            id: "1",
            name: "cap",
            color: "blue",
            inches: 30,
        });
    }));
    it("will map url parameter to request message", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield supertest(server)
            .get('/hat/12345')
            .expect('Content-Type', "application/json")
            .expect(200);
        expect(response.body).toEqual({
            hat_id: "12345",
        });
    }));
    it("will map query string parameters to request message", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield supertest(server)
            .get('/hat')
            .query({
            'filters[0].order_by': "desc",
            'filters[0].pagination.limit': 10,
            'filters[0].pagination.offset': 2,
            'filters[1].order_by': "asc",
            'filters[1].pagination.limit': 5,
            'filters[1].pagination.offset': 6,
        })
            .expect('Content-Type', "application/json")
            .expect(200);
        expect(response.body).toEqual({
            filters: [
                {
                    order_by: "desc",
                    pagination: {
                        limit: 10,
                        offset: 2,
                    },
                },
                {
                    order_by: "asc",
                    pagination: {
                        limit: 5,
                        offset: 6,
                    },
                }
            ]
        });
    }));
    it("will do a reverse proxy request to the handler", (done) => {
        const server = createHaberdasherServer({
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
        const gateway = createGateway();
        const twirpServerPort = 9999;
        const twirpServer = http.createServer(server.httpHandler());
        const httpTerminator1 = createHttpTerminator({
            server: twirpServer,
        });
        const gatewayServerPort = 9998;
        const gatewayServer = http.createServer(gateway.reverseProxy({
            baseUrl: "http://localhost:9999/twirp",
        }));
        const httpTerminator2 = createHttpTerminator({
            server: gatewayServer,
        });
        // twirp server
        twirpServer.listen(twirpServerPort, () => __awaiter(void 0, void 0, void 0, function* () {
            // reverse proxy server
            gatewayServer.listen(gatewayServerPort, () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield supertest(gatewayServer)
                    .post('/hat')
                    .send({
                    inches: 30,
                })
                    .expect('Content-Type', "application/json")
                    .expect(200);
                expect(response.body).toEqual({
                    id: "1",
                    name: "cap",
                    color: "blue",
                    inches: 100,
                });
                yield Promise.all([
                    httpTerminator1.terminate(),
                    httpTerminator2.terminate(),
                ]);
                done();
            }));
        }));
    });
});
