# Contribución y mantenimiento

## Preparar un cambio

1. Leer [visión](VISION_Y_ALCANCE.md), [arquitectura](ARQUITECTURA.md) y el contrato del área que cambia.
2. Revisar `git status --short` y conservar cambios existentes.
3. Instalar con `npm ci`; no regenerar el lockfile para resolver un problema ajeno a dependencias.
4. Elegir una tarea concreta del [roadmap](ROADMAP_Y_PROPUESTAS.md) o describir un defecto reproducible.
5. Definir aceptación y alcance antes de modificar varias capas a la vez.

El repositorio de trabajo está en `main`; la estrategia de ramas/PR del equipo no está formalizada. Para colaboración, se recomienda una rama de cambio y revisión por PR, sin presentarlo como una automatización existente.

## Convenciones

- Módulos ES con importaciones explícitas; el dominio debe poder ejecutarse en Node sin navegador.
- Indentación de dos espacios, comillas simples y formato coherente con [.prettierrc.json](../.prettierrc.json).
- Clases en PascalCase; funciones y campos en camelCase; constantes compartidas en mayúsculas.
- Textos de interfaz y documentación en español; nombres de contratos existentes conservados para no romper imports.
- No introducir efectos de DOM, reloj gráfico o audio en `core/`.
- No duplicar la transitabilidad en la vista: renderizar desde `known` y consultar el dominio para decidir.
- Tratar eventos `change`/`reset` como de solo lectura.

Hay configuración de Prettier, pero no una dependencia de formatter ni un script `lint`/`format` declarados. Usa una herramienta compatible si está disponible; no documentes un script npm inexistente.

## Cambiar reglas de navegación

Antes de modificar costes, conectividad, inicio/meta o dimensiones:

| Área       | Revisar                                                    |
| ---------- | ---------------------------------------------------------- |
| Heurística | Admisibilidad y consistencia bajo las nuevas transiciones. |
| Generador  | Fronteras, corredor garantizado y bloqueo de la meta.      |
| Telemetría | Progreso actualmente basado en distancia inicial 22.       |
| Historial  | Restauración de cualquier dato que ahora pueda cambiar.    |
| UI         | Tamaño y etiquetas del radar, monitores y parámetros.      |
| Vista      | Escala de celda y colocación visual.                       |
| Pruebas    | Oráculo, escenarios de referencia e invariantes.           |

No cambiar un resultado esperado solo para hacer pasar una prueba. Si el cambio es intencional, explica la nueva regla y prueba su corrección.

## Cambiar gráficos o HUD

Mantener la vista del piloto como un conjunto: renderer a altura del viewport, cabina física, HUD sobre el cristal y consola superpuesta. Verificar que los controles y reportes sean legibles y accesibles en escritorio, móvil y con movimiento reducido.

Liberar geometrías, materiales, render targets y texturas según su propiedad. No destruir una textura compartida al retirar un único obstáculo. Revisar cambios repetidos de calidad, reinicio, Undo y estado final.

Añadir recursos externos solo con origen, licencia y tamaño documentados. Los modelos decorativos no deben decidir colisiones lógicas ni revelar peligros internos desconocidos.

## Dependencias y archivos

- Fijar versiones de dependencias de forma intencional y versionar `package-lock.json` junto al manifiesto si cambia.
- Conservar verificación de TLS e integridad de npm.
- No versionar `node_modules/`, `dist/`, capturas temporales ni logs.
- No introducir claves en fuentes, URLs de ejemplo, logs o documentación. El proyecto actual no requiere secretos.
- Conservar los avisos de licencia de `public/licenses/`. La licencia general del código propio sigue pendiente de decisión del titular.

## Validación proporcional al cambio

| Cambio                   | Verificación sugerida                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Dominio o generación     | Suite de dominio, escenario afectado y E2E del flujo que lo usa.                                |
| Coordinación/Undo/piloto | Dominio más pruebas de navegación y concurrencia.                                               |
| Cámara/modelos/shaders   | Build, consola sin errores, calidad Cinemática/Equilibrada y acciones reales de vuelo.          |
| HUD/teclado              | Selección móvil, foco, controles y ausencia de scroll de página.                                |
| Despliegue/recursos      | Build y comprobación desde el servidor de producción o preview.                                 |
| Solo documentación       | Enlaces locales, comandos/símbolos contrastados con el código y diff sin cambios de aplicación. |

Las instrucciones completas están en [Pruebas](PRUEBAS_Y_VALIDACION.md). No es necesario ejecutar una suite gráfica costosa por corregir una frase que no cambia el producto. Sí hay que indicar qué se comprobó realmente y qué resultados proceden de validaciones anteriores.

## Documentar y revisar

Actualizar el documento propietario del contrato y los enlaces del índice si aparece una capacidad nueva. Para un cambio funcional, mover su estado en [Objetivos](ESTADO_Y_OBJETIVOS.md), registrar evidencia y actualizar [CHANGELOG](../CHANGELOG.md).

Una descripción de PR debería explicar el problema, el comportamiento final y su validación. Identificar cualquier límite real o cambio de contrato. Las propuestas deben seguir marcadas como propuestas hasta que exista una implementación verificable.

## Entrega de una versión

1. Revisar el diff y los archivos añadidos, incluidos binarios y atribuciones.
2. Completar verificaciones proporcionales y dejar registro de sus resultados.
3. Identificar el commit entregado; comprobar la rama remota después de subirlo.
4. Si se crea una release, definir tag y notas; actualmente no hay tags ni workflow automático.
5. Si se despliega, comprobar la URL y recursos publicados. No confundir un push con publicación de sitio.
6. Si se actualiza el entorno en la nube, guardar sus instrucciones/ref cuando proceda y comprobar su publicación por separado.

## Mantener esta documentación

- La base de implementación examinada figura en el [índice](README.md).
- Actualizarla cuando cambien reglas, APIs, comandos, assets o cobertura.
- Mantener los pendientes en un único inventario de [estado](ESTADO_Y_OBJETIVOS.md); usar el roadmap para el diseño de propuestas.
- Evitar copiar métricas de una semilla como si fueran garantías globales.
- Mantener ejemplos ejecutables desde la ubicación que especifican.

[Índice](README.md) · [Guía de contribución raíz](../CONTRIBUTING.md)
