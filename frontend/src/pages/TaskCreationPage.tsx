import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSkills, createTask } from '../api';
import type { Skill } from '../types';

interface FormNode {
  tempId: string;
  title: string;
  skillIds: number[];
  subtasks: FormNode[];
}

function createEmptyNode(): FormNode {
  return {
    tempId: crypto.randomUUID(),
    title: '',
    skillIds: [],
    subtasks: [],
  };
}

function TaskFormNode({
  node,
  skills,
  depth,
  onChange,
  onRemove,
}: {
  node: FormNode;
  skills: Skill[];
  depth: number;
  onChange: (updated: FormNode) => void;
  onRemove: () => void;
}) {
  function updateTitle(title: string) {
    onChange({ ...node, title });
  }

  function toggleSkill(skillId: number) {
    const has = node.skillIds.includes(skillId);
    const skillIds = has
      ? node.skillIds.filter((id) => id !== skillId)
      : [...node.skillIds, skillId];
    onChange({ ...node, skillIds });
  }

  function addSubtask() {
    onChange({ ...node, subtasks: [...node.subtasks, createEmptyNode()] });
  }

  function updateSubtask(index: number, updated: FormNode) {
    const subtasks = [...node.subtasks];
    subtasks[index] = updated;
    onChange({ ...node, subtasks });
  }

  function removeSubtask(index: number) {
    onChange({ ...node, subtasks: node.subtasks.filter((_, i) => i !== index) });
  }

  return (
    <div style={{ marginLeft: `${depth * 24}px`, border: '1px dashed #555', padding: '0.75rem', marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={depth === 0 ? 'Task title' : `Subtask title (level ${depth})`}
          value={node.title}
          onChange={(e) => updateTitle(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={addSubtask}>Add Subtask</button>
        {depth > 0 && (
          <button type="button" onClick={onRemove}>Remove</button>
        )}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        {skills.map((skill) => (
          <label key={skill.id} style={{ marginRight: '1rem' }}>
            <input
              type="checkbox"
              checked={node.skillIds.includes(skill.id)}
              onChange={() => toggleSkill(skill.id)}
            />
            {' '}{skill.name}
          </label>
        ))}
      </div>

      {node.subtasks.map((sub, index) => (
        <TaskFormNode
          key={sub.tempId}
          node={sub}
          skills={skills}
          depth={depth + 1}
          onChange={(updated) => updateSubtask(index, updated)}
          onRemove={() => removeSubtask(index)}
        />
      ))}
    </div>
  );
}

export default function TaskCreationPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [root, setRoot] = useState<FormNode>(createEmptyNode());
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getSkills().then(setSkills);
  }, []);

  // Recursively saves a node and all its subtasks, in order (parent must exist
  // before children, since children reference the parent's real database ID).
  async function saveNode(node: FormNode, parentTaskId?: number) {
    const created = await createTask({
      title: node.title,
      skillIds: node.skillIds.length > 0 ? node.skillIds : undefined,
      parentTaskId,
    });
    for (const sub of node.subtasks) {
      await saveNode(sub, created.id);
    }
  }

  async function handleSave() {
    if (!root.title.trim()) {
      alert('Task title is required.');
      return;
    }
    setSaving(true);
    try {
      await saveNode(root);
      navigate('/');
    } catch (err) {
      alert('Something went wrong saving the task.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Create Task</h1>
      <TaskFormNode
        node={root}
        skills={skills}
        depth={0}
        onChange={setRoot}
        onRemove={() => {}}
      />
      <button onClick={handleSave} disabled={saving} style={{ marginTop: '1rem' }}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}