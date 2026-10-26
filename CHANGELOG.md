# Historial de cambios

Los cambios se agrupan por entrega. El paquete declara `1.0.0`, pero no existen tags de release en la revisión examinada; estas entradas no inventan versiones ni despliegues públicos.

## Documentación integral · 26 de octubre de 2026

- README como punto de entrada y catálogo de documentación.
- Visión, requisitos, instalación, operación y manual del piloto.
- Arquitectura, algoritmo, generación, máquina de estados y API interna.
- Presentación 3D, HUD, audio, recursos y atribuciones.
- Cobertura y evidencia de validación, con límites explícitos.
- Matriz de objetivos cumplidos, pendientes y capacidades todavía no creadas.
- Roadmap priorizado con criterios de aceptación.
- Guía de contribución, mantenimiento, glosario y referencias.

Entrega documental: no incorpora las funcionalidades propuestas ni modifica el comportamiento de la aplicación.

## Cabina integrada y mejora visual · 26 de octubre de 2026

Commit: [`d4106cd`](https://github.com/IIrola/astar/commit/d4106cd7423b869d4b857d91228904fc5dacccbc).

- Mundo 3D a altura completa, marco de cabina unido a cámara y consola superpuesta con perspectiva.
- Cinco MFD simultáneos en escritorio y selección de monitor en móvil.
- Rocas deformadas y suavizadas, materiales PBR y modelo de fugitivo con componentes detallados.
- Planeta con mapas locales de color/normales, nubes y atmósfera.
- Modos Cinemática y Equilibrada, posprocesado y preferencia de movimiento reducido.
- Pruebas de integración visual, recursos, móvil y teclado.

## Simulador inicial · 26 de octubre de 2026

Commit: [`3c0072f`](https://github.com/IIrola/astar/commit/3c0072f9130cb28bc9e77623b1f997151dd4c690).

- Proyecto Vite/Three.js con dominio independiente de gráficos.
- Grafo 24 × 14, tres sectores y generación semillada.
- Repeated Forward A\*, escaneo cardinal, costes ponderados y combustible acumulado.
- Reversa al padre, snapshots inmutables y regreso de estado completo.
- Captura, bloqueo, reporte de óptimo global y nueva persecución.
- Radar, cinco instrumentos, piloto automático, atajos y audio procedural.
- Suite de dominio y verificación de navegador.
