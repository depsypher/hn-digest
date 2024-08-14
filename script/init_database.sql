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
--    type        TEXT,                        -- The type of item. One of "job", "story", "comment", "poll", or "pollopt".
--    parent      BIGINT,                      --	The comment's parent: either another comment or the relevant story.
--    poll        BIGINT,                      --	The pollopt's associated poll.
--    kids        BIGINT[],                    --	The ids of the item's comments, in ranked display order.
--    parts       BIGINT[],                    -- A list of related pollopts, in display order.
);

-- CREATE TABLE comment
-- (
--     comment_id BIGINT PRIMARY KEY,
--     deleted    BOOLEAN,                     -- true if the item is deleted.
--     by         TEXT,                        -- The username of the item's author.
--     time       TIMESTAMP WITHOUT TIME ZONE, -- Creation date of the item, in Unix Time.
--     text       TEXT,                        -- The comment, story or poll text. HTML.
--     dead       BOOLEAN                      -- true if the item is dead.
-- )
