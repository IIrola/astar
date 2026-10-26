# Objetivos cumplidos, pendientes y límites

**Corte:** revisión documental del 26/10/2026; implementación base `d4106cd`. Los estados se basan en código, pruebas existentes y resultados disponibles de la sesión. Las ideas futuras se detallan en el [roadmap](ROADMAP_Y_PROPUESTAS.md).

## Cumplimiento del alcance principal

| ID  | Objetivo / requisito                      | Estado                               | Evidencia                                                                                              | Matiz o límite                                                               |
| --- | ----------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| C01 | Dominio separado de gráficos              | Cumplido                             | [core](../src/core/), tests de Node                                                                    | La UI sí depende del controlador concreto.                                   |
| C02 | Grafo 24 × 14 y cuatro cardinales         | Cumplido                             | [Graph](../src/core/Graph.js), [constantes](../src/shared/constants.js)                                | Tamaño fijo, sin editor.                                                     |
| C03 | Tres sectores y costes 1/2/∞              | Cumplido                             | [generación](../src/core/Generator.js), `costOf`                                                       | La representación visual no añade colisiones físicas.                        |
| C04 | Generación reproducible                   | Cumplido                             | PRNG, generador y prueba de semilla                                                                    | Se garantiza corredor normal; no todos los mapas tienen reversas.            |
| C05 | Balizas conocidas en columnas 8 y 16      | Cumplido                             | `initialKnowledge`, generador, modelos de baliza                                                       | También son conocidos los límites sólidos de esas columnas.                  |
| C06 | Niebla y escaneo cardinal radio 1         | Cumplido                             | `Graph.scan` y test sin diagonales                                                                     | Pulso antes de salir; no existe escaneo extra de llegada.                    |
| C07 | Repeated Forward A\*                      | Cumplido                             | [planificador](../src/core/DynamicAStar.js), [controlador](../src/application/SimulationController.js) | Busca de nuevo en cada paso; no es D\* Lite.                                 |
| C08 | Desempate f, h e inercia                  | Cumplido                             | Comparador del heap y test dirigido                                                                    | Inercia local respecto al rumbo recibido, sin penalización de giros.         |
| C09 | g real acumulado sin reiniciar por sector | Cumplido                             | `step()`, prueba de suma real en 20 vuelos                                                             | Undo y nueva misión sí restauran o reinician g.                              |
| C10 | Recálculo al descubrir peligros           | Cumplido                             | Escaneo, bitácora y contador                                                                           | Contador por pulso con peligro, no por cada llamada a A\*.                   |
| C11 | Reversa hacia el nodo padre               | Cumplido con matiz                   | `ancestry`, `reverseCount`, cámara y prueba de nariz opuesta                                           | En esquinas se gira para mantener la nariz opuesta a la traslación.          |
| C12 | Snapshots inmutables y regreso            | Cumplido                             | [HistoryStack](../src/core/HistoryStack.js), test de igualdad/replay                                   | No hay persistencia entre recargas ni límite configurable del historial.     |
| C13 | Estados de vuelo especificados            | Cumplido con matiz                   | `PHASES`, controlador y main                                                                           | Etiquetas y guardas por comando; no hay validador formal de toda transición. |
| C14 | Captura, tractor y óptimo final           | Cumplido                             | Reporte del controlador, escena y E2E                                                                  | El óptimo se calcula con mapa completo y se distingue del combustible real.  |
| C15 | Meta inaccesible y Bloqueo                | Cumplido                             | Generador, agotamiento de OPEN, test y E2E móvil                                                       | Bloqueo se aplica a la siguiente misión.                                     |
| C16 | Nueva persecución con warp                | Cumplido                             | `main.js`, `SpaceScene.escape`                                                                         | Warp omitido con preferencia de movimiento reducido.                         |
| C17 | Cinco MFD y radar sincronizados           | Cumplido                             | [UI](../src/ui/CockpitUI.js), [radar](../src/ui/TacticalRadar.js)                                      | OPEN muestra tres candidatos del resumen de la última búsqueda.              |
| C18 | HUD integrado en la vista del piloto      | Cumplido                             | Cabina 3D, CSS de consola y E2E de bounds                                                              | Los monitores son DOM/CSS, no superficies espaciales WebXR.                  |
| C19 | Más volumen y acabado visual              | Cumplido como mejora de presentación | Rocas suavizadas, materiales PBR, mapas planetarios, nave y posprocesado                               | Calidad artística subjetiva; no hay objetivo medido de fotorrealismo.        |
| C20 | Audio sintetizado por eventos             | Cumplido                             | [Synthesizer](../src/audio/Synthesizer.js), activación E2E                                             | Sin música, volumen en UI ni evaluación acústica automática.                 |
| C21 | Móvil y movimiento reducido               | Cumplido con cobertura parcial       | Tabs de MFD, CSS, rig y E2E                                                                            | Móvil emulado; falta matriz de dispositivos reales.                          |
| C22 | Instalación y build reproducibles         | Cumplido                             | Manifiesto, lockfile, comandos y build registrado                                                      | El despliegue público no está automatizado.                                  |
| C23 | Documentación organizada                  | Cumplido en esta entrega             | [Índice](README.md), contratos, manual y roadmap                                                       | Requiere actualización al cambiar la implementación.                         |

## Resultados concretos de referencia

| Escenario            | Resultado medido con el motor en esta revisión                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ORION-042`, normal  | Captura; 64 movimientos; g=68; óptimo=32; exceso=36; 9 pasos en reversa; 29 recálculos; 149 nodos conocidos.   |
| `ORION-042`, Bloqueo | `BLOCKED_END`; 75 comandos para 74 movimientos; g=79; 10 pasos en reversa; 36 recálculos; 167 nodos conocidos. |

Estas cifras sirven para reproducción y regresión de esa semilla. No describen todos los mapas ni tiempos de ejecución.

## Pendientes de consolidación

| ID  | Pendiente real                            | Prioridad propuesta                 | Criterio de cierre                                                                                                 |
| --- | ----------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| P01 | Automatizar CI                            | Alta                                | Un PR ejecuta dominio, build y E2E reproducibles y conserva artefactos de fallo.                                   |
| P02 | Validar navegadores y dispositivos reales | Alta                                | Matriz con versiones, hardware, escenario, resultado y límites publicados.                                         |
| P03 | Auditar accesibilidad y legibilidad       | Alta                                | Recorrido por teclado/lector, contraste y zoom comprobados; hallazgos corregidos.                                  |
| P04 | Medir y optimizar gráficos                | Alta                                | Presupuestos de carga, FPS y memoria por calidad, con metodología y equipos identificados.                         |
| P05 | Consolidar errores y recuperación         | Alta                                | Casos de recurso ausente, contexto perdido y animación rechazada con estado recuperable y pruebas.                 |
| P06 | Definir licencia del código propio        | Alta, requiere decisión del titular | Archivo LICENSE elegido por el titular y coherente con la distribución y atribuciones.                             |
| P07 | Preparar releases y despliegue            | Media                               | Tags, proceso de publicación y URL de hosting verificable, sin confundir GitHub con despliegue.                    |
| P08 | Controlar memoria del historial           | Media                               | Límite/política definida y regresiones que mantengan la semántica de Undo.                                         |
| P09 | Mejorar carga y aviso de recursos         | Media                               | Disponibilidad de imágenes comprobada, error visible y alternativa definida antes de declarar preparación gráfica. |
| P10 | Portabilidad completa de E2E              | Media                               | Chromium y rutas de capturas resueltos de forma portable y validados en las plataformas elegidas.                  |

Prioridad expresa valor sugerido, no una asignación, fecha ni compromiso de implementación. No todos estos pendientes eran requisitos literales del TDD; consolidan el prototipo para una entrega más amplia.

## Capacidades que todavía no existen

| Capacidad                                                       | Estado    | Lugar en la evolución                       |
| --------------------------------------------------------------- | --------- | ------------------------------------------- |
| Guardar/cargar partida                                          | Propuesto | R02 del roadmap.                            |
| Exportar informe y replay                                       | Propuesto | R02.                                        |
| Enseñar cada expansión OPEN/CLOSED                              | Propuesto | R03.                                        |
| Comparar A\* con Dijkstra/BFS en la UI                          | Propuesto | R03; Dijkstra hoy solo es oráculo de tests. |
| Selector de semilla, dificultad y misiones curadas en UI        | Propuesto | R04.                                        |
| Obstáculos realmente móviles o costes que cambian con el tiempo | Propuesto | R06; no confundir con niebla.               |
| Fugitivo móvil y predicción de intercepción                     | Propuesto | R06.                                        |
| D* Lite/LPA* intercambiables                                    | Propuesto | R06.                                        |
| Modelos GLTF/LOD, render adaptativo                             | Propuesto | R05.                                        |
| Controles espaciales de cabina / WebXR                          | Propuesto | R08.                                        |
| PWA instalable y modo offline explícito                         | Propuesto | R07.                                        |

## Hechos externos por verificar

- El código fue subido a GitHub; esto no demuestra que exista un sitio público desplegado.
- Se guardó un borrador de configuración de entorno; su publicación y restauración en una nueva tarea no se dan por probadas en esta documentación.
- La suite se ejecutó en Chromium/Linux; no equivale a aprobar todos los sistemas que pueden instalar Node.

[Índice](README.md) · [Propuestas y criterios de aceptación](ROADMAP_Y_PROPUESTAS.md)
