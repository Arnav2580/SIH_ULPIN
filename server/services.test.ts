import { describe, expect, it } from 'vitest'
import { parcel } from './data.js'
import { buildProof, validateParcel } from './services.js'

describe('cadastre lifecycle services', () => {
  it('flags unresolved redevelopment mappings', () => {
    const result = validateParcel(parcel, 2031)
    expect(result.score).toBe(92)
    expect(result.checks.find((check) => check.id === 'rights')?.status).toBe('review')
  })

  it('creates stable integrity proofs', () => {
    expect(buildProof({ parcel: 'P-9471' })).toBe(buildProof({ parcel: 'P-9471' }))
  })
})
