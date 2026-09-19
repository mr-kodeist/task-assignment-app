import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import TaskListPage from './pages/TaskListPage';
import TaskCreationPage from './pages/TaskCreationPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Task List</Link>
        <Link to="/create">Create Task</Link>
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