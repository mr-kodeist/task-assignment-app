import { useEffect, useState } from 'react';
import { getTasks, getDevelopers, updateTask } from '../api';
import type { Task, Developer } from '../types';

const STATUS_OPTIONS = ['To-do', 'In Progress', 'Done'];

function TaskRow({
  task,
  developers,
  depth,
  onRefresh,
}: {
  task: Task;
  developers: Developer[];
  depth: number;
  onRefresh: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  // Only show developers who have ALL the skills this task requires
  const requiredSkillNames = task.skills.map((s) => s.name);
  const eligibleDevelopers = developers.filter((dev) =>
    requiredSkillNames.every((skillName) => dev.skills.includes(skillName))
  );

  async function handleStatusChange(newStatus: string) {
    setError(null);
    const result = await updateTask(task.id, { status: newStatus });
    if ('error' in result) {
      setError((result as any).error);
    } else {
      onRefresh();
    }
  }

  async function handleAssigneeChange(devId: string) {
    setError(null);
    if (!devId) return;
    const result = await updateTask(task.id, { assigneeId: Number(devId) });
    if ('error' in result) {
      setError((result as any).error);
    } else {
      onRefresh();
    }
  }

  return (
    <>
      <tr>
        <td style={{ paddingLeft: `${depth * 24}px` }}>{task.title}</td>
        <td>{requiredSkillNames.join(', ') || '—'}</td>
        <td>
          <select value={task.status} onChange={(e) => handleStatusChange(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </td>
        <td>
          <select
            value={task.assignee_id ?? ''}
            onChange={(e) => handleAssigneeChange(e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {eligibleDevelopers.map((dev) => (
              <option key={dev.id} value={dev.id}>{dev.name}</option>
            ))}
          </select>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={4} style={{ color: 'red', fontSize: '0.85rem' }}>{error}</td>
        </tr>
      )}
      {task.subtasks.map((sub) => (
        <TaskRow key={sub.id} task={sub} developers={developers} depth={depth + 1} onRefresh={onRefresh} />
      ))}
    </>
  );
}

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);

  async function loadData() {
    const [t, d] = await Promise.all([getTasks(), getDevelopers()]);
    setTasks(t);
    setDevelopers(d);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <h1>Tasks</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #d1d5db' }}>
            <th>Task Title</th>
            <th>Skills</th>
            <th>Status</th>
            <th>Assignee</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} developers={developers} depth={0} onRefresh={loadData} />
          ))}
        </tbody>
      </table>
    </div>
  );
}