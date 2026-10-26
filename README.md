# Caza Hiperespacial A\*

Simulador de persecución en primera persona: cabina WebGL, radar táctico simultáneo y **Repeated Forward A\*** sobre un universo parcialmente observable. JavaScript con módulos ES nativos, Three.js y Vite. Interfaz en español, adaptable a escritorio y móvil, sin servicios de backend ni claves de acceso.

## Desarrollo

Requiere Node.js **20.19+** (o **22.12+**, incluido Node 24) y npm.

```sh
git clone https://github.com/IIrola/astar.git
cd astar
npm ci
npm run dev -- --port 5173 --strictPort
```

El servidor escucha en `0.0.0.0`. `npm run build` genera `dist/`, un sitio estático que se puede servir con `npm run preview -- --port 4173 --strictPort`.

```sh
npm test        # Dominio, oracle Dijkstra, simulaciones completas e historial
npm run build  # Compilación de producción
npm run test:e2e # Chromium: WebGL, controles, captura, bloqueo y vista móvil
```

Para las pruebas E2E debe estar ejecutándose el servidor de desarrollo. Se usa Chromium del sistema (`/usr/bin/chromium`); `CHROMIUM_PATH` permite elegir otro ejecutable y `BASE_URL` otro servidor. No se descarga un navegador durante `npm ci`. Las capturas de validación se escriben en `/tmp/orion-*.png`. En una máquina sin Chromium, puede instalarse con el gestor de paquetes del sistema; esto solo es necesario para E2E.

## Cómo pilotar

- **Siguiente nodo / →:** escanea los cuatro vecinos, recalcula y ejecuta un movimiento atómico.
- **Regresar / ←:** restaura el snapshot anterior completo, incluidos rumbo, mapa descubierto, ruta, frontera, bitácora y g/h/f.
- **Piloto automático / A o espacio:** inicia o pausa la persecución. Al pausar termina primero el paso en curso.
- **Nueva persecución / N:** muestra la evasión warp y genera otra semilla; conserva velocidad y audio.
- **Velocidad:** 0.65×, 1×, 2× o 4×.
- **Audio:** síntesis Web Audio local, activada por una interacción del usuario.
- **Bloqueo:** se aplica a la siguiente misión y encierra el destino entre obstáculos, para observar el agotamiento de Open Set.
- **Guía de vuelo / ?:** explica los instrumentos y las reglas de navegación. Los atajos se suspenden al editar controles o abrir la guía.
- **Imagen:** Cinemática activa sombras y posprocesado con bloom moderado; Equilibrada reduce la resolución del mundo 3D y desactiva esos efectos, manteniendo el HUD nítido. El escritorio comienza en Cinemática y las pantallas pequeñas en Equilibrada. `?quality=balanced` permite abrir directamente el modo ligero.
- **Monitores en móvil:** los botones MAPA, VUELO, ESCÁNER, A\* y BITÁCORA cambian la pantalla de la consola. Las flechas del teclado recorren estos botones sin mover la nave.

Las misiones son reproducibles mediante `?seed=ORION-042`. Añade `&blocked=1` para el escenario inaccesible. La semilla inicial está elegida para mostrar descubrimientos, desvíos y maniobras de reversa.

## Cabina integrada

El mundo 3D ocupa el fondo completo de la vista del piloto. La estructura del parabrisas es geometría tridimensional unida a la cámara; los datos de vuelo se proyectan sobre el cristal y los cinco MFD quedan montados en la consola inferior con perspectiva y marcos físicos. En móvil se usa un monitor seleccionable dentro de esa misma cabina; la página no se desplaza a otra sección para consultar los instrumentos.

Si el sistema tiene activada la preferencia de movimiento reducido, los cambios de nodo y el regreso se muestran sin giros ni traslaciones animadas, y el reinicio omite el efecto warp. El rumbo, el coste y el historial conservan el mismo comportamiento.

Los asteroides tienen geometría deformada con normales suavizadas, textura y relieve. La nave fugitiva incorpora fuselaje, cabina, alas, góndolas y toberas. Los portales tienen armadura y segmentos luminosos. La iluminación combina luz direccional, reflejos de entorno y luz local de cabina, con tone mapping ACES. El planeta usa mapas de color y normales locales de 2048 píxeles, nubes independientes y una capa atmosférica. Los créditos y la licencia de las texturas se encuentran en `public/licenses/`.

## Contratos del dominio

- Grafo de **24 × 14 = 336** nodos y cuatro vecinos cardinales. Origen `(1,7)`, fugitivo `(22,6)`.
- Espacio profundo `x=0…7`, órbita planetaria `x=8…15`, otra galaxia `x=16…23`.
- Ventanas atmosféricas en `(8,3)` y `(8,10)`; agujeros de gusano en `(16,4)` y `(16,11)`. Los límites estructurales entre sectores y las balizas están cartografiados desde el inicio; los peligros internos están ocultos.
- Escaneo de **radio Manhattan 1**, antes de cada movimiento. Las diagonales no se revelan. El escáner muestra la información conocida desde la posición actual; tras llegar, los nuevos vecinos aún desconocidos aparecen con `?` hasta el siguiente pulso.
- Entrada a celda despejada o baliza: `+1`; anomalía: `+2`; sólido: `∞`. Una celda desconocida se considera despejada para la planificación.
- A\* usa un min-heap y distancia Manhattan. Orden de prioridad: menor `f`, menor `h`, continuación del rumbo actual y orden estable de inserción.
- Cada búsqueda comienza con el **g real acumulado**. Un desvío o retroceso consume combustible; g solo disminuye mediante una restauración del historial o una nueva misión.
- Al descubrir un sólido o anomalía se cuenta un recálculo. Se vuelve a planificar en cada paso para actualizar ruta y frontera.
- Si el primer paso vuelve al nodo padre, se activa la reversa: la nariz apunta en sentido opuesto al desplazamiento. En una esquina, la nave ajusta el rumbo antes de continuar en reversa. El tramo descartado queda en ámbar.
- Al capturar, una búsqueda independiente sobre el **mapa completo real** obtiene el óptimo global desde el origen. El reporte distingue ese coste del combustible realmente consumido y muestra su diferencia. La ruta óptima de referencia aparece en violeta en el radar; no se presenta la ruta exploratoria como globalmente óptima.
- El generador garantiza un corredor cardinal transitable en modo normal. El modo bloqueo elimina esa garantía exclusivamente alrededor de la meta.

## Arquitectura

```text
src/
  shared/       Constantes, coordenadas, PRNG y EventBus
  core/         Grafo inmutable, generación, A* y HistoryStack
  application/  Máquina de estados, pasos atómicos y proyección de telemetría
  view3d/       Escena Three.js, cámara POV, biomas, obstáculos y balizas
  ui/           Cinco MFD, radar Canvas 2D, controles, guía y accesibilidad
  audio/        Osciladores Web Audio y efectos procedurales
tests/          Pruebas de dominio y de navegador
css/            Tokens visuales, cabina y pantallas
```

El dominio no importa DOM, Three.js ni Web Audio. Las animaciones se inyectan en `SimulationController`; las pruebas del algoritmo funcionan directamente con Node. Los snapshots se clonan y congelan recursivamente y no comparten arrays mutables con el estado activo.

La máquina recorre `BOOT_INTRO`, `READY_WAIT`, `SCAN_AND_RECALC`, `ROTATING_NOSE`, `MOVING_FORWARD`, `BACKTRACKING_REV`, `CAPTURED_END`, `BLOCKED_END` y `FUGITIVE_ESCAPE`. Los comandos concurrentes se bloquean durante un movimiento. Al ocultar la pestaña o abrir la guía se pausa el piloto; no se inicia otro movimiento después del actual.

## Entorno en la nube

Cada tarea ya dispone de un entorno aislado: utiliza el checkout existente en `/workspace/astar`; **no crees otro worktree** salvo petición expresa. La caché npm se coloca en `/workspace/.cache/npm` para no depender de permisos de escritura en el directorio personal.

Solo hace falta acceso al registro npm para instalar dependencias (`registry.npmjs.org`). No se requieren credenciales, bases de datos, fuentes externas, modelos descargados ni archivos de audio. Las dependencias están fijadas en `package-lock.json`; usa `npm ci` para reproducir la instalación. Los procesos no se conservan al restaurar una instantánea: inicia Vite al comenzar una nueva sesión.

## Límites

La vista 3D necesita WebGL. Si no está disponible, la interfaz informa del problema y mantiene el radar y la simulación operativos; esa alternativa no sustituye la experiencia POV. La calidad Cinemática consume más GPU; Equilibrada conserva la cabina, los modelos y las texturas con menor coste de renderizado. La cuadrícula determina los movimientos válidos, sin colisiones físicas continuas. No hay guardado de partidas entre recargas; las semillas reproducen el mapa y el historial existe durante la sesión.
