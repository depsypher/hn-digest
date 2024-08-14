import * as core from "@actions/core";
import pg from "pg";

type Mode = "collect" | "send";
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
    const pgSSL: string = core.getInput("pg-ssl");

    return new pg.Client({
        user: pgUser,
        password: pgPassword,
        host: pgHost,
        database: pgDatabase,
        ssl: !!pgSSL,
    });
}

async function api<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }
    return (await response.json()) as Promise<T>;
}

async function collect(): Promise<void> {
    const topStories: TopStories = await api<TopStories>(
        `${HN_API_BASE}/topstories.json`,
    );
    core.debug(`Fetched ${topStories.length} top stories`);

    const client: pg.Client = getPostgresClient();
    await client.connect();

    await Promise.all(
        topStories.slice(0, STORY_COUNT).map(async (id) => {
            const story = await api<Story>(`${HN_API_BASE}/item/${id}.json`);
            if (story.type == "story") {
                await client.query(
                    "" +
                        "INSERT INTO story" +
                        " (story_id, deleted, by, time, text, dead, url, score, title, descendants, first_seen, last_seen)" +
                        " VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())" +
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
                    ],
                );
            }
        }),
    ).catch((err) => {
        throw err;
    });
    core.debug(`Done collecting new stories`);

    await client.end();
}

async function send(): Promise<void> {}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
    try {
        const mode: Mode = core.getInput("mode") as Mode;

        switch (mode) {
            case "collect":
                await collect();
                break;
            case "send":
                await send();
                break;
            default:
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("Invalid mode");
        }
    } catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) core.setFailed(error.message);
    }
}
