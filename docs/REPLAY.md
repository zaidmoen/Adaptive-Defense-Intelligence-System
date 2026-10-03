# Replay format v1

Top-level fields: schemaVersion=1, seed, scenario, policy, grid (40 rows × 60 columns), base [x,y], profiles, frames, events.

Terrain: 0 plains, 1 forest, 2 ridge, 3 impassable barrier.

Frame: tick, baseHealth, messages (cumulative deliveries), dispatches (cumulative assignments), squads.
Squad: id, side, kind, x, y, state, target, alive (unique soldier IDs), path (cell coordinates).
Event: tick, kind (report/support/fire), source, target, reason; optional deliveries, path or hits.

Frames include ground truth for debugging. AI report knowledge is held separately in Python. Replay links must not be interpreted as true network packets. Rendering spreads surviving unit IDs in a 5×5 formation around the squad centroid; those offsets are decorative.
