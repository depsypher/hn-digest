import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import jsdom from "jsdom";

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", () => {
    // No-op to skip console errors.
});

async function text(url: RequestInfo): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return Promise.resolve("");
        }
        return await response.text();
    } catch {
        return Promise.resolve("");
    }
}

function clean(input: string, length: number): string {
    const result = input.trim().replace(/\s+/g, " ");
    return result.length > length ? result.slice(0, length) : result;
}

export async function content(url: string): Promise<string> {
    const html: string = await text(new Request(url));

    const content = scrape(new JSDOM(html, { virtualConsole }));
    return clean(content, 5000);
}

export function scrape(doc: JSDOM): string {
    const reader = new Readability(doc.window.document);
    const article = reader.parse();
    return article ? `${article.title} ${article.textContent}`.trim() : "";
}
