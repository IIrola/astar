# Glosario y referencias

## Términos del proyecto

| Término                  | Significado en esta implementación                                                      |
| ------------------------ | --------------------------------------------------------------------------------------- |
| A\*                      | Búsqueda de camino de menor coste sobre el grafo que recibe, usando f=g+h.              |
| Repeated Forward A\*     | Repetir búsquedas hacia adelante desde la posición actual al conocer nuevos peligros.   |
| D* Lite / LPA*           | Planificadores incrementales mencionados como evolución; no implementados.              |
| Nodo                     | Celda lógica identificada por `z × 24 + x`.                                             |
| Arista cardinal          | Transición a norte, este, sur u oeste, sin diagonales.                                  |
| g real                   | Combustible acumulado de movimientos ya ejecutados.                                     |
| g de búsqueda            | g real al comenzar más el coste de un prefijo de plan candidato.                        |
| h                        | Distancia Manhattan a la meta.                                                          |
| f                        | g+h; prioridad del candidato o suma mostrada para la posición actual.                   |
| OPEN                     | Frontera de candidatos pendientes de expansión.                                         |
| CLOSED                   | Nodos ya expandidos en esa búsqueda.                                                    |
| Min-heap                 | Estructura para extraer el candidato de menor prioridad ordenada.                       |
| Inercia direccional      | Desempate por continuar el rumbo recibido; no física ni coste adicional de giro.        |
| Niebla de guerra         | Información interna desconocida hasta escanear.                                         |
| Radio 1                  | Cuatro vecinos cardinales inmediatos, limitado por los bordes.                          |
| Reversión / backtracking | Vuelo al nodo padre con nariz opuesta al desplazamiento.                                |
| Undo / Regresar          | Restauración del pasado; no es un vuelo nuevo que consuma combustible.                  |
| `ancestry`               | Rama activa de navegación usada para identificar al padre.                              |
| `trail`                  | Secuencia de todas las visitas, incluidas repeticiones.                                 |
| StepSnapshot             | Copia profunda congelada del estado guardada antes de un comando de paso.               |
| Óptimo global            | Camino mínimo del mapa real completo desde origen a meta fija.                          |
| Overhead                 | Combustible real menos óptimo global al capturar.                                       |
| Bioma                    | Sector visual/lógico determinado por la columna X.                                      |
| Baliza                   | Apertura conocida: ventana atmosférica o agujero de gusano.                             |
| POV                      | Vista de primera persona del piloto.                                                    |
| HUD                      | Datos proyectados visualmente sobre el cristal.                                         |
| MFD                      | Monitor multifunción de cabina.                                                         |
| PBR                      | Materiales con respuesta a luz/entorno basada en parámetros como metalness y roughness. |
| Normal map               | Textura que perturba normales de iluminación sin cambiar la malla.                      |
| Bump map                 | Relieve aparente derivado de una textura de altura.                                     |
| PMREM                    | Preparación del entorno para reflejos de materiales rugosos.                            |
| ACES                     | Operador de tone mapping usado para presentar el rango de iluminación.                  |
| Bloom                    | Brillo extendido alrededor de regiones luminosas, en modo Cinemática.                   |
| DPR                      | Relación de píxeles de dispositivo; se limita para controlar coste gráfico.             |
| Instancing               | Dibujar muchas instancias de geometría/material con matrices distintas.                 |
| LOD                      | Nivel de detalle según distancia/coste; propuesto, no implementado.                     |
| WebGL2                   | API gráfica requerida por la versión actual de Three.js.                                |
| Web Audio                | API con la que se sintetizan los efectos.                                               |
| WebXR                    | Experiencias inmersivas mencionadas en el roadmap; no disponibles.                      |
| E2E                      | Prueba de acciones de usuario en un navegador con la aplicación servida.                |
| SwiftShader              | Renderizado por software utilizado por los tests headless.                              |
| CI                       | Ejecución automática de verificaciones en integración; pendiente.                       |
| PWA                      | Aplicación web instalable/offline mediante mecanismos específicos; propuesta.           |

## Fuentes del comportamiento

La descripción exacta del programa procede de los [módulos del repositorio](../src/) y de sus [pruebas](../tests/). El TDD inicial estableció los objetivos; las decisiones y matices efectivos quedan registrados en [Alcance](VISION_Y_ALCANCE.md) y [Objetivos](ESTADO_Y_OBJETIVOS.md).

## Referencias técnicas externas

- [Three.js · documentación](https://threejs.org/docs/): escena, cámaras, materiales, luces y renderer.
- [Three.js · ejemplos](https://github.com/mrdoob/three.js/tree/r180/examples/jsm): utilidades y posprocesado de la versión de biblioteca utilizada.
- [Vite · guía](https://vite.dev/guide/): desarrollo y generación de sitios estáticos.
- [Vite · despliegue](https://vite.dev/guide/static-deploy.html): configuración de base y publicación de un build.
- [Node.js · test runner](https://nodejs.org/api/test.html): runner utilizado por las tres suites de archivos del proyecto.
- [Playwright · biblioteca](https://playwright.dev/docs/library): control programático del navegador.
- [MDN · WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API): contexto de la API gráfica del navegador.
- [MDN · Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API): contexto y síntesis de audio.
- [MDN · movimiento reducido](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): preferencia que respeta la cámara.
- [Hart, Nilsson y Raphael, 1968](https://doi.org/10.1109/TSSC.1968.300136), _A Formal Basis for the Heuristic Determination of Minimum Cost Paths_: referencia fundacional de A\*. No describe por sí sola todas las decisiones particulares de este simulador.

Las páginas actuales de las bibliotecas pueden describir versiones posteriores. Para reproducir el proyecto prevalecen las versiones fijadas en [package-lock.json](../package-lock.json).

## Recursos y licencia

- [Origen de texturas planetarias](https://github.com/mrdoob/three.js/tree/r160/examples/textures/planets).
- [Atribución incluida](../public/licenses/ASSETS.md).
- [MIT de los recursos de Three.js](../public/licenses/three-textures-MIT.txt).

No se debe extender automáticamente esa licencia al código propio: la elección de licencia del proyecto está pendiente.

[Índice](README.md)
