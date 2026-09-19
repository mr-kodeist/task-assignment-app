import { Router } from 'express';
import { pool } from '../db';
import { inferSkillsFromTitle } from '../llm';

const router = Router();

// Helper: fetch a task with its skills and subtasks (recursive)
async function getTaskWithDetails(taskId: number): Promise<any> {
  const taskResult = await pool.query(`
    SELECT t.id, t.title, t.status, t.assignee_id, t.parent_task_id, d.name AS assignee_name
    FROM tasks t
    LEFT JOIN developers d ON d.id = t.assignee_id
    WHERE t.id = $1
  `, [taskId]);

  if (taskResult.rows.length === 0) return null;
  const task = taskResult.rows[0];

  const skillsResult = await pool.query(`
    SELECT s.id, s.name FROM task_skills ts
    JOIN skills s ON s.id = ts.skill_id
    WHERE ts.task_id = $1
  `, [taskId]);
  task.skills = skillsResult.rows;

  const subtaskIdsResult = await pool.query(
    'SELECT id FROM tasks WHERE parent_task_id = $1', [taskId]
  );
  task.subtasks = await Promise.all(
    subtaskIdsResult.rows.map((row) => getTaskWithDetails(row.id))
  );

  return task;
}

// GET /api/tasks — list all top-level tasks (with nested subtasks)
router.get('/', async (req, res) => {
  const topLevel = await pool.query('SELECT id FROM tasks WHERE parent_task_id IS NULL ORDER BY id');
  const tasks = await Promise.all(topLevel.rows.map((row) => getTaskWithDetails(row.id)));
  res.json(tasks);
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  const task = await getTaskWithDetails(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// POST /api/tasks — create a task (or subtask, via parentTaskId)
router.post('/', async (req, res) => {
  const { title, skillIds, parentTaskId } = req.body;

  const result = await pool.query(
    'INSERT INTO tasks (title, parent_task_id) VALUES ($1, $2) RETURNING id',
    [title, parentTaskId ?? null]
  );
  const taskId = result.rows[0].id;

  let finalSkillIds: number[] = skillIds ?? [];

  if (finalSkillIds.length === 0) {
    // No skills specified by the user — infer them from the title using the LLM
    const allSkills = await pool.query('SELECT id, name FROM skills');
    const skillNames = allSkills.rows.map((s) => s.name);

    const inferredNames = await inferSkillsFromTitle(title, skillNames);
    finalSkillIds = allSkills.rows
      .filter((s) => inferredNames.includes(s.name))
      .map((s) => s.id);
  }

  for (const skillId of finalSkillIds) {
    await pool.query(
      'INSERT INTO task_skills (task_id, skill_id) VALUES ($1, $2)',
      [taskId, skillId]
    );
  }

  const task = await getTaskWithDetails(taskId);
  res.status(201).json(task);
});

// PATCH /api/tasks/:id — update assignee and/or status
router.patch('/:id', async (req, res) => {
  const taskId = Number(req.params.id);
  const { assigneeId, status } = req.body;

  if (assigneeId !== undefined) {
    // Business rule: developer must have ALL skills the task requires
    const requiredSkills = await pool.query(
      'SELECT skill_id FROM task_skills WHERE task_id = $1', [taskId]
    );
    const requiredSkillIds = requiredSkills.rows.map((r) => r.skill_id);

    if (requiredSkillIds.length > 0) {
      const devSkills = await pool.query(
        'SELECT skill_id FROM developer_skills WHERE developer_id = $1', [assigneeId]
      );
      const devSkillIds = new Set(devSkills.rows.map((r) => r.skill_id));
      const hasAllSkills = requiredSkillIds.every((id) => devSkillIds.has(id));

      if (!hasAllSkills) {
        return res.status(400).json({
          error: 'Developer does not have all required skills for this task',
        });
      }
    }
    await pool.query('UPDATE tasks SET assignee_id = $1 WHERE id = $2', [assigneeId, taskId]);
  }

  if (status !== undefined) {
    if (status === 'Done') {
      // Business rule: all subtasks must be Done first
      const subtasks = await pool.query(
        'SELECT status FROM tasks WHERE parent_task_id = $1', [taskId]
      );
      const allSubtasksDone = subtasks.rows.every((r) => r.status === 'Done');
      if (!allSubtasksDone) {
        return res.status(400).json({
          error: 'Cannot mark task as Done — one or more subtasks are not Done',
        });
      }
    }
    await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, taskId]);
  }

  const task = await getTaskWithDetails(taskId);
  res.json(task);
});

export default router;