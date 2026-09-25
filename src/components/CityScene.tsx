import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { atYear, useColors, type CityUnit } from "../../shared/city";
import type { MapProps } from "./CityMap";
function Camera({
  focus,
  selected,
  parcels,
}: {
  focus: number;
  selected: string;
  parcels: MapProps["parcels"];
}) {
  const { camera } = useThree(),
    controls = useRef<OrbitControlsType>(null);
  useEffect(() => {
    if (!focus) return;
    const p = parcels.find((p) => p.id === selected);
    if (!p || !controls.current) return;
    camera.position.set(p.x + 70, 80, p.z + 90);
    controls.current.target.set(p.x, 15, p.z);
    controls.current.update();
  }, [focus, selected, parcels, camera]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={35}
      maxDistance={650}
      maxPolarAngle={Math.PI / 2.1}
      enableDamping
    />
  );
}
function Box({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}
export default function CityScene(
  props: MapProps & {
    focus: number;
    floor: number;
    selectedUnit: string | null;
    onUnit: (unit: CityUnit) => void;
  },
) {
  return (
    <Canvas
      shadows
      camera={{ position: [260, 250, 310], fov: 42 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true }}
      aria-label="3D virtual city"
    >
      <color attach="background" args={["#e1e9e2"]} />
      <ambientLight intensity={1.7} />
      <directionalLight
        position={[110, 200, 80]}
        intensity={2.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-210}
        shadow-camera-right={210}
        shadow-camera-top={210}
        shadow-camera-bottom={-210}
        shadow-camera-far={550}
        shadow-bias={-0.0005}
      />
      <Box position={[0, -2, 0]} size={[330, 3, 330]} color="#d2dfd1" />
      {Array.from({ length: 7 }, (_, i) => -144 + i * 48).map((n) => (
        <group key={n}>
          <Box position={[n, -0.35, 0]} size={[7, 0.3, 318]} color="#aabbb5" />
          <Box position={[0, -0.34, n]} size={[318, 0.3, 7]} color="#aabbb5" />
          {Array.from({ length: 26 }, (_, i) => -150 + i * 12).map((m) => (
            <group key={m}>
              <Box
                position={[n, -0.15, m]}
                size={[0.35, 0.08, 4]}
                color="#ecf1e8"
              />
              <Box
                position={[m, -0.14, n]}
                size={[4, 0.08, 0.35]}
                color="#ecf1e8"
              />
            </group>
          ))}
        </group>
      ))}
      {props.parcels.map((p) => {
        const v = atYear(p, props.year),
          active = p.id === props.selected,
          dim = props.filter !== "All" && props.filter !== p.use;
        return (
          <group
            key={p.id}
            onClick={(e) => {
              e.stopPropagation();
              props.onSelect(p.id);
            }}
          >
            <mesh position={[p.x, 0, p.z]}>
              <boxGeometry args={[p.width, 0.25, p.depth]} />
              <meshStandardMaterial
                color={
                  active
                    ? "#c1de8c"
                    : dim
                      ? "#d8dfd7"
                      : p.use === "Green space"
                        ? "#9eba83"
                        : "#dbe1d3"
                }
              />
              {props.boundaries && (
                <Edges
                  color={active ? "#426e39" : "#91a591"}
                  lineWidth={active ? 2 : 1}
                />
              )}
            </mesh>
            {props.buildings &&
              Array.from({ length: v.floors }, (_, i) => i).map((i) => {
                const cut = active && props.floor > 0 && i + 1 > props.floor;
                if (cut) return null;
                if (active && i + 1 === props.floor)
                  return (
                    <group key={i}>
                      {v.units
                        .filter((u) => u.floor === props.floor)
                        .map((u) => {
                          const [x, y, z, X, Y, Z] = u.bounds;
                          return (
                            <mesh
                              key={u.id}
                              position={[(x + X) / 2, (y + Y) / 2, (z + Z) / 2]}
                              castShadow
                              onClick={(event) => {
                                event.stopPropagation();
                                props.onUnit(u);
                              }}
                            >
                              <boxGeometry
                                args={[X - x - 0.2, Y - y - 0.1, Z - z - 0.2]}
                              />
                              <meshStandardMaterial
                                color={
                                  props.selectedUnit === u.id
                                    ? "#ddb26d"
                                    : "#b3cf87"
                                }
                                roughness={0.7}
                              />
                              <Edges
                                color={
                                  props.selectedUnit === u.id
                                    ? "#8c642d"
                                    : "#749052"
                                }
                              />
                            </mesh>
                          );
                        })}
                    </group>
                  );
                return (
                  <group key={i}>
                    <Box
                      position={[p.x, i * 3.2 + 1.65, p.z]}
                      size={[28, 2.65, 28]}
                      color={
                        dim
                          ? "#c8d1ca"
                          : v.status === "Damaged"
                            ? "#bd8c74"
                            : active && i + 1 === props.floor
                              ? "#a7c963"
                              : useColors[
                                  v.status === "Redeveloped"
                                    ? "Commercial"
                                    : p.use
                                ]
                      }
                    />
                    <Box
                      position={[p.x, i * 3.2 + 3.08, p.z]}
                      size={[29, 0.4, 29]}
                      color={dim ? "#d1d8ce" : "#eff2e9"}
                    />
                    <Box
                      position={[p.x, i * 3.2 + 1.6, p.z + 14.05]}
                      size={[25, 1.7, 0.1]}
                      color={active ? "#42695f" : "#63857e"}
                    />
                    <Box
                      position={[p.x + 14.05, i * 3.2 + 1.6, p.z]}
                      size={[0.1, 1.7, 25]}
                      color="#64877e"
                    />
                  </group>
                );
              })}
            {p.use === "Green space" &&
              Array.from({ length: 9 }, (_, i) => (
                <group
                  key={i}
                  position={[
                    p.x - 12 + (i % 3) * 12,
                    0,
                    p.z - 12 + Math.floor(i / 3) * 12,
                  ]}
                >
                  <Box
                    position={[0, 2, 0]}
                    size={[0.8, 4, 0.8]}
                    color="#7f8061"
                  />
                  <mesh position={[0, 5, 0]} castShadow>
                    <icosahedronGeometry args={[4.5, 1]} />
                    <meshStandardMaterial
                      color={i % 2 ? "#759868" : "#98af73"}
                    />
                  </mesh>
                </group>
              ))}
            {active && (
              <mesh position={[p.x, 0.3, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[26, 26.5, 4]} />
                <meshBasicMaterial color="#4d7a35" transparent opacity={0.7} />
              </mesh>
            )}
          </group>
        );
      })}
      <Camera
        focus={props.focus}
        selected={props.selected}
        parcels={props.parcels}
      />
    </Canvas>
  );
}
