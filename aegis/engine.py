import math
import random
from .scenarios import create_squads
from .terrain import terrain, cost, visible
from .pathfinding import astar
from .coordination import observe, dispatch


class Simulation:
    def __init__(self, seed=42, scenario="ridge", policy="selective"):
        if policy not in {"selective", "periodic", "isolated"}:
            raise ValueError("Unknown policy")
        self.seed = seed
        self.scenario = scenario
        self.policy = policy
        self.rng = random.Random(seed)
        self.grid = terrain(seed)
        self.squads = create_squads(scenario)
        self.base = (6, 20)
        self.health = 100
        self.tick = 0
        self.messages = 0
        self.dispatches = 0
        self.events = []
        self.reports = {}
        self.frames = []
        for s in self.squads:
            if s.side == "enemy":
                s.path = astar(self.grid, (s.x, s.y), self.base, s.kind)
                s.state = "advancing"

    def event(self, kind, source, target, reason, **extra):
        self.events.append(
            dict(
                tick=self.tick,
                kind=kind,
                source=source,
                target=target,
                reason=reason,
                **extra,
            )
        )

    def move(self, s):
        budget = s.profile["speed"]
        while s.path and budget > 0:
            x, y = s.path[0]
            distance = math.dist((s.x, s.y), (x, y))
            c = cost(self.grid, x, y, s.kind)
            if not math.isfinite(c):
                s.path = []
                break
            step = min(distance, budget / c)
            if distance:
                s.x += (x - s.x) * step / distance
                s.y += (y - s.y) * step / distance
            budget -= step * c
            if distance <= step + 1e-8:
                s.path.pop(0)
        if not s.path and s.state == "supporting":
            s.state = "holding"
            s.target = None

    def combat(self):
        # Resolve simultaneously from a snapshot, avoiding side-order advantage.
        casualties = {s.id: 0 for s in self.squads}
        living = [s for s in self.squads if s.count]
        for s in living:
            targets = [
                e
                for e in living
                if e.side != s.side
                and math.dist((s.x, s.y), (e.x, e.y)) <= s.profile["range"]
                and visible(self.grid, (s.x, s.y), (e.x, e.y))
            ]
            if not targets:
                continue
            target = min(
                targets, key=lambda e: (math.dist((s.x, s.y), (e.x, e.y)), e.id)
            )
            ground = self.grid[round(s.y)][round(s.x)]
            cover = self.grid[round(target.y)][round(target.x)]
            chance = (
                s.profile["power"]
                * (1.25 if ground == 2 else 1)
                * (0.65 if cover == 1 else 1)
            )
            hits = sum(self.rng.random() < chance for _ in range(s.count))
            casualties[target.id] += hits
            if hits:
                self.event("fire", s.id, target.id, f"{hits} abstract hits", hits=hits)
        for s in living:
            for u in [u for u in s.units if u.alive][: casualties[s.id]]:
                u.alive = False
            if not s.count:
                s.state = "destroyed"
                s.path = []

    def frame(self):
        return {
            "tick": self.tick,
            "baseHealth": round(self.health, 2),
            "messages": self.messages,
            "dispatches": self.dispatches,
            "squads": [
                {
                    "id": s.id,
                    "side": s.side,
                    "kind": s.kind,
                    "x": round(s.x, 3),
                    "y": round(s.y, 3),
                    "state": s.state,
                    "target": s.target,
                    "alive": [u.id for u in s.units if u.alive],
                    "path": [list(p) for p in s.path],
                }
                for s in self.squads
            ],
        }

    def run(self, ticks=120):
        self.frames = [self.frame()]
        for t in range(1, ticks + 1):
            self.tick = t
            for s in self.squads:
                if s.count:
                    self.move(s)
            observe(self)
            dispatch(self)
            self.combat()
            attackers = sum(
                s.count
                for s in self.squads
                if s.side == "enemy" and math.dist((s.x, s.y), self.base) < 2
            )
            self.health = max(0, self.health - attackers * 0.07)
            self.frames.append(self.frame())
            if self.health <= 0 or not any(
                s.count for s in self.squads if s.side == "enemy"
            ):
                break
        return {
            "schemaVersion": 1,
            "seed": self.seed,
            "scenario": self.scenario,
            "policy": self.policy,
            "grid": self.grid,
            "base": list(self.base),
            "frames": self.frames,
            "events": self.events,
            "profiles": {s.kind: s.profile for s in self.squads},
        }
