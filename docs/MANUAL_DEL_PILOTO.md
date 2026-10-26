# Manual del piloto

## Primera misión

1. Inicia la aplicación y espera a que los sistemas queden listos.
2. Observa tu nodo `(1,7)`, la meta `(22,6)` y la ruta hipotética del radar.
3. Pulsa **Siguiente nodo**. El escáner revela los cuatro vecinos del nodo de salida y el ordenador vuelve a calcular la ruta.
4. Compara el radar, la bitácora y g/h/f. Un peligro recién descubierto puede cambiar la dirección elegida.
5. Si el nuevo camino vuelve al nodo padre, la nave retrocede en reversa. Los nodos descartados quedan en ámbar.
6. Prueba **Regresar** y vuelve a avanzar: se restaura también la información que conocías antes del paso.
7. Activa el piloto automático para terminar o pausarlo. Al capturar, contrasta el coste real con el óptimo global de referencia.

El usuario ordena avanzar o regresar; A\* decide a qué vecino desplazarse. Las flechas no son un control de vuelo manual en cuatro direcciones.

## Botones y teclado

| Acción               | Control                            | Efecto                                                                    |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| Avanzar              | Siguiente nodo / `→`               | Un escaneo y un movimiento, salvo que se demuestre que no hay ruta.       |
| Deshacer             | Regresar / `←`                     | Desapila un snapshot y restaura su estado completo.                       |
| Automatizar / pausar | Piloto automático / `A`            | Ejecuta pasos sucesivos o deja de programarlos después del paso en curso. |
| Nueva misión         | Nueva persecución / `N`            | Descarta la partida actual, genera otra semilla y aplica Bloqueo.         |
| Ayuda                | `?` de la cabecera o Guía de vuelo | Abre el manual breve y pausa el piloto.                                   |
| Cerrar ayuda         | Botón de cierre / `Escape`         | Vuelve a la cabina.                                                       |

`Espacio` alterna el piloto cuando el foco no está en un botón. Con un botón enfocado conserva su activación nativa. Los atajos de vuelo no intervienen al editar un input, select o textarea, ni con la guía abierta o modificadores Ctrl/Alt/Meta. En la selección móvil de monitores, las flechas recorren esos botones sin avanzar la nave.

Durante un paso, los controles que podrían interferir se deshabilitan. Pausar no corta una animación a la mitad. Ocultar la pestaña pausa el piloto; al volver no se reanuda automáticamente.

## Instrumentos

### Visor de vuelo

Muestra el bioma, sector, rumbo cardinal y grados, coordenadas, distancia Manhattan a la meta y alertas. La distancia es una heurística en nodos; no es una medición física en kilómetros ni una promesa del combustible restante.

La retícula y las marcas del visor orientan la vista. No habilitan puntería manual ni armas. La baliza del fugitivo está en una posición conocida durante cada misión.

### MFD 01 · Telemetría / VUELO

| Dato       | Interpretación                                                      |
| ---------- | ------------------------------------------------------------------- |
| `n`        | Coordenadas lógicas actuales.                                       |
| `g(n)`     | Combustible realmente consumido desde el origen.                    |
| `h(n)`     | Distancia Manhattan desde el nodo actual a la meta.                 |
| `f(n)`     | Suma `g(n) + h(n)` mostrada para la posición actual.                |
| Recálculos | Escaneos que descubrieron al menos un sólido o anomalía de coste 2. |
| Pasos      | Cantidad de desplazamientos completados.                            |

g no se reinicia al entrar a otro sector. Solo disminuye al restaurar un snapshot o comenzar otra misión. El contador de recálculos no cuenta todas las ejecuciones de A\*: el planificador se ejecuta en cada paso.

### MFD 02 · Mapa táctico / MAPA

- Celdas oscuras con puntos: información interna todavía desconocida.
- Nave orientada: posición y rumbo de la nariz.
- Línea discontinua verde: plan actual sobre el mapa conocido.
- Estela: nodos visitados; el tramo descartado se marca en ámbar.
- Obstáculo: no se puede entrar a esa celda.
- Anomalía: es transitable y entrar cuesta 2.
- Anillos: ventanas atmosféricas y agujeros de gusano conocidos.
- Marca de objetivo: meta fija del fugitivo.
- Tras la captura, línea violeta: óptimo global calculado con todo el mapa real.

Al pasar el puntero por una celda aparece su estado conocido. No revela peligros ocultos. Los límites entre sectores están cartografiados desde el inicio; no son descubrimientos de un escaneo global.

### MFD 03 · Escáner local / ESCÁNER

Presenta Norte, Este, Sur y Oeste:

| Símbolo | Significado                           |
| ------- | ------------------------------------- |
| `?`     | Todavía no se ha revelado ese vecino. |
| `+1`    | Entrada despejada o baliza.           |
| `+2`    | Entrada a anomalía transitable.       |
| `∞`     | Obstáculo o límite de cuadrícula.     |

El pulso se emite **antes de salir** del nodo. Tras llegar a otro nodo, sus nuevos vecinos pueden seguir con `?` hasta el siguiente paso. No se escanean diagonales ni se ejecuta automáticamente un segundo pulso de llegada.

### MFD 04 · OPEN SET / A\*

Muestra hasta tres candidatos de la frontera restante de la última búsqueda, con g/h/f. El motor entrega hasta seis; la pantalla presenta un subconjunto para ajustarse a la consola. No es una animación de cada extracción del heap ni una lista de todos los nodos expandidos.

El g de un candidato incluye combustible ya gastado más el coste de su prefijo de plan. Puede superar el g actual del monitor de telemetría sin que la nave haya consumido todavía esa diferencia.

Al capturar, se sustituye por el reporte final: óptimo global, coste real, exceso de combustible y pasos. Una diferencia positiva refleja exploración y desvíos; no demuestra por sí misma un error de A\*.

### MFD 05 · Bitácora / BITÁCORA

Registra arranque, descubrimientos, reversas y resultado. Se conservan hasta 70 eventos recientes. El número entre corchetes corresponde al paso lógico, no a segundos de reloj.

Incluye velocidad, audio y Bloqueo. La velocidad puede ser `0.65×`, `1×`, `2×` o `4×`; cambia la animación y la espera del piloto, no el coste de las celdas.

## Consola en móvil

El fondo 3D sigue ocupando la vista completa. MAPA, VUELO, ESCÁNER, A\* y BITÁCORA seleccionan un monitor a la vez; los controles principales permanecen disponibles debajo. Para cambiar velocidad, audio o Bloqueo, selecciona BITÁCORA.

Los botones de monitores admiten foco, Enter/Espacio y navegación con izquierda/derecha, Home y End. Cambiar de monitor no altera el estado de la misión.

## Calidad y movimiento

- **Cinemática:** sombras, reflejos y posprocesado con bloom moderado.
- **Equilibrada:** menor resolución del mundo 3D, sin sombras ni cadena de bloom; el HUD conserva su resolución DOM.
- La selección inicial es Cinemática si el ancho supera 900 píxeles y Equilibrada en el resto, salvo parámetro explícito en la URL.
- Si el sistema solicita movimiento reducido, la nave cambia de nodo sin animaciones de giro/traslación y el reinicio omite el warp. Esto no congela necesariamente todas las animaciones ambientales.

La calidad elegida y el audio no se guardan como preferencias permanentes. Nueva persecución conserva los controles de la sesión; recargar vuelve a la configuración de arranque.

## Reproducir una misión por URL

| Parámetro | Valor y comportamiento                                                                      |
| --------- | ------------------------------------------------------------------------------------------- |
| `seed`    | Texto; se usan como máximo sus primeros 64 caracteres. Vacío o ausente utiliza `ORION-042`. |
| `blocked` | Solo el literal `1` activa el destino encerrado.                                            |
| `quality` | `balanced` o `cinematic`; otros valores usan la selección por ancho.                        |

Ejemplos para añadir a la dirección de la aplicación:

```text
?seed=ORION-042
?seed=ORION-042&quality=balanced
?seed=ORION-042&blocked=1&quality=balanced
```

Nueva persecución genera una semilla con `crypto.getRandomValues` y actualiza `seed` y `blocked` en la URL. Cambiar el desplegable Imagen no sincroniza `quality` en la URL. Compartir la URL reproduce el mapa y las opciones iniciales expresadas allí, no la posición ni el historial de una partida en curso.

## Escenarios de referencia

Reproducidos con el motor sin animación durante la documentación de esta revisión:

| Dato                         | `ORION-042` | `ORION-042`, Bloqueo   |
| ---------------------------- | ----------- | ---------------------- |
| Final                        | Captura     | Destino inalcanzable   |
| Movimientos                  | 64          | 74                     |
| Coste real g                 | 68          | 79                     |
| Celdas recorridas en reversa | 9           | 10                     |
| Recálculos contabilizados    | 29          | 36                     |
| Óptimo global final          | 32          | Sin reporte de captura |

En el caso bloqueado se ejecuta un último escaneo sin movimiento: hay 75 comandos de paso y 75 snapshots para 74 desplazamientos. Los tiempos de reproducción dependen del equipo y de la calidad gráfica.

[Índice](README.md) · [Explicación algorítmica](ALGORITMO_Y_GENERACION.md)
