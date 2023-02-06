var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { chainHooks, isHook } from "./hooks";
import { getContentType, getRequestData, validateRequest } from "./request";
import { BadRouteError, httpStatusFromErrorCode, InternalServerError, InternalServerErrorWith, TwirpError, } from "./errors";
/**
 * Runtime server implementation of a TwirpServer
 */
export class TwirpServer {
    constructor(options) {
        this.pathPrefix = "/twirp";
        this.hooks = [];
        this.interceptors = [];
        this.packageName = options.packageName;
        this.serviceName = options.serviceName;
        this.methodList = options.methodList;
        this.matchRoute = options.matchRoute;
        this.service = options.service;
    }
    /**
     * Returns the prefix for this server
     */
    get prefix() {
        return this.pathPrefix;
    }
    /**
     * The http handler for twirp complaint endpoints
     * @param options
     */
    httpHandler(options) {
        return (req, resp) => {
            // setup prefix
            if ((options === null || options === void 0 ? void 0 : options.prefix) !== undefined) {
                this.withPrefix(options.prefix);
            }
            return this._httpHandler(req, resp);
        };
    }
    /**
     * Adds interceptors or hooks to the request stack
     * @param middlewares
     */
    use(...middlewares) {
        middlewares.forEach((middleware) => {
            if (isHook(middleware)) {
                this.hooks.push(middleware);
                return this;
            }
            this.interceptors.push(middleware);
        });
        return this;
    }
    /**
     * Adds a prefix to the service url path
     * @param prefix
     */
    withPrefix(prefix) {
        if (prefix === false) {
            this.pathPrefix = "";
        }
        else {
            this.pathPrefix = prefix;
        }
        return this;
    }
    /**
     * Returns the regex matching path for this twirp server
     */
    matchingPath() {
        const baseRegex = this.baseURI().replace(/\./g, "\\.");
        return new RegExp(`${baseRegex}\/(${this.methodList.join("|")})`);
    }
    /**
     * Returns the base URI for this twirp server
     */
    baseURI() {
        return `${this.pathPrefix}/${this.packageName ? this.packageName + "." : ""}${this.serviceName}`;
    }
    /**
     * Create a twirp context
     * @param req
     * @param res
     * @private
     */
    createContext(req, res) {
        return {
            packageName: this.packageName,
            serviceName: this.serviceName,
            methodName: "",
            contentType: getContentType(req.headers["content-type"]),
            req: req,
            res: res,
        };
    }
    /**
     * Twrip server http handler implementation
     * @param req
     * @param resp
     * @private
     */
    _httpHandler(req, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctx = this.createContext(req, resp);
            try {
                yield this.invokeHook("requestReceived", ctx);
                const { method, mimeContentType } = validateRequest(ctx, req, this.pathPrefix || "");
                const handler = this.matchRoute(method, {
                    onMatch: (ctx) => {
                        return this.invokeHook("requestRouted", ctx);
                    },
                    onNotFound: () => {
                        const msg = `no handler for path ${req.url}`;
                        throw new BadRouteError(msg, req.method || "", req.url || "");
                    },
                });
                const body = yield getRequestData(req);
                const response = yield handler(ctx, this.service, body, this.interceptors);
                yield Promise.all([
                    this.invokeHook("responsePrepared", ctx),
                    // keep backwards compatibility till next release
                    this.invokeHook("requestPrepared", ctx),
                ]);
                resp.statusCode = 200;
                resp.setHeader("Content-Type", mimeContentType);
                resp.end(response);
            }
            catch (e) {
                yield this.invokeHook("error", ctx, mustBeTwirpError(e));
                if (!resp.headersSent) {
                    writeError(resp, e);
                }
            }
            finally {
                yield Promise.all([
                    this.invokeHook("responseSent", ctx),
                    // keep backwards compatibility till next release
                    this.invokeHook("requestSent", ctx),
                ]);
            }
        });
    }
    /**
     * Invoke a hook
     * @param hookName
     * @param ctx
     * @param err
     * @protected
     */
    invokeHook(hookName, ctx, err) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hooks.length === 0) {
                return;
            }
            const chainedHooks = chainHooks(...this.hooks);
            const hook = chainedHooks === null || chainedHooks === void 0 ? void 0 : chainedHooks[hookName];
            if (hook) {
                yield hook(ctx, err || new InternalServerError("internal server error"));
            }
        });
    }
}
/**
 * Write http error response
 * @param res
 * @param error
 */
export function writeError(res, error) {
    const twirpError = mustBeTwirpError(error);
    res.setHeader("Content-Type", "application/json");
    res.statusCode = httpStatusFromErrorCode(twirpError.code);
    res.end(twirpError.toJSON());
}
/**
 * Make sure that the error passed is a TwirpError
 * otherwise it will wrap it into an InternalError
 * @param err
 */
function mustBeTwirpError(err) {
    if (err instanceof TwirpError) {
        return err;
    }
    return new InternalServerErrorWith(err);
}
