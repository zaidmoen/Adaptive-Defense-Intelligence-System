import { useEffect, useRef, useState } from "react";
import Battlefield from "./Battlefield";
import { validate, type Replay } from "./types";

export default function App() {
  const [replay, setReplay] = useState<Replay | null>(null),
    [error, setError] = useState("");
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [selected, setSelected] = useState("A01");
  const [vision, setVision] = useState(true),
    [paths, setPaths] = useState(true),
    [intel, setIntel] = useState(true);
  const [demo, setDemo] = useState("ridge-selective");
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const abort = new AbortController();
    setPlaying(false);
    fetch(`./replays/${demo}.json`, { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error("Demo could not be loaded");
        return r.json();
      })
      .then((r) => {
        setReplay(validate(r));
        setIndex(0);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, [demo]);
  useEffect(() => {
    if (!playing || !replay) return;
    const id = setInterval(
      () =>
        setIndex((i) => {
          if (i >= replay.frames.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        }),
      250 / speed,
    );
    return () => clearInterval(id);
  }, [playing, speed, replay]);
  const load = async (f: File) => {
    try {
      if (f.size > 40 * 1024 * 1024) throw Error("Replay limit is 40 MB");
      const r = validate(JSON.parse(await f.text()));
      setReplay(r);
      setIndex(0);
      setPlaying(false);
      setSelected(r.frames[0].squads[0]?.id ?? "");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (!replay)
    return (
      <main className="loading">
        <h1>AEGIS</h1>
        <p>{error || "Initializing command station…"}</p>
      </main>
    );
  const frame = replay.frames[index],
    squad = frame.squads.find((s) => s.id === selected);
  const count = (side: string) =>
    frame.squads
      .filter((s) => s.side === side)
      .reduce((n, s) => n + s.alive.length, 0);
  const events = replay.events
    .filter((e) => e.tick <= frame.tick && e.kind !== "fire")
    .slice(-7)
    .reverse();
  return (
    <div className="shell">
      <header>
        <div className="brand-icon">◇</div>
        <div>
          <h1>
            AEGIS<span> / RESEARCH SYSTEMS</span>
          </h1>
          <p>Adaptive Defense Intelligence System</p>
        </div>
        <div className="header-right">
          <span className="status-dot" /> REPLAY LAB{" "}
          <span className="version">v0.1</span>
        </div>
      </header>
      <div className="workspace-bar">
        <div>
          <span className="eyebrow">EXPERIMENT / 001</span>
          <h2>Cooperative defense laboratory</h2>
        </div>
        <button className="secondary" onClick={() => file.current?.click()}>
          ↥ Import replay
        </button>
        <input
          ref={file}
          type="file"
          accept=".json"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) void load(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <section className="metrics">
        <article>
          <label>BASE INTEGRITY</label>
          <strong>
            {frame.baseHealth.toFixed(0)}
            <small>%</small>
          </strong>
          <div className="meter">
            <i style={{ width: `${frame.baseHealth}%` }} />
          </div>
        </article>
        <article>
          <label>FRIENDLY UNITS</label>
          <strong className="green">
            {count("ally")}
            <small>active</small>
          </strong>
          <span>Individual unit identities</span>
        </article>
        <article>
          <label>HOSTILE UNITS</label>
          <strong className="red">
            {count("enemy")}
            <small>active</small>
          </strong>
          <span>Advancing toward headquarters</span>
        </article>
        <article>
          <label>INTELLIGENCE DELIVERIES</label>
          <strong>
            {frame.messages}
            <small>messages</small>
          </strong>
          <span>{frame.dispatches} support assignments</span>
        </article>
      </section>
      <div className="layout">
        <section className="map-panel">
          <div className="panel-title">
            <span>
              <b className="green">●</b> TACTICAL OVERVIEW
            </span>
            <span>60 × 40 / Observer view</span>
          </div>
          <Battlefield
            replay={replay}
            frame={frame}
            selected={selected}
            onSelect={setSelected}
            vision={vision}
            paths={paths}
            intel={intel}
          />
          <div className="legend">
            <span>
              <i className="dot ally" /> Friendly
            </span>
            <span>
              <i className="dot enemy" /> Hostile
            </span>
            <span>▲ Scout</span>
            <span>● Infantry</span>
            <span>■ Heavy</span>
            <span className="muted">
              Terrain: plains · forest · ridge · barrier
            </span>
          </div>
          <div className="playback">
            <button
              className="play"
              aria-label={playing ? "Pause replay" : "Play replay"}
              onClick={() => {
                if (index === replay.frames.length - 1) setIndex(0);
                setPlaying(!playing);
              }}
            >
              {playing ? "Ⅱ" : "▶"}
            </button>
            <button
              className="secondary"
              onClick={() => {
                setIndex(0);
                setPlaying(false);
              }}
            >
              ↺
            </button>
            <input
              aria-label="Replay timeline"
              type="range"
              min="0"
              max={replay.frames.length - 1}
              value={index}
              onChange={(e) => {
                setIndex(+e.target.value);
                setPlaying(false);
              }}
            />
            <code>
              {frame.tick.toString().padStart(3, "0")} /{" "}
              {replay.frames.at(-1)?.tick}
            </code>
            <select
              aria-label="Replay speed"
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
            >
              {[0.5, 1, 2, 4].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </div>
        </section>
        <aside>
          <section className="card">
            <div className="panel-title">EXPERIMENT CONFIGURATION</div>
            <label className="field-label">Scenario & policy</label>
            <select value={demo} onChange={(e) => setDemo(e.target.value)}>
              <option value="ridge-selective">
                Ridge / Selective coordination
              </option>
              <option value="ridge-periodic">Ridge / Periodic broadcast</option>
              <option value="ridge-isolated">Ridge / Isolated squads</option>
              <option value="stress-selective">
                Stress / 1,000 initial units
              </option>
            </select>
            <div className="chips">
              <span>SEED {replay.seed}</span>
              <span>{replay.policy.toUpperCase()}</span>
            </div>
            <p className="hint">
              Recorded Python simulation. Policy changes load a separate run
              with the same seed.
            </p>
            <div className="toggles">
              {[
                ["Vision radius", vision, setVision],
                ["Planned routes", paths, setPaths],
                ["Contact links", intel, setIntel],
              ].map(([name, value, set]) => (
                <label key={name as string}>
                  <span>{name as string}</span>
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) =>
                      (set as (v: boolean) => void)(e.target.checked)
                    }
                  />
                </label>
              ))}
            </div>
          </section>
          <section className="card">
            <div className="panel-title">
              SQUAD INSPECTOR <span>{selected}</span>
            </div>
            <select
              aria-label="Selected squad"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {frame.squads.map((s) => (
                <option key={s.id}>{s.id}</option>
              ))}
            </select>
            {squad && (
              <>
                <h3>
                  {squad.kind.toUpperCase()}{" "}
                  <span className={squad.side === "ally" ? "green" : "red"}>
                    {squad.alive.length} / 25
                  </span>
                </h3>
                <dl>
                  <dt>Current state</dt>
                  <dd>{squad.state}</dd>
                  <dt>Support target</dt>
                  <dd>{squad.target ?? "—"}</dd>
                  <dt>Position</dt>
                  <dd>
                    {squad.x.toFixed(1)}, {squad.y.toFixed(1)}
                  </dd>
                </dl>
              </>
            )}
            <p className="hint">
              Vision overlay shows radius; barriers can block actual line of
              sight. Formation offsets are visual.
            </p>
          </section>
        </aside>
      </div>
      <section className="event-panel">
        <div className="panel-title">
          DECISION STREAM <span>Reports & support / up to current tick</span>
        </div>
        {events.length ? (
          events.map((e, i) => (
            <div className="event" key={`${e.tick}-${i}`}>
              <code>T+{e.tick.toString().padStart(3, "0")}</code>
              <span className={`badge ${e.kind}`}>{e.kind}</span>
              <b>
                {e.source} → {e.target}
              </b>
              <span>{e.reason}</span>
            </div>
          ))
        ) : (
          <p className="empty">
            No shared intelligence yet. Play the simulation to watch contacts
            appear.
          </p>
        )}
      </section>
      <footer>
        <span>AEGIS / OPEN RESEARCH PROTOTYPE</span>
        <span>Abstract game mechanics · No novelty or performance claims</span>
      </footer>
    </div>
  );
}
