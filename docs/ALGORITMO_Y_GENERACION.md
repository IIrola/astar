# Algoritmo, generación y reglas de navegación

## Grafo y coordenadas

```text
W = 24, H = 14, V = 336
id(x,z) = z × 24 + x
x(id) = id mod 24
z(id) = floor(id / 24)
```

Un ID válido está entre 0 y 335. El origen `(1,7)` tiene ID 169 y la meta `(22,6)` ID 166. La vecindad sigue el orden estable N, E, S, O. Sin obstáculos, hay 634 conexiones cardinales no dirigidas, equivalentes a 1268 aristas dirigidas posibles.

| Tipo                   | Coste de entrar                                 |
| ---------------------- | ----------------------------------------------- |
| `clear`                | 1                                               |
| `gate`                 | 1                                               |
| `wormhole`             | 1                                               |
| `anomaly`              | 2                                               |
| `solid`                | Infinito; se excluye de la búsqueda.            |
| `null` en conocimiento | Se supone coste 1 hasta descubrir su tipo real. |

El coste pertenece a la celda destino. Esto puede producir costes distintos entre recorrer una misma conexión en un sentido u otro. El origen inicial no se cobra; volver a entrar en él sí consume su coste.

## Generación reproducible

`seededRandom(seed)` combina un hash del texto con un generador de enteros de 32 bits. Su función devuelve números en `[0,1)`. No se utiliza para criptografía. La nueva semilla de misión se obtiene aparte con `crypto.getRandomValues`.

El generador realiza estas operaciones en orden:

1. Asigna celdas por muestreo: 23% sólido, 14% anomalía y 63% despejado como probabilidades **previas** a los cambios estructurales.
2. Instala fronteras sólidas en `x=8` y `x=16`, dejando dos aperturas por frontera.
3. Fija las ventanas `(8,3)`, `(8,10)` y los agujeros `(16,4)`, `(16,11)`.
4. Abre un corredor cardinal desde el origen a la meta, eligiendo una apertura en cada frontera.
5. Garantiza que origen y meta sean despejados.
6. Si Bloqueo está activo, vuelve sólidos los cuatro vecinos de la meta.

La distribución final no tiene exactamente los porcentajes iniciales: fronteras y corredor la modifican. En modo normal existe al menos un camino real. Esto no obliga al piloto a descubrir directamente ese camino ni hace óptima su exploración total.

Los biomas dependen de `floor(x / 8)`: espacio profundo, órbita planetaria y otra galaxia. El decorado usa sus propias semillas visuales; no consume el PRNG del generador lógico.

## Conocimiento y radio de escaneo

El conocimiento inicial incluye origen, meta, cuatro balizas y 24 celdas de frontera sólida: 30 nodos conocidos. El resto comienza en `null`.

Escanear un nodo crea un array nuevo, revela sus vecinos cardinales válidos y asegura que el propio nodo esté identificado. `discoveries` contiene únicamente vecinos que antes eran desconocidos. No revela diagonales.

El escaneo se ejecuta desde el nodo actual antes de desplazarse. Una celda adyacente elegida para avanzar siempre tiene su coste real revelado antes de entrar. El combustible no se cobra a partir de una suposición optimista.

## A\* de cada búsqueda

Para una búsqueda que empieza en el nodo actual `s`, sea `G` el combustible real ya gastado y `d(s,n)` el coste del mejor prefijo de plan conocido desde `s`:

```text
g_busqueda(n) = G + d(s,n)
h(n) = abs(x(n) - x(meta)) + abs(z(n) - z(meta))
f_busqueda(n) = g_busqueda(n) + h(n)
```

La cola es un min-heap. Se compara, en orden:

1. Menor f.
2. Menor h.
3. Continuación del rumbo de la nariz recibido al iniciar la búsqueda.
4. Orden estable de inserción.

La inercia compara el movimiento del candidato con el **rumbo actual de la nave**, no con un rumbo predicho distinto en cada nodo remoto. Es un desempate: no cambia el coste de transición ni introduce una penalización por girar.

OPEN puede contener entradas antiguas de un nodo cuyo g mejoró; se descartan al extraerlas si su g ya no coincide. CLOSED evita volver a expandir nodos cerrados. Con esta heurística consistente y costes positivos no hace falta reabrirlos.

Al extraer la meta se reconstruye la ruta, incluidos inicio y meta. La respuesta incorpora el coste acumulado del plan, la cantidad expandida y hasta seis candidatos restantes ordenados. Si OPEN se agota, devuelve ruta vacía y coste infinito.

## Por qué la heurística es válida

Cada transición cardinal cambia la distancia Manhattan a la meta en una unidad como máximo y cuesta al menos 1. Por tanto:

```text
h(n) <= cost(n,n') + h(n')
```

Manhattan es consistente y no sobrestima el coste mínimo en el grafo considerado por esa búsqueda. El mismo argumento vale para celdas desconocidas supuestas de coste 1. Al revelar un peligro, cambia el grafo conocido y se inicia otra búsqueda.

Esta justificación dejaría de ser válida automáticamente si se agregaran teletransportes de coste bajo, diagonales con otro coste o aristas arbitrarias. Tales modos necesitan una heurística revisada.

## Repeated Forward A\*

```text
guardar snapshot previo
revelar vecinos cardinales del nodo actual
si aparece sólido o anomalía nueva: incrementar contador de recálculos
resolver A* desde el nodo actual con g inicial = combustible real
si no hay camino: terminar en BLOCKED_END
elegir el segundo nodo de la ruta
clasificar avance o reversa al padre
animar, entrar y cobrar el coste real del destino
actualizar h y f para la nueva posición
si es la meta: calcular el reporte; de lo contrario esperar otro paso
```

Se vuelve a ejecutar A\* **en cada paso**, incluso cuando el pulso no descubre peligro. El contador visible aumenta una vez por escaneo con uno o más nuevos sólidos/anomalías, no una vez por llamada ni por peligro individual.

## Coste acumulado continuo

Después de cada desplazamiento de `n_t` a `n_(t+1)`:

```text
G_(t+1) = G_t + coste_real(n_(t+1))
```

La constante G incluida en todos los candidatos de una búsqueda mantiene el registro continuo y no altera el orden de sus caminos alternativos. g solo disminuye al restaurar un snapshot o reiniciar. En la telemetría de la posición actual, `f = G + h`; no es necesariamente el coste exacto del plan completo.

## Reversa y ancestry

`ancestry` conserva la rama activa. Si el siguiente nodo es `ancestry.at(-2)`, el movimiento se clasifica como reversa:

- Se retira el nodo actual de la rama.
- Se añade al conjunto de descartados.
- Se incrementa `reverseCount`, que cuenta celdas retrocedidas.
- La nariz se orienta en sentido opuesto al vector de desplazamiento.

La primera reversa puede mantener el rumbo que ya miraba al obstáculo. Si el retroceso cruza una esquina, se ajusta la guiñada para continuar con la nariz opuesta al movimiento. No se conserva un único ángulo absoluto al doblar toda una rama.

Entrar nuevamente a una celda cuesta combustible. `Regresar` es otra operación: restaura el pasado y no representa vuelo adicional cobrado.

## Óptimo final y límites de optimalidad

Cada A\* optimiza el camino del **grafo que conoce en ese momento**. El trayecto completo de exploración puede ser más caro que el óptimo con conocimiento total.

Al capturar se ejecuta otra búsqueda desde el origen sobre `graph.cells`, con g inicial 0. El reporte conserva:

```text
optimalCost   = mínimo real origen → meta con todo el mapa
actualCost    = combustible consumido durante la exploración
overhead      = actualCost - optimalCost
optimalPath   = ruta global de referencia
```

No se sustituye el combustible real por el óptimo. Si el destino es inaccesible, se muestra bloqueo y no se fabrica un reporte de captura.

## Coste computacional

Para V nodos, E aristas candidatas, Q entradas del heap y L nodos de ruta:

- Inserción/extracción del heap: `O(log Q)`.
- Búsqueda: cota conservadora `O((V + E) log(E + 1))`, más el resumen ordenado de frontera.
- Resumen final de OPEN: ordenación de hasta V candidatos, `O(V log V)`.
- Reconstrucción actual mediante `unshift`: puede costar `O(L²)`; es mejorable con append y reverse.
- Cada snapshot copia el conocimiento y las colecciones de la partida. El historial completo no tiene límite configurado y puede crecer de forma cuadrática respecto a las visitas acumuladas, además del coste de copiar el mapa por paso.

El tamaño fijo 336 mantiene estas operaciones pequeñas en el prototipo. Ampliar mapas exige revisar rendimiento, memoria y supuestos antes de reutilizar estos límites.

[Índice](README.md) · [Estado y API](ESTADO_Y_API.md)
