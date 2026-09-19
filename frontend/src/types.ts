export interface Skill {
  id: number;
  name: string;
}

export interface Developer {
  id: number;
  name: string;
  skills: string[];
}

export interface Task {
  id: number;
  title: string;
  status: string;
  assignee_id: number | null;
  assignee_name: string | null;
  parent_task_id: number | null;
  skills: Skill[];
  subtasks: Task[];
}