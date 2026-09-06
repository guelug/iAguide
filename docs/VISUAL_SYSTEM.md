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

## Referencias ampliadas y laboratorio (6 septiembre)

Pedro añadió referencias de orrery, insecto, reactor desmontado, superficie gravitatoria, robot, telemetría, casa seccionada, turbina, planeta y motor. El patrón común es una pieza protagonista con detalle constructivo, un contexto editorial claro y controles conectados a la simulación. No trasladamos adornos mecánicos a ecuaciones como si fueran hardware real.

El laboratorio `/es/lab` cataloga los diagramas insertados en las lecciones ES (incluyendo una vista principal por módulo) y monta solo la lámina seleccionada. Los enlaces llevan el identificador `scene` y permiten abrir directamente una figura. El índice y las secciones salen de los MDX, no de un inventario manual desincronizado. Las figuras dentro de las lecciones enlazan al mismo laboratorio. No existe una traducción nueva al inglés.

La cámara incorpora giro y elevación ajustables por teclado. El render ES usa el mapeo tonal del estudio para retener detalle en los reflejos; el render EN mantiene `flat`. El laboratorio da más altura al visor sin instanciar una segunda escena.

Criterios para cada rediseño:

1. La geometría debe enseñar un mecanismo específico y conservar su significado al separar piezas.
2. Las magnitudes, curvas y contadores derivan de un modelo explícito. Nada de telemetría decorativa.
3. Los controles cambian tanto la representación como la explicación; reiniciar recupera un estado definido.
4. Las etiquetas son cortas; cálculos y detalles permanecen fuera del canvas y accesibles.
5. Verificar escritorio y móvil, estados extremos, pausa y movimiento reducido. Un build verde no certifica el acabado visual.

La nueva `attention:4` sustituye un uso duplicado de la escena de atención que tenía una leyenda de caché KV incorrecta para su contenido. La nueva maqueta representa ocho capas y dieciséis posiciones; cada posición agrupa K y V de dos cabezas de dimensión cuatro en FP16, con batch uno. Cada token añade 256 bytes. Se muestra explícitamente que las bandejas no son tarjetas físicas.

En esta ampliación se rehacen los principales ES de tokenización (fusiones BPE calculadas), modelos de imagen (banco con carcasas y textura RGB procedimental), memoria/hardware (GPU desmontable y presupuesto en GiB) y entrenamiento (superficie MSE y descenso calculado). Sus componentes ingleses se conservan por separado. La alta definición se activa inicialmente en el laboratorio, donde solo hay un visor, y sigue siendo opcional en la lección.

Verificación numérica: KV de ocho tokens = 2048 B, nueve = 2304 B; modelo de 8B a cuatro bits = 3,725 GiB ideales, más 4 GiB de KV a 32 × 1024 tokens y 1,5 GiB de reserva; descenso MSE con tasa 0,12 desde (2,4; −0,8) produce (2,016; 0,2128) y baja la pérdida de 11,468 a 3,89015168. Estas cifras se contrastaron con la interfaz. Catálogo: 262 diagramas en 96 módulos. El resto de escenas conserva su geometría anterior: el catálogo completo no debe presentarse como 262 rediseños terminados.

## Hardware y procesos: NVIDIA y Apple Max

Tres nuevas láminas ES amplían `memory-hardware` a seis figuras:

- `:4`: anatomía comparada, placas, paquetes de memoria, disipador, tornillos y conexiones; NVIDIA RTX 5090 y dos configuraciones de M4 Max. Selección de pieza, cubierta, despiece y separación. Geometría topológica, no un plano industrial exacto.
- `:5`: banco de carga, prefill y decode; animaciones distintas para pesos, tokens y lectura/escritura de KV. NVIDIA separa RAM y VRAM; Apple usa memoria compartida. Fases por teclado, repetir y pausa; tabla accesible con fase resaltada. La velocidad visual no representa mediciones.
- `:6`: calculadora de capacidad y tiempo ideal de lectura con gráfico SVG de escala común. Compara RTX 5090, M4 Max 16/40 y M3 Max 16/40. GB decimales, precisión y reservas explícitas, avisos de exceso y fuentes oficiales. Evita controles de cámara en una lámina cuantitativa plana.

Se corrigieron afirmaciones del texto ES que convertían ancho de banda en rendimiento garantizado. Las cifras proceden de las fichas oficiales de NVIDIA y Apple enlazadas en cada instrumento. Ni una reserva ilustrativa es memoria libre medida, ni una cifra de ancho de banda describe todas las variantes Max.

QA: valores iniciales de la calculadora 4 GB de pesos, 14 GB totales y lecturas ideales de 2,23 / 7,33 / 10 ms; a 120 mil millones y 16 bits, 250 GB totales y exceso de 218/122/122 GB. Cambio M4 Max 128→36 GB y 546→410 GB/s; cubierta, separación máxima, fases y pausa probados. Catálogo resultante: 265 figuras en 96 módulos. Son tres adiciones, no una certificación de calidad uniforme del catálogo.
