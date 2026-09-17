INSERT INTO skills (name) VALUES ('Frontend'), ('Backend');

INSERT INTO developers (name) VALUES ('Alice'), ('Bob'), ('Carol'), ('Dave');

INSERT INTO developer_skills (developer_id, skill_id)
SELECT d.id, s.id FROM developers d, skills s WHERE d.name = 'Alice' AND s.name = 'Frontend';

INSERT INTO developer_skills (developer_id, skill_id)
SELECT d.id, s.id FROM developers d, skills s WHERE d.name = 'Bob' AND s.name = 'Backend';

INSERT INTO developer_skills (developer_id, skill_id)
SELECT d.id, s.id FROM developers d, skills s WHERE d.name = 'Carol' AND s.name IN ('Frontend', 'Backend');

INSERT INTO developer_skills (developer_id, skill_id)
SELECT d.id, s.id FROM developers d, skills s WHERE d.name = 'Dave' AND s.name = 'Backend';