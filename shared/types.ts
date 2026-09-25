export type SceneYear = 2026 | 2028 | 2029 | 2031

export interface Unit {
  id: string
  floor: number
  index: number
  type: 'Apartment' | 'Retail' | 'Parking'
  area: number
  volume: number
  holder: string
  rightStatus: 'Active' | 'Under review' | 'Superseded'
  share: string
}

export interface LifecycleEvent {
  id: string
  year: SceneYear
  date: string
  type: 'construction' | 'transfer' | 'disaster' | 'demolition' | 'redevelopment'
  title: string
  description: string
  authority: string
  hash: string
}

export interface ParcelSnapshot {
  year: SceneYear
  label: string
  status: 'ACTIVE' | 'DAMAGED' | 'VACANT' | 'REDEVELOPED'
  structureId: string | null
  structureType: string
  floors: number
  units: number
  confidence: number
}

export interface Parcel {
  id: string
  ulpin: string
  ward: string
  city: string
  state: string
  area: number
  zoning: string
  coordinates: [number, number]
  snapshots: ParcelSnapshot[]
  units: Unit[]
  events: LifecycleEvent[]
}

export interface DashboardData {
  parcel: Parcel
  metrics: { structures: number; spatialUnits: number; activeRights: number; integrity: number }
}
