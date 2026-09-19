import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import TaskListPage from './pages/TaskListPage';
import TaskCreationPage from './pages/TaskCreationPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <nav style={{
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        display: 'flex',
        gap: '0.75rem',
      }}>
        <Link
          to="/"
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            color: '#111827',
            textDecoration: 'none',
            fontSize: '0.95rem',
          }}
        >
          Task List
        </Link>
        <Link
          to="/create"
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            border: '1px solid #2563eb',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '0.95rem',
          }}
        >
          Create Task
        </Link>
      </nav>
      <div style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<TaskListPage />} />
          <Route path="/create" element={<TaskCreationPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;