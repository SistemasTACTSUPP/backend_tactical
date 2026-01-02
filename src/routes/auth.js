const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código de acceso requerido' });
    }

    const [users] = await pool.execute(
      'SELECT id, access_code, role, name FROM users WHERE access_code = ?',
      [code]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Código de acceso inválido' });
    }

    const user = users[0];

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/verify
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }

      const [users] = await pool.execute(
        'SELECT id, access_code, role, name FROM users WHERE id = ?',
        [decoded.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ user: users[0] });
    });
  } catch (error) {
    console.error('Error en verify:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

