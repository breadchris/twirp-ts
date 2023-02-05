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
import * as https from "https";
import { URL } from "url";
import { TwirpError } from "./errors";
/**
 * a node HTTP RPC implementation
 * @param options
 * @constructor
 */
export const NodeHttpRPC = (options) => ({
    request(service, method, contentType, data) {
        let client;
        return new Promise((resolve, rejected) => {
            const responseChunks = [];
            const requestData = contentType === "application/protobuf"
                ? Buffer.from(data)
                : JSON.stringify(data);
            const url = new URL(options.baseUrl);
            const isHttps = url.protocol === "https:";
            if (isHttps) {
                client = https;
            }
            else {
                client = http;
            }
            const prefix = url.pathname !== "/" ? url.pathname : "";
            const req = client
                .request(Object.assign(Object.assign({}, (options ? options : {})), { method: "POST", protocol: url.protocol, host: url.hostname, port: url.port ? url.port : isHttps ? 443 : 80, path: `${prefix}/${service}/${method}`, headers: Object.assign(Object.assign({}, (options.headers ? options.headers : {})), { "Content-Type": contentType, "Content-Length": contentType === "application/protobuf"
                        ? Buffer.byteLength(requestData)
                        : Buffer.from(requestData).byteLength }) }), (res) => {
                res.on("data", (chunk) => responseChunks.push(chunk));
                res.on("end", () => {
                    const data = Buffer.concat(responseChunks);
                    if (res.statusCode != 200) {
                        rejected(wrapErrorResponseToTwirpError(data.toString()));
                    }
                    else {
                        if (contentType === "application/json") {
                            resolve(JSON.parse(data.toString()));
                        }
                        else {
                            resolve(data);
                        }
                    }
                });
                res.on("error", (err) => {
                    rejected(err);
                });
            })
                .on("error", (err) => {
                rejected(err);
            });
            req.end(requestData);
        });
    },
});
export function wrapErrorResponseToTwirpError(errorResponse) {
    return TwirpError.fromObject(JSON.parse(errorResponse));
}
/**
 * a browser fetch RPC implementation
 */
export const FetchRPC = (options) => ({
    request(service, method, contentType, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = new Headers(options.headers);
            headers.set("content-type", contentType);
            const response = yield fetch(`${options.baseUrl}/${service}/${method}`, Object.assign(Object.assign({}, options), { method: "POST", headers, body: data instanceof Uint8Array ? data : JSON.stringify(data) }));
            if (response.status === 200) {
                if (contentType === "application/json") {
                    return yield response.json();
                }
                return new Uint8Array(yield response.arrayBuffer());
            }
            throw TwirpError.fromObject(yield response.json());
        });
    },
});
