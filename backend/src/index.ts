import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import developersRouter from './routes/developers';
import skillsRouter from './routes/skills';
import tasksRouter from './routes/tasks';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/developers', developersRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/tasks', tasksRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));