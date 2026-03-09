-- migrate:up
CREATE TABLE todos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT        NOT NULL CHECK (char_length(description) > 0),
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX todos_created_at_idx ON todos (created_at ASC);

-- migrate:down
DROP TABLE IF EXISTS todos;
