import unittest
from aegis.engine import Simulation
from aegis.pathfinding import astar
from aegis.terrain import visible
from aegis.scenarios import create_squads


class SimulationTests(unittest.TestCase):
    def test_reproducibility(self):
        self.assertEqual(Simulation(7).run(20), Simulation(7).run(20))

    def test_blocked_goal(self):
        self.assertEqual(astar([[0, 3], [0, 3]], (0, 0), (1, 1), "scout"), [])

    def test_astar_detour(self):
        grid = [[0, 3, 0], [0, 3, 0], [0, 0, 0]]
        path = astar(grid, (0, 0), (2, 0), "infantry")
        self.assertEqual(len(path), 6)
        self.assertTrue(all(grid[y][x] != 3 for x, y in path))

    def test_wall_blocks_sight(self):
        self.assertFalse(visible([[0, 3, 0]], (0, 0), (2, 0)))

    def test_stress_has_independent_units(self):
        units = [u.id for s in create_squads("stress") for u in s.units]
        self.assertEqual(len(units), 1000)
        self.assertEqual(len(set(units)), 1000)

    def test_invariants(self):
        sim = Simulation()
        replay = sim.run(80)
        previous = 10**9
        for frame in replay["frames"]:
            count = sum(len(s["alive"]) for s in frame["squads"])
            self.assertLessEqual(count, previous)
            previous = count
            self.assertGreaterEqual(frame["baseHealth"], 0)
            for s in frame["squads"]:
                self.assertNotEqual(sim.grid[round(s["y"])][round(s["x"])], 3)

    def test_isolated_has_no_reports(self):
        sim = Simulation(policy="isolated")
        sim.run(40)
        self.assertEqual(sim.messages, 0)

    def test_selective_retains_reserve(self):
        sim = Simulation()
        sim.run(12)
        self.assertTrue(
            any(
                s.side == "ally"
                and s.kind != "scout"
                and s.state == "holding"
                and s.count
                for s in sim.squads
            )
        )


if __name__ == "__main__":
    unittest.main()
