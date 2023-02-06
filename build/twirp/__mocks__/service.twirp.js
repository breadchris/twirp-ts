var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TwirpServer, TwirpError, TwirpErrorCode, TwirpContentType, chainInterceptors, } from "../index";
import { Size, Hat, FindHatRPC, ListHatRPC } from "./service";
export class HaberdasherClientJSON {
    constructor(rpc) {
        this.rpc = rpc;
        this.MakeHat.bind(this);
        this.FindHat.bind(this);
        this.ListHat.bind(this);
    }
    MakeHat(request) {
        const data = Size.toJson(request, {
            useProtoFieldName: true,
            emitDefaultValues: false,
        });
        const promise = this.rpc.request("twirp.example.haberdasher.Haberdasher", "MakeHat", "application/json", data);
        return promise.then((data) => Hat.fromJson(data, { ignoreUnknownFields: true }));
    }
    FindHat(request) {
        const data = FindHatRPC.toJson(request, {
            useProtoFieldName: true,
            emitDefaultValues: false,
        });
        const promise = this.rpc.request("twirp.example.haberdasher.Haberdasher", "FindHat", "application/json", data);
        return promise.then((data) => FindHatRPC.fromJson(data, { ignoreUnknownFields: true }));
    }
    ListHat(request) {
        const data = ListHatRPC.toJson(request, {
            useProtoFieldName: true,
            emitDefaultValues: false,
        });
        const promise = this.rpc.request("twirp.example.haberdasher.Haberdasher", "ListHat", "application/json", data);
        return promise.then((data) => ListHatRPC.fromJson(data, { ignoreUnknownFields: true }));
    }
}
export class HaberdasherClientProtobuf {
    constructor(rpc) {
        this.rpc = rpc;
        this.MakeHat.bind(this);
        this.FindHat.bind(this);
        this.ListHat.bind(this);
    }
    MakeHat(request) {
        const data = Size.toBinary(request);
        const promise = this.rpc.request("twirp.example.haberdasher.Haberdasher", "MakeHat", "application/protobuf", data);
        return promise.then((data) => Hat.fromBinary(data));
    }
    FindHat(request) {
        const data = FindHatRPC.toBinary(request);
        const promise = this.rpc.request("twirp.example.haberdasher.Haberdasher", "FindHat", "application/protobuf", data);
        return promise.then((data) => FindHatRPC.fromBinary(data));
    }
    ListHat(request) {
        const data = ListHatRPC.toBinary(request);
        const promise = this.rpc.request("twirp.example.haberdasher.Haberdasher", "ListHat", "application/protobuf", data);
        return promise.then((data) => ListHatRPC.fromBinary(data));
    }
}
export var HaberdasherMethod;
(function (HaberdasherMethod) {
    HaberdasherMethod["MakeHat"] = "MakeHat";
    HaberdasherMethod["FindHat"] = "FindHat";
    HaberdasherMethod["ListHat"] = "ListHat";
})(HaberdasherMethod || (HaberdasherMethod = {}));
export const HaberdasherMethodList = [
    HaberdasherMethod.MakeHat,
    HaberdasherMethod.FindHat,
    HaberdasherMethod.ListHat,
];
export function createHaberdasherServer(service) {
    return new TwirpServer({
        service,
        packageName: "twirp.example.haberdasher",
        serviceName: "Haberdasher",
        methodList: HaberdasherMethodList,
        matchRoute: matchHaberdasherRoute,
    });
}
function matchHaberdasherRoute(method, events) {
    switch (method) {
        case "MakeHat":
            return (ctx, service, data, interceptors) => __awaiter(this, void 0, void 0, function* () {
                ctx = Object.assign(Object.assign({}, ctx), { methodName: "MakeHat" });
                yield events.onMatch(ctx);
                return handleHaberdasherMakeHatRequest(ctx, service, data, interceptors);
            });
        case "FindHat":
            return (ctx, service, data, interceptors) => __awaiter(this, void 0, void 0, function* () {
                ctx = Object.assign(Object.assign({}, ctx), { methodName: "FindHat" });
                yield events.onMatch(ctx);
                return handleHaberdasherFindHatRequest(ctx, service, data, interceptors);
            });
        case "ListHat":
            return (ctx, service, data, interceptors) => __awaiter(this, void 0, void 0, function* () {
                ctx = Object.assign(Object.assign({}, ctx), { methodName: "ListHat" });
                yield events.onMatch(ctx);
                return handleHaberdasherListHatRequest(ctx, service, data, interceptors);
            });
        default:
            events.onNotFound();
            const msg = `no handler found`;
            throw new TwirpError(TwirpErrorCode.BadRoute, msg);
    }
}
function handleHaberdasherMakeHatRequest(ctx, service, data, interceptors) {
    switch (ctx.contentType) {
        case TwirpContentType.JSON:
            return handleHaberdasherMakeHatJSON(ctx, service, data, interceptors);
        case TwirpContentType.Protobuf:
            return handleHaberdasherMakeHatProtobuf(ctx, service, data, interceptors);
        default:
            const msg = "unexpected Content-Type";
            throw new TwirpError(TwirpErrorCode.BadRoute, msg);
    }
}
function handleHaberdasherFindHatRequest(ctx, service, data, interceptors) {
    switch (ctx.contentType) {
        case TwirpContentType.JSON:
            return handleHaberdasherFindHatJSON(ctx, service, data, interceptors);
        case TwirpContentType.Protobuf:
            return handleHaberdasherFindHatProtobuf(ctx, service, data, interceptors);
        default:
            const msg = "unexpected Content-Type";
            throw new TwirpError(TwirpErrorCode.BadRoute, msg);
    }
}
function handleHaberdasherListHatRequest(ctx, service, data, interceptors) {
    switch (ctx.contentType) {
        case TwirpContentType.JSON:
            return handleHaberdasherListHatJSON(ctx, service, data, interceptors);
        case TwirpContentType.Protobuf:
            return handleHaberdasherListHatProtobuf(ctx, service, data, interceptors);
        default:
            const msg = "unexpected Content-Type";
            throw new TwirpError(TwirpErrorCode.BadRoute, msg);
    }
}
function handleHaberdasherMakeHatJSON(ctx, service, data, interceptors) {
    return __awaiter(this, void 0, void 0, function* () {
        let request;
        let response;
        try {
            const body = JSON.parse(data.toString() || "{}");
            request = Size.fromJson(body, { ignoreUnknownFields: true });
        }
        catch (e) {
            if (e instanceof Error) {
                const msg = "the json request could not be decoded";
                throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
            }
        }
        if (interceptors && interceptors.length > 0) {
            const interceptor = chainInterceptors(...interceptors);
            response = yield interceptor(ctx, request, (ctx, inputReq) => {
                return service.MakeHat(ctx, inputReq);
            });
        }
        else {
            response = yield service.MakeHat(ctx, request);
        }
        return JSON.stringify(Hat.toJson(response, {
            useProtoFieldName: true,
            emitDefaultValues: false,
        }));
    });
}
function handleHaberdasherFindHatJSON(ctx, service, data, interceptors) {
    return __awaiter(this, void 0, void 0, function* () {
        let request;
        let response;
        try {
            const body = JSON.parse(data.toString() || "{}");
            request = FindHatRPC.fromJson(body, { ignoreUnknownFields: true });
        }
        catch (e) {
            if (e instanceof Error) {
                const msg = "the json request could not be decoded";
                throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
            }
        }
        if (interceptors && interceptors.length > 0) {
            const interceptor = chainInterceptors(...interceptors);
            response = yield interceptor(ctx, request, (ctx, inputReq) => {
                return service.FindHat(ctx, inputReq);
            });
        }
        else {
            response = yield service.FindHat(ctx, request);
        }
        return JSON.stringify(FindHatRPC.toJson(response, {
            useProtoFieldName: true,
            emitDefaultValues: false,
        }));
    });
}
function handleHaberdasherListHatJSON(ctx, service, data, interceptors) {
    return __awaiter(this, void 0, void 0, function* () {
        let request;
        let response;
        try {
            const body = JSON.parse(data.toString() || "{}");
            request = ListHatRPC.fromJson(body, { ignoreUnknownFields: true });
        }
        catch (e) {
            if (e instanceof Error) {
                const msg = "the json request could not be decoded";
                throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
            }
        }
        if (interceptors && interceptors.length > 0) {
            const interceptor = chainInterceptors(...interceptors);
            response = yield interceptor(ctx, request, (ctx, inputReq) => {
                return service.ListHat(ctx, inputReq);
            });
        }
        else {
            response = yield service.ListHat(ctx, request);
        }
        return JSON.stringify(ListHatRPC.toJson(response, {
            useProtoFieldName: true,
            emitDefaultValues: false,
        }));
    });
}
function handleHaberdasherMakeHatProtobuf(ctx, service, data, interceptors) {
    return __awaiter(this, void 0, void 0, function* () {
        let request;
        let response;
        try {
            request = Size.fromBinary(data);
        }
        catch (e) {
            if (e instanceof Error) {
                const msg = "the protobuf request could not be decoded";
                throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
            }
        }
        if (interceptors && interceptors.length > 0) {
            const interceptor = chainInterceptors(...interceptors);
            response = yield interceptor(ctx, request, (ctx, inputReq) => {
                return service.MakeHat(ctx, inputReq);
            });
        }
        else {
            response = yield service.MakeHat(ctx, request);
        }
        return Buffer.from(Hat.toBinary(response));
    });
}
function handleHaberdasherFindHatProtobuf(ctx, service, data, interceptors) {
    return __awaiter(this, void 0, void 0, function* () {
        let request;
        let response;
        try {
            request = FindHatRPC.fromBinary(data);
        }
        catch (e) {
            if (e instanceof Error) {
                const msg = "the protobuf request could not be decoded";
                throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
            }
        }
        if (interceptors && interceptors.length > 0) {
            const interceptor = chainInterceptors(...interceptors);
            response = yield interceptor(ctx, request, (ctx, inputReq) => {
                return service.FindHat(ctx, inputReq);
            });
        }
        else {
            response = yield service.FindHat(ctx, request);
        }
        return Buffer.from(FindHatRPC.toBinary(response));
    });
}
function handleHaberdasherListHatProtobuf(ctx, service, data, interceptors) {
    return __awaiter(this, void 0, void 0, function* () {
        let request;
        let response;
        try {
            request = ListHatRPC.fromBinary(data);
        }
        catch (e) {
            if (e instanceof Error) {
                const msg = "the protobuf request could not be decoded";
                throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
            }
        }
        if (interceptors && interceptors.length > 0) {
            const interceptor = chainInterceptors(...interceptors);
            response = yield interceptor(ctx, request, (ctx, inputReq) => {
                return service.ListHat(ctx, inputReq);
            });
        }
        else {
            response = yield service.ListHat(ctx, request);
        }
        return Buffer.from(ListHatRPC.toBinary(response));
    });
}
