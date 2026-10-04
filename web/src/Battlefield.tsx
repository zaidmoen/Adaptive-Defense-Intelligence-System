import { useEffect, useRef } from "react";
import { Application, Assets, Graphics, Container, Sprite, Text, Texture } from "pixi.js";
import type { Replay, Frame } from "./types";

type Props = {
  replay: Replay;
  frame: Frame;
  selected: string;
  onSelect: (id: string) => void;
  vision: boolean;
  paths: boolean;
  intel: boolean;
};
export default function Battlefield(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  current.current = props;
  useEffect(() => {
    let disposed = false;
    const app = new Application();
    const start = async () => {
      await app.init({
        width: 1200,
        height: 800,
        background: "#102522",
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      if (disposed) {
        app.destroy(true);
        return;
      }
      host.current!.appendChild(app.canvas);
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.objectFit = "contain";
      const assetRoot = new URL("./assets/kenney-tiny-battle/", window.location.href).href;
      const assetFiles = [
        "grass", "grass-detail", "headquarters", "forest-tree",
        "barrier", "heavy-ally", "infantry-ally", "scout-ally",
        "heavy-enemy", "infantry-enemy", "scout-enemy", "forest-detail",
      ];
      const textures: Record<string, Texture> = {};
      await Promise.all(assetFiles.map(async (name) => {
        textures[name] = await Assets.load<Texture>(`${assetRoot}${name}.png`);
      }));
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      const ground = new Container();
      const land = new Graphics();
      const scenery = new Container();
      app.stage.addChild(ground, land, scenery);
      props.replay.grid.forEach((row, y) =>
        row.forEach((t, x) => {
          const tile = new Sprite(textures[t === 3 ? "barrier" : (x * 13 + y * 7) % 5 === 0 ? "grass-detail" : "grass"]);
          tile.position.set(x * 20, y * 20);
          tile.width = 20;
          tile.height = 20;
          ground.addChild(tile);
          if (t === 3) {
            land.rect(x * 20, y * 20, 20, 20).fill({ color: 0x253333, alpha: 0.74 });
            land.rect(x * 20 + 1, y * 20 + 1, 18, 18)
              .stroke({ color: 0xd0b477, alpha: 0.58, width: 1 });
          }
          if (t === 1) {
            if ((x * 31 + y * 17) % 3 !== 0) {
              const tree = new Sprite(textures[(x + y) % 2 ? "forest-tree" : "forest-detail"]);
              tree.anchor.set(0.5, 0.68);
              tree.position.set(x * 20 + 10, y * 20 + 10);
              tree.scale.set(1.14);
              tree.alpha = 0.86;
              scenery.addChild(tree);
            }
          }
          if (t === 2) {
            land
              .moveTo(x * 20 + 1, y * 20 + 15)
              .lineTo(x * 20 + 5, y * 20 + 7)
              .lineTo(x * 20 + 9, y * 20 + 13)
              .lineTo(x * 20 + 14, y * 20 + 4)
              .lineTo(x * 20 + 19, y * 20 + 15)
              .closePath()
              .fill({ color: 0x777866, alpha: 0.58 })
              .stroke({ color: 0xc2b98d, alpha: 0.42, width: 1 });
          }
        }),
      );
      for (let x = 0; x <= 1200; x += 100)
        land
          .moveTo(x, 0)
          .lineTo(x, 800)
          .stroke({ color: 0x75978b, alpha: 0.1, width: 1 });
      for (let y = 0; y <= 800; y += 100)
        land
          .moveTo(0, y)
          .lineTo(1200, y)
          .stroke({ color: 0x75978b, alpha: 0.1, width: 1 });
      const baseX = props.replay.base[0] * 20;
      const baseY = props.replay.base[1] * 20;
      const base = new Graphics().roundRect(baseX - 23, baseY - 22, 46, 44, 7)
        .fill({ color: 0x16352c, alpha: 0.9 })
        .stroke({ color: 0x9bf0c9, width: 2 });
      app.stage.addChild(base);
      const hq = new Sprite(textures.headquarters);
      hq.anchor.set(0.5);
      hq.position.set(baseX, baseY);
      hq.scale.set(1.8);
      app.stage.addChild(hq);
      const label = new Text({
        text: "AEGIS / HQ",
        style: { fill: 0xb5e8d7, fontSize: 13, fontFamily: "monospace" },
      });
      label.position.set(
        baseX - 38,
        baseY + 25,
      );
      app.stage.addChild(label);
      const soldiers = new Container();
      app.stage.addChild(soldiers);
      const unitSprites = new Map<string, Map<number, Sprite>>();
      const iconName = (side: string, kind: string) => `${kind}-${side === "ally" ? "ally" : "enemy"}`;
      for (const squad of props.replay.frames[0].squads) {
        const members = new Map<number, Sprite>();
        for (const id of squad.alive) {
          const sprite = new Sprite(textures[iconName(squad.side, squad.kind)]);
          sprite.anchor.set(0.5);
          sprite.scale.set(0.58);
          soldiers.addChild(sprite);
          members.set(id, sprite);
        }
        unitSprites.set(squad.id, members);
      }
      const dynamic = new Graphics();
      app.stage.addChild(dynamic);
      const labels = new Container();
      app.stage.addChild(labels);
      const tags = new Map<string, Text>();
      for (const s of props.replay.frames[0].squads) {
        const tag = new Text({
          text: s.id,
          style: {
            fill: s.side === "ally" ? 0x96f5d5 : 0xffa08e,
            fontSize: 12,
            fontFamily: "monospace",
          },
        });
        labels.addChild(tag);
        tags.set(s.id, tag);
      }
      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;
      app.stage.on("pointerdown", (e) => {
        const p = e.global;
        const s = current.current.frame.squads
          .filter((s) => s.alive.length)
          .sort(
            (a, b) =>
              Math.hypot(a.x * 20 - p.x, a.y * 20 - p.y) -
              Math.hypot(b.x * 20 - p.x, b.y * 20 - p.y),
          )[0];
        if (s && Math.hypot(s.x * 20 - p.x, s.y * 20 - p.y) < 60)
          current.current.onSelect(s.id);
      });
      app.ticker.add(() => {
        const { frame, selected, vision, paths, intel, replay } =
          current.current;
        dynamic.clear();
        for (const s of frame.squads) {
          const members = unitSprites.get(s.id);
          if (members) {
            for (const [id, sprite] of members) sprite.visible = false;
            s.alive.forEach((id) => {
              const sprite = members.get(id);
              if (!sprite) return;
              const slot = id % 25;
              sprite.position.set(
                s.x * 20 + ((slot % 5) - 2) * 6,
                s.y * 20 + (Math.floor(slot / 5) - 2) * 6,
              );
              sprite.visible = true;
            });
          }
          const tag = tags.get(s.id)!;
          tag.visible = !!s.alive.length;
          tag.position.set(s.x * 20 - 15, s.y * 20 - 27);
          if (!s.alive.length) continue;
          const c = s.side === "ally" ? 0x66e7bb : 0xf78071;
          if (selected === s.id) {
            dynamic
              .circle(s.x * 20, s.y * 20, 26)
              .stroke({ color: 0xffffff, width: 2 });
            if (vision)
              dynamic
                .circle(
                  s.x * 20,
                  s.y * 20,
                  (replay.profiles[s.kind]?.vision ?? 10) * 20,
                )
                .fill({ color: c, alpha: 0.05 })
                .stroke({ color: c, alpha: 0.35, width: 1 });
          }
          if (
            paths &&
            (selected === s.id || s.state === "supporting") &&
            s.path.length
          ) {
            dynamic.moveTo(s.x * 20, s.y * 20);
            for (const p of s.path) dynamic.lineTo(p[0] * 20, p[1] * 20);
            dynamic.stroke({ color: c, alpha: 0.45, width: 1.5 });
          }
        }
        for (const e of replay.events.filter(
          (e) => e.tick <= frame.tick && e.tick >= frame.tick - 1,
        )) {
          if (e.kind === "report" && !intel) continue;
          const a = frame.squads.find((s) => s.id === e.source),
            b = frame.squads.find((s) => s.id === e.target);
          if (!a || !b) continue;
          const c =
            e.kind === "report"
              ? 0x72bfff
              : e.kind === "support"
                ? 0x66e7bb
                : 0xffd17c;
          dynamic
            .moveTo(a.x * 20, a.y * 20)
            .lineTo(b.x * 20, b.y * 20)
            .stroke({
              color: c,
              alpha: e.kind === "fire" ? 0.23 : 0.55,
              width: e.kind === "support" ? 2 : 1,
            });
        }
      });
    };
    start().catch(console.error);
    return () => {
      disposed = true;
      if (app.renderer) app.destroy(true, { children: true });
    };
  }, [props.replay]);
  return (
    <div
      className="canvas-host"
      ref={host}
      aria-label="Battlefield replay. Select a squad using the map or roster."
    />
  );
}
