(()=>{
const cv=document.getElementById('game');if(!cv)return;
const cx=cv.getContext('2d');
const W=2400,H=1600,R=36;
const WA=cv.dataset.wa, SITE='https://chhayaglobalschool.com/akola-bus-dash/';
// ---- roads: [x1,y1,x2,y2] centre lines ----
const roads=[
 [0,200,2400,200,'Station Road'],[300,520,2100,520,'Birla Road'],[900,700,2100,700,''],[0,900,2400,900,'Jatharpeth Road'],[0,1250,2000,1250,'Usman Azad Road'],[200,1500,1500,1500,''],
 [380,200,380,1600,'NH 161A'],[900,520,900,1250,''],[1250,520,1250,1600,'Necklace Road'],[1700,520,1700,900,''],[2100,200,2100,1250,'MIDC Road'],[620,900,620,1500,'']];
function onRoad(x,y){for(const r of roads){const[a,b,c,d]=r;if(b===d){if(x>=a-R&&x<=c+R&&Math.abs(y-b)<=R)return true}else{if(y>=b-R&&y<=d+R&&Math.abs(x-a)<=R)return true}}return false}
// ---- places ----
const SCHOOL={x:1000,y:520};
const parks=[{x:960,y:560,w:240,h:100,n:'Tilak Park',c:'#7cc47f'},{x:450,y:600,w:380,h:240,n:'Vasant Desai Stadium',c:'#8fd18f',oval:1},{x:430,y:1300,w:140,h:150,n:'L.B. Shastri Stadium',c:'#8fd18f',oval:1}];
const blocks=[{x:560,y:60,w:1000,h:100,n:'Akola Railway Station',c:'#c9b8e8'},{x:180,y:1540,w:160,h:56,n:'Central Bus Stand',c:'#a9cdeb'},{x:1290,y:960,w:250,h:120,n:'Market area',c:'#f2d0a4'}];
const starts={rail:{x:380,y:200,n:'Railway Station Chowk'},bus:{x:380,y:1500,n:'Central Bus Stand'},durga:{x:1250,y:700,n:'Durga Chowk'},jath:{x:2100,y:900,n:'Jatharpeth Chowk'}};
const kidNames=['Aarav','Siya','Vihaan','Anaya','Kabir','Myra'];
const kidSpots=[[700,200],[2100,480],[1700,800],[560,1250],[1250,1420],[1560,900],[900,1100],[1900,1250],[1500,520],[200,900]];
let kids=[],autos=[],cows=[],bus,keys={},t0=0,elapsed=0,penalty=0,state='intro',msg=null,hit=0,camX=0,camY=0,parts=[];
// deterministic scenery
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
const houses=[];for(let gx=0;gx<W;gx+=80)for(let gy=0;gy<H;gy+=80){const w=40+rnd()*30,h=40+rnd()*30,x=gx+5,y=gy+5;let ok=true;for(let i=0;i<=1;i+=.25)for(let j=0;j<=1;j+=.25)if(onRoad(x+w*i,y+h*j))ok=false;
 for(const p of parks.concat(blocks))if(x+w>p.x-10&&x<p.x+p.w+10&&y+h>p.y-10&&y<p.y+p.h+10)ok=false;
 if(Math.hypot(x-SCHOOL.x,y-(SCHOOL.y-90))<130)ok=false;
 if(ok&&rnd()<.8)houses.push({x,y,w,h,c:['#f4e9d8','#efe2cf','#f6efe3','#e9dcc8','#fbe3d6','#e4ecf5'][Math.floor(rnd()*6)],r:rnd()<.15?'#ff6f5e':'#d8c7ad'})}
function reset(sk){
 const s=starts[sk];bus={x:s.x,y:s.y,a:0,vx:0,vy:0};
 const pool=kidSpots.slice().sort(()=>Math.random()-.5).slice(0,6);
 kids=pool.map((p,i)=>({x:p[0],y:p[1],n:kidNames[i],got:false,b:Math.random()*6}));
 autos=[{r:0,t:.1,s:.07},{r:3,t:.6,s:-.06},{r:8,t:.3,s:.09},{r:6,t:.8,s:-.08},{r:4,t:.4,s:.08},{r:10,t:.2,s:-.1}].map(o=>({...o}));
 cows=[{x:1250,y:900},{x:380,y:700},{x:2100,y:520},{x:900,y:1250}].map(c=>({...c,ox:c.x,oy:c.y,ph:Math.random()*6}));
 t0=performance.now();penalty=0;elapsed=0;state='play';msg={t:'Pick up 6 friends, then race to school!',until:performance.now()+2500};parts=[];
 document.getElementById('gintro').hidden=true;document.getElementById('gend').hidden=true;
}
function roadPos(r,t){const[a,b,c,d]=roads[r];return b===d?{x:a+(c-a)*t,y:b+(t*0+0)+(r%2?14:-14),h:1}:{x:a+(r%2?14:-14),y:b+(d-b)*t,h:0}}
// ---- input ----
const map={ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r'};
addEventListener('keydown',e=>{if(map[e.code]&&state==='play'){keys[map[e.code]]=1;e.preventDefault()}});
addEventListener('keyup',e=>{if(map[e.code])keys[map[e.code]]=0});
document.querySelectorAll('.dpad button').forEach(b=>{const k=b.dataset.k;const on=e=>{e.preventDefault();keys[k]=1},off=e=>{e.preventDefault();keys[k]=0};
 b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)});
document.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>{reset(b.dataset.start);const gb=cv.parentElement.getBoundingClientRect();if(gb.top<0||gb.bottom>innerHeight)cv.parentElement.scrollIntoView({behavior:'smooth',block:'center'})}));
// ---- loop ----
let last=performance.now();
function step(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(state==='play')update(dt,now);draw(now);requestAnimationFrame(step)}
function say(t,ms=1400){msg={t,until:performance.now()+ms}}
function update(dt,now){
 elapsed=(now-t0)/1000+penalty;
 let dx=(keys.r?1:0)-(keys.l?1:0),dy=(keys.d?1:0)-(keys.u?1:0);
 const sp=300*(hit>now?.4:1);
 if(dx||dy){const m=Math.hypot(dx,dy);dx/=m;dy/=m;const ta=Math.atan2(dy,dx);let da=ta-bus.a;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;bus.a+=da*Math.min(1,dt*12)}
 const nx=bus.x+dx*sp*dt,ny=bus.y+dy*sp*dt;
 if(onRoad(nx,bus.y))bus.x=nx;if(onRoad(bus.x,ny))bus.y=ny;
 if((dx||dy)&&Math.random()<.3)parts.push({x:bus.x-Math.cos(bus.a)*30,y:bus.y-Math.sin(bus.a)*30,l:.6});
 parts.forEach(p=>p.l-=dt);parts=parts.filter(p=>p.l>0);
 for(const k of kids)if(!k.got&&Math.hypot(k.x-bus.x,k.y-bus.y)<50){k.got=true;const n=kids.filter(q=>q.got).length;say(n<6?`${k.n} is on board! ${n}/6`:'Everyone is on board! Now go to school ⭐',1800);burst(k.x,k.y,'#FFC23D')}
 for(const a of autos){a.t+=a.s*dt*2.2;if(a.t>1||a.t<0){a.s*=-1;a.t=Math.max(0,Math.min(1,a.t))}const p=roadPos(a.r,a.t);a.x=p.x;a.y=p.y;a.h=p.h;
  if(hit<now&&Math.hypot(a.x-bus.x,a.y-bus.y)<44){penalty+=3;hit=now+900;say('Beep beep! Auto ahead. +3 seconds');burst(bus.x,bus.y,'#FF6F5E')}}
 for(const c of cows){c.ph+=dt;c.x=c.ox+Math.sin(c.ph*.6)*40;c.y=c.oy+Math.cos(c.ph*.4)*14;
  if(hit<now&&Math.hypot(c.x-bus.x,c.y-bus.y)<46){penalty+=2;hit=now+900;say('Moooo! A cow has right of way. +2 seconds');burst(bus.x,bus.y,'#fff')}}
 if(kids.every(k=>k.got)&&Math.hypot(SCHOOL.x-bus.x,SCHOOL.y-bus.y)<60)finish();
 else if(!kids.every(k=>k.got)&&Math.hypot(SCHOOL.x-bus.x,SCHOOL.y-bus.y)<50&&(!msg||msg.until<now))say('Pick up all your friends first!');
}
function burst(x,y,c){for(let i=0;i<16;i++){const a=Math.random()*6.3,s=60+Math.random()*120;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.8,c})}}
function finish(){state='end';keys={};const t=elapsed.toFixed(1);const st=elapsed<45?3:elapsed<70?2:1;
 const best=(()=>{try{const b=parseFloat(localStorage.getItem('busdash')||'999');if(elapsed<b){localStorage.setItem('busdash',elapsed);return elapsed}return b}catch(e){return elapsed}})();
 document.getElementById('gtime').textContent=t+'s';document.getElementById('gstars').textContent='★'.repeat(st)+'☆'.repeat(3-st);
 document.getElementById('gbest').textContent='Your best: '+best.toFixed(1)+'s';
 const txt=`🚌 I drove the school bus across Akola and got all 6 kids to Chhaya Global School in ${t} seconds! Can you beat me? Play here: ${SITE}`;
 document.getElementById('gshare').href='https://wa.me/?text='+encodeURIComponent(txt);
 document.getElementById('gend').hidden=false;for(let i=0;i<5;i++)burst(SCHOOL.x+(Math.random()-.5)*200,SCHOOL.y-80,['#FFC23D','#FF6F5E','#17A99B','#A9CDEB'][i%4])}
// ---- draw ----
function rr(x,y,w,h,r){cx.beginPath();cx.roundRect?cx.roundRect(x,y,w,h,r):cx.rect(x,y,w,h)}
function draw(now){
 const vw=cv.width,vh=cv.height,sc=vw<700?.62:.85;
 const tx=(bus?bus.x:1000)-vw/2/sc,ty=(bus?bus.y:600)-vh/2/sc;camX+= (Math.max(0,Math.min(W-vw/sc,tx))-camX)*.15;camY+=(Math.max(0,Math.min(H-vh/sc,ty))-camY)*.15;
 cx.setTransform(sc,0,0,sc,-camX*sc,-camY*sc);
 cx.fillStyle='#efe6d6';cx.fillRect(0,0,W,H);
 // railway tracks
 cx.fillStyle='#d9cfe8';cx.fillRect(0,150,W,14);cx.strokeStyle='#9a8fb3';cx.lineWidth=2;for(let x=0;x<W;x+=18){cx.beginPath();cx.moveTo(x,148);cx.lineTo(x,166);cx.stroke()}
 for(const h of houses){cx.fillStyle='rgba(0,0,0,.06)';cx.fillRect(h.x+4,h.y+4,h.w,h.h);cx.fillStyle=h.c;cx.fillRect(h.x,h.y,h.w,h.h);cx.fillStyle=h.r;cx.fillRect(h.x,h.y,h.w,6)}
 for(const p of parks){cx.fillStyle=p.c;if(p.oval){cx.beginPath();cx.ellipse(p.x+p.w/2,p.y+p.h/2,p.w/2,p.h/2,0,0,7);cx.fill()}else{rr(p.x,p.y,p.w,p.h,16);cx.fill()}
  cx.fillStyle='#4e9a52';for(let i=0;i<8;i++){cx.beginPath();cx.arc(p.x+20+((i*53)%(p.w-30)),p.y+18+((i*37)%(p.h-30)),9,0,7);cx.fill()}}
 for(const b of blocks){cx.fillStyle=b.c;rr(b.x,b.y,b.w,b.h,10);cx.fill()}
 // roads
 cx.lineCap='round';for(const r of roads){const[a,b,c,d]=r;cx.strokeStyle='#5b6170';cx.lineWidth=R*2;cx.beginPath();cx.moveTo(a,b);cx.lineTo(c,d);cx.stroke()}
 for(const r of roads){const[a,b,c,d]=r;cx.strokeStyle='#f6f1e4';cx.lineWidth=3;cx.setLineDash([18,16]);cx.beginPath();cx.moveTo(a,b);cx.lineTo(c,d);cx.stroke()}cx.setLineDash([]);
 cx.font='600 17px Poppins,sans-serif';cx.fillStyle='rgba(255,255,255,.85)';for(const r of roads){if(!r[4])continue;const[a,b,c,d]=r;cx.save();if(b===d){cx.translate(a+(c-a)*.72,b+6);}else{cx.translate(a+6,b+(d-b)*.35);cx.rotate(-Math.PI/2)}cx.textAlign='center';cx.fillText(r[4],0,0);cx.restore()}
 // labels
 const lab=(t,x,y,bg='#14284B')=>{cx.font='700 20px Poppins,sans-serif';const w=cx.measureText(t).width+20;cx.fillStyle=bg;rr(x-w/2,y-16,w,30,15);cx.fill();cx.fillStyle='#fff';cx.textAlign='center';cx.fillText(t,x,y+6)};
 for(const p of parks.concat(blocks))lab(p.n,p.x+p.w/2,p.y+p.h/2,'rgba(20,40,75,.75)');
 for(const k in starts){const s=starts[k];cx.fillStyle='#fff';cx.beginPath();cx.arc(s.x,s.y,14,0,7);cx.fill();cx.fillStyle='#14284B';cx.beginPath();cx.arc(s.x,s.y,8,0,7);cx.fill();if(k!=='bus')lab(s.n,s.x+(k==='jath'?-40:0),s.y-48,'rgba(23,169,155,.92)')}
 // school
 const pulse=1+Math.sin(now/300)*.06;cx.fillStyle='rgba(201,154,46,.25)';cx.beginPath();cx.arc(SCHOOL.x,SCHOOL.y-80,110*pulse,0,7);cx.fill();
 cx.fillStyle='#14284B';rr(SCHOOL.x-120,SCHOOL.y-160,240,120,12);cx.fill();cx.fillStyle='#C99A2E';cx.fillRect(SCHOOL.x-120,SCHOOL.y-160,240,14);
 cx.fillStyle='#FFC23D';for(let i=0;i<5;i++)cx.fillRect(SCHOOL.x-100+i*44,SCHOOL.y-130,26,22);cx.fillStyle='#C99A2E';cx.fillRect(SCHOOL.x-20,SCHOOL.y-80,40,40);
 star(SCHOOL.x,SCHOOL.y-190,22,'#FFC23D');lab('Chhaya Global School & Pearl Kidz',SCHOOL.x,SCHOOL.y-232,'#C99A2E');
 // kids
 for(const k of kids){if(k.got)continue;const bob=Math.sin(now/250+k.b)*4;cx.fillStyle='rgba(0,0,0,.15)';cx.beginPath();cx.ellipse(k.x,k.y+20,14,5,0,0,7);cx.fill();
  cx.fillStyle=['#FF6F5E','#17A99B','#7B5BD6','#FFC23D','#A9CDEB','#ff9a3c'][kidNames.indexOf(k.n)];rr(k.x-10,k.y-6+bob,20,24,8);cx.fill();cx.fillStyle='#f1c7a0';cx.beginPath();cx.arc(k.x,k.y-14+bob,10,0,7);cx.fill();
  cx.fillStyle='#2b2b2b';cx.beginPath();cx.arc(k.x,k.y-18+bob,10,Math.PI,0);cx.fill();cx.font='700 15px Poppins';cx.fillStyle='#14284B';cx.textAlign='center';cx.fillText('🙋 '+k.n,k.x,k.y-34+bob)}
 // cows
 for(const c of cows){cx.save();cx.translate(c.x,c.y);cx.fillStyle='#fff';rr(-22,-12,44,24,10);cx.fill();cx.strokeStyle='#888';cx.lineWidth=2;cx.stroke();cx.fillStyle='#6b5b4b';cx.beginPath();cx.arc(-8,-2,5,0,7);cx.arc(8,4,4,0,7);cx.fill();cx.fillStyle='#f3d6c6';cx.beginPath();cx.arc(24,0,8,0,7);cx.fill();cx.fillStyle='#c9a26b';cx.fillRect(20,-14,3,7);cx.fillRect(26,-14,3,7);cx.restore()}
 // autos
 for(const a of autos){if(a.x==null)continue;cx.save();cx.translate(a.x,a.y);cx.rotate(a.h?(a.s>0?0:Math.PI):(a.s>0?Math.PI/2:-Math.PI/2));cx.fillStyle='#1f8f4e';rr(-18,-12,36,24,8);cx.fill();cx.fillStyle='#FFC23D';rr(-6,-12,22,24,6);cx.fill();cx.fillStyle='#222';cx.fillRect(14,-8,4,16);cx.restore()}
 // particles
 for(const p of parts){if(p.vx){p.x+=p.vx/60;p.y+=p.vy/60}cx.globalAlpha=Math.max(0,p.l);cx.fillStyle=p.c||'rgba(150,150,150,.6)';cx.beginPath();cx.arc(p.x,p.y,p.c?5:7*(1-p.l),0,7);cx.fill()}cx.globalAlpha=1;
 // bus
 if(bus){cx.save();cx.translate(bus.x,bus.y);cx.rotate(bus.a);if(hit>now&&Math.floor(now/100)%2)cx.globalAlpha=.5;cx.fillStyle='rgba(0,0,0,.2)';rr(-32,-16,68,38,8);cx.fill();
  cx.fillStyle='#FFC23D';rr(-34,-19,68,38,9);cx.fill();cx.fillStyle='#14284B';cx.fillRect(-34,-4,68,8);cx.fillStyle='#bfe0ff';for(let i=0;i<4;i++)cx.fillRect(-26+i*13,-16,9,9);cx.fillStyle='#bfe0ff';cx.fillRect(22,-14,9,28);
  const n=kids.filter(k=>k.got).length;cx.fillStyle='#14284B';cx.font='700 11px Poppins';cx.textAlign='center';cx.fillText('CGS',-6,16);cx.restore()}
 // HUD
 cx.setTransform(1,0,0,1,0,0);
 if(state==='play'||state==='end'){const n=kids.filter(k=>k.got).length;cx.fillStyle='rgba(20,40,75,.88)';rr(10,10,250,54,14);cx.fill();cx.fillStyle='#fff';cx.font='700 20px Poppins';cx.textAlign='left';cx.fillText('⏱ '+elapsed.toFixed(1)+'s',24,44);cx.fillStyle='#FFC23D';cx.fillText('🙋 '+n+'/6',150,44);
  // minimap
  const mw=vw<700?120:180,mh=mw*H/W,mx=vw-mw-12,my=12;cx.fillStyle='rgba(255,255,255,.9)';rr(mx-4,my-4,mw+8,mh+8,10);cx.fill();cx.strokeStyle='#9aa2b2';cx.lineWidth=3;for(const r of roads){cx.beginPath();cx.moveTo(mx+r[0]/W*mw,my+r[1]/H*mh);cx.lineTo(mx+r[2]/W*mw,my+r[3]/H*mh);cx.stroke()}
  for(const k of kids)if(!k.got){cx.fillStyle='#FF6F5E';cx.beginPath();cx.arc(mx+k.x/W*mw,my+k.y/H*mh,4,0,7);cx.fill()}
  star(mx+SCHOOL.x/W*mw,my+SCHOOL.y/H*mh,7,'#C99A2E');if(bus){cx.fillStyle='#14284B';cx.beginPath();cx.arc(mx+bus.x/W*mw,my+bus.y/H*mh,5,0,7);cx.fill()}
  if(msg&&msg.until>now){cx.font='700 '+(vw<700?15:19)+'px Poppins';const w=cx.measureText(msg.t).width+30;cx.fillStyle='rgba(201,154,46,.95)';const my2=vw<700?78:vh-80;rr(vw/2-w/2,my2,w,40,20);cx.fill();cx.fillStyle='#14284B';cx.textAlign='center';cx.fillText(msg.t,vw/2,my2+26)}}
}
function star(x,y,r,c){cx.fillStyle=c;cx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr2=i%2?r*.45:r;cx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2)}cx.closePath();cx.fill()}
function fit(){const b=cv.parentElement.getBoundingClientRect();cv.width=Math.round(b.width);cv.height=Math.round(b.height)}
addEventListener('resize',fit);fit();requestAnimationFrame(step);
document.getElementById('gagain').addEventListener('click',()=>{document.getElementById('gend').hidden=true;document.getElementById('gintro').hidden=false;state='intro'});
})();
