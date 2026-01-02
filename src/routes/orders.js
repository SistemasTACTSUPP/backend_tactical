const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders ORDER BY date DESC, created_at DESC'
    );

    for (let order of orders) {
      const [items] = await pool.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const order = orders[0];
    const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [id]);
    order.items = items;

    res.json(order);
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

// POST /api/orders
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { order_number, date, supplier, items, created_by } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const totalAmount = items.reduce((sum, item) => sum + ((item.qty || 0) * (item.unit_price || 0)), 0);

      const [result] = await connection.execute(
        'INSERT INTO orders (order_number, date, supplier, total_amount, created_by) VALUES (?, ?, ?, ?, ?)',
        [order_number, date, supplier || null, totalAmount, created_by || req.user.name]
      );

      const orderId = result.insertId;

      for (const item of items) {
        await connection.execute(
          'INSERT INTO order_items (order_id, code, description, qty, unit_price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.code, item.description, item.qty, item.unit_price || 0]
        );
      }

      await connection.commit();
      const [order] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
      const [orderItems] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      order[0].items = orderItems;
      res.status(201).json(order[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El número de pedido ya existe' });
    }
    console.error('Error creando pedido:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    res.status(500).json({ error: 'Error al eliminar pedido' });
  }
});

// GET /api/orders/suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { site } = req.query;

    let query = `
      SELECT code, description, size, site, 
             (stock_new + stock_recovered) as total_stock,
             stock_min, stock_max,
             CASE 
               WHEN (stock_new + stock_recovered) <= stock_min THEN stock_max - (stock_new + stock_recovered)
               ELSE 0
             END as suggested_qty
      FROM inventory_items
      WHERE status IN ('Reordenar', 'Agotado')
    `;

    const params = [];
    if (site) {
      query += ' AND site = ?';
      params.push(site);
    }

    query += ' ORDER BY suggested_qty DESC, code ASC';

    const [suggestions] = await pool.execute(query, params);
    res.json(suggestions);
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({ error: 'Error al obtener sugerencias' });
  }
});

module.exports = router;

