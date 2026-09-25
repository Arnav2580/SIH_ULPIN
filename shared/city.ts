export type LandUse = "Residential" | "Commercial" | "Civic" | "Green space";
export type Bounds = [number, number, number, number, number, number];
export interface CityUnit {
  id: string;
  parcelId: string;
  structureId: string;
  floor: number;
  number: number;
  bounds: Bounds;
  area: number;
  volume: number;
  holder: string;
  right: "Ownership" | "Public use";
  review: boolean;
}
export interface CityVersion {
  year: number;
  status: "Active" | "Damaged" | "Vacant" | "Redeveloped";
  structureId: string;
  floors: number;
  units: CityUnit[];
  source: string;
}
export interface CityParcel {
  id: string;
  ulpin: string;
  name: string;
  use: LandUse;
  ward: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  area: number;
  versions: CityVersion[];
}
export interface Check {
  id: string;
  label: string;
  status: "pass" | "review" | "fail";
  detail: string;
}
export interface Validation {
  parcelId: string;
  year: number;
  score: number;
  checkedAt: string;
  checks: Check[];
}
export interface Review {
  id: string;
  parcelId: string;
  note: string;
  status: "Pending" | "Resolved";
  createdAt: string;
  resolvedAt: string | null;
}
export interface Audit {
  sequence: number;
  action: string;
  payload: string;
  createdAt: string;
  previousHash: string;
  hash: string;
}
export interface CityData {
  parcels: CityParcel[];
  years: number[];
  coordinateSystem: string;
  synthetic: boolean;
}
export const uses: LandUse[] = [
  "Residential",
  "Commercial",
  "Civic",
  "Green space",
];
export const useColors: Record<LandUse, string> = {
  Residential: "#b9d4c7",
  Commercial: "#91bdd4",
  Civic: "#d8c8a4",
  "Green space": "#90b97d",
};
export function atYear(parcel: CityParcel, year: number): CityVersion {
  return (
    [...parcel.versions].reverse().find((v) => v.year <= year) ??
    parcel.versions[0]
  );
}
export function unitContains(a: Bounds, b: Bounds) {
  return (
    b[0] >= a[0] &&
    b[1] >= a[1] &&
    b[2] >= a[2] &&
    b[3] <= a[3] &&
    b[4] <= a[4] &&
    b[5] <= a[5]
  );
}
export function overlaps(a: Bounds, b: Bounds) {
  return (
    a[0] < b[3] - 1e-6 &&
    a[3] > b[0] + 1e-6 &&
    a[1] < b[4] - 1e-6 &&
    a[4] > b[1] + 1e-6 &&
    a[2] < b[5] - 1e-6 &&
    a[5] > b[2] + 1e-6
  );
}
