# DIY Hacker News email digest

![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This github action periodically polls hacker news for stories appearing on the front page, then sends you an email of the day's best stories.

## How it works

-   The action is used in a workflow configured to collect stories on a schedule (e.g every hour) which it puts in the `story` table in the database.
-   On every run the current top stories are upserted, with their scores and comment counts continuously updated.
-   Then after each run, if the current time is after the `next_send` time in the `config` table the top stories are queried and sent to the emails set in `config` and `next_send` is incremented.
-   The metric for ranking the best stories is combined percentile rank of score and number of comments for stories collected since the last send.

## You'll need

1. A fork of this repo or a github project configured to use this action.
1. A postgres database (e.g. a free neon instance)
1. A Mailgun account for sending email.

## Setup

TODO
