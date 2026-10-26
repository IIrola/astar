# Visión, objetivos y alcance

## Propósito

Mostrar cómo una nave puede llegar a una meta conocida cuando desconoce los peligros del trayecto. La experiencia combina observación espacial, decisión algorítmica y telemetría matemática, de forma que el usuario pueda relacionar un descubrimiento con un desvío, un recálculo y su coste real.

El producto es un **simulador educativo interactivo de navegación discreta**. Su presentación es una cabina cinematográfica en primera persona; las decisiones válidas pertenecen a una cuadrícula cardinal y no a una simulación física libre.

## Usuarios y casos de uso

| Perfil             | Uso principal                                             | Resultado esperado                                               |
| ------------------ | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Estudiante         | Avanzar paso a paso y observar el radar.                  | Comprender g, h, f, exploración y recálculo.                     |
| Docente            | Repetir semillas y contrastar decisiones.                 | Explicar mapas parcialmente observables y costes de exploración. |
| Usuario explorador | Activar piloto automático y probar Bloqueo.               | Completar misiones y observar resultados reproducibles.          |
| Desarrollador      | Probar el motor sin navegador y extender la presentación. | Cambiar una capa con contratos y verificaciones identificables.  |

## Objetivos del producto

| ID  | Objetivo                                                               | Forma de evaluación                                         |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| O1  | Resolver navegación parcialmente observable con Repeated Forward A\*.  | Captura en mapas normales y pruebas del planificador.       |
| O2  | Hacer visible la relación entre escaneo, replanteamiento y movimiento. | Radar, escáner, bitácora y estados de vuelo sincronizados.  |
| O3  | Contabilizar todo el combustible realmente gastado.                    | Suma de costes de entradas, incluidas reversas.             |
| O4  | Permitir experimentar y regresar sin perder coherencia.                | Restauración exacta de snapshots y repetición determinista. |
| O5  | Ofrecer una cabina con instrumentos integrados en la vista del piloto. | Estructura 3D, HUD sobre el cristal y MFD en consola.       |
| O6  | Mantener el algoritmo independiente de Three.js y del DOM.             | Pruebas de dominio ejecutables directamente en Node.        |
| O7  | Facilitar reproducción, instalación y evolución.                       | Lockfile, semillas, documentación y suite existente.        |

La evaluación detallada de estos objetivos está en [Estado y objetivos](ESTADO_Y_OBJETIVOS.md).

## Alcance funcional actual

- Mapa de 336 nodos, dividido en tres sectores, con inicio `(1,7)` y meta `(22,6)`.
- Generación semillada y corredor garantizado en modo normal.
- Balizas y límites estructurales conocidos; peligros internos ocultos.
- Escaneo de vecinos cardinales antes de cada movimiento.
- Replanificación optimista sobre celdas desconocidas y costes ponderados conocidos.
- Avance, giros, reversa al nodo padre, pila de historial y piloto automático.
- Captura o destino inalcanzable; nueva persecución con otra semilla.
- Radar, telemetría, escáner, frontera de la última búsqueda y bitácora.
- Dos calidades gráficas, adaptación móvil y preferencia de movimiento reducido.
- Audio sintetizado activable por el usuario.

## Decisiones de alcance

| Tema               | Decisión vigente                          | Consecuencia                                                                        |
| ------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Objetivo           | Posición fija durante cada misión.        | Se persigue una baliza; no se predice una trayectoria móvil.                        |
| Dinamismo          | Cambia el conocimiento del piloto.        | El mundo real permanece inmutable durante la misión.                                |
| Movimiento         | Cuatro vecinos, sin diagonales.           | Los costes y giros son fáciles de inspeccionar.                                     |
| Coste              | Entrada a la celda destino.               | Regresar a una anomalía vuelve a consumir 2 unidades.                               |
| Física             | Animación de movimientos lógicos.         | No hay gravedad, inercia física, choques continuos ni vuelo manual libre.           |
| Agujeros de gusano | Balizas transitables de coste 1.          | No teletransportan a nodos remotos.                                                 |
| Instrumentos       | HTML/CSS con perspectiva sobre la escena. | Se integran visualmente; no son paneles interactivos texturizados en el espacio 3D. |
| Persistencia       | Memoria de la pestaña.                    | Una recarga elimina progreso e historial.                                           |
| Distribución       | Sitio estático.                           | No existe API HTTP propia, servidor de juego ni base de datos.                      |

## Fuera del alcance entregado

No se incluyen multijugador, cuentas, sincronización remota, WebXR, mando/joystick, editor de mapas, guardado de partidas, exportación de informes ni comparación interactiva de algoritmos. Se describen como [propuestas](ROADMAP_Y_PROPUESTAS.md), no como capacidades existentes.

La mejora visual usa materiales PBR, normales, texturas y posprocesado. No establece un compromiso de fotorrealismo ni de FPS: falta un protocolo de rendimiento y una matriz de hardware.

## Condiciones para considerar una evolución terminada

1. Su comportamiento y sus límites están definidos.
2. Conserva o modifica explícitamente los contratos de navegación.
3. Tiene evidencia útil de funcionamiento y de los fallos que pretende manejar.
4. Se integra en escritorio y en el monitor seleccionable móvil.
5. Actualiza la matriz de objetivos, el manual y el historial de cambios.

[Índice](README.md) · [Roadmap](ROADMAP_Y_PROPUESTAS.md)
