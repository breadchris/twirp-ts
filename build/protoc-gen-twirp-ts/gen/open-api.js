var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DescriptorProto, EnumDescriptorProto, FieldDescriptorProto_Label, FieldDescriptorProto_Type } from "@protobuf-ts/plugin-framework";
import * as yaml from 'yaml';
import { createLocalTypeName } from "../local-type-name";
import { getMethod, Pattern } from "./gateway";
export var OpenAPIType;
(function (OpenAPIType) {
    OpenAPIType[OpenAPIType["GATEWAY"] = 0] = "GATEWAY";
    OpenAPIType[OpenAPIType["TWIRP"] = 1] = "TWIRP";
})(OpenAPIType || (OpenAPIType = {}));
/**
 * Generate twirp compliant OpenAPI doc
 * @param ctx
 * @param files
 * @param type
 */
export function genOpenAPI(ctx, files, type) {
    return __awaiter(this, void 0, void 0, function* () {
        const documents = [];
        files.forEach(file => {
            file.service.forEach((service) => {
                var _a, _b;
                const document = {
                    openapi: "3.0.3",
                    info: {
                        title: `${service.name}`,
                        version: "1.0.0",
                        description: genDescription(ctx, service),
                    },
                    paths: type === OpenAPIType.TWIRP ?
                        genTwirpPaths(ctx, file, service) :
                        genGatewayPaths(ctx, file, service),
                    components: genComponents(ctx, service.method),
                };
                const fileName = type === OpenAPIType.TWIRP ?
                    `${(_a = service.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()}.twirp.openapi.yaml` :
                    `${(_b = service.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()}.openapi.yaml`;
                documents.push({
                    fileName,
                    content: yaml.stringify(document),
                });
            });
        });
        return documents;
    });
}
/**
 * Generates OpenAPI Twirp URI paths
 * @param ctx
 * @param file
 * @param service
 */
function genTwirpPaths(ctx, file, service) {
    return service.method.reduce((paths, method) => {
        const description = genDescription(ctx, method);
        paths[`/${file.package ? file.package + "." : ""}${service.name}/${method.name}`] = {
            post: {
                summary: description,
                operationId: `${service.name}_${method.name}`,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: genRef(ctx, method.inputType)
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: genRef(ctx, method.outputType),
                                }
                            }
                        }
                    }
                }
            }
        };
        return paths;
    }, {});
}
/**
 * Generates OpenAPI Twrip Gateway URI paths
 * @param ctx
 * @param file
 * @param service
 */
function genGatewayPaths(ctx, file, service) {
    const registry = ctx.registry;
    /**
     * Build paths recursively
     * @param method
     * @param httpSpec
     * @param paths
     */
    function buildPath(method, httpSpec, paths) {
        const httpMethod = getMethod(httpSpec);
        const description = genDescription(ctx, method);
        const pathItem = {
            [httpMethod]: {
                summary: description,
                operationId: `${service.name}_${method.name}`,
            }
        };
        const inputMessage = registry.resolveTypeName(method.inputType);
        const outPutMessage = registry.resolveTypeName(method.outputType);
        // All methods except GET have body
        if (httpMethod !== Pattern.GET) {
            pathItem[httpMethod].requestBody = genGatewayBody(ctx, httpSpec, inputMessage);
        }
        // All methods might have params
        pathItem[httpMethod].parameters = genGatewayParams(ctx, httpSpec, inputMessage);
        pathItem[httpMethod].responses = genGatewayResponse(ctx, httpSpec, outPutMessage);
        paths[`${httpSpec[httpMethod]}`] = pathItem;
        if (httpSpec.additional_bindings) {
            buildPath(method, httpSpec.additional_bindings, paths);
        }
    }
    return service.method.reduce((paths, method) => {
        const options = ctx.interpreter.readOptions(method);
        if (!options || options && !options["google.api.http"]) {
            return paths;
        }
        const httpSpec = options["google.api.http"];
        buildPath(method, httpSpec, paths);
        return paths;
    }, {});
}
/**
 * Generate OpenAPI Gateway Response
 * @param ctx
 * @param httpOptions
 * @param message
 */
function genGatewayResponse(ctx, httpOptions, message) {
    let schema = {};
    if (httpOptions.responseBody) {
        schema = {
            type: "object",
            properties: {
                [httpOptions.responseBody]: {
                    $ref: `#/components/schemas/${message.name}`
                }
            }
        };
    }
    else {
        schema = {
            $ref: `#/components/schemas/${message.name}`
        };
    }
    return {
        "200": {
            description: "OK",
            content: {
                "application/json": {
                    schema,
                }
            }
        }
    };
}
/**
 * Generate OpenAPI Gateway Response
 * @param ctx
 * @param httpOptions
 * @param message
 */
function genGatewayBody(ctx, httpOptions, message) {
    const schema = {};
    if (httpOptions.body === "*") {
        schema.$ref = `#/components/schemas/${message.name}`;
    }
    else if (httpOptions.body) {
        const subField = message.field.find(field => field.name === httpOptions.body);
        if (!subField) {
            throw new Error(`the body field ${httpOptions.body} cannot be mapped to message ${message.name}`);
        }
        schema.properties = {
            [httpOptions.body]: genField(ctx, subField),
        };
    }
    return {
        required: true,
        content: {
            "application/json": {
                schema,
            }
        }
    };
}
/**
 * Generates OpenAPI Gateway Parameters
 * @param ctx
 * @param httpOptions
 * @param message
 */
function genGatewayParams(ctx, httpOptions, message) {
    const httpMethod = getMethod(httpOptions);
    const params = parseUriParams(httpOptions[httpMethod]);
    const urlParams = message.field
        .filter((field) => params.find((param) => param === field.name))
        .map((field) => {
        return {
            name: field.name,
            in: "path",
            required: true,
            schema: Object.assign({}, genField(ctx, field))
        };
    });
    if (httpOptions.body === "*") {
        return urlParams;
    }
    const queryString = message.field
        .filter((field) => field.name !== httpOptions.body &&
        !params.find(param => param === field.name))
        .map((field) => {
        return {
            name: field.name,
            in: "query",
            schema: Object.assign({}, genField(ctx, field))
        };
    });
    return [
        ...queryString,
        ...urlParams,
    ];
}
/**
 * Generates OpenAPI Components
 * @param ctx
 * @param methods
 */
function genComponents(ctx, methods) {
    const components = {
        schemas: {}
    };
    methods.reduce((schemas, method) => {
        genSchema(ctx, schemas, method.inputType);
        genSchema(ctx, schemas, method.outputType);
        return schemas;
    }, components.schemas);
    return components;
}
/**
 * Generate OpenAPI Schemas
 * @param ctx
 * @param schemas
 * @param typeName
 */
function genSchema(ctx, schemas, typeName) {
    const registry = ctx.registry;
    const localName = localMessageName(ctx, typeName);
    if (!localName) {
        return;
    }
    const descriptor = registry.resolveTypeName(typeName);
    if (schemas[localName]) {
        return;
    }
    // Handle OneOf
    if (descriptor.field.some((field) => registry.isUserDeclaredOneof(field))) {
        schemas[localName] = genOneOfType(ctx, descriptor);
        descriptor.oneofDecl.forEach((oneOfField, index) => {
            const oneOfTyName = `${localName}_${capitalizeFirstLetter(oneOfField.name)}`;
            const oneOfFields = descriptor.field.filter(field => {
                return field.oneofIndex === index;
            });
            schemas[oneOfTyName] = genOneOfTypeKind(ctx, descriptor, oneOfFields);
        });
    }
    else {
        schemas[localName] = genType(ctx, descriptor);
    }
    descriptor.field.forEach((field) => {
        if (field.type !== FieldDescriptorProto_Type.MESSAGE || !registry.isMapField(field)) {
            return;
        }
        if (registry.isMapField(field)) {
            const entry = registry.resolveTypeName(field.typeName);
            if (DescriptorProto.is(entry)) {
                const valueField = entry.field.find(fd => fd.number === 2);
                if (!valueField) {
                    return;
                }
                if (valueField.type !== FieldDescriptorProto_Type.MESSAGE) {
                    return;
                }
                field = valueField;
            }
        }
        else if (registry.isSyntheticElement(descriptor)) {
            return;
        }
        genSchema(ctx, schemas, field.typeName);
    });
}
/**
 * Generate an OpenAPI type
 * @param ctx
 * @param message
 */
function genType(ctx, message) {
    const description = genDescription(ctx, message);
    return {
        properties: genMessageProperties(ctx, message),
        description,
    };
}
/**
 * Generate a Protobuf to OpenAPI oneof type
 * @param ctx
 * @param message
 */
function genOneOfType(ctx, message) {
    const description = genDescription(ctx, message);
    const oneOf = {
        allOf: [
            {
                type: "object",
                properties: genMessageProperties(ctx, message),
            },
        ],
        description,
    };
    message.oneofDecl.forEach((field) => {
        oneOf.allOf.push({
            $ref: `#/components/schemas/${message.name}_${capitalizeFirstLetter(field.name)}`
        });
    });
    return oneOf;
}
/**
 * Generate one of type
 * @param ctx
 * @param message
 * @param oneOfFields
 */
function genOneOfTypeKind(ctx, message, oneOfFields) {
    return {
        oneOf: oneOfFields.map((oneOf) => {
            return {
                type: "object",
                properties: {
                    [oneOf.name]: genField(ctx, oneOf),
                }
            };
        })
    };
}
/**
 * Generate message properties
 * @param ctx
 * @param message
 */
function genMessageProperties(ctx, message) {
    const registry = ctx.registry;
    return message.field.reduce((fields, field) => {
        if (registry.isUserDeclaredOneof(field)) {
            return fields;
        }
        fields[field.name] = genField(ctx, field);
        return fields;
    }, {});
}
/**
 * Generates OpenAPI $ref
 * @param ctx
 * @param name
 */
function genRef(ctx, name) {
    const messageType = localMessageName(ctx, name);
    return `#/components/schemas/${messageType}`;
}
/**
 * Generate field definition
 * @param ctx
 * @param field
 */
function genField(ctx, field) {
    let openApiType;
    const registry = ctx.registry;
    switch (field.type) {
        case FieldDescriptorProto_Type.DOUBLE:
        case FieldDescriptorProto_Type.FLOAT:
        case FieldDescriptorProto_Type.BOOL:
        case FieldDescriptorProto_Type.STRING:
        case FieldDescriptorProto_Type.FIXED32:
        case FieldDescriptorProto_Type.FIXED64:
        case FieldDescriptorProto_Type.INT32:
        case FieldDescriptorProto_Type.INT64:
        case FieldDescriptorProto_Type.SFIXED32:
        case FieldDescriptorProto_Type.SFIXED64:
        case FieldDescriptorProto_Type.SINT32:
        case FieldDescriptorProto_Type.SINT64:
        case FieldDescriptorProto_Type.UINT32:
        case FieldDescriptorProto_Type.UINT64:
            openApiType = {
                type: genScalar(field.type),
            };
            break;
        case FieldDescriptorProto_Type.BYTES:
            openApiType = {
                type: "array",
                items: {
                    type: "integer",
                }
            };
            break;
        case FieldDescriptorProto_Type.ENUM:
            const enumType = registry.getEnumFieldEnum(field);
            openApiType = genEnum(enumType);
            break;
        case FieldDescriptorProto_Type.MESSAGE:
            // Map type
            if (registry.isMapField(field)) {
                const mapTypeValue = registry.getMapValueType(field);
                if (typeof mapTypeValue === "number") {
                    const scalar = mapTypeValue;
                    openApiType = {
                        type: "object",
                        additionalProperties: {
                            type: genScalar(scalar)
                        }
                    };
                }
                else if (EnumDescriptorProto.is(mapTypeValue)) {
                    openApiType = {
                        type: "object",
                        additionalProperties: Object.assign({}, genEnum(mapTypeValue))
                    };
                }
                else if (DescriptorProto.is(mapTypeValue)) {
                    openApiType = {
                        type: "object",
                        additionalProperties: {
                            $ref: `#/components/schemas/${mapTypeValue.name}`,
                        }
                    };
                }
                else {
                    throw new Error("map value not supported");
                }
                break;
            }
            openApiType = {
                $ref: genRef(ctx, field.typeName),
            };
            break;
        default:
            throw new Error(`${field.name} of type ${field.type} not supported`);
    }
    const description = genDescription(ctx, field);
    if (field.label === FieldDescriptorProto_Label.REPEATED && !registry.isMapField(field)) {
        return {
            type: "array",
            items: openApiType,
            description: description || "",
        };
    }
    if (field.type !== FieldDescriptorProto_Type.MESSAGE) {
        openApiType.description = description || "";
    }
    return openApiType;
}
/**
 * Generates enum definition
 * @param enumType
 */
function genEnum(enumType) {
    return {
        type: 'string',
        enum: enumType.value.map((value) => {
            return value.name;
        })
    };
}
/**
 * Generate scalar
 * @param type
 */
function genScalar(type) {
    switch (type) {
        case FieldDescriptorProto_Type.BOOL:
            return "boolean";
        case FieldDescriptorProto_Type.DOUBLE:
        case FieldDescriptorProto_Type.FLOAT:
            return "number";
        case FieldDescriptorProto_Type.STRING:
            return "string";
        case FieldDescriptorProto_Type.FIXED32:
        case FieldDescriptorProto_Type.FIXED64:
        case FieldDescriptorProto_Type.INT32:
        case FieldDescriptorProto_Type.INT64:
        case FieldDescriptorProto_Type.SFIXED32:
        case FieldDescriptorProto_Type.SFIXED64:
        case FieldDescriptorProto_Type.SINT32:
        case FieldDescriptorProto_Type.SINT64:
        case FieldDescriptorProto_Type.UINT32:
        case FieldDescriptorProto_Type.UINT64:
            return "integer";
        default:
            throw new Error(`${type} is not a scalar value`);
    }
}
/**
 * Generates the description
 * @param ctx
 * @param descriptor
 */
function genDescription(ctx, descriptor) {
    const registry = ctx.registry;
    const source = registry.sourceCodeComments(descriptor);
    const description = source.leading || source.trailing || "";
    return description.trim();
}
/**
 * Format protobuf name
 * @param ctx
 * @param name
 */
function localMessageName(ctx, name) {
    const registry = ctx.registry;
    const symbols = ctx.symbols;
    const entry = symbols.find(registry.resolveTypeName(name));
    if (!entry) {
        return "";
    }
    return createLocalTypeName(entry.descriptor, registry);
}
function parseUriParams(uri) {
    return getMatches(uri, /{([a-zA-Z_0-9]+)}/g, 1);
}
function getMatches(str, regex, index = 1) {
    const matches = [];
    let match;
    while (match = regex.exec(str)) {
        matches.push(match[index]);
    }
    return matches;
}
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
