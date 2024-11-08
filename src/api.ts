import type { z } from "zod";
import {
	type ZodOpenApiOperationObject,
	type ZodOpenApiPathsObject,
	createDocument,
} from "zod-openapi";
import type { ZodOpenApiObject } from "zod-openapi";
import "zod-openapi/extend";

type Method =
	| "get"
	| "post"
	| "put"
	| "delete"
	| "options"
	| "head"
	| "patch"
	| "trace";

type StatusCode = `${1 | 2 | 3 | 4 | 5}${string}`;

type ResponseOptions = {
	description?: string;
}

class MethodBuilder {
	pathBuilder: PathBuilder;
	method: Method;

	pathSchema: z.AnyZodObject | null = null;
	querySchema: z.AnyZodObject | null = null;
	bodySchema: z.ZodType | null = null;
	responseSchema: Record<StatusCode, z.ZodType> = {};
	responseOptions: Record<StatusCode, ResponseOptions> = {};
	tags: string[] = [];

	constructor(pathBuilder: PathBuilder, method: Method) {
		this.pathBuilder = pathBuilder;
		this.method = method;

		this.pathBuilder.methodBuilders.push(this);
	}

	pathParams(schema: z.AnyZodObject) {
		this.pathSchema = schema;

		return this;
	}

	query(schema: z.AnyZodObject) {
		this.querySchema = schema;

		return this;
	}

	body(schema: z.ZodType) {
		this.bodySchema = schema;

		return this;
	}

	responds(statusCode: StatusCode, schema: z.ZodType, options?: ResponseOptions) {
		this.responseSchema[statusCode] = schema;

		if (options) {
			this.responseOptions[statusCode] = options;
		}

		return this;
	}

	withTags(tags: string[]) {
		this.tags = tags;
		return this;
	}

	build(): ZodOpenApiOperationObject {
		const op: ZodOpenApiOperationObject = {
			responses: {},
		};

		if (this.pathSchema || this.querySchema) {
			op.requestParams = {};

			if (this.pathSchema) {
				op.requestParams.path = this.pathSchema;
			}

			if (this.querySchema) {
				op.requestParams.query = this.querySchema;
			}
		}

		if (this.bodySchema) {
			op.requestBody = {
				content: {
					"application/json": {
						schema: this.bodySchema,
					},
				},
			};
		}

		if (Object.keys(this.responseSchema).length > 0) {
			op.responses = {};

			for (const statusCode in this.responseSchema) {
				const code = statusCode as StatusCode;

				op.responses[code] = {
					content: {
						"application/json": {
							schema: this.responseSchema[code],
						},
					},
					description: this.responseOptions[code]?.description ?? "",
				};
			}
		}

		if (this.tags.length > 0) {
			op.tags = this.tags;
		}

		return op;
	}
}

class PathBuilder {
	path: string;
	methodBuilders: MethodBuilder[] = [];

	constructor(path: string) {
		this.path = path;
	}

	build(): ZodOpenApiPathsObject {
		return {
			[this.path]: this.methodBuilders.reduce(
				(acc, mb) => {
					acc[mb.method] = mb.build();
					return acc;
				},
				{} as Record<Method, ZodOpenApiOperationObject>,
			),
		};
	}
}

export class Api {
	paths: Record<string, PathBuilder> = {};

	public info: ZodOpenApiObject["info"];
	public openapi: ZodOpenApiObject["openapi"];

	constructor(
		openapi: ZodOpenApiObject["openapi"],
		info: ZodOpenApiObject["info"],
	) {
		this.info = info;
		this.openapi = openapi;
	}

	private method(path: string, method: Method): MethodBuilder {
		const existingBuilder = this.paths[path];

		if (existingBuilder) {
			return new MethodBuilder(existingBuilder, method);
		}

		const pb = new PathBuilder(path);
		this.paths[path] = pb;

		return new MethodBuilder(pb, method);
	}

	get(path: string): MethodBuilder {
		return this.method(path, "get");
	}

	post(path: string): MethodBuilder {
		return this.method(path, "post");
	}

	put(path: string): MethodBuilder {
		return this.method(path, "put");
	}

	delete(path: string): MethodBuilder {
		return this.method(path, "delete");
	}

	document(): ReturnType<typeof createDocument> {
		const object: ZodOpenApiObject = {
			info: this.info,
			openapi: this.openapi,
			paths: {},
		};

		for (const path in this.paths) {
			const pathBuilder = this.paths[path];
			const pathObject = pathBuilder.build();

			object.paths![path] = {
				...object.paths![path],
				...pathObject[path],
			};
		}

		return createDocument(object);
	}
}
