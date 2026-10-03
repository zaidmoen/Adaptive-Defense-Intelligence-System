# Research protocol — exploratory

Question: how do observation sharing and squad dispatch affect base survival, message deliveries and computation under different terrain and wave conditions?

This release is infrastructure for experiments. It does not establish novelty or realistic combat outcomes. All combat parameters are fictional game balance values.

## Evaluation
Use paired initial seeds across policy variants. Report base health, friendly survivors, assignments, logical message deliveries and measured Python runtime. Keep scenario, horizon and initial unit count fixed for each comparison. Runs terminate on base destruction, enemy elimination or the horizon; compare completion times as well as end health when interpreting results. Runtime includes initialization and replay construction. It is not per-frame render time or pure pathfinding time. Different policies consume random draws differently; paired seeds do not imply identical later combat randomness.

Before a paper, use held-out maps/seeds, repeated timings, confidence intervals, full failure cases and parameter sensitivity. Do not tune on the final test set. Profile routing, observation, combat and serialization separately. A benchmark with 1,000 logical soldiers still has only 40 squad-level planners; disclose both counts.

## Required ablations
Hold dispatch fixed while changing reporting (none / periodic / selective). Hold reporting fixed while changing dispatch (distance / travel time / reserve-aware). Then test timestamp expiry and reserve removal. Current bundled policies combine changes and cannot isolate causality.

## Related starting points
- Zhao, Harabor & Stuckey: Reducing Redundant Work in Jump Point Search (2023): https://arxiv.org/abs/2306.15928
- Multi-Agent Pathfinding: Definitions, Variants, and Benchmarks (2019): https://arxiv.org/abs/1906.08291
- Multi Agent Path Finding under Obstacle Uncertainty (ICAPS 2023): https://ojs.aaai.org/index.php/ICAPS/article/view/27219

These are starting points for a literature review, not evidence that our candidate contribution is new.
