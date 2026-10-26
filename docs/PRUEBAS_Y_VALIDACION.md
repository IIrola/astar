# Pruebas y validación

## Qué existe

Se utiliza el runner nativo de Node. Las pruebas gráficas importan Chromium desde `@playwright/test`; no utilizan el runner `playwright test`. Ejecutar `npx playwright test` no es el comando de esta suite.

| Archivo                                     | Casos | Ámbito                                           |
| ------------------------------------------- | ----- | ------------------------------------------------ |
| [domain.test.js](../tests/domain.test.js)   | 11    | Motor y aplicación sin DOM.                      |
| [browser.e2e.js](../tests/browser.e2e.js)   | 3     | Calidad gráfica, vuelo completo y móvil/bloqueo. |
| [keyboard.e2e.js](../tests/keyboard.e2e.js) | 1     | Atajos y foco.                                   |

Son 15 casos de primer nivel. Los bucles de 40 mapas o 20 vuelos son fixtures dentro de casos, no pruebas adicionales que deban sumarse al contador del runner.

## Dominio: cobertura verificable

| Caso                         | Qué demuestra                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Generación semillada         | Reproducibilidad, cardinalidad, balizas y tamaño del mapa.                           |
| Escaneo radio 1              | Revelación local sin diagonal y sin mutar el conocimiento recibido.                  |
| A\* frente a Dijkstra        | Igualdad de coste en 40 mapas ponderados con un oráculo independiente.               |
| Optimismo, g inicial y rumbo | Coste supuesto de desconocidos, conservación de g de entrada y desempates dirigidos. |
| Cola agotada                 | Meta encerrada produce ruta vacía y coste infinito.                                  |
| Historial                    | Congelación profunda y restauración mediante copias independientes.                  |
| Veinte vuelos completos      | Captura, vecindad válida, suma real de combustible y óptimo final correcto.          |
| Undo y replay                | Igualdad exacta de estado antes del paso y repetición determinista.                  |
| Reversa por defecto          | Al menos una reversa; nariz opuesta a cada desplazamiento clasificado como tal.      |
| Vuelo inaccesible            | Termina en bloqueo, permite deshacer el escaneo fallido y reiniciar.                 |
| Concurrencia                 | No se intercalan dos pasos, un regreso o un reset durante la animación pendiente.    |

```sh
npm test
```

Estas pruebas no necesitan servidor, Chromium, audio ni aceleración gráfica. Los tests del motor tampoco miden FPS.

## Navegador: cobertura verificable

1. **Cinemática y recursos:** comprueba modo Cinemática, tres respuestas satisfactorias de texturas, captura visual, cambio a Equilibrada y un avance funcional.
2. **Persecución completa:** cinco MFD, renderer a altura del viewport, instrumentos dentro de la vista del piloto, avance, regreso con estado exacto, captura con reversas, reporte, nueva semilla, ayuda, audio, bloqueo y varios anchos sin overflow horizontal.
3. **Móvil y destino bloqueado:** vista de 390 × 844, sin scroll de página, selección de monitores, flechas de tabs sin mover la nave, piloto hasta bloqueo y regreso posterior.
4. **Teclado:** izquierda/derecha tras hacer clic, select que conserva su navegación nativa y nueva misión mediante `N`.

Los casos de la suite solicitan movimiento reducido. Por ello, aprobarlos no demuestra exhaustivamente las animaciones largas, todos los giros a velocidad normal ni cada fotograma de una reversa.

## Ejecutar E2E

Primero inicia Vite en una terminal. En otra, desde el repositorio:

```sh
npm run test:e2e
```

El script incluye `--test-concurrency=1` para no competir por la GPU entre archivos. El runner invoca `/usr/bin/chromium` con modo headless y SwiftShader. Sus flags pertenecen a este entorno de verificación, no son parámetros que el usuario deba añadir a su navegador habitual.

Variables opcionales:

| Variable        | Por defecto             | Uso                                              |
| --------------- | ----------------------- | ------------------------------------------------ |
| `BASE_URL`      | `http://127.0.0.1:5173` | Servidor que ya debe estar iniciado.             |
| `CHROMIUM_PATH` | `/usr/bin/chromium`     | Ejecutable real de Chromium o Chrome compatible. |

Ejemplo POSIX contra preview de producción:

```sh
BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

Para PowerShell, WSL y ubicación del navegador, consulta [Instalación](INSTALACION_Y_OPERACION.md). Las capturas usan `/tmp/` y no se versionan.

## Artefactos del navegador

| Ruta                       | Momento                                           |
| -------------------------- | ------------------------------------------------- |
| `/tmp/orion-cinematic.png` | Verificación de calidad cinematográfica.          |
| `/tmp/orion-desktop.png`   | Cabina de escritorio al inicio del caso completo. |
| `/tmp/orion-captured.png`  | Resultado de captura.                             |
| `/tmp/orion-mobile.png`    | Cabina móvil inicial.                             |

Una captura no es por sí sola una prueba de que el resto del caso concluyó. Comprueba fecha, target, contador final y exit code. Los archivos pueden sobrescribirse entre ejecuciones.

La suite no realiza comparación visual píxel a píxel ni comprueba perceptualmente que el audio resulte agradable. Capturar errores de consola detecta fallos de recursos/shaders presentes, pero no reemplaza una evaluación visual humana.

## Evidencia disponible

| Comprobación                     | Evidencia y alcance                                                                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrega de la cabina, 26/10/2026 | Se registraron 11 casos de dominio y 4 de navegador aprobados durante la sesión de implementación.                                                                           |
| Producción de esa entrega        | Build satisfactorio y un caso de humo cinematográfico contra preview; no se registra una nueva ejecución completa de los cuatro casos sobre ese build final.                 |
| Revisión documental actual       | Se reproducen los dos escenarios de referencia con el motor sin animación y se ejecuta `npm test`. No se vuelve a ejecutar Chromium por cambios exclusivamente documentales. |

El registro disponible del conjunto de navegador informó aproximadamente 173 segundos con renderizado por software. Es duración de suite en ese entorno, no latencia de usuario ni benchmark transferible a otra GPU.

El build registra una advertencia de chunk Three.js superior a 500 kB. La compilación termina correctamente; la advertencia queda como oportunidad de optimización, no como una garantía de rendimiento o un fallo oculto.

## Reproducir las métricas de referencia

Desde la raíz, en una terminal POSIX:

```sh
node --input-type=module <<'JS'
import { SimulationController } from './src/application/SimulationController.js';
for (const blocked of [false, true]) {
  const sim = new SimulationController({ seed: 'ORION-042', blocked });
  sim.ready();
  let commands = 0;
  while (!['CAPTURED_END', 'BLOCKED_END'].includes(sim.state.phase)
    && commands < 1000) {
    await sim.step();
    commands++;
  }
  const s = sim.state;
  console.log({ blocked, phase: s.phase, commands, steps: s.step,
    g: s.g, reverses: s.reverseCount, optimal: s.report?.optimalCost });
}
JS
```

Resultados de esta revisión: normal, captura en 64 movimientos, g=68, 9 celdas en reversa y óptimo=32; bloqueado, 75 comandos, 74 movimientos, g=79 y 10 celdas en reversa. El límite de 1000 es una salvaguarda del ejemplo, no una regla del simulador.

## Diagnosticar un fallo

1. Conservar el comando, exit code y mensaje original.
2. Registrar semilla, modo bloqueo, calidad, navegador y si había movimiento reducido.
3. Distinguir un servidor ausente o recurso 404 de un defecto del algoritmo.
4. Para timeouts, revisar estado, recursos gráficos y servidor; no desactivar assertions ni aumentar tiempos sin diagnóstico.
5. Repetir el caso afectado después de una corrección o cambio significativo.

Ejecutar solo un caso o tener cero casos seleccionados no permite declarar aprobada la suite completa.

## Cobertura pendiente

- Navegadores Firefox y WebKit; Windows/macOS y dispositivos móviles reales.
- Movimiento normal y sus transiciones visuales, más allá de comprobaciones puntuales.
- Lectores de pantalla, contraste medido, zoom y navegación completa solo con teclado.
- Pérdida/restauración de contexto WebGL y recursos gráficos ausentes.
- Rechazos del puerto de animación y listeners que lanzan excepciones.
- Presupuestos de GPU, memoria, FPS, LOD y comparación visual automatizada.
- Integración continua: hoy los comandos se ejecutan manualmente, sin workflow versionado.

[Índice](README.md) · [Estado de objetivos](ESTADO_Y_OBJETIVOS.md)
