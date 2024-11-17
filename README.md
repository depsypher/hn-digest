# DIY Hacker News email digest

![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This github action periodically polls hacker news for stories appearing on the front page, then sends you an email of the day's best stories with AI generated summaries.

## How it works

-   A github actions workflow is configured to collect stories on a schedule (e.g every 4 hours) which get put in the `story` table in the database.
-   On every run the current top stories are upserted, with their scores and comment counts continuously updated.
-   After each run, if the current time is after the `next_send` time, the top stories are queried, the html scraped and a summary of the content is generated. The results are sent to the email(s) set in `config` and `next_send` is incremented.
-   The metric for ranking the best stories is combined percentile rank of score and number of comments for stories collected since the last send.
- Anthropic is used to summarize, and voyage ai is used to generate vector embeddings of the summary.

## You'll need

1. A fork of this repo or a github project configured to use this action.
1. A postgres database (e.g. a free neon instance)
1. A Mailgun account for sending email.
1. Anthropic and Voyage AI accounts for summaries and embeddings.

It should be possible to stay in the free tier for all the services except anthropic which requires purchasing some credits. Voyage AI may require purchasing credits once the free credits are exhausted but it should take a long while.

## Setup
WIP - I'm currently using this to send myself a daily email digest of hn top stories, but I'm documenting the setup after the fact and may have missed some steps. 

Fork the repo. You'll need the following secrets set up in your repo settings for the github action:
- PG_HOST 
- PG_PASSWORD 
- MAILGUN_KEY 
- MAILGUN_DOMAIN 
- ANTHROPIC_KEY 
- VOYAGEAI_KEY

Change the email address in `script/init_database.sql` then run it on your postgres database.

I think that should be it, you should start getting a daily email of top hackernews stories with AI generated summaries. 
