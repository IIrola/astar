# Caza Hiperespacial A\*

Simulador educativo de navegación y persecución espacial con **Repeated Forward A\***, cabina 3D en primera persona, radar táctico y niebla de guerra. Construido con JavaScript, módulos ES, Three.js y Vite. La interfaz está en español.

La nave explora una cuadrícula de **24 × 14**, descubre peligros a distancia cardinal 1 y vuelve a planificar hasta interceptar al fugitivo o demostrar que no existe ruta. El combustible real incluye los desvíos y las maniobras de reversa. El historial permite restaurar posición, rumbo, mapa descubierto y telemetría.

## Arranque local

Se recomienda **Node.js 24 LTS** y npm. El rango declarado es `^20.19.0 || >=22.12.0`.

```sh
git clone https://github.com/IIrola/astar.git
cd astar
npm ci
npm run dev -- --port 5173 --strictPort
```

Abre la dirección que muestra Vite. No se necesitan backend, base de datos, cuentas ni claves. Para actualizar un clon existente, ejecuta `git pull` antes de instalar o iniciar. Consulta la [guía de instalación](docs/INSTALACION_Y_OPERACION.md) para otros sistemas, puertos y despliegue estático.

## Documentación

El [índice completo](docs/README.md) organiza la documentación por perfil y tarea.

| Documento                                                            | Contenido                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Visión y alcance](docs/VISION_Y_ALCANCE.md)                         | Propósito, objetivos, requisitos y límites del producto.          |
| [Manual del piloto](docs/MANUAL_DEL_PILOTO.md)                       | Controles, cinco MFD, ejemplos de misión y lectura de resultados. |
| [Instalación y operación](docs/INSTALACION_Y_OPERACION.md)           | Desarrollo, producción, configuración y solución de problemas.    |
| [Arquitectura](docs/ARQUITECTURA.md)                                 | Capas, módulos, dependencias y flujo de datos.                    |
| [Algoritmo y generación](docs/ALGORITMO_Y_GENERACION.md)             | A\*, heurística, costes, desempates, escaneo y reversa.           |
| [Estado y API interna](docs/ESTADO_Y_API.md)                         | Snapshots, estados de vuelo, eventos y contratos de los módulos.  |
| [Gráficos, HUD y audio](docs/GRAFICOS_HUD_Y_AUDIO.md)                | Cabina integrada, materiales, cámara, calidad y recursos.         |
| [Pruebas y validación](docs/PRUEBAS_Y_VALIDACION.md)                 | Suites, evidencia disponible, reproducción y cobertura pendiente. |
| [Objetivos cumplidos y pendientes](docs/ESTADO_Y_OBJETIVOS.md)       | Matriz de trazabilidad con evidencia y estado real.               |
| [Roadmap y propuestas](docs/ROADMAP_Y_PROPUESTAS.md)                 | Qué crear después, prioridades y criterios de aceptación.         |
| [Contribución y mantenimiento](docs/CONTRIBUCION_Y_MANTENIMIENTO.md) | Convenciones, cambios seguros y entrega de mejoras.               |
| [Glosario y referencias](docs/GLOSARIO_Y_REFERENCIAS.md)             | Terminología y fuentes técnicas.                                  |

También están disponibles el [historial de cambios](CHANGELOG.md) y la [guía de contribución](CONTRIBUTING.md).

## Uso rápido

- **→ / Siguiente nodo:** escanear, recalcular y avanzar un nodo.
- **← / Regresar:** restaurar el estado previo completo.
- **A / Piloto automático:** iniciar o pausar al concluir el paso en curso.
- **N / Nueva persecución:** regenerar la misión; Bloqueo se aplica a la siguiente.
- **Imagen:** elegir Cinemática o Equilibrada según el equipo.
- **Móvil:** seleccionar MAPA, VUELO, ESCÁNER, A\* o BITÁCORA en la consola.

La semilla inicial es `ORION-042`. Usa `?seed=ORION-042&quality=balanced` para reproducirla en modo ligero y añade `&blocked=1` para un destino inaccesible.

## Verificación

```sh
npm test
npm run build
# Con Vite ejecutándose y Chromium instalado:
npm run test:e2e
```

La suite contiene **11 pruebas de dominio y 4 pruebas de navegador**. Los resultados registrados, sus límites y los requisitos de Chromium están en [Pruebas y validación](docs/PRUEBAS_Y_VALIDACION.md). `npm run preview` sirve el resultado de `dist/` para comprobarlo localmente.

## Estado del proyecto

Existe un prototipo funcional del alcance principal: A\* repetido, generación reproducible, escaneo, reversa, historial, cabina integrada, audio y captura/bloqueo. Quedan por desarrollar CI, persistencia de partidas, exportación de resultados y validación amplia de navegadores y rendimiento. Son pendientes o propuestas, no funciones disponibles; consulta la [matriz de objetivos](docs/ESTADO_Y_OBJETIVOS.md).

El fugitivo ocupa una meta fija y los obstáculos permanecen estáticos durante cada misión. El recálculo responde a **nuevo conocimiento** del mapa. No se incluyen física de vuelo continua, multijugador ni WebXR.

## Recursos y licencia

Los modelos se generan en código y las texturas planetarias se sirven desde el propio proyecto. Sus [créditos](public/licenses/ASSETS.md) y [licencia de origen](public/licenses/three-textures-MIT.txt) se conservan en `public/licenses/`. **Todavía no hay una licencia global declarada para el código propio**; la licencia de una dependencia no licencia todo este repositorio.
