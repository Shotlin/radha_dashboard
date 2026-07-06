/**
 * lib/api/clients/products.ts — Product catalog endpoints (Doc 1 §6.4)
 */
import 'server-only';
import { z } from 'zod';
import { apiFetch } from '../core/api-fetch';
import { ProductSchema } from '../schemas/common';
import { PaginatedSchema, cursorParams, type CursorParams } from '../core/pagination';

export async function lookupProductByEan(ean: string) {
  return apiFetch(`/products/ean/${ean}`, { schema: ProductSchema });
}

/**
 * Lenient view of the backend `GET /products/lookup/:ean` envelope
 * (`ProductLookupResult`), validating only what the Product_Image_Service needs:
 * whether a product was found and its (possibly null) `imageUrl`. Unknown keys
 * are stripped so backend additions to the lookup payload never break this.
 *
 * `imageUrl` is intentionally NOT constrained to `.url()` — the proxy returns
 * exactly what the backend gives (honest-data); a non-loadable URL simply fails
 * to render and the component falls back to the Placeholder_Image (R4.6).
 */
const ProductImageLookupSchema = z
  .object({
    found: z.boolean(),
    product: z
      .object({ imageUrl: z.string().nullable().optional() })
      .nullable()
      .optional(),
  })
  .passthrough();

/**
 * Resolve a product image URL for an EAN via the backend's product lookup, which
 * backfills from the Open Food Facts integration (BE-11) when the catalog has no
 * local row (R4.2). Returns `{ url }` with the backend-provided image URL, or
 * `{ url: null }` when the product is not found or carries no image.
 *
 * The session tenant is carried by the server-side Bearer token; `signal` lets
 * the caller bound the lookup with an `AbortController` (the resolve proxy uses a
 * 5-second window — R4.2, R4.3).
 */
export async function resolveProductImageByEan(
  ean: string,
  signal?: AbortSignal,
): Promise<{ url: string | null }> {
  const result = await apiFetch(`/products/lookup/${encodeURIComponent(ean)}`, {
    schema: ProductImageLookupSchema,
    signal,
  });
  const url = result.found ? (result.product?.imageUrl ?? null) : null;
  return { url: url && url.trim().length > 0 ? url : null };
}

export async function searchProducts(query: string, params?: CursorParams) {
  return apiFetch('/products/search', {
    schema: PaginatedSchema(ProductSchema),
    query: { q: query, ...cursorParams(params) },
  });
}

export async function getProduct(id: string) {
  return apiFetch(`/products/${id}`, { schema: ProductSchema });
}

export async function getProductIngredients(id: string) {
  return apiFetch(`/products/${id}/ingredients`, {
    schema: z.object({ ingredients: z.array(z.string()), warnings: z.array(z.string()).optional() }),
  });
}
