# AI_CONTEXT.md

## Estado del proyecto

- **Backend**: API REST NestJS + PostgreSQL en Docker (`:3000`). Endpoints funcionales:
  - `GET/POST/DELETE /api/interest`
  - `GET/POST/DELETE /api/categories`
  - `GET/POST/GET:id/DELETE /api/products`
- **Cliente**: Catálogo de productos — consume productos con variantes (color/talle), categorías, y filtros. Incluye consulta por WhatsApp.
- **Admin**: Panel de administración de intereses — CRUD completo.
- **Seed**: Datos iniciales automáticos con 8 productos (Remeras, Pantalones, Buzos, Accesorios) y 37 variantes con imágenes de placeholder.
- **Docker**: Backend y PostgreSQL en Docker. Cliente y Admin corren localmente con `npm run dev`.
- **Cliente local** → `http://localhost:5186/` (o el puerto que muestre `npm run dev`)
- **Admin local** → `http://localhost:5187/` (o el puerto que muestre `npm run dev`)
- **Próximos pasos**:
  1. Ajustes de estilo (colores, micro‑animaciones) según preferencias.
  2. Añadir pruebas unitarias/integración.

## Historial de cambios

- 2026‑07‑22: Creación de módulos `Category` y `Product` (entity, dto, service, controller, module) en backend.
- 2026‑07‑22: Entidades relacionadas: `Product → Variant → Media`, `Product → Category`.
- 2026‑07‑22: Agregado CORS, prefijo global `/api`, y ValidationPipe en `main.ts`.
- 2026‑07‑22: Seed automático con datos de ejemplo para ropa.
- 2026‑07‑22: Todos los servicios Docker corriendo (postgres, backend, client, admin).
- 2026‑07‑22: Bugfix: imports de tipos (`{ Product, Category }` → `import type { Product, Category }`) en cliente para que React monte correctamente.

## Notas

- Todo el código está en inglés, siguiendo la convención del proyecto.
- No se ha añadido ninguna dependencia nueva.
- Los imports de solo tipos deben usar `import type`, no `import`, porque las interfaces de TypeScript se borran en runtime y el navegador tira `SyntaxError`.
