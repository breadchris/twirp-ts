var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BadRouteError, TwirpError, TwirpErrorCode } from "./errors";
/**
 * Supported Twirp Content-Type
 */
export var TwirpContentType;
(function (TwirpContentType) {
    TwirpContentType[TwirpContentType["Protobuf"] = 0] = "Protobuf";
    TwirpContentType[TwirpContentType["JSON"] = 1] = "JSON";
    TwirpContentType[TwirpContentType["Unknown"] = 2] = "Unknown";
})(TwirpContentType || (TwirpContentType = {}));
/**
 * Get supported content-type
 * @param mimeType
 */
export function getContentType(mimeType) {
    switch (mimeType) {
        case "application/protobuf":
            return TwirpContentType.Protobuf;
        case "application/json":
            return TwirpContentType.JSON;
        default:
            return TwirpContentType.Unknown;
    }
}
/**
 * Validate a twirp request
 * @param ctx
 * @param request
 * @param pathPrefix
 */
export function validateRequest(ctx, request, pathPrefix) {
    if (request.method !== "POST") {
        const msg = `unsupported method ${request.method} (only POST is allowed)`;
        throw new BadRouteError(msg, request.method || "", request.url || "");
    }
    const path = parseTwirpPath(request.url || "");
    if (path.pkgService !==
        (ctx.packageName ? ctx.packageName + "." : "") + ctx.serviceName) {
        const msg = `no handler for path ${request.url}`;
        throw new BadRouteError(msg, request.method || "", request.url || "");
    }
    if (path.prefix !== pathPrefix) {
        const msg = `invalid path prefix ${path.prefix}, expected ${pathPrefix}, on path ${request.url}`;
        throw new BadRouteError(msg, request.method || "", request.url || "");
    }
    const mimeContentType = request.headers["content-type"] || "";
    if (ctx.contentType === TwirpContentType.Unknown) {
        const msg = `unexpected Content-Type: ${request.headers["content-type"]}`;
        throw new BadRouteError(msg, request.method || "", request.url || "");
    }
    return Object.assign(Object.assign({}, path), { mimeContentType, contentType: ctx.contentType });
}
/**
 * Get request data from the body
 * @param req
 */
export function getRequestData(req) {
    return new Promise((resolve, reject) => {
        const reqWithRawBody = req;
        if (reqWithRawBody.rawBody instanceof Buffer) {
            resolve(reqWithRawBody.rawBody);
            return;
        }
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => __awaiter(this, void 0, void 0, function* () {
            const data = Buffer.concat(chunks);
            resolve(data);
        }));
        req.on("error", (err) => {
            if (req.aborted) {
                reject(new TwirpError(TwirpErrorCode.DeadlineExceeded, "failed to read request: deadline exceeded"));
            }
            else {
                reject(new TwirpError(TwirpErrorCode.Malformed, err.message).withCause(err));
            }
        });
        req.on("close", () => {
            reject(new TwirpError(TwirpErrorCode.Canceled, "failed to read request: context canceled"));
        });
    });
}
/**
 * Parses twirp url path
 * @param path
 */
export function parseTwirpPath(path) {
    const parts = path.split("/");
    if (parts.length < 2) {
        return {
            pkgService: "",
            method: "",
            prefix: "",
        };
    }
    return {
        method: parts[parts.length - 1],
        pkgService: parts[parts.length - 2],
        prefix: parts.slice(0, parts.length - 2).join("/"),
    };
}
