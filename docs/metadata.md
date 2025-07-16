# Metadata de Reportes

## Empresa
- `empresa`: `{ id: string, nombre: string }` (objeto completo, obligatorio)
- `empresaId`: `string` (obligatorio, igual a empresa.id)
- `empresaNombre`: `string` (obligatorio, igual a empresa.nombre)

## Sucursal
- `sucursal`: `string` (opcional, nombre o dirección)

## Formulario
- `formulario`: `{ id: string, nombre: string }` (objeto completo, obligatorio)
- `formularioId`: `string` (obligatorio, igual a formulario.id)
- `formularioNombre`: `string` (obligatorio, igual a formulario.nombre)

## Ejemplo de documento de reporte

```json
{
  "empresa": { "id": "abc123", "nombre": "Mi Empresa" },
  "empresaId": "abc123",
  "empresaNombre": "Mi Empresa",
  "sucursal": "Sucursal Centro",
  "formulario": { "id": "f1", "nombre": "Checklist Seguridad" },
  "formularioId": "f1",
  "formularioNombre": "Checklist Seguridad",
  "respuestas": [["Conforme", "No conforme"]],
  "comentarios": [["Todo ok", "Falta señalización"]],
  "imagenes": [[null, "url.jpg"]],
  "secciones": [
    { "nombre": "General", "preguntas": ["¿Hay extintores?", "¿Hay salidas de emergencia?"] }
  ],
  "firmaAuditor": "data:image/png;base64,...",
  "firmaResponsable": "data:image/png;base64,...",
  "fechaGuardado": "2024-06-01T12:00:00Z"
}
```

## Notas
- Siempre usar los helpers de `useMetadataService.js` para leer y guardar metadatos.
- Si cambias el modelo, actualiza este archivo y el servicio. 