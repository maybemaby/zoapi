import { describe, expect, it } from "vitest";
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
});
