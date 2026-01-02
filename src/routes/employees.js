const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/employees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Construir query - igual que inventory, simple y directo
    let query = 'SELECT * FROM employees';
    const params = [];

    // Si se solicita un status específico, filtrar
    if (status && status !== 'Todos') {
      if (status === 'Activo') {
        // Para 'Activo', incluir también los que no tienen status definido
        query += ' WHERE (status = ? OR status IS NULL OR status = "")';
        params.push(status);
      } else {
        // Para otros status, solo los que coinciden exactamente
        query += ' WHERE status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY full_name ASC';

    console.log('🔍 Consulta empleados:', { query, params, status });
    const [employees] = await pool.execute(query, params);
    console.log(`✅ Empleados encontrados: ${employees.length}`);
    
    // Transformar a camelCase (como lo espera Flutter)
    const transformed = employees.map(emp => ({
      id: emp.employee_id || emp.id || '',
      name: emp.full_name || emp.name || '',
      service: emp.service || '',
      puesto: emp.puesto || null,
      status: emp.status || 'Activo',
      hireDate: emp.hire_date || null,
      lastRenewalDate: emp.last_renewal_date || null,
      nextRenewalDate: emp.next_renewal_date || null,
      secondUniformDate: emp.second_uniform_date || null,
      createdAt: emp.created_at || null,
      updatedAt: emp.updated_at || null,
      vestSize: emp.vest_size || null,
      shirtSize: emp.shirt_size || null,
      pantsSize: emp.pants_size || null,
      shoeSize: emp.shoe_size || null,
    }));
    
    console.log(`📤 Enviando ${transformed.length} empleados`);
    res.json(transformed);
  } catch (error) {
    console.error('❌ Error obteniendo empleados:', error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

// POST /api/employees
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      employee_id,
      full_name,
      service,
      hire_date,
      last_renewal_date,
      second_uniform_date,
      next_renewal_date,
      vest_size,
      shirt_size,
      pants_size,
      shoe_size
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO employees (employee_id, full_name, service, hire_date, last_renewal_date, 
       second_uniform_date, next_renewal_date, vest_size, shirt_size, pants_size, shoe_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id, full_name, service, hire_date,
        last_renewal_date || null, second_uniform_date || null, next_renewal_date || null,
        vest_size || null, shirt_size || null, pants_size || null, shoe_size || null
      ]
    );

    const [employee] = await pool.execute('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    res.status(201).json(employee[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El ID de empleado ya existe' });
    }
    console.error('Error creando empleado:', error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
});

// PUT /api/employees/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const {
      employee_id,
      full_name,
      service,
      hire_date,
      last_renewal_date,
      second_uniform_date,
      next_renewal_date,
      status,
      vest_size,
      shirt_size,
      pants_size,
      shoe_size
    } = req.body;

    await pool.execute(
      `UPDATE employees 
       SET employee_id = ?, full_name = ?, service = ?, hire_date = ?, 
           last_renewal_date = ?, second_uniform_date = ?, next_renewal_date = ?,
           status = ?, vest_size = ?, shirt_size = ?, pants_size = ?, shoe_size = ?
       WHERE employee_id = ?`,
      [
        employee_id, full_name, service, hire_date,
        last_renewal_date || null, second_uniform_date || null, next_renewal_date || null,
        status, vest_size || null, shirt_size || null, pants_size || null, shoe_size || null,
        id
      ]
    );

    const [employee] = await pool.execute('SELECT * FROM employees WHERE employee_id = ?', [id]);
    res.json(employee[0]);
  } catch (error) {
    console.error('Error actualizando empleado:', error);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.execute('DELETE FROM employees WHERE employee_id = ?', [id]);
    res.json({ message: 'Empleado eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
});

// GET /api/employees/:id/history
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const history = [];

    // Despachos
    const [dispatches] = await pool.execute(
      'SELECT * FROM dispatches WHERE employee_id = ? ORDER BY date DESC',
      [id]
    );
    for (let dispatch of dispatches) {
      const [items] = await pool.execute(
        'SELECT * FROM dispatch_items WHERE dispatch_id = ?',
        [dispatch.id]
      );
      history.push({
        type: 'dispatch',
        date: dispatch.date,
        data: { ...dispatch, items }
      });
    }

    // Recuperaciones
    const [recoveries] = await pool.execute(
      'SELECT * FROM recoveries WHERE employee_id = ? ORDER BY date DESC',
      [id]
    );
    for (let recovery of recoveries) {
      const [items] = await pool.execute(
        'SELECT * FROM recovery_items WHERE recovery_id = ?',
        [recovery.id]
      );
      history.push({
        type: 'recovery',
        date: recovery.date,
        data: { ...recovery, items }
      });
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(history);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// GET /api/employees/services
router.get('/services', authenticateToken, async (req, res) => {
  try {
    const [services] = await pool.execute(
      'SELECT DISTINCT service FROM employees WHERE service IS NOT NULL ORDER BY service ASC'
    );
    res.json(services.map(s => s.service));
  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// POST /api/employees/pending
router.post('/pending', authenticateToken, async (req, res) => {
  try {
    const {
      employee_id,
      full_name,
      service,
      hire_date,
      last_renewal_date,
      second_uniform_date,
      next_renewal_date
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO pending_employees (employee_id, full_name, service, hire_date, 
       last_renewal_date, second_uniform_date, next_renewal_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id || null, full_name, service, hire_date,
        last_renewal_date || null, second_uniform_date || null, next_renewal_date || null
      ]
    );

    const [pending] = await pool.execute('SELECT * FROM pending_employees WHERE id = ?', [result.insertId]);
    res.status(201).json(pending[0]);
  } catch (error) {
    console.error('Error creando empleado pendiente:', error);
    res.status(500).json({ error: 'Error al crear empleado pendiente' });
  }
});

// GET /api/employees/pending
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const [pending] = await pool.execute(
      'SELECT * FROM pending_employees ORDER BY created_at DESC'
    );
    res.json(pending);
  } catch (error) {
    console.error('Error obteniendo empleados pendientes:', error);
    res.status(500).json({ error: 'Error al obtener empleados pendientes' });
  }
});

// POST /api/employees/pending/:id/approve
router.post('/pending/:id/approve', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { employeeId } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [pending] = await connection.execute('SELECT * FROM pending_employees WHERE id = ?', [id]);
      if (pending.length === 0) {
        return res.status(404).json({ error: 'Empleado pendiente no encontrado' });
      }

      const p = pending[0];

      await connection.execute(
        `INSERT INTO employees (employee_id, full_name, service, hire_date, 
         last_renewal_date, second_uniform_date, next_renewal_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeId, p.full_name, p.service, p.hire_date,
          p.last_renewal_date, p.second_uniform_date, p.next_renewal_date
        ]
      );

      await connection.execute('DELETE FROM pending_employees WHERE id = ?', [id]);
      await connection.commit();

      const [employee] = await pool.execute('SELECT * FROM employees WHERE employee_id = ?', [employeeId]);
      res.json(employee[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El ID de empleado ya existe' });
    }
    console.error('Error aprobando empleado pendiente:', error);
    res.status(500).json({ error: 'Error al aprobar empleado pendiente' });
  }
});

module.exports = router;

