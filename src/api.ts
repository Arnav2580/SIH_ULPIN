import type { DashboardData, SceneYear } from '../shared/types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options)
  if (!response.ok) throw new Error((await response.json()).message ?? 'Request failed')
  return response.json()
}

export const api = {
  dashboard: () => request<DashboardData>('/api/dashboard'),
  validate: (id: string, year: SceneYear) => request<{ score: number; checks: Array<{ id: string; label: string; status: string; detail: string }> }>(`/api/parcels/${id}/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year }) }),
}
