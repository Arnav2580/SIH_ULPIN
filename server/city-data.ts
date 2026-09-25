import {
  type CityData,
  type CityParcel,
  type CityUnit,
  type CityVersion,
  type LandUse,
} from "../shared/city.js";
const names = [
  "Lakeview Residences",
  "Orion Business Park",
  "Civic Resource Centre",
  "Canopy Gardens",
  "Aranya Heights",
  "Metro Square",
  "Juniper Court",
  "Sampige Residences",
  "District Library",
  "Central Commons",
  "Mango Grove",
  "The Exchange",
];
function units(
  p: CityParcel,
  structureId: string,
  floors: number,
  review = false,
): CityUnit[] {
  return Array.from({ length: floors * 4 }, (_, i) => {
    const floor = Math.floor(i / 4) + 1,
      n = i % 4;
    const w = (p.width - 10) / 2,
      d = (p.depth - 10) / 2;
    const x = p.x - p.width / 2 + 5 + (n % 2) * w,
      z = p.z - p.depth / 2 + 5 + Math.floor(n / 2) * d;
    return {
      id: `3D-${p.ulpin}-${structureId}-F${String(floor).padStart(2, "0")}-U${n + 1}`,
      parcelId: p.id,
      structureId,
      floor,
      number: n + 1,
      bounds: [x, (floor - 1) * 3.2, z, x + w, floor * 3.2, z + d],
      area: w * d,
      volume: w * d * 3.2,
      holder: `Demo party ${String(i + 1).padStart(3, "0")}`,
      right: p.use === "Civic" ? "Public use" : "Ownership",
      review: review && i < 3,
    };
  });
}
export function seedCity(): CityData {
  const parcels: CityParcel[] = Array.from({ length: 36 }, (_, i) => {
    const row = Math.floor(i / 6),
      col = i % 6;
    const use: LandUse =
      i % 11 === 9 || i === 30
        ? "Green space"
        : i % 8 === 2
          ? "Civic"
          : i % 4 === 1
            ? "Commercial"
            : "Residential";
    const p: CityParcel = {
      id: `P-${9471 + i}`,
      ulpin: `DEMO${String(9471000000 + i)}`,
      name:
        i === 0
          ? "Aranya Heights"
          : `${names[i % names.length]}${i > 11 ? ` ${Math.floor(i / 12) + 1}` : ""}`,
      use,
      ward: row < 3 ? "Ward 82 · East" : "Ward 83 · South",
      x: (col - 2.5) * 48,
      z: (row - 2.5) * 48,
      width: 38,
      depth: 38,
      area: 1444,
      versions: [],
    };
    const floors =
      use === "Green space"
        ? 0
        : use === "Civic"
          ? 3
          : i === 0
            ? 12
            : 4 + ((i * 7) % 10);
    const original: CityVersion = {
      year: 2026,
      status: "Active",
      structureId: `B${i + 1}-V1`,
      floors,
      units: [],
      source: `SYNTHETIC-SURVEY-${i + 1}`,
    };
    original.units = units(p, original.structureId, floors);
    p.versions = [original];
    if (i === 0)
      p.versions.push(
        {
          ...original,
          year: 2028,
          status: "Damaged",
          source: "SIMULATED-DISASTER-2028",
        },
        {
          year: 2029,
          status: "Vacant",
          structureId: "",
          floors: 0,
          units: [],
          source: "SIMULATED-CLEARANCE-2029",
        },
        {
          year: 2031,
          status: "Redeveloped",
          structureId: "B1-V2",
          floors: 3,
          units: units(p, "B1-V2", 3, true),
          source: "SIMULATED-APPROVAL-2031",
        },
      );
    return p;
  });
  return {
    parcels,
    years: [2026, 2028, 2029, 2031],
    coordinateSystem: "Local engineering grid · metres · synthetic district",
    synthetic: true,
  };
}
