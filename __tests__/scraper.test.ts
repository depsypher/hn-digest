import { scrape } from "../src/scraper";
import { expect } from "@jest/globals";

import { JSDOM } from "jsdom";

describe("scraper.ts", () => {
    it("scrapes", async () => {
        const doc = new JSDOM(
            "<body>Look at this cat: <img src='./cat.jpg'></body>",
            {
                url: "http://localhost:8080",
            },
        );

        const text = scrape(doc);
        expect(text).toBe("Look at this cat:");
    });
});
