import { ContactShadows, Environment, OrbitControls, RoundedBox, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import type { SceneYear, Unit } from '../../shared/types'

function ResidentialTower({ year, selected, onSelect }: { year: SceneYear; selected: string | null; onSelect: (unit: Unit) => void }) {
  const damaged = year === 2028
  const floors = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
  return <group position={[0, 0, 0]} rotation={[0, -0.25, 0]}>
    {floors.map((floor) => <group key={floor} position={[0, floor * 0.46, 0]}>
      {[0, 1, 2, 3].map((index) => {
        const id = `IN-KA-BLR-560102-9471-F${String(floor).padStart(2, '0')}-U${String(index + 1).padStart(2, '0')}`
        const unit: Unit = { id, floor, index: index + 1, type: 'Apartment', area: 78 + ((floor * 4 + index) * 7 % 18), volume: 244 + ((floor * 4 + index) * 13 % 52), holder: ['Aarav Mehta', 'Nisha Rao', 'Zoya Khan', 'Kabir Joshi'][(floor + index) % 4], rightStatus: floor === 1 && index < 3 ? 'Under review' : 'Active', share: '1.73%' }
        const x = index % 2 === 0 ? -0.83 : 0.83
        const z = index < 2 ? -0.63 : 0.63
        const active = selected === id
        return <RoundedBox key={id} args={[1.55, 0.4, 1.18]} radius={0.035} smoothness={4} position={[x, 0, z]} onClick={(e) => { e.stopPropagation(); onSelect(unit) }}>
          <meshStandardMaterial color={active ? '#f2a45b' : damaged ? '#9d7869' : floor % 2 ? '#d7c7aa' : '#e9dcc6'} emissive={active ? '#7a3211' : '#000000'} emissiveIntensity={active ? 0.45 : 0} roughness={0.72} />
        </RoundedBox>
      })}
    </group>)}
    {damaged && <mesh position={[0.5, 4.1, 1.22]} rotation={[0, 0, -0.25]}><boxGeometry args={[0.09, 2.2, 0.03]} /><meshBasicMaterial color="#a43c2e" /></mesh>}
  </group>
}

function RedevelopedBuilding() {
  return <group rotation={[0, -0.25, 0]}>
    {[1, 2, 3].map((floor) => <RoundedBox key={floor} args={[4.1, 0.92, 3]} radius={0.08} position={[0, floor * 0.96, 0]}>
      <meshStandardMaterial color={floor === 1 ? '#244f47' : '#d9cbaa'} metalness={0.08} roughness={0.58} />
    </RoundedBox>)}
    <Text position={[0, 1.9, 1.54]} fontSize={0.34} color="#f5eedf">JANATA MARKET</Text>
  </group>
}

export function PropertyScene({ year, selected, onSelect }: { year: SceneYear; selected: string | null; onSelect: (unit: Unit) => void }) {
  return <Canvas camera={{ position: [8, 7, 10], fov: 38 }} shadows dpr={[1, 1.5]}>
    <color attach="background" args={['#dce4df']} />
    <fog attach="fog" args={['#dce4df', 15, 26]} />
    <ambientLight intensity={1.25} />
    <directionalLight position={[6, 10, 4]} intensity={2.4} castShadow />
    <group position={[0, -3, 0]}>
      <RoundedBox args={[6, 0.18, 5]} radius={0.1}><meshStandardMaterial color="#a9b69f" /></RoundedBox>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[5.4, 4.4]} /><meshStandardMaterial color="#c5ad82" wireframe={year === 2029} /></mesh>
      {(year === 2026 || year === 2028) && <ResidentialTower year={year} selected={selected} onSelect={onSelect} />}
      {year === 2031 && <RedevelopedBuilding />}
      {year === 2029 && <Text position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.36} color="#244f47">P-9471 · VACANT</Text>}
    </group>
    <ContactShadows position={[0, -2.89, 0]} opacity={0.3} scale={14} blur={2.2} />
    <Environment preset="city" />
    <OrbitControls makeDefault minPolarAngle={0.45} maxPolarAngle={1.45} minDistance={7} maxDistance={20} target={[0, 0, 0]} />
  </Canvas>
}
