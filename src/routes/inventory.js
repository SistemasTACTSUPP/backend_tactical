const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/inventory/:site
router.get('/:site', authenticateToken, async (req, res) => {
  try {
    const site = decodeURIComponent(req.params.site);
    const [items] = await pool.execute(
      'SELECT * FROM inventory_items WHERE site = ? ORDER BY code ASC',
      [site]
    );
    res.json(items);
  } catch (error) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// POST /api/inventory/:site
router.post('/:site', authenticateToken, async (req, res) => {
  try {
    const site = decodeURIComponent(req.params.site);
    const { code, description, size, stock_new, stock_recovered, stock_min, stock_max } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO inventory_items (code, description, size, stock_new, stock_recovered, stock_min, stock_max, site, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'En Stock')`,
      [code, description, size || null, stock_new || 0, stock_recovered || 0, stock_min || 0, stock_max || 0, site]
    );

    const [item] = await pool.execute('SELECT * FROM inventory_items WHERE id = ?', [result.insertId]);
    res.status(201).json(item[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El código ya existe para este sitio' });
    }
    console.error('Error creando item:', error);
    res.status(500).json({ error: 'Error al crear item' });
  }
});

// PUT /api/inventory/:site/:id
router.put('/:site/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { code, description, size, stock_new, stock_recovered, stock_min, stock_max, status } = req.body;

    await pool.execute(
      `UPDATE inventory_items 
       SET code = ?, description = ?, size = ?, stock_new = ?, stock_recovered = ?, 
           stock_min = ?, stock_max = ?, status = ?
       WHERE id = ?`,
      [code, description, size || null, stock_new, stock_recovered, stock_min, stock_max, status || 'En Stock', id]
    );

    const [item] = await pool.execute('SELECT * FROM inventory_items WHERE id = ?', [id]);
    res.json(item[0]);
  } catch (error) {
    console.error('Error actualizando item:', error);
    res.status(500).json({ error: 'Error al actualizar item' });
  }
});

// PATCH /api/inventory/:site/:id/stock
router.patch('/:site/:id/stock', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { stock_new, stock_recovered } = req.body;

    await pool.execute(
      'UPDATE inventory_items SET stock_new = ?, stock_recovered = ? WHERE id = ?',
      [stock_new, stock_recovered, id]
    );

    const [item] = await pool.execute('SELECT * FROM inventory_items WHERE id = ?', [id]);
    res.json(item[0]);
  } catch (error) {
    console.error('Error actualizando stock:', error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});

// DELETE /api/inventory/:site/:id
router.delete('/:site/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.execute('DELETE FROM inventory_items WHERE id = ?', [id]);
    res.json({ message: 'Item eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando item:', error);
    res.status(500).json({ error: 'Error al eliminar item' });
  }
});

module.exports = router;

