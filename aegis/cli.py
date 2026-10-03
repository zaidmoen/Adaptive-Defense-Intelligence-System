import argparse
import json
from pathlib import Path
from .engine import Simulation
from .scenarios import SCENARIOS

def main():
    p=argparse.ArgumentParser(description="Generate an AEGIS replay")
    p.add_argument("--seed",type=int,default=42)
    p.add_argument("--scenario",choices=SCENARIOS,default="ridge")
    p.add_argument("--policy",choices=["selective","periodic","isolated"],default="selective")
    p.add_argument("--ticks",type=int,default=120)
    p.add_argument("--output",default="results/replay.json")
    a=p.parse_args()
    if not 1<=a.ticks<=10000:p.error("ticks must be between 1 and 10000")
    replay=Simulation(a.seed,a.scenario,a.policy).run(a.ticks)
    path=Path(a.output);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(replay,separators=(",",":")))
    print(f"Saved {len(replay['frames'])} frames to {path}")
if __name__=="__main__":main()
