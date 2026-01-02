const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [entries] = await pool.execute(
      `SELECT e.*, 
       (SELECT COUNT(*) FROM entry_items WHERE entry_id = e.id) as item_count
       FROM entries e 
       ORDER BY e.date DESC, e.created_at DESC`
    );

    for (let entry of entries) {
      const [items] = await pool.execute(
        'SELECT * FROM entry_items WHERE entry_id = ?',
        [entry.id]
      );
      entry.items = items;
    }

    res.json(entries);
  } catch (error) {
    console.error('Error obteniendo entradas:', error);
    res.status(500).json({ error: 'Error al obtener entradas' });
  }
});

// POST /api/entries
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, site, items, created_by } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const totalItems = items.reduce((sum, item) => sum + (item.qty || 0), 0);

      const [result] = await connection.execute(
        'INSERT INTO entries (date, site, total_items, created_by) VALUES (?, ?, ?, ?)',
        [date, site, totalItems, created_by || req.user.name]
      );

      const entryId = result.insertId;

      for (const item of items) {
        await connection.execute(
          'INSERT INTO entry_items (entry_id, code, description, qty) VALUES (?, ?, ?, ?)',
          [entryId, item.code, item.description, item.qty]
        );

        // Actualizar inventario
        const [existing] = await connection.execute(
          'SELECT * FROM inventory_items WHERE code = ? AND site = ?',
          [item.code, site]
        );

        if (existing.length > 0) {
          await connection.execute(
            'UPDATE inventory_items SET stock_new = stock_new + ? WHERE code = ? AND site = ?',
            [item.qty, item.code, site]
          );
        } else {
          await connection.execute(
            `INSERT INTO inventory_items (code, description, size, stock_new, site, status)
             VALUES (?, ?, ?, ?, ?, 'En Stock')`,
            [item.code, item.description, item.size || null, item.qty, site]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ id: entryId, message: 'Entrada creada correctamente' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creando entrada:', error);
    res.status(500).json({ error: 'Error al crear entrada' });
  }
});

// PUT /api/entries/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { date, site, items } = req.body;

    await pool.execute(
      'UPDATE entries SET date = ?, site = ?, total_items = ? WHERE id = ?',
      [date, site, items.length, id]
    );

    // Eliminar items anteriores y crear nuevos
    await pool.execute('DELETE FROM entry_items WHERE entry_id = ?', [id]);

    for (const item of items) {
      await pool.execute(
        'INSERT INTO entry_items (entry_id, code, description, qty) VALUES (?, ?, ?, ?)',
        [id, item.code, item.description, item.qty]
      );
    }

    const [entry] = await pool.execute('SELECT * FROM entries WHERE id = ?', [id]);
    res.json(entry[0]);
  } catch (error) {
    console.error('Error actualizando entrada:', error);
    res.status(500).json({ error: 'Error al actualizar entrada' });
  }
});

// DELETE /api/entries/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.execute('DELETE FROM entries WHERE id = ?', [id]);
    res.json({ message: 'Entrada eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando entrada:', error);
    res.status(500).json({ error: 'Error al eliminar entrada' });
  }
});

module.exports = router;

