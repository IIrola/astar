# Gráficos, HUD y audio

## Composición de la cabina

La escena ocupa la altura completa del viewport. El piloto ve el mundo a través de una estructura de cabina unida a la cámara. Sobre el cristal se colocan rumbo, coordenadas, distancia y alertas. La consola inferior superpone los instrumentos con perspectiva, sin desplazar al usuario a otra sección de página.

| Capa                      | Tecnología           | Responsabilidad                                       |
| ------------------------- | -------------------- | ----------------------------------------------------- |
| Mundo y estructura física | Three.js / WebGL2    | Biomas, modelos, cámara, materiales, luces y efectos. |
| HUD del cristal           | HTML/CSS/SVG         | Datos de vuelo, retícula y alertas.                   |
| Monitores MFD             | HTML/CSS y Canvas 2D | Telemetría, mapa, escáner, frontera y bitácora.       |
| Interacción               | DOM y teclado        | Controles, selectores y ayuda.                        |

Los MFD no son superficies WebGL interactivas dentro del mundo. Su integración actual es visual, mediante posición y transformaciones CSS. Convertirlos en paneles espaciales con raycasting o WebXR sería otro desarrollo.

## Coordenadas y cámara

Una celda equivale a 12 unidades visuales. El nodo `(x,z)` coloca la cámara en `(12x, 5, 12z)`. Y es altura; Z creciente corresponde al sur lógico. La guiñada se obtiene con `atan2(-dx, -dz)` para la cámara, cuyo eje frontal local es -Z.

El campo de visión base es 60°. `setViewOffset` eleva el eje óptico al área del parabrisas, por encima de la consola. El marco se escala horizontalmente según la relación de aspecto para conservar su presencia en pantallas estrechas.

`PilotCameraRig` interpola giros y traslaciones con smoothstep. A velocidad 1, los tiempos nominales son 340 ms de giro y 620 ms de desplazamiento; la velocidad divide estos tiempos. La pausa nominal entre pasos del piloto es `180 / speed` ms. La carga del equipo puede alargar la presentación efectiva.

En reversa cambia el vector de traslación; la nariz queda opuesta a ese vector. Al doblar una esquina se ajusta el rumbo. Regresar usa el mismo adaptador de cámara con el rumbo recuperado del snapshot.

Con `prefers-reduced-motion: reduce`, la cámara se posiciona directamente, se elimina su oscilación de reposo y el reinicio omite el warp. El planeta, las nubes y determinados efectos ambientales todavía pueden animarse; no se declara inmovilidad total.

## Modelos y materiales

| Elemento             | Implementación                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Cabina               | Vigas y superficies con bordes redondeados, hombros laterales, juntas, tornillos y tiras luminosas.    |
| Fugitivo             | Fuselaje y nariz, canopy con clearcoat, alas extruidas con bisel, góndolas, toberas y glow de motores. |
| Asteroides           | Icosaedros deformados con ruido, vértices soldados y normales recalculadas; mapa y bump procedurales.  |
| Obstáculos orbitales | Rocas escaladas verticalmente, con superficies rugosas y recepción de sombra.                          |
| Anomalías            | Fragmentos instanciados y marcador visual.                                                             |
| Singularidades       | Núcleo oscuro, anillo luminoso y disco con shader animado; representación artística.                   |
| Balizas              | Toros de armadura, segmentos instanciados y luces internas.                                            |
| Planeta              | Esfera, mapa de color y normales, nubes en otra esfera y atmósfera con shader de borde.                |
| Fondo                | Cielo texturizado proceduralmente, puntos estelares y decorado instanciado fuera de la capa de vuelo.  |

Los materiales usan principalmente `MeshStandardMaterial` y `MeshPhysicalMaterial`. La geometría lógica determina las colisiones de navegación; no se calcula colisión continua contra triángulos de estos modelos.

## Iluminación y posprocesado

- Luz hemisférica de relleno.
- Luz direccional cálida con mapa de sombras de 1024 × 1024 en Cinemática.
- Entorno de reflejos generado con `RoomEnvironment` y PMREM; no se descarga un HDR externo.
- Luz local de cabina para el acabado de materiales cercanos.
- Salida sRGB y tone mapping ACES, con exposición configurada en la escena.
- Cinemática usa `RenderPass → UnrealBloomPass → OutputPass`.

Las sombras se invalidan al actualizar el estado y durante el movimiento, evitando recalcularlas continuamente para una vista quieta. La reconstrucción de nodos conocidos y la eliminación de peligros al deshacer se manejan desde `SpaceScene.update`.

## Calidad gráfica

| Propiedad                       | Cinemática          | Equilibrada                                         |
| ------------------------------- | ------------------- | --------------------------------------------------- |
| Modelos y mapas                 | Presentes           | Presentes                                           |
| Sombras                         | Activadas           | Desactivadas                                        |
| Bloom y OutputPass del composer | En uso              | Se renderiza directamente con el renderer.          |
| Resolución del renderer         | DPR limitado a 1.5  | `min(DPR, 1) × 0.85`                                |
| Resolución del composer         | DPR limitado a 1.35 | Configurado a 0.85, aunque su cadena no se ejecuta. |
| Resolución DOM de instrumentos  | Nativa              | Nativa                                              |

La implementación crea el composer durante el arranque incluso cuando comienza en Equilibrada. La creación diferida y liberación al cambiar de calidad son oportunidades de optimización, no funciones ya entregadas.

No hay mediciones publicadas de FPS, memoria GPU ni calidad adaptativa automática. Los tiempos de pruebas con SwiftShader no deben presentarse como un benchmark de un equipo de juego.

## Disposición adaptable

- Más de 900 px de ancho: cinco MFD simultáneos, con mapa central y dos pantallas a cada lado.
- Hasta 900 px: un MFD visible, seleccionado con botones, dentro de la misma consola.
- Los controles principales siguen accesibles en ambos modos.
- La página de vuelo ocupa el viewport sin scroll; el diálogo de ayuda se abre como modal.
- `ResizeObserver` redimensiona renderer y radar cuando cambia su contenedor.

Los colores, tipografía y capas están en [variables.css](../css/variables.css), [cockpit-layout.css](../css/cockpit-layout.css) y [mfd-screens.css](../css/mfd-screens.css). La accesibilidad y legibilidad en dispositivos reales necesitan una revisión específica adicional.

## Recursos y atribución

| Archivo                | Dimensiones | Tratamiento                 |
| ---------------------- | ----------- | --------------------------- |
| `earth-atmosphere.jpg` | 2048 × 1024 | Color, sRGB.                |
| `earth-normal.jpg`     | 2048 × 1024 | Normales, datos lineales.   |
| `earth-clouds.png`     | 1024 × 512  | Color/alpha de nubes, sRGB. |

Los archivos se encuentran en [public/textures/](../public/textures/). Se redistribuyen desde ejemplos de Three.js r160; conserva [créditos](../public/licenses/ASSETS.md) y [licencia](../public/licenses/three-textures-MIT.txt). La carga usa `import.meta.env.BASE_URL`; el sitio no solicita esas imágenes a GitHub durante la ejecución.

Las texturas procedurales de roca y metal se generan en el navegador. Los modelos no requieren descargar GLB/GLTF. Cualquier futuro modelo externo necesitará origen, condiciones de uso y presupuesto de tamaño explícitos.

## Audio procedural

`Synthesizer` crea el contexto al activar AUDIO, después de una interacción. Cada sonido conecta un oscilador a una envolvente de ganancia y después al destino; los nodos se desconectan al terminar.

| Evento     | Representación                        |
| ---------- | ------------------------------------- |
| `scan`     | Pulso de seno descendente.            |
| `obstacle` | Dos tonos triangulares de aviso.      |
| `reverse`  | Tono grave descendente y señal corta. |
| `warp`     | Barridos ascendentes.                 |
| `capture`  | Secuencia de cuatro notas.            |
| `blocked`  | Tres avisos graves.                   |

El nivel de síntesis interno es 0.065. No hay archivos de audio, música de fondo, mezcla espacial ni deslizador de volumen. Los tests prueban la activación de la UI y ausencia de errores, no la calidad acústica percibida.

## Fallos gráficos

Si falla la creación de la escena, el arranque muestra un aviso y mantiene radar y simulación. Si se pierde el contexto WebGL, se pausa el piloto y se pide recargar para recuperar la vista. No existe recuperación transparente del contexto ni restauración persistente de la partida tras esa recarga.

[Índice](README.md) · [Pendientes](ESTADO_Y_OBJETIVOS.md)
