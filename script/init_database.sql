-- Run this to setup your postgres database.
-- Don't forget to put your own email in the config table.

CREATE TABLE config
(
    config_id     TEXT PRIMARY KEY, -- probably only ever one row, but PK doesn't hurt
    emails        TEXT[],
    send_interval INTERVAL NOT NULL,
    next_send     TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO config(config_id, emails, send_interval, next_send)
VALUES ('v1',
        ARRAY ['yourself@example.com'], -- IMPORTANT! CHANGE ME
        '1 day',
        (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12' hour) AT TIME ZONE 'US/Pacific');

CREATE TABLE story
(
    story_id    BIGINT PRIMARY KEY,          -- The item's unique id.
    deleted     BOOLEAN,                     -- true if the item is deleted.
    by          TEXT,                        --	The username of the item's author.
    time        TIMESTAMP WITHOUT TIME ZONE, --	Creation date of the item, in Unix Time.
    text        TEXT,                        --	The comment, story or poll text. HTML.
    dead        BOOLEAN,                     --	true if the item is dead.
    url         TEXT,                        -- The URL of the story.
    score       INT,                         --	The story's score, or the votes for a pollopt.
    title       TEXT,                        -- The title of the story, poll or job. HTML.
    descendants INT,                         -- In the case of stories or polls, the total comment count.
    first_seen  TIMESTAMP WITHOUT TIME ZONE NOT NULL,   -- First time we've seen this record
    last_seen   TIMESTAMP WITHOUT TIME ZONE  -- Last time we've seen this record
);
ALTER TABLE story ADD COLUMN content TEXT;
