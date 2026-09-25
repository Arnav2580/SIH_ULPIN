import {
  atYear,
  useColors,
  type CityParcel,
  type LandUse,
} from "../../shared/city";
export interface MapProps {
  parcels: CityParcel[];
  selected: string;
  year: number;
  filter: LandUse | "All";
  onSelect: (id: string) => void;
  boundaries: boolean;
  buildings: boolean;
}
export function CityMap(props: MapProps) {
  return (
    <svg
      viewBox="-166 -166 332 332"
      className="flat-map"
      aria-label="Interactive 2D cadastral map"
    >
      <rect x="-166" y="-166" width="332" height="332" fill="#e4ece4" />
      {Array.from({ length: 7 }, (_, i) => -144 + i * 48).map((n) => (
        <g key={n}>
          <path
            d={`M ${n} -160 V 160 M -160 ${n} H 160`}
            stroke="#bdc9c4"
            strokeWidth="7"
          />
          <path
            d={`M ${n} -160 V 160 M -160 ${n} H 160`}
            stroke="#f8faf8"
            strokeWidth=".4"
            strokeDasharray="3 3"
          />
        </g>
      ))}
      {props.parcels.map((p) => {
        const v = atYear(p, props.year),
          active = p.id === props.selected;
        return (
          <g
            key={p.id}
            role="button"
            tabIndex={0}
            aria-label={`Select ${p.name}, ${p.id}`}
            onClick={() => props.onSelect(p.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                props.onSelect(p.id);
              }
            }}
            opacity={
              props.filter === "All" || props.filter === p.use ? 1 : 0.22
            }
            className="map-parcel"
          >
            <rect
              x={p.x - p.width / 2}
              y={p.z - p.depth / 2}
              width={p.width}
              height={p.depth}
              rx="1"
              fill={active ? "#d8efb2" : useColors[p.use]}
              stroke={
                active
                  ? "#3c6941"
                  : props.boundaries
                    ? "#879e8d"
                    : "transparent"
              }
              strokeWidth={active ? 1.5 : 0.4}
              strokeDasharray={active ? "" : "2 1"}
            />
            {props.buildings && v.floors > 0 && (
              <rect
                x={p.x - 13}
                y={p.z - 13}
                width="26"
                height="26"
                fill={v.status === "Damaged" ? "#d59e83" : "#f4f6ef"}
                stroke="#71877a"
                strokeWidth=".5"
              />
            )}
            <text
              x={p.x}
              y={p.z - 1}
              textAnchor="middle"
              fontSize="4.3"
              fill="#2e4e40"
            >
              {p.id}
            </text>
            <text
              x={p.x}
              y={p.z + 5}
              textAnchor="middle"
              fontSize="3.1"
              fill="#587569"
            >
              {v.floors
                ? `${v.floors} floors`
                : p.use === "Green space"
                  ? "Public green"
                  : "Vacant"}
            </text>
          </g>
        );
      })}
      <text
        x="0"
        y="-149"
        textAnchor="middle"
        fontSize="4"
        fill="#607a6b"
        letterSpacing="2"
      >
        SAMPIGE AVENUE
      </text>
    </svg>
  );
}
