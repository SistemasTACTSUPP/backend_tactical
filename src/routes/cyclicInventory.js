const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/cyclic-inventory/tasks
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const { status, site } = req.query;
    let query = 'SELECT * FROM cyclic_inventory_tasks';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [tasks] = await pool.execute(query, params);

    for (let task of tasks) {
      const [items] = await pool.execute(
        'SELECT * FROM cyclic_inventory_items WHERE task_id = ?',
        [task.id]
      );
      task.items = items;
    }

    res.json(tasks);
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// GET /api/cyclic-inventory/tasks/:id
router.get('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const [tasks] = await pool.execute('SELECT * FROM cyclic_inventory_tasks WHERE id = ?', [id]);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const task = tasks[0];
    const [items] = await pool.execute(
      'SELECT * FROM cyclic_inventory_items WHERE task_id = ?',
      [id]
    );
    task.items = items;

    res.json(task);
  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    res.status(500).json({ error: 'Error al obtener tarea' });
  }
});

// POST /api/cyclic-inventory/tasks
router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const { date, assigned_to, items } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.execute(
        'INSERT INTO cyclic_inventory_tasks (date, assigned_to, status) VALUES (?, ?, ?)',
        [date, assigned_to, 'Pendiente']
      );

      const taskId = result.insertId;

      for (const item of items) {
        await connection.execute(
          `INSERT INTO cyclic_inventory_items (task_id, code, description, size, theoretical_stock)
           VALUES (?, ?, ?, ?, ?)`,
          [taskId, item.code, item.description, item.size || null, item.theoretical_stock || 0]
        );
      }

      await connection.commit();
      res.status(201).json({ id: taskId, message: 'Tarea creada correctamente' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creando tarea:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

// PATCH /api/cyclic-inventory/tasks/:id/complete
router.patch('/tasks/:id/complete', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { items } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute(
        'UPDATE cyclic_inventory_tasks SET status = ?, completed_at = NOW(), completed_by = ? WHERE id = ?',
        ['Completado', req.user.name, id]
      );

      for (const item of items) {
        await connection.execute(
          `UPDATE cyclic_inventory_items 
           SET physical_count = ?, difference = ? - theoretical_stock
           WHERE task_id = ? AND code = ?`,
          [item.physical_count, item.physical_count, id, item.code]
        );
      }

      await connection.commit();
      const [task] = await pool.execute('SELECT * FROM cyclic_inventory_tasks WHERE id = ?', [id]);
      const [taskItems] = await pool.execute('SELECT * FROM cyclic_inventory_items WHERE task_id = ?', [id]);
      task[0].items = taskItems;
      res.json(task[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error completando tarea:', error);
    res.status(500).json({ error: 'Error al completar tarea' });
  }
});

// GET /api/cyclic-inventory/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Pendiente' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'Completado' THEN 1 ELSE 0 END) as completed_tasks
      FROM cyclic_inventory_tasks
    `);

    const [recentTasks] = await pool.execute(`
      SELECT * FROM cyclic_inventory_tasks 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      ...stats[0],
      recent_tasks: recentTasks
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;

