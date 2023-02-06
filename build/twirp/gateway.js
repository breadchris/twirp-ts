var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { parse } from "querystring";
import * as dotObject from "dot-object";
import { getRequestData } from "./request";
import { BadRouteError, NotFoundError, TwirpError, TwirpErrorCode, } from "./errors";
import { NodeHttpRPC } from "./http.client";
import { writeError } from "./server";
export var Pattern;
(function (Pattern) {
    Pattern["POST"] = "post";
    Pattern["GET"] = "get";
    Pattern["PATCH"] = "patch";
    Pattern["PUT"] = "put";
    Pattern["DELETE"] = "delete";
})(Pattern || (Pattern = {}));
/**
 * The Gateway proxies http requests to Twirp Compliant
 * handlers
 */
export class Gateway {
    constructor(routes) {
        this.routes = routes;
    }
    /**
     * Middleware that rewrite the current request
     * to a Twirp compliant request
     */
    twirpRewrite(prefix = "/twirp") {
        return (req, resp, next) => {
            this.rewrite(req, resp, prefix)
                .then(() => next())
                .catch((e) => {
                if (e instanceof TwirpError) {
                    if (e.code !== TwirpErrorCode.NotFound) {
                        writeError(resp, e);
                    }
                    else {
                        next();
                    }
                }
            });
        };
    }
    /**
     * Rewrite an incoming request to a Twirp compliant request
     * @param req
     * @param resp
     * @param prefix
     */
    rewrite(req, resp, prefix = "/twirp") {
        return __awaiter(this, void 0, void 0, function* () {
            const [match, route] = this.matchRoute(req);
            const body = yield this.prepareTwirpBody(req, match, route);
            const twirpUrl = `${prefix}/${route.packageName}.${route.serviceName}/${route.methodName}`;
            req.url = twirpUrl;
            req.originalUrl = twirpUrl;
            req.method = "POST";
            req.headers["content-type"] = "application/json";
            req.rawBody = Buffer.from(JSON.stringify(body));
            if (route.responseBodyKey) {
                const endFn = resp.end.bind(resp);
                resp.end = function (chunk) {
                    if (resp.statusCode === 200) {
                        endFn(`{ "${route.responseBodyKey}": ${chunk} }`);
                    }
                    else {
                        endFn(chunk);
                    }
                };
            }
        });
    }
    /**
     * Create a reverse proxy handler to
     * proxy http requests to Twirp Compliant handlers
     * @param httpClientOption
     */
    reverseProxy(httpClientOption) {
        const client = NodeHttpRPC(httpClientOption);
        return (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const [match, route] = this.matchRoute(req);
                const body = yield this.prepareTwirpBody(req, match, route);
                const response = yield client.request(`${route.packageName}.${route.serviceName}`, route.methodName, "application/json", body);
                res.statusCode = 200;
                res.setHeader("content-type", "application/json");
                let jsonResponse;
                if (route.responseBodyKey) {
                    jsonResponse = JSON.stringify({ [route.responseBodyKey]: response });
                }
                else {
                    jsonResponse = JSON.stringify(response);
                }
                res.end(jsonResponse);
            }
            catch (e) {
                writeError(res, e);
            }
        });
    }
    /**
     * Prepares twirp body requests using http.google.annotions
     * compliant spec
     *
     * @param req
     * @param match
     * @param route
     * @protected
     */
    prepareTwirpBody(req, match, route) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = match.params, { query_string } = _a, params = __rest(_a, ["query_string"]);
            let requestBody = Object.assign({}, params);
            if (query_string && route.bodyKey !== "*") {
                const queryParams = this.parseQueryString(query_string);
                requestBody = Object.assign(Object.assign({}, queryParams), requestBody);
            }
            let body = {};
            if (route.bodyKey) {
                const data = yield getRequestData(req);
                try {
                    const jsonBody = JSON.parse(data.toString() || "{}");
                    if (route.bodyKey === "*") {
                        body = jsonBody;
                    }
                    else {
                        body[route.bodyKey] = jsonBody;
                    }
                }
                catch (e) {
                    const msg = "the json request could not be decoded";
                    throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
                }
            }
            return Object.assign(Object.assign({}, body), requestBody);
        });
    }
    /**
     * Matches a route
     * @param req
     */
    matchRoute(req) {
        var _a;
        const httpMethod = (_a = req.method) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (!httpMethod) {
            throw new BadRouteError(`method not allowed`, req.method || "", req.url || "");
        }
        const routes = this.routes[httpMethod];
        for (const route of routes) {
            const match = route.matcher(req.url || "/");
            if (match) {
                return [match, route];
            }
        }
        throw new NotFoundError(`url ${req.url} not found`);
    }
    /**
     * Parse query string
     * @param queryString
     */
    parseQueryString(queryString) {
        const queryParams = parse(queryString.replace("?", ""));
        return dotObject.object(queryParams);
    }
}
