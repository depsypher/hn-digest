import * as core from "@actions/core";
import pg from "pg";
import { content } from "./scraper";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_KEY = core.getInput("anthropic-key");
const anthropic = new Anthropic({
    apiKey: ANTHROPIC_KEY,
});

type TopStories = number[];
type Story = {
    story_id: number;
    type: string;
    deleted: boolean;
    by: string;
    time: number;
    text: string;
    dead: boolean;
    url: string;
    score: number;
    title: string;
    descendants: number;
};

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";
const STORY_COUNT = 30;

function getPostgresClient(): pg.Client {
    const pgUser: string = core.getInput("pg-user");
    const pgPassword: string = core.getInput("pg-password");
    const pgHost: string = core.getInput("pg-host");
    const pgDatabase: string = core.getInput("pg-database");
    const pgSSL: boolean = core.getBooleanInput("pg-ssl");

    return new pg.Client({
        user: pgUser,
        password: pgPassword,
        host: pgHost,
        database: pgDatabase,
        ssl: pgSSL,
    });
}

async function api<T>(url: RequestInfo): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    return (await response.json()) as Promise<T>;
}

function truncate(input: string, length: number): string {
    if (input.length > length) {
        return input.slice(0, length);
    }
    return input;
}

async function collect(db: pg.Client): Promise<void> {
    const topStories: TopStories = await api<TopStories>(
        `${HN_API_BASE}/topstories.json`,
    );
    core.debug(`Fetched ${topStories.length} top stories`);

    await Promise.all(
        topStories.slice(0, STORY_COUNT).map(async (id) => {
            const story = await api<Story>(`${HN_API_BASE}/item/${id}.json`);
            if (story.type == "story" && story.url) {
                const text: string = await content(story.url);

                await db.query(
                    "" +
                        "INSERT INTO story" +
                        " (story_id, deleted, by, time, text, dead, url, score, title, descendants, content, first_seen, last_seen)" +
                        " VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())" +
                        " ON CONFLICT (story_id)" +
                        " DO UPDATE SET deleted = $2, dead = $6, score = $8, descendants = $10," +
                        "  last_seen = NOW()",
                    [
                        id,
                        story.deleted,
                        story.by,
                        new Date(story.time * 1000),
                        story.text,
                        story.dead,
                        story.url,
                        story.score,
                        story.title,
                        story.descendants,
                        text,
                    ],
                );
            }
        }),
    ).catch((err) => {
        core.error("Error collecting stories");
        throw err;
    });
    core.debug(`Done collecting new stories`);
}

async function sendMail(
    MAILGUN_DOMAIN: string,
    emails: string[],
    html: string,
    MAILGUN_KEY: string,
): Promise<void> {
    const data = new URLSearchParams();
    data.append("from", `DIY HN Digest <hn@${MAILGUN_DOMAIN}>`);
    data.append("to", emails[0]);
    data.append("subject", "HN Digest");
    data.append("text", "");
    data.append("html", html);

    const request: RequestInfo = new Request(
        `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
        {
            method: "POST",
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(`api:${MAILGUN_KEY}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: data,
        },
    );
    await api<void>(request);
}

async function summarize(text: string): Promise<string> {
    if (!ANTHROPIC_KEY || !text || text.length < 1000) {
        return text;
    }
    const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text:
                            "Summarize the following article in 200 words or less. Return only the summary and do not acknowledge this instructional prompt: " +
                            text,
                    },
                ],
            },
        ],
    });
    if (msg.content.length > 0 && msg.content[0].type === "text") {
        return msg.content[0].text;
    }
    return "";
}

async function send(db: pg.Client): Promise<void> {
    core.debug(`Sending best stories`);
    const config = await db.query(
        "SELECT emails, next_send FROM config where config_id = 'v1'",
    );

    const emails: string[] = config.rows[0].emails as string[];
    const nextSend: Date = config.rows[0].next_send as Date;

    if (new Date() >= nextSend && emails.length > 0) {
        const stories = await db.query(
            "" +
                " WITH cte AS (" +
                "   SELECT story_id," +
                "          by," +
                "          text," +
                "          url," +
                "          title," +
                "          score," +
                "          descendants," +
                "          content," +
                "          percent_rank() OVER (ORDER BY score)       AS score_rank," +
                "          percent_rank() OVER (ORDER BY descendants) AS comment_rank" +
                "   FROM story" +
                "   WHERE last_seen > NOW() - (SELECT send_interval FROM config WHERE config_id = 'v1'))" +
                " SELECT *, score_rank + comment_rank AS rank" +
                " FROM cte" +
                " ORDER BY rank DESC" +
                " LIMIT 10",
        );

        let html = "<ul>";
        const storySummaries = new Map<number, string>();
        for (const story of stories.rows) {
            const summary = await summarize(story.content);
            storySummaries.set(story.story_id, summary);

            html += `<li>
                <a href="https://news.ycombinator.com/item?id=${story.story_id}">${story.title}</a>
                <div style="margin: 0 0 .5rem">
                  Score: ${story.score} (%${(story.score_rank * 100).toFixed(0)}th)
                  Comments: ${story.descendants} (%${(story.comment_rank * 100).toFixed(0)}th)
                  Rank: ${story.rank.toFixed(2)}
                </div>
                <div style="margin: 0 0 .5rem">${truncate(summary ?? "", 2000)}</div>
              </li>`;
        }

        const MAILGUN_DOMAIN = core.getInput("mailgun-domain");
        const MAILGUN_KEY = core.getInput("mailgun-key");
        await sendMail(MAILGUN_DOMAIN, emails, html, MAILGUN_KEY);

        // increment the next email send time
        await db.query(
            "UPDATE config SET next_send = CAST(NOW() AS DATE) + CAST(next_send AS TIME) + send_interval WHERE config_id = 'v1'",
        );

        // record the stories sent in the database
        const storyIds = [...storySummaries.keys()];
        await db.query("INSERT INTO digest (stories) VALUES ($1)", [storyIds]);
    }
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
    const db: pg.Client = getPostgresClient();

    try {
        await db.connect();
        await collect(db);
        await send(db);
    } catch (error) {
        core.error(`Caught ${error}`);
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    } finally {
        await db.end();
    }
}
