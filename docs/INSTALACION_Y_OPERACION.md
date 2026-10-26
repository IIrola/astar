# Instalación y operación

## Requisitos

| Componente | Requisito                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------- | --- | ----------- |
| Node.js    | Recomendado: 24 LTS. Rango del manifiesto: `^20.19.0                                              |     | >=22.12.0`. |
| npm        | Incluido con Node; usar el lockfile mediante `npm ci`.                                            |
| Git        | Para clonar y actualizar.                                                                         |
| Navegador  | Navegador moderno con WebGL2 para Three.js 0.180.0; Web Audio para los efectos.                   |
| Chromium   | Solo para las pruebas E2E; no hace falta instalarlo para ejecutar el motor en Node.               |
| Red        | Registro npm durante la instalación. Los recursos gráficos de la aplicación se sirven localmente. |

La validación gráfica automatizada disponible corresponde a Chromium en Linux. No se declara certificación de Safari, Firefox, Windows nativo ni de dispositivos móviles reales.

## Primera instalación

```sh
git clone https://github.com/IIrola/astar.git
cd astar
node --version
npm --version
npm ci
npm run dev -- --port 5173 --strictPort
```

Estos comandos de arranque también se pueden usar desde PowerShell. Abre la dirección indicada por Vite. El servidor escucha en `0.0.0.0`; `--strictPort` evita cambiar de puerto silenciosamente.

No abras `index.html` directamente con `file://`: la aplicación necesita servir sus módulos ES y recursos por HTTP. No existe un comando `npm start`; el comando de desarrollo es `npm run dev`.

## Actualizar una copia existente

```sh
git status --short
git pull
npm ci
npm run dev -- --port 5173 --strictPort
```

Conserva tus modificaciones locales antes de integrar cambios. Si reinstalas dependencias con Vite en marcha, reinicia el proceso de desarrollo que hayas iniciado: una caché anterior puede producir `504 Outdated Optimize Dep`.

## Comandos disponibles

| Comando            | Resultado                                                            |
| ------------------ | -------------------------------------------------------------------- |
| `npm run dev`      | Servidor Vite con recarga de desarrollo.                             |
| `npm test`         | Once pruebas de dominio con el runner de Node.                       |
| `npm run build`    | Compilación estática en `dist/`.                                     |
| `npm run preview`  | Servir la compilación para revisión local.                           |
| `npm run test:e2e` | Cuatro pruebas de Chromium, con archivos ejecutados secuencialmente. |

Los scripts proceden de [package.json](../package.json). No existen scripts de lint, despliegue, Docker ni arranque de backend en esta revisión.

## Configuración de la aplicación

Se configura principalmente mediante la URL; los controles de velocidad, audio, calidad y bloqueo actúan durante la sesión. Consulta los valores exactos en el [manual](MANUAL_DEL_PILOTO.md).

```text
?seed=ORION-042&quality=balanced
?seed=ORION-042&blocked=1&quality=balanced
```

No se necesita `.env`, API key, autenticación de usuario ni base de datos. `BASE_URL` y `CHROMIUM_PATH` pertenecen al runner de pruebas, no a la configuración de juego. `import.meta.env.BASE_URL` es la base de recursos generada por Vite; no es la variable de proceso `BASE_URL` del runner.

## Validación local

En una terminal:

```sh
npm run dev -- --port 5173 --strictPort
```

En otra, desde la raíz del repositorio:

```sh
npm test
npm run test:e2e
```

La suite usa `/usr/bin/chromium` por defecto. Si el ejecutable está en otra ubicación, indica su ruta real:

```sh
CHROMIUM_PATH=/ruta/al/ejecutable/chromium npm run test:e2e
```

En PowerShell la asignación equivalente es `$env:CHROMIUM_PATH = 'C:\ruta\chrome.exe'`, seguida del comando npm. Las capturas usan rutas `/tmp/` fijadas en los tests; para ejecutar la receta E2E documentada en Windows se recomienda WSL2 con Chromium disponible allí. La portabilidad completa de E2E nativo sigue pendiente.

Los tests no inician Vite ni descargan un navegador. Instalar solo `@playwright/test` no instala automáticamente el Chromium que esta suite espera. Para cobertura, tiempos y diagnóstico, consulta [Pruebas y validación](PRUEBAS_Y_VALIDACION.md).

## Compilar y comprobar producción

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Con el preview activo, en otra terminal POSIX:

```sh
BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

En PowerShell: `$env:BASE_URL = 'http://127.0.0.1:4173'`. El preview requiere un `dist/` vigente. Una comprobación rápida de la presentación compilada puede usar solo el caso de calidad cinematográfica:

```sh
BASE_URL=http://127.0.0.1:4173 node --test --test-name-pattern="cinematic rendering" tests/browser.e2e.js
```

Esa selección ejecuta **un caso**, no equivale a aprobar toda la suite.

## Publicación en un hosting estático

1. Instalar con `npm ci` y compilar con `npm run build`.
2. Publicar el **contenido de `dist/`**, incluidas las carpetas `assets/`, `textures/` y `licenses/`.
3. Comprobar que se sirven los módulos JavaScript y que las tres texturas planetarias devuelven respuestas satisfactorias.
4. Probar avance, regreso, audio y selección de monitores en la URL publicada.

La base por defecto es `/`. Para publicar bajo una subcarpeta como `/astar/`, compilar expresamente:

```sh
npm run build -- --base=/astar/
```

Las texturas usan la base de Vite. Este comando es una receta de configuración, no evidencia de que exista un despliegue en esa ruta. No hay workflow de GitHub Pages ni hosting público declarado en el repositorio.

`vite preview` sirve para revisar el build. La elección y operación del servidor de publicación corresponde al hosting utilizado. Subir commits a GitHub no publica por sí mismo el sitio ni el entorno de desarrollo en la nube.

## Entorno en la nube

El checkout está en `/workspace/astar`. Cada tarea ya se ejecuta de forma aislada: usa esa copia y no crees otro worktree salvo petición expresa.

Si el directorio personal no admite escritura, la instalación reproducible utiliza una caché permitida:

```sh
cd /workspace/astar
npm ci --cache /workspace/.cache/npm --no-audit --no-fund
npm test
npm run build
```

Se guardaron instrucciones `install_script` y `start_skill` en la configuración del entorno durante el onboarding. Guardar un borrador no ejecuta los scripts ni publica la máquina. La publicación debe comprobarse en la configuración del producto. Los procesos Vite, el audio y la partida no deben suponerse conservados al restaurar otra sesión.

## Solución de problemas

| Síntoma                                         | Comprobación y acción                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm` no existe o hay incompatibilidad de motor | Instalar/activar Node 24 LTS y volver a abrir la terminal.                                                                     |
| `npm ci` indica divergencia de lockfile         | Comprobar rama y cambios locales; no borrar el lockfile para ocultar la divergencia.                                           |
| Puerto ocupado                                  | Reutilizar solo el servidor de esta aplicación o elegir otro con `--port`; adaptar `BASE_URL` del test.                        |
| `504 Outdated Optimize Dep`                     | Reiniciar el Vite propio después de reinstalar dependencias.                                                                   |
| Solo aparece radar / aviso de WebGL             | Revisar aceleración gráfica y compatibilidad WebGL2. El fallback no valida la vista POV.                                       |
| Movimiento lento                                | Elegir Equilibrada; cerrar cargas gráficas ajenas y revisar aceleración del navegador. No hay una garantía de FPS establecida. |
| Audio apagado                                   | Activar AUDIO mediante un clic y comprobar volumen del equipo y restricciones del navegador.                                   |
| Bloqueo parece no cambiar la misión actual      | Se aplica al pulsar Nueva persecución.                                                                                         |
| E2E no encuentra Chromium                       | Configurar `CHROMIUM_PATH` o instalar Chromium del sistema en el entorno de pruebas.                                           |
| Captura o E2E agota su espera                   | Leer el comando y estado fallidos; comprobar recursos gráficos y servidor antes de cambiar tiempos.                            |
| Recursos 404 al publicar                        | Comprobar base del build y que se incluyó todo `dist/`.                                                                        |
| Se pierde progreso al recargar                  | Es una limitación actual: no hay persistencia de partidas.                                                                     |

[Índice](README.md) · [Manual](MANUAL_DEL_PILOTO.md)
