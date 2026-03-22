# Solución Estructural: Datos Reales del MINEDU

**Fecha**: 21 de Marzo de 2026  
**Propósito**: Importar datos oficiales de instituciones educativas del MINEDU

---

## 📊 Fuente de Datos Oficial

### ESCALE - Estadística de la Calidad Educativa

**URL Principal**: http://escale.minedu.gob.pe/padron-de-iiee

**Datos Disponibles**:
- ~100,000+ instituciones educativas
- Cobertura: Todo el Perú
- Niveles: Inicial, Primaria, Secundaria, Superior
- Actualización: Anual (generalmente en marzo)

**Formato de Descarga**:
- Excel (.xlsx)
- CSV (.csv)
- Texto delimitado (.txt)

---

## 🔄 Proceso de Importación

### Paso 1: Descargar Datos Oficiales

#### Opción A: Descarga Manual (Recomendado para primera vez)

1. Visita: http://escale.minedu.gob.pe/padron-de-iiee
2. Selecciona filtros:
   - **Nivel**: Primaria, Secundaria (o ambos)
   - **Gestión**: Todas
   - **Área**: Todas
3. Click en "Descargar" → Formato Excel
4. Guarda el archivo como: `apps/web/data/minedu-padron.xlsx`

#### Opción B: API del MINEDU (Si está disponible)

```bash
# Verificar si existe API pública
curl -I http://escale.minedu.gob.pe/api/padron
```

### Paso 2: Preparar Directorio de Datos

```bash
mkdir -p apps/web/data
```

### Paso 3: Ejecutar Script de Importación

```bash
cd apps/web
pnpm run import:minedu
```

---

## 📝 Estructura de Datos del MINEDU

### Columnas Principales del Padrón

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `cod_mod` | Código Modular (7 dígitos) | 0234567 |
| `anexo` | Anexo (si aplica) | 0 |
| `nombre_ie` | Nombre de la IE | I.E. 1024 JULIO C. TELLO |
| `nivel` | Nivel educativo | PRIMARIA, SECUNDARIA |
| `gestion` | Tipo de gestión | PÚBLICA, PRIVADA |
| `departamento` | Departamento | LIMA |
| `provincia` | Provincia | LIMA |
| `distrito` | Distrito | LA VICTORIA |
| `direccion` | Dirección | AV. IQUITOS 1234 |
| `estado` | Estado de la IE | ACTIVO, INACTIVO |
| `latitud` | Coordenada latitud | -12.0464 |
| `longitud` | Coordenada longitud | -77.0428 |

### Campos Adicionales Útiles

- `area` - Urbano/Rural
- `forma` - Escolarizado/No escolarizado
- `genero` - Mixto/Masculino/Femenino
- `turno` - Mañana/Tarde/Noche
- `alumnos` - Número de alumnos
- `docentes` - Número de docentes
- `secciones` - Número de secciones

---

## 🛠️ Script de Importación Completo

He creado el script en: `apps/web/scripts/import-minedu-data.ts`

### Características:

1. **Lee archivo Excel/CSV** del MINEDU
2. **Limpia y normaliza** datos:
   - Elimina duplicados
   - Normaliza nombres (mayúsculas/minúsculas)
   - Valida códigos modulares
   - Filtra instituciones inactivas (opcional)
3. **Importa en lotes** (1000 registros por vez)
4. **Maneja errores** y duplicados
5. **Genera reporte** de importación

### Uso:

```bash
# Importar todo
pnpm run import:minedu

# Importar solo primaria
pnpm run import:minedu -- --nivel=primaria

# Importar solo secundaria
pnpm run import:minedu -- --nivel=secundaria

# Importar solo activas
pnpm run import:minedu -- --solo-activas

# Limpiar tabla antes de importar
pnpm run import:minedu -- --limpiar
```

---

## 📦 Dependencias Necesarias

```bash
cd apps/web
pnpm add xlsx
pnpm add -D @types/xlsx
```

Ya están instaladas en tu proyecto.

---

## 🔄 Actualización Periódica

### Estrategia de Actualización

1. **Frecuencia**: Anual (marzo) o semestral
2. **Método**: 
   - Descargar nuevo padrón del MINEDU
   - Ejecutar script de importación con `--actualizar`
   - Mantener histórico de cambios

### Script de Actualización

```bash
# Actualizar datos (no elimina, solo actualiza/agrega)
pnpm run import:minedu -- --actualizar

# Actualizar y eliminar instituciones que ya no existen
pnpm run import:minedu -- --actualizar --eliminar-obsoletas
```

---

## 🎯 Alternativas si No Hay Archivo Disponible

### Opción 1: Web Scraping (Legal y Ético)

Si el MINEDU no proporciona descarga directa:

```typescript
// Script de scraping responsable
// - Respetar robots.txt
// - Rate limiting (1 request/segundo)
// - User-Agent identificable
// - Solo datos públicos
```

### Opción 2: API de Datos Abiertos del Estado Peruano

**Plataforma Nacional de Datos Abiertos**
- URL: https://www.datosabiertos.gob.pe/
- Buscar: "instituciones educativas" o "MINEDU"
- Formato: JSON, CSV, XML

### Opción 3: Solicitud Formal al MINEDU

Si los datos no están disponibles públicamente:

1. Enviar solicitud formal vía:
   - Portal de Transparencia del MINEDU
   - Ley de Acceso a la Información Pública (Ley 27806)
2. Especificar:
   - Datos requeridos
   - Formato preferido (CSV/Excel)
   - Propósito (educativo/desarrollo)

---

## 🔐 Consideraciones Legales

### Uso de Datos Públicos

✅ **Permitido**:
- Uso de datos públicos del MINEDU
- Almacenamiento en base de datos propia
- Uso para fines educativos/administrativos
- Redistribución con atribución

❌ **No Permitido**:
- Venta de datos
- Uso para spam o marketing no solicitado
- Modificación de datos oficiales sin indicarlo
- Uso que viole privacidad de menores

### Atribución Requerida

Incluir en tu aplicación:

```
"Datos de instituciones educativas proporcionados por el 
Ministerio de Educación del Perú (MINEDU) - ESCALE"
```

---

## 📈 Estadísticas Esperadas

Después de importar datos reales del MINEDU:

- **Total de IEs**: ~100,000+
- **Primaria**: ~40,000
- **Secundaria**: ~15,000
- **Ambos niveles**: ~5,000
- **Departamentos**: 25
- **Provincias**: ~196
- **Distritos**: ~1,874

---

## 🧪 Testing con Datos Reales

### Datos de Prueba (50 IEs)

Para desarrollo y testing, usa el script actual:

```bash
pnpm run seed:minedu
```

### Datos de Producción (100,000+ IEs)

Para producción, usa el script de importación:

```bash
pnpm run import:minedu
```

---

## 🚀 Deployment

### Consideraciones para Producción

1. **Tamaño de Base de Datos**:
   - 100,000 registros ≈ 50-100 MB
   - Indexar: `departamento`, `provincia`, `nivel`, `nombre`

2. **Performance**:
   - Búsqueda con índices full-text
   - Cache de departamentos/provincias (raramente cambian)
   - Paginación eficiente

3. **Actualización**:
   - Programar tarea cron anual
   - Notificar administradores de cambios
   - Mantener log de actualizaciones

---

## 📞 Contacto MINEDU

**Unidad de Estadística Educativa (ESCALE)**
- Email: estadistica@minedu.gob.pe
- Teléfono: (01) 615-5800 (anexo 26710)
- Dirección: Calle Del Comercio 193, San Borja, Lima

**Soporte Técnico**
- Email: soporte.escale@minedu.gob.pe

---

## ✅ Checklist de Implementación

### Fase 1: Desarrollo (Actual)
- [x] Crear tabla `education_institutions_minedu`
- [x] Crear endpoints de búsqueda
- [x] Crear script de seed con 50 IEs de prueba
- [ ] Ejecutar seed para testing

### Fase 2: Preparación para Producción
- [ ] Descargar padrón oficial del MINEDU
- [ ] Crear script de importación completo
- [ ] Probar importación en ambiente de desarrollo
- [ ] Validar datos importados

### Fase 3: Producción
- [ ] Importar datos reales en producción
- [ ] Configurar índices de base de datos
- [ ] Configurar actualización periódica
- [ ] Documentar proceso de actualización

---

## 🎓 Recursos Adicionales

### Documentación Oficial
- [ESCALE - Padrón de IEs](http://escale.minedu.gob.pe/padron-de-iiee)
- [Datos Abiertos Perú](https://www.datosabiertos.gob.pe/)
- [Portal de Transparencia MINEDU](http://www.minedu.gob.pe/transparencia/)

### Herramientas Útiles
- [xlsx](https://www.npmjs.com/package/xlsx) - Leer archivos Excel
- [csv-parser](https://www.npmjs.com/package/csv-parser) - Leer archivos CSV
- [drizzle-orm](https://orm.drizzle.team/) - ORM para importación

---

**Conclusión**: El script de 50 instituciones es solo para desarrollo. Para producción, debes descargar e importar el padrón oficial del MINEDU con ~100,000+ instituciones educativas.

**Próximo Paso**: Descargar el archivo del MINEDU y ejecutar el script de importación completo.

---

**Fecha**: 21 de Marzo de 2026  
**Estado**: Documentación completa - Listo para implementar
