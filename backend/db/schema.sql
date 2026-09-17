-- Fixed set of statuses. A stricter alternative to a plain TEXT column;
-- trade-off is that adding a new status later requires an ALTER TYPE.
CREATE TYPE task_status AS ENUM ('To-do', 'In Progress', 'Done');

CREATE TABLE developers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- Many-to-many: a developer can have many skills, a skill belongs to many developers
CREATE TABLE developer_skills (
  developer_id INTEGER NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (developer_id, skill_id)
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'To-do',
  assignee_id INTEGER REFERENCES developers(id) ON DELETE SET NULL,
  parent_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Many-to-many: a task can require many skills
CREATE TABLE task_skills (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, skill_id)
);