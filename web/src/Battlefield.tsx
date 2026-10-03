import {useEffect,useRef} from 'react';
import {Application,Graphics,Container,Text} from 'pixi.js';
import type {Replay,Frame} from './types';

type Props={replay:Replay;frame:Frame;selected:string;onSelect:(id:string)=>void;vision:boolean;paths:boolean;intel:boolean};
export default function Battlefield(props:Props){
 const host=useRef<HTMLDivElement>(null);const current=useRef(props);current.current=props;
 useEffect(()=>{
  let disposed=false;const app=new Application();
  const start=async()=>{
   await app.init({width:1200,height:800,background:'#102522',antialias:true,resolution:window.devicePixelRatio||1,autoDensity:true});
   if(disposed){app.destroy(true);return;}
   host.current!.appendChild(app.canvas);app.canvas.style.width='100%';app.canvas.style.height='100%';app.canvas.style.objectFit='contain';
   const land=new Graphics();app.stage.addChild(land);
   const colors=[0x18302d,0x25463b,0x4c5140,0x101d22];
   props.replay.grid.forEach((row,y)=>row.forEach((t,x)=>{
    land.rect(x*20,y*20,20,20).fill(colors[t]);
    if(t===1){land.moveTo(x*20+5,y*20+15).lineTo(x*20+10,y*20+4).lineTo(x*20+15,y*20+15).fill(0x365848);}
    if(t===2)land.moveTo(x*20+3,y*20+14).lineTo(x*20+10,y*20+6).lineTo(x*20+17,y*20+14).stroke({color:0x73715a,width:1});
   }));
   for(let x=0;x<=1200;x+=100)land.moveTo(x,0).lineTo(x,800).stroke({color:0x75978b,alpha:.1,width:1});
   for(let y=0;y<=800;y+=100)land.moveTo(0,y).lineTo(1200,y).stroke({color:0x75978b,alpha:.1,width:1});
   const base=new Graphics().roundRect(props.replay.base[0]*20-24,props.replay.base[1]*20-25,48,50,5).fill(0x2c7969).stroke({color:0x89f9d3,width:2});app.stage.addChild(base);
   const label=new Text({text:'AEGIS / HQ',style:{fill:0xb5e8d7,fontSize:13,fontFamily:'monospace'}});label.position.set(props.replay.base[0]*20-38,props.replay.base[1]*20+34);app.stage.addChild(label);
   const dynamic=new Graphics();app.stage.addChild(dynamic);
   const labels=new Container();app.stage.addChild(labels);
   const tags=new Map<string,Text>();
   for(const s of props.replay.frames[0].squads){const tag=new Text({text:s.id,style:{fill:s.side==='ally'?0x96f5d5:0xffa08e,fontSize:12,fontFamily:'monospace'}});labels.addChild(tag);tags.set(s.id,tag);}
   app.stage.eventMode='static';app.stage.hitArea=app.screen;
   app.stage.on('pointerdown',e=>{
    const p=e.global;const s=current.current.frame.squads.filter(s=>s.alive.length).sort((a,b)=>Math.hypot(a.x*20-p.x,a.y*20-p.y)-Math.hypot(b.x*20-p.x,b.y*20-p.y))[0];
    if(s&&Math.hypot(s.x*20-p.x,s.y*20-p.y)<60)current.current.onSelect(s.id);
   });
   app.ticker.add(()=>{
    const {frame,selected,vision,paths,intel,replay}=current.current;dynamic.clear();
    for(const s of frame.squads){
     const tag=tags.get(s.id)!;tag.visible=!!s.alive.length;tag.position.set(s.x*20-15,s.y*20-27);
     if(!s.alive.length)continue;
     const c=s.side==='ally'?0x66e7bb:0xf78071;
     if(selected===s.id){dynamic.circle(s.x*20,s.y*20,26).stroke({color:0xffffff,width:2});
      if(vision)dynamic.circle(s.x*20,s.y*20,(replay.profiles[s.kind]?.vision??10)*20).fill({color:c,alpha:.05}).stroke({color:c,alpha:.35,width:1});
     }
     if(paths&&(selected===s.id||s.state==='supporting')&&s.path.length){dynamic.moveTo(s.x*20,s.y*20);for(const p of s.path)dynamic.lineTo(p[0]*20,p[1]*20);dynamic.stroke({color:c,alpha:.45,width:1.5});}
     s.alive.forEach(id=>{const slot=id%25;const x=s.x*20+(slot%5-2)*6,y=s.y*20+(Math.floor(slot/5)-2)*6;
      if(s.kind==='heavy')dynamic.rect(x-2.5,y-2.5,5,5).fill(c);else if(s.kind==='scout')dynamic.moveTo(x,y-3).lineTo(x+3,y+3).lineTo(x-3,y+3).fill(c);else dynamic.circle(x,y,2.4).fill(c);
     });
    }
    for(const e of replay.events.filter(e=>e.tick<=frame.tick&&e.tick>=frame.tick-1)){
     if(e.kind==='report'&&!intel)continue;
     const a=frame.squads.find(s=>s.id===e.source),b=frame.squads.find(s=>s.id===e.target);if(!a||!b)continue;
     const c=e.kind==='report'?0x72bfff:e.kind==='support'?0x66e7bb:0xffd17c;
     dynamic.moveTo(a.x*20,a.y*20).lineTo(b.x*20,b.y*20).stroke({color:c,alpha:e.kind==='fire'?.23:.55,width:e.kind==='support'?2:1});
    }
   });
  };start().catch(console.error);
  return()=>{disposed=true;if(app.renderer)app.destroy(true,{children:true});};
 },[props.replay]);
 return <div className="canvas-host" ref={host} aria-label="Battlefield replay. Select a squad using the map or roster."/>;
}
