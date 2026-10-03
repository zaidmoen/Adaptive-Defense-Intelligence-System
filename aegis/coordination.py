import math
from .models import Report
from .terrain import visible
from .pathfinding import astar


def observe(sim):
    allies = [s for s in sim.squads if s.side == "ally" and s.count]
    enemies = [s for s in sim.squads if s.side == "enemy" and s.count]
    for scout in allies:
        for enemy in enemies:
            if (
                math.dist((scout.x, scout.y), (enemy.x, enemy.y))
                > scout.profile["vision"]
            ):
                continue
            if not visible(sim.grid, (scout.x, scout.y), (enemy.x, enemy.y)):
                continue
            old = sim.reports.get(enemy.id)
            changed = (
                not old
                or math.dist((old.x, old.y), (enemy.x, enemy.y)) >= 3
                or abs(old.count - enemy.count) >= 5
            )
            send = (
                (sim.tick % 5 == 0)
                if sim.policy == "periodic"
                else changed or (old and sim.tick - old.observed >= 8)
            )
            if sim.policy == "isolated" or not send:
                continue
            sim.reports[enemy.id] = Report(
                enemy.id, enemy.x, enemy.y, enemy.count, enemy.kind, sim.tick, scout.id
            )
            # Count logical deliveries to the coordinator, or all allied squads.
            deliveries = len(allies) if sim.policy == "periodic" else 1
            sim.messages += deliveries
            sim.event(
                "report",
                scout.id,
                enemy.id,
                f"Contact: {enemy.kind}, estimated {enemy.count} units",
                deliveries=deliveries,
            )


def dispatch(sim):
    if sim.policy == "isolated":
        return
    for report in sorted(
        sim.reports.values(), key=lambda r: math.dist((r.x, r.y), sim.base)
    ):
        if sim.tick - report.observed > 10:
            continue
        assigned = [s for s in sim.squads if s.target == report.enemy and s.count]
        if assigned:
            continue
        available = [
            s
            for s in sim.squads
            if s.side == "ally"
            and s.count
            and s.state == "holding"
            and s.kind != "scout"
        ]
        # Keep one mobile squad in reserve under the selective policy.
        if not available or (sim.policy == "selective" and len(available) <= 1):
            continue
        choices = []
        for s in available:
            path = astar(sim.grid, (s.x, s.y), (report.x, report.y), s.kind)
            if not path:
                continue
            score = len(path) / s.profile["speed"]
            if sim.policy == "selective":
                score += max(0, report.count - s.count) * 0.2
            choices.append((score, s.id, s, path))
        if not choices:
            continue
        _, _, s, path = min(choices)
        s.path = path
        s.target = report.enemy
        s.state = "supporting"
        sim.dispatches += 1
        sim.event(
            "support",
            s.id,
            report.enemy,
            "Support assigned from received report",
            path=[list(p) for p in path],
        )
