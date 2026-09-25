import type { DashboardData, LifecycleEvent, Parcel, SceneYear, Unit } from '../shared/types.js'

const names = ['Aarav Mehta', 'Nisha Rao', 'Zoya Khan', 'Kabir Joshi', 'Meera Iyer', 'Dev Malhotra', 'Anaya Das', 'Rohan Shah']

const units: Unit[] = Array.from({ length: 48 }, (_, i) => {
  const floor = Math.floor(i / 4) + 1
  const unit = (i % 4) + 1
  return {
    id: `IN-KA-BLR-560102-9471-F${String(floor).padStart(2, '0')}-U${String(unit).padStart(2, '0')}`,
    floor,
    index: unit,
    type: 'Apartment',
    area: 78 + ((i * 7) % 18),
    volume: 244 + ((i * 13) % 52),
    holder: names[i % names.length],
    rightStatus: i < 3 ? 'Under review' : 'Active',
    share: `${(1.65 + (i % 4) * 0.08).toFixed(2)}%`,
  }
})

const events: LifecycleEvent[] = [
  { id: 'EVT-001', year: 2026, date: '2026-02-12', type: 'construction', title: 'Occupancy certificate issued', description: 'Residential tower B001 entered the active register with 48 volumetric units.', authority: 'BBMP East Zone', hash: '8e4a…91c2' },
  { id: 'EVT-002', year: 2026, date: '2026-09-04', type: 'transfer', title: 'Unit rights updated', description: 'Registered transfer for F08-U04; geometry and parcel anchor unchanged.', authority: 'Sub-Registrar, Mahadevapura', hash: '40bc…7df1' },
  { id: 'EVT-003', year: 2028, date: '2028-04-17', type: 'disaster', title: 'Seismic damage assessment', description: 'Structure B001 marked unsafe. Physical geometry retired; associated rights preserved for review.', authority: 'Karnataka SDMA', hash: 'c174…0ab8' },
  { id: 'EVT-004', year: 2029, date: '2029-01-24', type: 'demolition', title: 'Demolition completed', description: 'Site cleared and parcel status changed to vacant. Historical structure remains queryable.', authority: 'BBMP Building Cell', hash: 'f82d…6b31' },
  { id: 'EVT-005', year: 2031, date: '2031-06-08', type: 'redevelopment', title: 'Redevelopment registered', description: 'Commercial structure B002 approved. 45 rights mapped; 3 records remain under review.', authority: 'BDA Planning Authority', hash: '2d91…4fe7' },
]

export const parcel: Parcel = {
  id: 'P-9471',
  ulpin: 'IN-KA-BLR-560102-9471',
  ward: 'Ward 82 · Garudachar Palya',
  city: 'Bengaluru',
  state: 'Karnataka',
  area: 1842.6,
  zoning: 'Mixed residential',
  coordinates: [12.9916, 77.7004],
  snapshots: [
    { year: 2026, label: 'Residential tower B001', status: 'ACTIVE', structureId: 'B001', structureType: 'Residential', floors: 12, units: 48, confidence: 96 },
    { year: 2028, label: 'B001 · unsafe', status: 'DAMAGED', structureId: 'B001', structureType: 'Residential', floors: 12, units: 48, confidence: 99 },
    { year: 2029, label: 'Cleared land', status: 'VACANT', structureId: null, structureType: 'None', floors: 0, units: 0, confidence: 100 },
    { year: 2031, label: 'Commercial centre B002', status: 'REDEVELOPED', structureId: 'B002', structureType: 'Retail', floors: 3, units: 12, confidence: 94 },
  ],
  units,
  events,
}

export function dashboardData(): DashboardData {
  return { parcel, metrics: { structures: 2, spatialUnits: 60, activeRights: 48, integrity: 98.7 } }
}

export function snapshotAt(year: SceneYear) {
  return parcel.snapshots.find((snapshot) => snapshot.year === year)!
}
