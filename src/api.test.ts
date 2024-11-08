import { beforeEach, describe, expect, it } from "vitest";
import { Api } from "./api.js";
import { z } from "zod";

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

            api.get("/test").query(z.object({ id: z.string() })).responds("201", z.object({ amount: z.number() })).withTags(["test"]);

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
                }
            ]);

            expect(doc.paths?.["/test"].get?.responses?.["201"].description).toEqual("");
        });
    })
});
