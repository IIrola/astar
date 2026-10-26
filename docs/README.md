# Documentación del proyecto

**Proyecto:** Caza Hiperespacial A\* · **Paquete:** `caza-hiperespacial-astar@1.0.0`.

**Revisión documental:** 26 de octubre de 2026, fecha del cliente en America/Cancun. La implementación examinada corresponde a [`d4106cd`](https://github.com/IIrola/astar/commit/d4106cd7423b869d4b857d91228904fc5dacccbc). Esta entrega añade documentación; no implementa las funciones propuestas en el roadmap.

## Recorridos de lectura

| Quiero…                              | Leer                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Ejecutar el proyecto                 | [Instalación y operación](INSTALACION_Y_OPERACION.md).                                                              |
| Aprender a pilotar e interpretar A\* | [Manual](MANUAL_DEL_PILOTO.md), después [Algoritmo](ALGORITMO_Y_GENERACION.md).                                     |
| Entender o modificar el código       | [Arquitectura](ARQUITECTURA.md), [API y estado](ESTADO_Y_API.md), [Mantenimiento](CONTRIBUCION_Y_MANTENIMIENTO.md). |
| Trabajar en la presentación visual   | [Gráficos, HUD y audio](GRAFICOS_HUD_Y_AUDIO.md).                                                                   |
| Evaluar lo que se entregó            | [Objetivos](ESTADO_Y_OBJETIVOS.md) y [Validación](PRUEBAS_Y_VALIDACION.md).                                         |
| Decidir qué crear después            | [Visión](VISION_Y_ALCANCE.md) y [Roadmap](ROADMAP_Y_PROPUESTAS.md).                                                 |

## Catálogo

1. [Visión y alcance](VISION_Y_ALCANCE.md).
2. [Instalación y operación](INSTALACION_Y_OPERACION.md).
3. [Manual del piloto](MANUAL_DEL_PILOTO.md).
4. [Arquitectura](ARQUITECTURA.md).
5. [Algoritmo y generación](ALGORITMO_Y_GENERACION.md).
6. [Estado y API interna](ESTADO_Y_API.md).
7. [Gráficos, HUD y audio](GRAFICOS_HUD_Y_AUDIO.md).
8. [Pruebas y validación](PRUEBAS_Y_VALIDACION.md).
9. [Objetivos cumplidos y pendientes](ESTADO_Y_OBJETIVOS.md).
10. [Roadmap y propuestas para crear](ROADMAP_Y_PROPUESTAS.md).
11. [Contribución y mantenimiento](CONTRIBUCION_Y_MANTENIMIENTO.md).
12. [Glosario y referencias](GLOSARIO_Y_REFERENCIAS.md).

## Cómo interpretar el estado

- **Cumplido:** existe implementación identificable y se cita su evidencia; no implica validación universal en todos los equipos.
- **Parcial:** una capacidad existe, pero conserva restricciones expresas.
- **Pendiente:** falta trabajo necesario para completar una capacidad o consolidar la entrega.
- **Propuesto:** idea de evolución; no se ha implementado ni se promete una fecha.
- **Por verificar:** depende de evidencia externa o de una comprobación aún no realizada.

La [matriz de objetivos](ESTADO_Y_OBJETIVOS.md) centraliza estos estados. El [roadmap](ROADMAP_Y_PROPUESTAS.md) aporta criterios de aceptación para convertirlos en tareas; evita duplicar listas contradictorias.

## Fuentes de verdad

| Dato                       | Fuente                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Comandos y dependencias    | [package.json](../package.json) y [package-lock.json](../package-lock.json).                                             |
| Reglas espaciales          | [constants.js](../src/shared/constants.js), [Graph.js](../src/core/Graph.js) y [Generator.js](../src/core/Generator.js). |
| Decisiones de navegación   | [DynamicAStar.js](../src/core/DynamicAStar.js) y [SimulationController.js](../src/application/SimulationController.js).  |
| Comportamiento visible     | [main.js](../src/main.js), [CockpitUI.js](../src/ui/CockpitUI.js) y [SpaceScene.js](../src/view3d/SpaceScene.js).        |
| Comprobaciones automáticas | [tests/](../tests/).                                                                                                     |
| Recursos de terceros       | [public/licenses/](../public/licenses/).                                                                                 |

Si cambia una regla o un contrato, actualiza conjuntamente código, pruebas y documento correspondiente. Las métricas del escenario de referencia describen la revisión examinada; no son constantes contractuales para cualquier mapa.

[Volver al README principal](../README.md)
