import { Router } from 'express';
import { pool } from '../db';

const router = Router();

//GET /api/developers - list all developers with their skills
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, d.name, 
        COALESCE(json_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '[]') AS skills
      FROM developers d
      LEFT JOIN developer_skills ds ON  ds.developer_id = d.id
      LEFT JOIN skills s ON s.id = ds.skill_id
      GROUP BY d.id
      ORDER BY d.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/developers/:id — one developer with skills
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
         SELECT d.id, d.name,
      COALESCE(json_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '[]') AS skills
        FROM developers d
        LEFT JOIN developer_skills ds ON ds.developer_id = d.id
        LEFT JOIN skills s ON s.id = ds.skill_id
        WHERE d.id = $1
        GROUP BY d.id
    `, [req.params.id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Developer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}); 

export default router;