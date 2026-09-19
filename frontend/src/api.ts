const BASE_URL = 'http://localhost:4000/api';

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE_URL}/tasks`);
  return res.json();
}

export async function getDevelopers(): Promise<Developer[]> {
  const res = await fetch(`${BASE_URL}/developers`);
  return res.json();
}

export async function getSkills(): Promise<Skill[]> {
  const res = await fetch(`${BASE_URL}/skills`);
  return res.json();
}

export async function createTask(payload: {
  title: string;
  skillIds?: number[];
  parentTaskId?: number;
}): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateTask(
  id: number,
  payload: { assigneeId?: number; status?: string }
): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

import type { Task, Developer, Skill } from './types';