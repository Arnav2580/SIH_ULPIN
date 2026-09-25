import type { Audit, CityData, Review, Validation } from "../shared/city";
export async function call<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `Server returned ${response.status}` }));
    throw new Error(error.message);
  }
  return response.json();
}
export const cityApi = {
  load: () => call<CityData>("/city"),
  validate: (id: string, year: number) =>
    call<Validation>(`/parcels/${id}/validate`, { year }),
  reviews: () => call<Review[]>("/reviews"),
  audit: () =>
    call<{
      events: Audit[];
      integrity: { valid: boolean; events: number; head: string };
    }>("/audit"),
};
