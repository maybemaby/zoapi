import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { Api } from "./api.js";

describe("Api", () => {
	describe("info", () => {
		it("should be set", () => {
			const apiTitle = "My API";
			const apiVersion = "1.0.0";
			const apiDescription = "My API description";

			const api = new Api("3.0.0", {
				title: apiTitle,
				version: apiVersion,
				description: apiDescription,
			});

			const doc = api.document();

			expect(doc.info).toEqual({
				title: apiTitle,
				version: apiVersion,
				description: apiDescription,
			});

			expect(doc.openapi).toEqual("3.0.0");
		});
	});

	describe("get", () => {
		it("should create a get/test", () => {
			const api = new Api("3.0.0", {
				title: "My API",
				version: "1.0.0",
				description: "My API description",
			});

			api
				.get("/test")
				.query(z.object({ id: z.string() }))
				.responds("201", z.object({ amount: z.number() }))
				.responds("400", z.object({ error: z.string() }))
				.withTags(["test"]);

			const doc = api.document();

			expect(doc.paths?.["/test"]).toBeDefined();

			expect(doc.paths?.["/test"].get).toBeDefined();
			expect(doc.paths?.["/test"].get?.tags).toEqual(["test"]);
			expect(doc.paths?.["/test"].get?.parameters).toEqual([
				{
					in: "query",
					name: "id",
					required: true,
					schema: {
						type: "string",
					},
				},
			]);

			expect(doc.paths?.["/test"].get?.responses?.["201"].description).toEqual(
				"",
			);
			expect(
				doc.paths?.["/test"].get?.responses?.["201"].content?.[
					"application/json"
				].schema,
			).toEqual({
				type: "object",
				properties: {
					amount: {
						type: "number",
					},
				},
				required: ["amount"],
			});

			expect(doc.paths?.["/test"].get?.responses?.["400"].description).toEqual(
				"",
			);
			expect(
				doc.paths?.["/test"].get?.responses?.["400"].content?.[
					"application/json"
				].schema,
			).toEqual({
				type: "object",
				properties: {
					error: {
						type: "string",
					},
				},
				required: ["error"],
			});
		});

		it("should create a shareable ref", () => {
			const api = new Api("3.0.0", {
				title: "My API",
				version: "1.0.0",
				description: "My API description",
			});

			const ref = z.object({ id: z.string() }).openapi({ ref: "Test200" });

			api.get("/test").responds("200", ref);
			api.get("/test2").responds("200", ref);

			const doc = api.document();

			expect(doc.paths?.["/test"]).toBeDefined();
			expect(
				doc.paths?.["/test"].get?.responses?.["200"].content?.[
					"application/json"
				].schema,
			).toEqual({
				$ref: "#/components/schemas/Test200",
			});

			expect(doc.paths?.["/test2"]).toBeDefined();
			expect(
				doc.paths?.["/test2"].get?.responses?.["200"].content?.[
					"application/json"
				].schema,
			).toEqual({
				$ref: "#/components/schemas/Test200",
			});

			expect(doc.components?.schemas?.Test200).toEqual({
				type: "object",
				properties: {
					id: {
						type: "string",
					},
				},
				required: ["id"],
			});
		});

        it("should have examples", () => {
            const api = new Api("3.0.0", {
                title: "My API",
                version: "1.0.0",
                description: "My API description",
            });

            const ref = z.object({ id: z.string() }).openapi({  example: {
                id: "123",
            } });

            api.get("/test").responds("200", ref);

            const doc = api.document();

            expect(doc.paths?.["/test"]).toBeDefined();

            console.log(doc.paths?.["/test"].get?.responses?.["200"].content?.["application/json"].schema.example);

            expect(
                doc.paths?.["/test"].get?.responses?.["200"].content?.["application/json"].schema.example,
            ).toEqual({
                    id: "123",
            });
        })
	});
});
