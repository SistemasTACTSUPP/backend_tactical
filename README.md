# Tactical Inventory API

API Backend para el Sistema de Gestión de Inventario Táctico - Aplicación Flutter

## 🚀 Características

- API RESTful con Express.js
- Base de datos MySQL
- Autenticación JWT
- WebSocket con Socket.io para notificaciones en tiempo real
- Soporte para múltiples almacenes (CEDIS, ACUÑA, NLD)
- Gestión completa de inventario, entradas, salidas, recuperaciones, empleados y pedidos

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm >= 9.0.0

## 🔧 Instalación

1. Clonar el repositorio o descargar los archivos
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

4. Editar `.env` con tus credenciales de MySQL:
```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tactical_inventory
JWT_SECRET=tu_secreto_jwt_muy_seguro
```

5. Crear la base de datos:
```bash
mysql -u root -p < schema.sql
```
O ejecutar el archivo `schema.sql` en MySQL Workbench o tu cliente MySQL preferido.

## 🏃 Ejecutar

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión con código de acceso
- `GET /api/auth/verify` - Verificar token

### Inventario
- `GET /api/inventory/:site` - Obtener inventario por sitio
- `POST /api/inventory/:site` - Crear item de inventario
- `PUT /api/inventory/:site/:id` - Actualizar item
- `PATCH /api/inventory/:site/:id/stock` - Actualizar stock
- `DELETE /api/inventory/:site/:id` - Eliminar item

### Entradas
- `GET /api/entries` - Listar entradas
- `POST /api/entries` - Crear entrada
- `PUT /api/entries/:id` - Actualizar entrada
- `DELETE /api/entries/:id` - Eliminar entrada

### Salidas/Despachos
- `GET /api/dispatches` - Listar despachos
- `POST /api/dispatches` - Crear despacho
- `PATCH /api/dispatches/:id/approve` - Aprobar despacho
- `PUT /api/dispatches/:id` - Actualizar despacho
- `DELETE /api/dispatches/:id` - Eliminar despacho

### Recuperaciones
- `GET /api/recoveries` - Listar recuperaciones
- `POST /api/recoveries` - Crear recuperación
- `PUT /api/recoveries/:id` - Actualizar recuperación
- `DELETE /api/recoveries/:id` - Eliminar recuperación

### Empleados
- `GET /api/employees` - Listar empleados
- `POST /api/employees` - Crear empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado
- `GET /api/employees/:id/history` - Historial del empleado
- `GET /api/employees/pending` - Empleados pendientes
- `POST /api/employees/pending` - Crear empleado pendiente

### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Crear pedido
- `GET /api/orders/:id` - Obtener pedido
- `GET /api/orders/suggestions` - Sugerencias de pedido
- `DELETE /api/orders/:id` - Eliminar pedido

### Inventario Cíclico
- `GET /api/cyclic-inventory/tasks` - Listar tareas
- `POST /api/cyclic-inventory/tasks` - Crear tarea
- `GET /api/cyclic-inventory/tasks/:id` - Obtener tarea
- `PATCH /api/cyclic-inventory/tasks/:id/complete` - Completar tarea
- `GET /api/cyclic-inventory/stats` - Estadísticas

## 🚀 Despliegue

### Render.com

1. Crear cuenta en [Render.com](https://render.com)
2. Crear nuevo Web Service
3. Conectar tu repositorio de GitHub
4. Configurar:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `DB_HOST` (tu host de MySQL)
     - `DB_USER`
     - `DB_PASSWORD`
     - `DB_NAME`
     - `JWT_SECRET`
     - `PORT` (Render lo asigna automáticamente)
     - `NODE_ENV=production`

### Railway.app

1. Crear cuenta en [Railway.app](https://railway.app)
2. Nuevo proyecto desde GitHub
3. Agregar MySQL service
4. Configurar variables de entorno
5. Deploy automático

### Otros servicios

- **Heroku**: Requiere `Procfile` con `web: node src/server.js`
- **Vercel**: Configurar como servidor Node.js
- **AWS/GCP/Azure**: Seguir guías específicas de cada plataforma

## 📝 Notas

- Asegúrate de que tu base de datos MySQL esté accesible desde el servicio de hosting
- Para producción, usa un servicio de MySQL gestionado (PlanetScale, AWS RDS, etc.)
- Cambia el `JWT_SECRET` por uno seguro y aleatorio en producción
- Configura CORS apropiadamente para tu dominio de la app Flutter

## 🔒 Seguridad

- Las rutas están protegidas con autenticación JWT (excepto `/api/auth/login`)
- Usa HTTPS en producción
- Valida y sanitiza todas las entradas
- Implementa rate limiting en producción

## 📄 Licencia

ISC

