# Sistema visual 3D — español

La referencia de dirección de Pedro es la lámina mecánica de Dilum Sanjaya:
https://x.com/DilumSanjaya/status/2076711723437068491/video/1

La cualidad a trasladar al curso es un objeto legible, con profundidad, detalles constructivos y movimiento que explica una operación. La geometría no debe sugerir que una operación matemática es una pieza real de hardware. Los ejemplos numéricos deben identificarse como didácticos y salir de cálculos reproducibles.

## Visor compartido

`Figure` presenta título editorial, leyenda y explicación fuera del canvas. En español ofrece pausa, cámara de autor/frontal/superior, zoom, etiquetas, alta definición y pantalla completa cuando el navegador la soporta. Los selectores semánticos admiten flechas, Inicio y Fin. El inglés conserva su explorador y no recibe nuevas inserciones editoriales.

`Stage` monta WebGL solo cerca de la pantalla, mide las piezas para encuadrarlas, ajusta sombras y reduce calidad cuando cae el rendimiento. Las figuras usan la misma preferencia de pausa que el movimiento reducido. Alta definición añade oclusión ambiental N8AO; puede reducirse con el gobernador de rendimiento.

`VisualSlot` importa cada escena al acercarse a ella, mantiene separada la identidad de cada diagrama y ofrece reintento ante un error de carga. No descargar todas las escenas al abrir una lección.

## Composición

- Las piezas explicativas y las etiquetas entran en el cálculo de encuadre.
- Marcos, polvo y trazas decorativas llevan `userData.noFit`; no alejan la cámara.
- Reservar etiquetas cortas para identificar piezas. Explicaciones y cifras extensas van en HTML.
- Comprobar proyecciones reales: posiciones 3D separadas pueden solaparse en pantalla.
- El bisel, la rugosidad, la iluminación y las sombras deben mostrar volumen sin ocultar el significado del color.
- No añadir engranajes o animaciones que sugieran relaciones inexistentes.

## Cobertura de esta revisión

El mapa español permite buscar entre todos los módulos, seleccionar uno, navegar por sus prerrequisitos y sus secciones, y abrir su diagrama principal sin salir del mapa.

Se añaden escenas específicas en `image-models:4`, `huggingface-hub:5`, `unsloth:5` y `hermes-slash:2`; la escena principal de atención tiene una nueva composición en español. Las mejoras de visor y primitivas se aplican al conjunto del curso. Esto no significa que cada una de las escenas haya sido redibujada o revisada individualmente.

La cobertura por sección se comprueba con `npm run check:coverage`; referencias y bibliografías no necesitan un diagrama por el mero hecho de aparecer en el informe.
