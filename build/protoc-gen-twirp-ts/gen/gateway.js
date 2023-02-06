var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { writeFileSync } from "fs";
import { code, imp, joinCode } from "ts-poet";
import { match } from "path-to-regexp";
const Gateway = imp("Gateway@twirp-ts");
const GatewayPattern = imp("Pattern@twirp-ts");
const pathToRegexpMatch = imp("match@path-to-regexp");
const debug = (content) => writeFileSync(__dirname + "/debug.json", JSON.stringify(content, null, 2), "utf-8");
export var Pattern;
(function (Pattern) {
    Pattern["POST"] = "post";
    Pattern["GET"] = "get";
    Pattern["PATCH"] = "patch";
    Pattern["PUT"] = "put";
    Pattern["DELETE"] = "delete";
})(Pattern || (Pattern = {}));
export function genGateway(ctx, files) {
    return __awaiter(this, void 0, void 0, function* () {
        const httpRoutes = files.reduce((all, current) => {
            current.service.forEach(service => {
                service.method.forEach((method) => {
                    const options = ctx.interpreter.readOptions(method);
                    if (options && options["google.api.http"]) {
                        const httpSpec = options["google.api.http"];
                        all.push(parseHttpOption(httpSpec, current.package || "", method.name, service.name));
                        if (httpSpec.additional_bindings) {
                            all.push(parseHttpOption(httpSpec.additional_bindings, current.package || "", method.name, service.name));
                        }
                    }
                });
            });
            return all;
        }, []);
        return genGatewayHandler(httpRoutes).toStringWithImports();
    });
}
function genGatewayHandler(httpRoute) {
    const genRoutes = (method) => httpRoute.filter(route => route.httpMethod === method).map(route => {
        return code `
      {
        packageName: "${route.packageName}",
        methodName: "${route.methodName}",
        serviceName: "${route.serviceName}",
        httpMethod: "${route.httpMethod}" as ${GatewayPattern},
        matchingPath: "${route.matchingPath}{:query_string(\\\\?.*)}?",
        matcher: ${pathToRegexpMatch}("${route.matchingPath}{:query_string(\\\\?.*)}?"),
        bodyKey: "${route.bodyKey || ""}",
        responseBodyKey: "${route.responseBodyKey || ""}",
      },
    `;
    });
    return code `
  export function createGateway() {
    return new ${Gateway}({
      post: [${joinCode(genRoutes(Pattern.POST), { on: "\n" })}],
      get: [${joinCode(genRoutes(Pattern.GET), { on: "\n" })}],
      put: [${joinCode(genRoutes(Pattern.PUT), { on: "\n" })}],
      patch: [${joinCode(genRoutes(Pattern.PATCH), { on: "\n" })}],
      delete: [${joinCode(genRoutes(Pattern.DELETE), { on: "\n" })}],
    })
  }
  `;
}
function parseHttpOption(httpOption, packageName, methodName, serviceName) {
    const httpMethod = getMethod(httpOption);
    const matchingUrl = httpOption[httpMethod];
    const matchingPath = matcher(matchingUrl);
    const httpRoute = {
        packageName,
        methodName,
        serviceName,
        httpMethod: httpMethod,
        matchingPath,
        matcher: match(matchingPath),
        bodyKey: httpOption.body,
        responseBodyKey: httpOption.responseBody,
    };
    return httpRoute;
}
function matcher(url) {
    return url.split("/").map((urlSegment) => {
        const matchURLParams = /{([0-9a-zA-Z_-]+)}/.exec(urlSegment);
        if (matchURLParams && matchURLParams.length > 0) {
            const paramName = matchURLParams[1];
            return "{:" + paramName + "}";
        }
        else {
            return urlSegment;
        }
    }).join("/");
}
export function getMethod(httpSpec) {
    const possibleMethods = ["post", "get", "patch", "put", "delete"];
    for (const method of possibleMethods) {
        if (method in httpSpec) {
            return method;
        }
    }
    throw new Error(`HTTP method not found`);
}
