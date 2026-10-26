# Contribuir a Caza Hiperespacial A\*

La guía completa está en [Contribución y mantenimiento](docs/CONTRIBUCION_Y_MANTENIMIENTO.md).

Antes de proponer una mejora, revisa la [arquitectura](docs/ARQUITECTURA.md), el [estado de objetivos](docs/ESTADO_Y_OBJETIVOS.md) y el [roadmap](docs/ROADMAP_Y_PROPUESTAS.md). Conserva los contratos de coste real, escaneo cardinal e historial, o explica y prueba cualquier cambio intencional.

Para arrancar y verificar:

```sh
npm ci
npm test
npm run build
```

Los cambios de interfaz o renderizado necesitan además la verificación de navegador descrita en [Pruebas](docs/PRUEBAS_Y_VALIDACION.md). Los cambios exclusivamente documentales requieren revisar enlaces, ejemplos y coherencia con la implementación.

No incluyas salidas generadas, dependencias instaladas, logs ni credenciales. Conserva las atribuciones de los recursos de terceros. La licencia global del código propio sigue pendiente de una decisión del titular.
