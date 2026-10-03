from dataclasses import dataclass, field

# Fictional balance values; these do not model real weapons.
PROFILES = {
    "scout": {"vision": 17, "range": 11, "power": .11, "speed": 1.0},
    "infantry": {"vision": 10, "range": 7, "power": .09, "speed": 1.3},
    "heavy": {"vision": 11, "range": 9, "power": .13, "speed": .8},
}

@dataclass
class Unit:
    id: int
    alive: bool = True

@dataclass
class Squad:
    id: str
    side: str
    kind: str
    x: float
    y: float
    units: list[Unit]
    state: str = "holding"
    path: list = field(default_factory=list)
    target: str | None = None
    @property
    def count(self):
        return sum(u.alive for u in self.units)
    @property
    def profile(self):
        return PROFILES[self.kind]

@dataclass
class Report:
    enemy: str
    x: float
    y: float
    count: int
    kind: str
    observed: int
    observer: str
