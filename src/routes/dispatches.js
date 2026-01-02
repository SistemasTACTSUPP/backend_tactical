const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dispatches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [dispatches] = await pool.execute(
      'SELECT * FROM dispatches ORDER BY date DESC, created_at DESC'
    );

    for (let dispatch of dispatches) {
      const [items] = await pool.execute(
        'SELECT * FROM dispatch_items WHERE dispatch_id = ?',
        [dispatch.id]
      );
      dispatch.items = items;
    }

    res.json(dispatches);
  } catch (error) {
    console.error('Error obteniendo despachos:', error);
    res.status(500).json({ error: 'Error al obtener despachos' });
  }
});

// POST /api/dispatches
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, employeeId, employeeName, service, site, dispatchType, items, receiptImage, isRenewal } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const totalItems = items.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0);

      const [result] = await connection.execute(
        `INSERT INTO dispatches (date, employee_id, employee_name, service, site, dispatch_type, status, total_items, created_by, receipt_image)
         VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?)`,
        [date, employeeId, employeeName, service, site, dispatchType || 'Normal', totalItems, req.user.name, receiptImage || null]
      );

      const dispatchId = result.insertId;

      for (const item of items) {
        await connection.execute(
          'INSERT INTO dispatch_items (dispatch_id, code, description, quantity) VALUES (?, ?, ?, ?)',
          [dispatchId, item.code, item.description, item.quantity || item.qty]
        );
      }

      // Si es renovación, actualizar fechas del empleado
      if (isRenewal && employeeId) {
        const today = new Date().toISOString().split('T')[0];
        const nextRenewal = new Date();
        nextRenewal.setMonth(nextRenewal.getMonth() + 6);
        const nextRenewalDate = nextRenewal.toISOString().split('T')[0];

        await connection.execute(
          'UPDATE employees SET last_renewal_date = ?, next_renewal_date = ? WHERE employee_id = ?',
          [today, nextRenewalDate, employeeId]
        );
      }

      await connection.commit();
      res.status(201).json({ id: dispatchId, message: 'Despacho creado correctamente' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creando despacho:', error);
    res.status(500).json({ error: 'Error al crear despacho' });
  }
});

// PATCH /api/dispatches/:id/approve
router.patch('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [dispatch] = await connection.execute('SELECT * FROM dispatches WHERE id = ?', [id]);
      if (dispatch.length === 0) {
        return res.status(404).json({ error: 'Despacho no encontrado' });
      }

      // Actualizar estado
      await connection.execute(
        'UPDATE dispatches SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
        ['Aprobado', req.user.name, id]
      );

      // Obtener items del despacho
      const [items] = await connection.execute(
        'SELECT * FROM dispatch_items WHERE dispatch_id = ?',
        [id]
      );

      // Descontar del inventario
      for (const item of items) {
        const [inventory] = await connection.execute(
          'SELECT * FROM inventory_items WHERE code = ? AND site = ?',
          [item.code, dispatch[0].site]
        );

        if (inventory.length > 0) {
          const newStock = Math.max(0, inventory[0].stock_new - item.quantity);
          await connection.execute(
            'UPDATE inventory_items SET stock_new = ? WHERE code = ? AND site = ?',
            [newStock, item.code, dispatch[0].site]
          );
        }
      }

      await connection.commit();
      const [updated] = await pool.execute('SELECT * FROM dispatches WHERE id = ?', [id]);
      res.json(updated[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error aprobando despacho:', error);
    res.status(500).json({ error: 'Error al aprobar despacho' });
  }
});

// PUT /api/dispatches/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { date, employeeId, employeeName, service, site, dispatchType, items, receiptImage } = req.body;

    await pool.execute(
      `UPDATE dispatches 
       SET date = ?, employee_id = ?, employee_name = ?, service = ?, site = ?, dispatch_type = ?, receipt_image = ?, total_items = ?
       WHERE id = ?`,
      [date, employeeId, employeeName, service, site, dispatchType, receiptImage, items.length, id]
    );

    await pool.execute('DELETE FROM dispatch_items WHERE dispatch_id = ?', [id]);
    for (const item of items) {
      await pool.execute(
        'INSERT INTO dispatch_items (dispatch_id, code, description, quantity) VALUES (?, ?, ?, ?)',
        [id, item.code, item.description, item.quantity || item.qty]
      );
    }

    const [dispatch] = await pool.execute('SELECT * FROM dispatches WHERE id = ?', [id]);
    res.json(dispatch[0]);
  } catch (error) {
    console.error('Error actualizando despacho:', error);
    res.status(500).json({ error: 'Error al actualizar despacho' });
  }
});

// DELETE /api/dispatches/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.execute('DELETE FROM dispatches WHERE id = ?', [id]);
    res.json({ message: 'Despacho eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando despacho:', error);
    res.status(500).json({ error: 'Error al eliminar despacho' });
  }
});

module.exports = router;

