# ✅ Guía de Verificación: Conexión MySQL en Render

## 🔍 Pasos para Verificar

### 1. Verifica las Variables de Entorno en Render

1. **Ve a tu servicio en Render**
   - Entra a https://dashboard.render.com
   - Selecciona tu servicio `backend-tactical` (o el nombre que le pusiste)

2. **Ve a Environment Variables**
   - Click en **Environment** en el menú lateral
   - Debes ver estas variables configuradas:

```
✅ DB_HOST = (tu host de MySQL, ej: mysql.example.com o una IP)
✅ DB_USER = (tu usuario de MySQL)
✅ DB_PASSWORD = (tu contraseña de MySQL)
✅ DB_NAME = tactical_inventory
✅ DB_PORT = 3306
✅ JWT_SECRET = (un secreto aleatorio)
```

### 2. Verifica los Logs en Render

1. **Ve a Logs**
   - En el menú lateral, click en **Logs**
   - Busca líneas que digan:
     - `❌ Error conectando a MySQL:` - Si aparece, hay un error
     - `✅ Conectado a MySQL:` - Si aparece, está funcionando
   - También verás la configuración actual si hay error

### 3. Problemas Comunes y Soluciones

#### ❌ Error: "Access denied for user"
**Causa**: Usuario o contraseña incorrectos
**Solución**: 
- Verifica que `DB_USER` y `DB_PASSWORD` sean correctos
- Asegúrate de que no haya espacios extra en las variables

#### ❌ Error: "Can't connect to MySQL server"
**Causa**: El host no es accesible o está mal configurado
**Solución**:
- Si es MySQL local: No funcionará, necesitas MySQL en la nube
- Si es MySQL remoto: Verifica que el host sea correcto
- Verifica que el firewall permita conexiones desde Render

#### ❌ Error: "Unknown database"
**Causa**: La base de datos no existe
**Solución**:
- Crea la base de datos `tactical_inventory` en tu MySQL
- O ejecuta el archivo `schema.sql` para crearla

#### ❌ Variables muestran "NO CONFIGURADO"
**Causa**: Las variables de entorno no están configuradas
**Solución**:
- Ve a **Environment** en Render
- Agrega cada variable manualmente
- Guarda los cambios (Render redeployará automáticamente)

### 4. Si Usas MySQL Local (No Funcionará)

Si tu MySQL está en tu computadora local, **NO funcionará** con Render porque:
- Render está en la nube
- No puede acceder a tu computadora local
- Necesitas MySQL en la nube

**Opciones:**
- ✅ **PlanetScale** (gratis): https://planetscale.com
- ✅ **Railway** (gratis): https://railway.app (agrega MySQL service)
- ✅ **AWS RDS** (pago)
- ✅ **MySQL en otro servidor** (que permita conexiones remotas)

### 5. Si Usas MySQL en la Nube

Si ya tienes MySQL en la nube (PlanetScale, Railway, etc.):

1. **Obtén las credenciales** de tu proveedor
2. **Configura en Render**:
   ```
   DB_HOST = (el host que te dieron, ej: us-east.connect.psdb.cloud)
   DB_USER = (el usuario)
   DB_PASSWORD = (la contraseña)
   DB_NAME = tactical_inventory
   DB_PORT = 3306 (o el puerto que te indiquen)
   ```

3. **Asegúrate de crear la base de datos**:
   - Ejecuta el archivo `schema.sql` en tu MySQL
   - O crea la base de datos manualmente

### 6. Verificar que Funciona

Después de configurar todo:

1. **Redeploy manual**:
   - Ve a **Manual Deploy** → **Deploy latest commit**

2. **Revisa los logs**:
   - Debe aparecer: `✅ Conectado a MySQL: tactical_inventory`
   - NO debe aparecer: `❌ Error conectando a MySQL`

3. **Prueba el API**:
   ```bash
   curl https://backend-tactical.onrender.com/health
   ```
   Debe responder: `{"status":"OK","message":"API funcionando correctamente"}`

---

## 📋 Checklist

- [ ] Variables de entorno configuradas en Render
- [ ] DB_HOST tiene el valor correcto
- [ ] DB_USER tiene el valor correcto
- [ ] DB_PASSWORD tiene el valor correcto
- [ ] DB_NAME es `tactical_inventory`
- [ ] La base de datos existe en MySQL
- [ ] El schema.sql fue ejecutado (tablas creadas)
- [ ] Los logs muestran "✅ Conectado a MySQL"
- [ ] El endpoint /health responde correctamente

---

## 🆘 Si Nada Funciona

1. **Revisa los logs completos** en Render
2. **Copia el error exacto** que aparece
3. **Verifica** que las variables estén sin espacios extra
4. **Prueba conectarte** a MySQL desde otro cliente (ej: MySQL Workbench) con las mismas credenciales

