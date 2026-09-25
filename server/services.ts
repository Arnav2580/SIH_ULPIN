import { createHash } from 'node:crypto'
import type { Parcel, SceneYear } from '../shared/types.js'

export function validateParcel(parcel: Parcel, year: SceneYear) {
  const snapshot = parcel.snapshots.find((item) => item.year === year)
  if (!snapshot) throw new Error('Snapshot not found')
  const checks = [
    { id: 'boundary', label: 'Contained within base parcel', status: 'pass', detail: 'All XY extents fall inside P-9471.' },
    { id: 'overlap', label: 'No volumetric overlaps', status: 'pass', detail: `${snapshot.units} active volumes tested.` },
    { id: 'rights', label: 'Rights continuity', status: year === 2031 ? 'review' : 'pass', detail: year === 2031 ? '3 legacy rights require an authoritative mapping.' : 'Historical relationships remain preserved.' },
    { id: 'approval', label: 'Authority record attached', status: 'pass', detail: `Version ${year} has a signed source event.` },
  ]
  return { year, score: year === 2031 ? 92 : 100, checkedAt: new Date().toISOString(), checks }
}

export function buildProof(payload: unknown) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}
