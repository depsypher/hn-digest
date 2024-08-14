# DIY Hacker News email digest

![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This github action periodically polls hacker news for stories appearing on the front page, then sends you an email of the day's best stories.

## How it works

- The action is used in a workflow configured to 'collect' stories on a schedule (e.g every hour). It puts these in the 'story' table in the database. The top 30 stories are upserted, with their comment counts and last_seen dates continuously updated. That way we have some stats for determining which stories are 'best'.
- The action is used in a separate workflow configured on a different schedule (e.g. once a day) to 'send' the best stories to email addresses you specify.

## You'll need

1. A fork of this repo or a github project configured to use this action.
1. A postgres database (e.g. a free neon instance)
1. A Mailgun account for sending email.

## Setup

TODO
