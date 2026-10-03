export type Squad = {
  id: string;
  side: "ally" | "enemy";
  kind: string;
  x: number;
  y: number;
  state: string;
  target: string | null;
  alive: number[];
  path: number[][];
};
export type Frame = {
  tick: number;
  baseHealth: number;
  messages: number;
  dispatches: number;
  squads: Squad[];
};
export type Event = {
  tick: number;
  kind: string;
  source: string;
  target: string;
  reason: string;
};
export type Replay = {
  schemaVersion: number;
  seed: number;
  scenario: string;
  policy: string;
  grid: number[][];
  base: number[];
  frames: Frame[];
  events: Event[];
  profiles: Record<string, { vision: number; range: number }>;
};
export function validate(value: unknown): Replay {
  const r = value as Replay;
  if (
    !r ||
    r.schemaVersion !== 1 ||
    !Array.isArray(r.grid) ||
    r.grid.length !== 40 ||
    r.grid.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== 60 ||
        row.some((t) => !Number.isInteger(t) || t < 0 || t > 3),
    )
  )
    throw Error("Expected a version 1 AEGIS replay with a 60 × 40 map.");
  if (
    !Array.isArray(r.frames) ||
    !r.frames.length ||
    r.frames.length > 10001 ||
    !Array.isArray(r.events) ||
    !Array.isArray(r.base) ||
    r.base.length !== 2 ||
    !r.base.every(Number.isFinite)
  )
    throw Error("Replay is missing frames, events or base.");
  if (
    !r.profiles ||
    typeof r.profiles !== "object" ||
    Object.values(r.profiles).some(
      (p) =>
        !p ||
        !Number.isFinite(p.vision) ||
        p.vision < 0 ||
        p.vision > 100 ||
        !Number.isFinite(p.range),
    )
  )
    throw Error("Invalid unit profiles.");
  const ids = new Set(r.frames[0].squads?.map((s) => s.id));
  for (const f of r.frames) {
    if (
      !Number.isFinite(f.tick) ||
      !Number.isFinite(f.baseHealth) ||
      !Number.isFinite(f.messages) ||
      !Number.isFinite(f.dispatches) ||
      !Array.isArray(f.squads) ||
      f.squads.length > 200
    )
      throw Error("Invalid frame.");
    for (const s of f.squads)
      if (
        !s ||
        !ids.has(s.id) ||
        !r.profiles[s.kind] ||
        typeof s.id !== "string" ||
        !["ally", "enemy"].includes(s.side) ||
        !Number.isFinite(s.x) ||
        !Number.isFinite(s.y) ||
        s.x < 0 ||
        s.x > 59 ||
        s.y < 0 ||
        s.y > 39 ||
        !Array.isArray(s.alive) ||
        s.alive.length > 25 ||
        !s.alive.every(Number.isInteger) ||
        !Array.isArray(s.path) ||
        s.path.some(
          (p) =>
            !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite),
        )
      )
        throw Error("Invalid squad.");
  }
  if (
    r.events.some(
      (e) =>
        !Number.isFinite(e.tick) ||
        typeof e.reason !== "string" ||
        typeof e.source !== "string" ||
        typeof e.target !== "string",
    )
  )
    throw Error("Invalid event.");
  return r;
}
