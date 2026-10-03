import argparse, csv, time
from pathlib import Path
from .engine import Simulation


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--scenario", default="ridge", choices=["ridge", "siege", "stress"])
    p.add_argument("--seeds", type=int, default=5)
    p.add_argument("--output", default="results/benchmark.csv")
    a = p.parse_args()
    if a.seeds < 1:
        p.error("seeds must be positive")
    rows = []
    for seed in range(a.seeds):
        for policy in ["isolated", "periodic", "selective"]:
            start = time.perf_counter()
            sim = Simulation(seed, a.scenario, policy)
            sim.run()
            rows.append(
                dict(
                    seed=seed,
                    policy=policy,
                    scenario=a.scenario,
                    base_health=sim.health,
                    messages=sim.messages,
                    dispatches=sim.dispatches,
                    allies_alive=sum(s.count for s in sim.squads if s.side == "ally"),
                    elapsed_seconds=round(time.perf_counter() - start, 6),
                )
            )
    path = Path(a.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=rows[0])
        w.writeheader()
        w.writerows(rows)
    print(path)


if __name__ == "__main__":
    main()
