# Datos de Instituciones Educativas del MINEDU

Este directorio contiene los datos del padrón de instituciones educativas del Ministerio de Educación del Perú.

---

## 📥 Cómo Obtener los Datos Oficiales

### Paso 1: Descargar el Padrón del MINEDU

1. Visita: **http://escale.minedu.gob.pe/padron-de-iiee**

2. Selecciona los filtros:
   - **Nivel**: Primaria, Secundaria (o ambos)
   - **Gestión**: Todas
   - **Área**: Todas
   - **Estado**: Activo (recomendado)

3. Click en **"Descargar"** → Selecciona formato **Excel**

4. Guarda el archivo descargado como:
   ```
   apps/web/data/minedu-padron.xlsx
   ```

### Paso 2: Importar a la Base de Datos

```bash
cd apps/web

# Instalar tsx si no está instalado
pnpm add -D tsx

# Importar todos los datos
pnpm run import:minedu

# O con opciones específicas:
pnpm run import:minedu -- --nivel=primaria
pnpm run import:minedu -- --nivel=secundaria
pnpm run import:minedu -- --solo-activas
pnpm run import:minedu -- --limpiar
```

---

## 🧪 Datos de Prueba (Desarrollo)

Si solo necesitas datos de prueba para desarrollo:

```bash
cd apps/web
pnpm run seed:minedu
```

Esto insertará 50 instituciones de ejemplo.

---

## 📊 Estructura del Archivo

El archivo Excel del MINEDU debe contener estas columnas (pueden variar los nombres):

| Columna | Alternativas | Descripción |
|---------|--------------|-------------|
| `cod_mod` | `codigo_modular`, `COD_MOD` | Código Modular (7 dígitos) |
| `nombre_ie` | `nombre`, `NOMBRE_IE` | Nombre de la institución |
| `nivel` | `nivel_modalidad`, `NIVEL` | Nivel educativo |
| `gestion` | `tipo_gestion`, `GESTION` | Tipo de gestión |
| `departamento` | `dpto`, `DEPARTAMENTO` | Departamento |
| `provincia` | `prov`, `PROVINCIA` | Provincia |
| `distrito` | `dist`, `DISTRITO` | Distrito |
| `direccion` | `dir`, `DIRECCION` | Dirección |
| `estado` | `ESTADO` | Estado (Activo/Inactivo) |

El script de importación detecta automáticamente los nombres de columnas.

---

## 🔄 Actualización Periódica

El MINEDU actualiza el padrón anualmente (generalmente en marzo).

Para actualizar los datos:

```bash
# 1. Descargar nuevo archivo del MINEDU
# 2. Reemplazar apps/web/data/minedu-padron.xlsx
# 3. Ejecutar actualización
pnpm run import:minedu -- --actualizar
```

---

## 📈 Estadísticas Esperadas

Después de importar datos reales:

- **Total**: ~100,000+ instituciones
- **Primaria**: ~40,000
- **Secundaria**: ~15,000
- **Departamentos**: 25
- **Provincias**: ~196
- **Distritos**: ~1,874

---

## 🔍 Verificación

Después de importar, verifica en la aplicación:

1. Abre: `http://localhost:3000/onboarding`
2. Selecciona nivel (Primaria/Secundaria)
3. Deberías ver todas las regiones del Perú
4. Al buscar, deberías encontrar instituciones reales

---

## 📞 Soporte

Si tienes problemas para descargar los datos:

**ESCALE - MINEDU**
- Email: estadistica@minedu.gob.pe
- Teléfono: (01) 615-5800 (anexo 26710)
- Soporte: soporte.escale@minedu.gob.pe

---

## ⚠️ Importante

- **No subir el archivo Excel a Git** (está en .gitignore)
- El archivo puede pesar 10-50 MB
- La importación puede tomar 5-10 minutos
- Asegúrate de tener espacio en la base de datos

---

**Última actualización**: 21 de Marzo de 2026
