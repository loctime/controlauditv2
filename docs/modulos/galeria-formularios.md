# Galería de Formularios

## Qué hace

Biblioteca pública de formularios compartidos entre usuarios. Permite descubrir, evaluar y copiar formularios de otros admins para usarlos como base propia.

## Ruta

- `/formulario` — acceso a la galería y creación de formularios nuevos

## Funcionalidades confirmadas en código

Todas en `src/components/pages/formulario/GaleriaFormulariosPublicos.jsx`:

- **Búsqueda** por nombre del formulario, email del creador o nombre del creador
- **Filtros**: todos, más copiados, mejor valorados, menos preguntas, más preguntas
- **Rating**: promedio calculado dinámicamente con contador de votos (`ratingsCount`). Precisión 0.5 en vista, precisión 1 al votar
- **Contador de copias**: campo `copiadoCount`. Lógica anti-duplicado: verifica `usuariosQueCopiaron` antes de incrementar
- **Accordion**: muestra secciones y preguntas anidadas dentro de cada formulario
- **Copia de formulario**: crea un documento nuevo e independiente. Editar el original no afecta las copias

## Notas importantes

- El creador de un formulario no puede copiarlo ni calificarlo (botones deshabilitados con tooltip).
- Los **chips de estado "público / compartido / propio"** que mencionaba documentación vieja **no se renderizan visualmente**. La lógica de `esPropio` y `yaCopiado` existe en el código pero solo se usa para habilitar/deshabilitar botones, no para mostrar chips de estado en la UI. Es deuda visual menor.
- Copiar un formulario genera un documento completamente independiente en Firestore. No hay vínculo entre original y copia.
