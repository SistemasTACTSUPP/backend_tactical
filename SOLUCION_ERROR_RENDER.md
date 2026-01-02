# 🔧 Solución: Error "Couldn't find package.json in /opt/render/project/src"

## ❌ El Problema

Render está buscando el `package.json` en la carpeta `src/` cuando debería buscarlo en la raíz del proyecto.

Error que ves:
```
error Couldn't find a package.json file in "/opt/render/project/src"
```

## ✅ Solución Rápida

### Opción 1: Corregir en Render Dashboard (Recomendado)

1. **Ve a tu servicio en Render**
   - Entra a [dashboard.render.com](https://dashboard.render.com)
   - Selecciona tu servicio `tactical-inventory-api`

2. **Ve a Settings**
   - Click en **Settings** en el menú lateral
   - Scroll hasta **Build & Deploy**

3. **Corrige el Root Directory**
   - Busca el campo **Root Directory**
   - **BÓRRALO completamente** (déjalo vacío)
   - O pon solo `.` (punto)
   - **NO** debe decir `src` o cualquier otra carpeta

4. **Verifica Build Command**
   - **Build Command**: `npm install` (o déjalo vacío)
   - **Start Command**: `npm start`

5. **Guarda y Redespliega**
   - Click en **Save Changes**
   - Ve a **Manual Deploy** → **Deploy latest commit**

### Opción 2: Usar render.yaml (Automático)

Si ya creaste el archivo `render.yaml` en la raíz del proyecto:

1. **Conecta el repositorio a Render**
   - Render detectará automáticamente el `render.yaml`
   - Las configuraciones se aplicarán automáticamente

2. **Si ya tienes el servicio creado**
   - Render debería usar el `render.yaml` automáticamente
   - Si no, elimina el servicio y créalo de nuevo desde GitHub

## 📋 Verificación

Después de corregir, verifica que:

- ✅ El `package.json` está en la raíz del repositorio (no en `src/`)
- ✅ El Root Directory en Render está vacío o es `.`
- ✅ Build Command es `npm install` (no `yarn install`)
- ✅ Start Command es `npm start`

## 🔍 Estructura Correcta del Proyecto

```
BACKEND APP/
├── package.json          ← Debe estar aquí (raíz)
├── src/
│   └── server.js
├── render.yaml           ← Opcional, pero recomendado
└── ...
```

**NO debe ser así:**
```
BACKEND APP/
└── src/
    ├── package.json      ← ❌ INCORRECTO
    └── server.js
```

## 📝 Notas Adicionales

- Si Render sigue usando `yarn` en lugar de `npm`, cambia el Build Command explícitamente a `npm install`
- El archivo `render.yaml` que creamos automáticamente configura todo correctamente
- Si tienes problemas, elimina el servicio y créalo de nuevo desde cero

## ✅ Después de Corregir

Una vez corregido, el build debería funcionar y verás:
```
✓ npm install
✓ npm start
✓ Server running on port 10000
```

