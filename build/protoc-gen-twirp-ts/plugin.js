var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CodeGeneratorResponse_Feature, DescriptorRegistry, PluginBase, SymbolTable, } from "@protobuf-ts/plugin-framework";
import { File } from "./file";
import { generateTwirp, generateTwirpClient, generateTwirpServer, } from "./gen/twirp";
import { genGateway } from "./gen/gateway";
import { createLocalTypeName } from "./local-type-name";
import { Interpreter } from "./interpreter";
import { genOpenAPI, OpenAPIType } from "./gen/open-api";
import { genIndexFile } from "./gen/index-file";
export class ProtobuftsPlugin extends PluginBase {
    constructor() {
        super(...arguments);
        this.parameters = {
            ts_proto: {
                description: "Use the ts-proto compiler (protobuf-ts by default)",
            },
            gateway: {
                description: "Generates the twirp gateway",
            },
            index_file: {
                description: "Generates an index.ts file that exports all the types",
            },
            emit_default_values: {
                description: "Json encode and decode will emit default values",
            },
            openapi_twirp: {
                description: "Generates an OpenAPI spec for twirp handlers",
            },
            openapi_gateway: {
                description: "Generates an OpenAPI spec for gateway handlers",
            },
            standalone: {
                description: "Generates client and server in 2 separate files",
            },
            client_only: {
                description: "Only client will be generated (overrides 'standalone')",
            },
            server_only: {
                description: "Only server will be generated (overrides 'standalone')",
            },
            camel_case: {
                description: "Generates with method names in camel case.",
            },
        };
        // we support proto3-optionals, so we let protoc know
        this.getSupportedFeatures = () => [
            CodeGeneratorResponse_Feature.PROTO3_OPTIONAL,
        ];
    }
    generate(request) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const params = this.parseOptions(this.parameters, request.parameter), registry = DescriptorRegistry.createFrom(request), symbols = new SymbolTable(), interpreter = new Interpreter(registry);
            const ctx = {
                lib: params.ts_proto ? "ts-proto" : "protobuf-ts",
                emitDefaultValues: params.emit_default_values,
                symbols,
                registry,
                interpreter,
                camelCase: params.camel_case,
            };
            const files = [];
            for (let fileDescriptor of registry.allFiles()) {
                const messageFileOut = new File(`${(_a = fileDescriptor.name) === null || _a === void 0 ? void 0 : _a.replace(".proto", "").toLowerCase()}`);
                registry.visitTypes(fileDescriptor, (descriptor) => {
                    // we are not interested in synthetic types like map entry messages
                    if (registry.isSyntheticElement(descriptor))
                        return;
                    ctx.symbols.register(createLocalTypeName(descriptor, registry), descriptor, messageFileOut);
                });
                // Generate a combined client and server bundle if no code gen
                // options are passed.
                if (!params.standalone && !params.client_only && !params.server_only) {
                    const twirpFileOut = new File(`${(_b = fileDescriptor.name) === null || _b === void 0 ? void 0 : _b.replace(".proto", "").toLowerCase()}.twirp.ts`);
                    const twirpFileContent = yield generateTwirp(ctx, fileDescriptor);
                    twirpFileOut.setContent(twirpFileContent);
                    files.push(twirpFileOut);
                }
                if (params.server_only && params.client_only) {
                    throw new Error("Only one of server_only or client_only can be passed.");
                }
                if (params.server_only || params.standalone) {
                    const serverFileOut = new File(`${(_c = fileDescriptor.name) === null || _c === void 0 ? void 0 : _c.replace(".proto", "").toLowerCase()}.twirp.ts`);
                    const serverContent = yield generateTwirpServer(ctx, fileDescriptor);
                    serverFileOut.setContent(serverContent);
                    files.push(serverFileOut);
                }
                if (params.client_only || params.standalone) {
                    const clientFileOut = new File(`${(_d = fileDescriptor.name) === null || _d === void 0 ? void 0 : _d.replace(".proto", "").toLowerCase()}.twirp-client.ts`);
                    const clientContent = yield generateTwirpClient(ctx, fileDescriptor);
                    clientFileOut.setContent(clientContent);
                    files.push(clientFileOut);
                }
            }
            // Gateway generation
            if (params.gateway) {
                const gatewayFileOut = new File(`gateway.twirp.ts`);
                const gatewayContent = yield genGateway(ctx, registry.allFiles());
                gatewayFileOut.setContent(gatewayContent);
                files.push(gatewayFileOut);
            }
            // Create index file
            if (params.index_file) {
                files.push(genIndexFile(registry, [...files]));
            }
            // Open API
            const docs = [];
            if (params.openapi_twirp) {
                docs.push(...(yield genOpenAPI(ctx, registry.allFiles(), OpenAPIType.TWIRP)));
            }
            if (params.openapi_gateway) {
                docs.push(...(yield genOpenAPI(ctx, registry.allFiles(), OpenAPIType.GATEWAY)));
            }
            docs.forEach((doc) => {
                const file = new File(`${doc.fileName}`);
                file.setContent(doc.content);
                files.push(file);
            });
            return files;
        });
    }
}
new ProtobuftsPlugin()
    .run()
    .then(() => {
    process.exit(0);
})
    .catch((e) => {
    process.stderr.write("FAILED!");
    process.stderr.write(e.message);
    process.stderr.write(e.stack);
    process.exit(1);
});
