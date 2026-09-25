import {
  atYear,
  overlaps,
  unitContains,
  type CityParcel,
  type Check,
  type Validation,
} from "../shared/city.js";
export function validateCityParcel(p: CityParcel, year: number): Validation {
  const v = atYear(p, year),
    units = v.units;
  const boundary: [number, number, number, number, number, number] = [
    p.x - p.width / 2,
    0,
    p.z - p.depth / 2,
    p.x + p.width / 2,
    v.floors * 3.2,
    p.z + p.depth / 2,
  ];
  const invalid = units.filter(
    (u) =>
      !u.bounds.every(Number.isFinite) ||
      u.bounds[3] <= u.bounds[0] ||
      u.bounds[4] <= u.bounds[1] ||
      u.bounds[5] <= u.bounds[2],
  ).length;
  const outside = units.filter((u) => !unitContains(boundary, u.bounds)).length;
  let collisions = 0;
  for (let i = 0; i < units.length; i++)
    for (let j = i + 1; j < units.length; j++)
      if (overlaps(units[i].bounds, units[j].bounds)) collisions++;
  const duplicate = units.length - new Set(units.map((u) => u.id)).size;
  const reviews = units.filter((u) => u.review).length;
  const checks: Check[] = [
    {
      id: "solid",
      label: "Positive, finite solid geometry",
      status: invalid ? "fail" : "pass",
      detail: `${invalid} invalid volumes in ${units.length} units.`,
    },
    {
      id: "containment",
      label: "2D parcel / 3D volume containment",
      status: outside ? "fail" : "pass",
      detail: `${outside} units extend beyond the parcel or structure envelope.`,
    },
    {
      id: "overlap",
      label: "Volumetric overlap detection",
      status: collisions ? "fail" : "pass",
      detail: `${collisions} overlapping pairs. Shared faces are permitted.`,
    },
    {
      id: "identity",
      label: "Unique spatial identities",
      status: duplicate ? "fail" : "pass",
      detail: `${duplicate} duplicate identifiers.`,
    },
    {
      id: "rights",
      label: "Rights continuity review",
      status: reviews ? "review" : "pass",
      detail: reviews
        ? `${reviews} replacement units require an authoritative rights instrument. Historical rights remain recorded.`
        : "No unresolved mappings in this synthetic snapshot.",
    },
    {
      id: "source",
      label: "Source provenance",
      status: "review",
      detail: `${v.source}. Synthetic source; no official signature or field survey.`,
    },
  ];
  return {
    parcelId: p.id,
    year,
    checks,
    checkedAt: new Date().toISOString(),
    score: Math.round(
      (checks.filter((c) => c.status === "pass").length / checks.length) * 100,
    ),
  };
}
export function exportGeometry(parcels: CityParcel[], year: number) {
  const vertices: number[][] = [],
    CityObjects: Record<string, unknown> = {};
  for (const p of parcels) {
    const version = atYear(p, year),
      start = vertices.length;
    vertices.push(
      [p.x - p.width / 2, p.z - p.depth / 2, 0],
      [p.x + p.width / 2, p.z - p.depth / 2, 0],
      [p.x + p.width / 2, p.z + p.depth / 2, 0],
      [p.x - p.width / 2, p.z + p.depth / 2, 0],
    );
    CityObjects[p.id] = {
      type: "LandUse",
      attributes: {
        ulpin: p.ulpin,
        name: p.name,
        synthetic: true,
        year,
        status: version.status,
      },
      geometry: [
        {
          type: "MultiSurface",
          lod: "0",
          boundaries: [[[start, start + 1, start + 2, start + 3]]],
        },
      ],
    };
    for (const u of version.units) {
      const [x, y, z, X, Y, Z] = u.bounds,
        k = vertices.length;
      vertices.push(
        [x, z, y],
        [X, z, y],
        [X, Z, y],
        [x, Z, y],
        [x, z, Y],
        [X, z, Y],
        [X, Z, Y],
        [x, Z, Y],
      );
      const faces = [
        [0, 3, 2, 1],
        [0, 1, 5, 4],
        [1, 2, 6, 5],
        [2, 3, 7, 6],
        [3, 0, 4, 7],
        [4, 5, 6, 7],
      ].map((face) => [face.map((n) => k + n)]);
      CityObjects[u.id] = {
        type: "GenericCityObject",
        attributes: { parcelId: p.id, prototype3DId: u.id, floor: u.floor },
        geometry: [{ type: "Solid", lod: "1", boundaries: [faces] }],
      };
    }
  }
  return {
    type: "CityJSON",
    version: "2.0",
    transform: { scale: [0.001, 0.001, 0.001], translate: [0, 0, 0] },
    metadata: {
      title:
        "BhuDrishti synthetic district; local engineering coordinates in metres",
    },
    CityObjects,
    vertices: vertices.map((v) => v.map((n) => Math.round(n * 1000))),
  };
}
