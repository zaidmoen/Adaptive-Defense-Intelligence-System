# Architecture and assumptions

Python owns the world state. A fixed simulation step is one abstract time unit. A seeded random generator controls terrain and combat. Order per step: squad movement → observation → dispatch → simultaneous combat → base damage → frame capture.

React loads an immutable JSON replay. PixiJS draws the selected frame; it does not recompute AI or influence outcomes. The UI speed is playback speed, not simulation CPU performance. Imports are bounded to 40 MB and validated against version 1 map/frame constraints.

## State and observation
Unit stores unique identity and alive status. Squad stores position, type, path, target and state. Every living friendly squad can observe contacts within its profile radius if no barrier blocks sight. Reports contain an observed location/type/count and timestamp. Exact observed counts are a simplifying assumption. Reports older than 10 steps are not used for new support dispatches. Combat uses only targets currently visible and in game-defined range.

## Policies
- isolated: local combat, no shared reports or mobile support.
- periodic: broadcast current visible contacts every 5 ticks; choose reachable mobile support by path-length/speed estimate.
- selective: send on first contact, displacement >=3 cells, count change >=5, or age >=8 ticks; retain one available mobile reserve; add a numerical strength-deficit penalty to dispatch scores.

Dispatch is a heuristic: the travel estimate uses path length, not integrated terrain travel time. It follows the last reported location and may be reassigned after arrival. No optimality claim. Scouts remain observers rather than mobile support. Reports count logical recipient deliveries, not network bytes.

A* is implemented locally using Python's heapq priority queue. Terrain costs are >=1, making Manhattan distance admissible for four-neighbor movement. Squad centroids respect walls. Formation sprites are offsets only and are not individual navigation solutions.

## Rendering
Forest/ridge/barrier tiles and individual soldier symbols are procedural. Map links indicate contact, support and abstract fire events. The vision circle shows radius, not occlusion geometry. The UI is an omniscient analysis tool. All simulation results are generated in Python; the frontend is a replay viewer.

## Next implementation gates
1. Per-unit motion and collision checks with a spatial index.
2. Terrain edits recorded as replay events with route invalidation.
3. Controlled information noise and delivery latency.
4. Factorial comparison separating communication from dispatch.
5. CPU profiling before any performance promises or optimized rewrite.
