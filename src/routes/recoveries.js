const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/recoveries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [recoveries] = await pool.execute(
      'SELECT * FROM recoveries ORDER BY date DESC, created_at DESC'
    );

    for (let recovery of recoveries) {
      const [items] = await pool.execute(
        'SELECT * FROM recovery_items WHERE recovery_id = ?',
        [recovery.id]
      );
      recovery.items = items;
    }

    res.json(recoveries);
  } catch (error) {
    console.error('Error obteniendo recuperaciones:', error);
    res.status(500).json({ error: 'Error al obtener recuperaciones' });
  }
});

// POST /api/recoveries
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, employeeId, employeeName, items, created_by } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

      const [result] = await connection.execute(
        'INSERT INTO recoveries (date, employee_id, employee_name, total_items, created_by) VALUES (?, ?, ?, ?, ?)',
        [date, employeeId, employeeName, totalItems, created_by || req.user.name]
      );

      const recoveryId = result.insertId;

      for (const item of items) {
        await connection.execute(
          'INSERT INTO recovery_items (recovery_id, code, description, quantity, destination) VALUES (?, ?, ?, ?, ?)',
          [recoveryId, item.code, item.description, item.quantity || item.qty, item.destination]
        );

        // Actualizar inventario según destino
        if (item.destination !== 'Desecho') {
          const [existing] = await connection.execute(
            'SELECT * FROM inventory_items WHERE code = ? AND site = ?',
            [item.code, item.destination]
          );

          if (existing.length > 0) {
            await connection.execute(
              'UPDATE inventory_items SET stock_recovered = stock_recovered + ? WHERE code = ? AND site = ?',
              [item.quantity || item.qty, item.code, item.destination]
            );
          } else {
            await connection.execute(
              `INSERT INTO inventory_items (code, description, size, stock_recovered, site, status)
               VALUES (?, ?, ?, ?, ?, 'En Stock')`,
              [item.code, item.description, item.size || null, item.quantity || item.qty, item.destination]
            );
          }
        }
      }

      await connection.commit();
      res.status(201).json({ id: recoveryId, message: 'Recuperación creada correctamente' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creando recuperación:', error);
    res.status(500).json({ error: 'Error al crear recuperación' });
  }
});

// PUT /api/recoveries/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { date, employeeId, employeeName, items } = req.body;

    await pool.execute(
      'UPDATE recoveries SET date = ?, employee_id = ?, employee_name = ?, total_items = ? WHERE id = ?',
      [date, employeeId, employeeName, items.length, id]
    );

    await pool.execute('DELETE FROM recovery_items WHERE recovery_id = ?', [id]);
    for (const item of items) {
      await pool.execute(
        'INSERT INTO recovery_items (recovery_id, code, description, quantity, destination) VALUES (?, ?, ?, ?, ?)',
        [id, item.code, item.description, item.quantity || item.qty, item.destination]
      );
    }

    const [recovery] = await pool.execute('SELECT * FROM recoveries WHERE id = ?', [id]);
    res.json(recovery[0]);
  } catch (error) {
    console.error('Error actualizando recuperación:', error);
    res.status(500).json({ error: 'Error al actualizar recuperación' });
  }
});

// DELETE /api/recoveries/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.execute('DELETE FROM recoveries WHERE id = ?', [id]);
    res.json({ message: 'Recuperación eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando recuperación:', error);
    res.status(500).json({ error: 'Error al eliminar recuperación' });
  }
});

module.exports = router;

