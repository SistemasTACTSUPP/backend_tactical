# 📦 Guía de Despliegue - Tactical Inventory API

Esta guía te ayudará a subir el backend a GitHub y desplegarlo en Render u otra plataforma.

## 📋 Pasos para subir a GitHub

### 1. Inicializar Git (si no está inicializado)
```bash
cd "C:\Users\Tactical_IT_2\Desktop\BACKEND APP"
git init
```

### 2. Configurar Git (si es primera vez)
```bash
git config user.name "Tu Nombre"
git config user.email "tu.email@ejemplo.com"
```

### 3. Agregar archivos al staging
```bash
git add .
```

### 4. Hacer commit inicial
```bash
git commit -m "Initial commit: Backend API completo"
```

### 5. Crear repositorio en GitHub
- Ve a [github.com](https://github.com) e inicia sesión
- Click en el botón "+" (arriba derecha) → "New repository"
- Nombre: `tactical-inventory-backend` (o el que prefieras)
- Descripción: "API Backend para Sistema de Gestión de Inventario Táctico"
- Elige si será público o privado
- **NO** marques "Initialize with README" (ya tenemos uno)
- Click en "Create repository"

### 6. Conectar con GitHub y subir
```bash
git remote add origin https://github.com/TU_USUARIO/tactical-inventory-backend.git
git branch -M main
git push -u origin main
```

(Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub)

---

## 🚀 Desplegar en Render.com

### Paso 1: Crear cuenta
1. Ve a [render.com](https://render.com)
2. Crea una cuenta (puedes usar GitHub para registro rápido)

### Paso 2: Crear Web Service
1. Click en "New +" → "Web Service"
2. Conecta tu repositorio de GitHub (selecciona `tactical-inventory-backend`)
3. Configura el servicio:
   - **Name**: `tactical-inventory-api` (o el que prefieras)
   - **Region**: Elige la más cercana a tus usuarios
   - **Branch**: `main`
   - **Root Directory**: ⚠️ **DEJAR VACÍO** o poner `.` (punto) - **NO** poner `src`
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (o dejar vacío si usas `render.yaml`)
   - **Start Command**: `npm start` (o dejar vacío si usas `render.yaml`)
   - **Instance Type**: Free (para empezar) o Paid (para producción)

**⚠️ IMPORTANTE**: Si ves el error "Couldn't find a package.json file in /opt/render/project/src":
- Ve a **Settings** → **Build & Deploy**
- Asegúrate que **Root Directory** esté vacío o sea `.` (punto)
- **NO** debe decir `src` o cualquier otra carpeta
- Guarda los cambios y vuelve a desplegar

### Paso 3: Configurar Variables de Entorno
En la sección "Environment", agrega:

```
NODE_ENV=production
PORT=10000
DB_HOST=tu_host_mysql
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tactical_inventory
DB_PORT=3306
JWT_SECRET=tu_secreto_jwt_muy_seguro_y_aleatorio
CORS_ORIGIN=*
```

**⚠️ IMPORTANTE**: 
- Render usa el puerto automáticamente, pero puedes dejarlo en 10000 o usar la variable `PORT` que Render asigna
- Para JWT_SECRET, genera uno seguro: puedes usar `openssl rand -hex 32` en terminal

### Paso 4: Crear Base de Datos MySQL en Render
1. Click en "New +" → "PostgreSQL" (o busca MySQL si está disponible)
2. Si no hay MySQL, puedes usar:
   - **PlanetScale** (MySQL gratis)
   - **Railway** (MySQL)
   - **AWS RDS** (pago)
   - O mantener tu MySQL local/hosting actual y configurar el acceso externo

#### Si usas PlanetScale:
1. Ve a [planetscale.com](https://planetscale.com)
2. Crea cuenta y base de datos
3. Obtén las credenciales de conexión
4. Úsalas en las variables de entorno de Render

### Paso 5: Desplegar
1. Click en "Create Web Service"
2. Render comenzará a construir y desplegar automáticamente
3. Espera a que termine (puede tardar 2-5 minutos)
4. Una vez listo, verás la URL: `https://tactical-inventory-api.onrender.com`

### Paso 6: Probar el API
```bash
curl https://tactical-inventory-api.onrender.com/health
```

Deberías recibir: `{"status":"OK","message":"API funcionando correctamente"}`

---

## 🚂 Desplegar en Railway.app

### Paso 1: Crear cuenta
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub

### Paso 2: Crear proyecto
1. Click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Elige tu repositorio `tactical-inventory-backend`

### Paso 3: Agregar MySQL
1. Click en "+ New" → "Database" → "Add MySQL"
2. Railway creará automáticamente una base de datos MySQL

### Paso 4: Configurar Variables
Railway detecta automáticamente las variables, pero puedes agregar/editar en "Variables":
- `JWT_SECRET`: Genera uno seguro
- Las variables de DB se configuran automáticamente desde el servicio MySQL

### Paso 5: Configurar el dominio
1. Ve a "Settings" → "Generate Domain"
2. Railway asignará una URL como: `tactical-inventory-api.up.railway.app`

---

## 🐳 Desplegar con Docker (Opcional)

Si quieres usar Docker, crea un `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

Y un `.dockerignore`:
```
node_modules
.env
.git
*.log
```

---

## ✅ Checklist antes de desplegar

- [ ] ✅ Base de datos MySQL creada y accesible
- [ ] ✅ Schema ejecutado en la base de datos (`schema.sql`)
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ JWT_SECRET cambiado a uno seguro
- [ ] ✅ CORS configurado correctamente (o usa el dominio específico de tu app Flutter)
- [ ] ✅ Puerto configurado (Render usa variables automáticas)
- [ ] ✅ Repositorio subido a GitHub

---

## 🔧 Actualizar la App Flutter

Una vez desplegado, actualiza `api_config.dart` en tu app Flutter:

```dart
static const String apiBaseUrl = 'https://tactical-inventory-api.onrender.com/api';
static const String wsBaseUrl = 'https://tactical-inventory-api.onrender.com';
```

---

## 🐛 Solución de problemas

### Error: "Couldn't find a package.json file in /opt/render/project/src"
**Causa**: Render está buscando el `package.json` en la carpeta `src` en lugar de la raíz.

**Solución**:
1. Ve a tu servicio en Render → **Settings** → **Build & Deploy**
2. Busca el campo **Root Directory**
3. **BÓRRALO completamente** o pon solo `.` (punto)
4. Guarda los cambios
5. Ve a **Manual Deploy** → **Deploy latest commit**

**Alternativa**: Si el problema persiste:
- Verifica que el `package.json` esté en la raíz del repositorio (no dentro de `src/`)
- Asegúrate de que el repositorio esté correctamente conectado
- Usa `npm` en lugar de `yarn` (cambia en Build Command si es necesario)

### Error de conexión a base de datos
- Verifica que las credenciales sean correctas
- Asegúrate que la base de datos permita conexiones externas
- Verifica el firewall y seguridad de red

### Error 503 o timeout
- Render puede poner el servicio en "sleep" después de 15 min de inactividad (plan gratis)
- Considera usar un servicio de pago o mantenerlo activo con pings periódicos

### Error CORS
- Verifica que `CORS_ORIGIN` esté configurado correctamente
- En producción, usa el dominio específico: `CORS_ORIGIN=https://tu-dominio.com`

### Error JWT
- Asegúrate de que `JWT_SECRET` sea el mismo en todas las instancias
- Genera uno nuevo si es necesario

---

## 📞 Soporte

Si tienes problemas, revisa los logs en Render/Railway para ver errores específicos.

