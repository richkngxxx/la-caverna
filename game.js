'use strict';
(function(){
const W=360,H=640,cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const KEY='la_caverna_v1';
const RAR=['Gris','Verde','Azul','Morado','Naranja'],RCOL=['#bbb','#5f5','#59f','#c6f','#fa3'];
const SLOTS={arma:'Arma',cabeza:'Cabeza',cuerpo:'Cuerpo',linterna:'Linterna'};
const NAMES={arma:['Palo','Machete','Hacha','Lanza'],cabeza:['Gorro','Casco','Capucha'],cuerpo:['Chaqueta','Peto','Abrigo'],linterna:['Vela','Linterna','Farol']};
const STAT={arma:'fu',cabeza:'va',cuerpo:'va',linterna:'ve'};
const BUILD=[null,null,{n:'Taller',x:250,y:372},{n:'Puente',x:90,y:368},{n:'Atalaya',x:300,y:330},{n:'Muelle',x:180,y:458}];
const CAVES=[[60,140],[300,120],[40,250],[320,230],[120,80],[250,70],[30,330],[335,320],[200,190],[130,200]];
const STORY=[
 ['Abuela Rosa','La hoguera no puede apagarse. Nunca.'],
 ['Leo','Arriba, el túnel lleva fuera. Hay cosas útiles... y cosas peores.'],
 ['Nico','Nico dibuja algo en el agua del lago con un palo.'],
 ['Dra. Inés','Si alguien tose o tiene fiebre, traédmelo enseguida.'],
 ['Nico','"Es un pez muy grande", dice Nico. Nadie ha visto peces aquí.'],
 ['???','¡PLASH! Algo enorme se mueve en el lago oscuro...']];
let S,Z=[],FX=[],t0=performance.now(),last=t0,toastT=0,saveT=0;
function sv(name,col,role,fu,ve,va,x){return{name,col,role,lv:1,xp:0,hp:100,max:100,hunger:0,sick:false,fu,ve,va,x,y:400,tx:x,ty:400,away:0,cd:0,hit:0}}
function fresh(){return{res:{madera:10,metal:2,comida:10,medicina:1,piedra:0,agua:5},en:10,fire:1,cave:1,
 surv:[sv('Tú','#3a8ee6','player',6,5,5,150),sv('Abuela Rosa','#c04a8a','fire',3,2,6,200),sv('Leo','#3fb34f','scout',5,8,5,120),sv('Dra. Inés','#e8e8f0','medic',3,4,5,240),sv('Nico','#f2c94c','kid',2,6,3,170)],
 inv:[],eq:{arma:null,cabeza:null,cuerpo:null,linterna:null},dog:null,wave:80,story:0,storyT:15,bld:{},log:[],tick:0}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.surv)return d}catch(e){}return fresh()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
S=load();S.surv.forEach(s=>{if(s.away)s.y=60});
const P=()=>S.surv[0];
function log(m){S.log.unshift(m);S.log=S.log.slice(0,5);renderLog()}
function renderLog(){$('log').innerHTML=S.log.map((m,i)=>'<div style="opacity:'+(1-i*.17)+'">'+m+'</div>').join('')}
function toast(m){$('toast').textContent=m;$('toast').classList.add('on');toastT=3.5;log(m)}
const R=(a,b)=>a+Math.random()*(b-a),RI=(a,b)=>Math.floor(R(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
function maxSurv(){return 4+S.fire}
function lightR(){return 110+S.fire*55}
function stat(s,k){let v=s[k]+s.lv;if(s.role==='player')for(const q in S.eq){const it=S.eq[q];if(it&&it.st===k)v+=it.b}return v}
function addXP(s,n){s.xp+=n;while(s.xp>=s.lv*20){s.xp-=s.lv*20;s.lv++;s.max+=10;s.hp=s.max;s.fu++;s.ve++;s.va++;toast(s.name+' sube a nivel '+s.lv+'!')}}
function mkItem(minR){const r=Math.min(4,Math.max(minR||0,(()=>{const x=Math.random();return x<.5?0:x<.78?1:x<.92?2:x<.985?3:4})()));const sl=pick(Object.keys(SLOTS));
 return{id:Date.now()+Math.random(),sl,n:pick(NAMES[sl])+' '+RAR[r].toLowerCase(),r,st:STAT[sl],b:1+r*2+RI(0,1)}}
function resStr(o){return Object.entries(o).filter(e=>e[1]>0).map(([k,v])=>v+' '+k).join(', ')}
function has(c){return Object.entries(c).every(([k,v])=>(S.res[k]||0)>=v)}
function pay(c){for(const k in c)S.res[k]-=c[k]}
// ---------- actions
function dig(){if(S.en<3){toast('Sin energía. Descansa un poco.');return}
 S.en-=3;S.cave++;const p=P();addXP(p,4);const x=Math.random();FX.push({t:'dust',x:70,y:300,l:1});
 if(x<.35){const n=RI(2,5);S.res.piedra+=n;if(Math.random()<.4){S.res.metal++;log('⛏ Cueva nv '+S.cave+': '+n+' piedra y mineral (+1 metal)')}else log('⛏ Cueva nv '+S.cave+': '+n+' piedra')}
 else if(x<.55){const it=mkItem(1);S.inv.push(it);S.res.comida+=RI(1,3);toast('¡Alijo escondido! '+it.n)}
 else if(x<.75){if(Math.random()<.65){S.res.agua+=RI(2,4);log('💧 Encuentras agua limpia')}else{S.res.agua+=2;if(Math.random()<.5){p.sick=true;toast('Agua mala... te pones enfermo')}else log('💧 Agua turbia. Mejor hervirla.')}}
 else if(x<.9){toast('¡Un zombi dormido en la cueva!');spawnZ(70,300,true)}
 else{S.res.madera+=RI(1,3);log('⛏ Raíces secas: madera')}
 save()}
function expedition(i){const s=S.surv[i];if(!s||s.away||s.hp<s.max*.3)return;s.away=R(20,40);s.dur=s.away;s.tx=180;s.ty=90;s.out=false;log('🧭 '+s.name+' sale de expedición');closeM();save()}
function returnExp(s){s.out=false;s.y=70;s.x=180;s.tx=R(110,260);s.ty=R(390,420);
 const g={madera:RI(2,6),metal:RI(0,3),comida:RI(1,5)};if(Math.random()<.4)g.medicina=1;
 for(const k in g)S.res[k]+=g[k];let m=s.name+' vuelve: '+resStr(g);addXP(s,10+S.fire*3);
 if(Math.random()<.35){const it=mkItem(Math.random()<.1?2:0);S.inv.push(it);m+=' + '+it.n}
 const risk=Math.random()*20;if(risk>stat(s,'ve')+3){s.hp=Math.max(10,s.hp-RI(15,40));m+=' (herido)'}
 if(Math.random()<.12){s.sick=true;m+=' (enfermo)'}
 if(!S.dog&&Math.random()<.12){S.dog={hp:60,max:60,x:180,y:400,cd:0};m+=' ¡y un PERRO que te sigue!'}
 toast(m);save()}
function upFire(){const c=fireCost();if(!has(c))return;pay(c);S.fire++;const b=BUILD[S.fire];if(b)S.bld[S.fire]={lv:1,broken:false};
 toast('🔥 Gran Hoguera nivel '+S.fire+'!'+(b?' Nuevo: '+b.n:'')+' La luz revela más cavernas.');closeM();save()}
function fireCost(){const l=S.fire;return{madera:8*l,piedra:4*l,metal:2*(l-1)}}
function repair(k){const c={madera:4,piedra:2};if(!has(c))return;pay(c);S.bld[k].broken=false;log('🔧 '+BUILD[k].n+' reparado');openFire();save()}
function heal(i){const s=S.surv[i];if(S.res.medicina<1)return;S.res.medicina--;s.sick=false;s.hp=Math.min(s.max,s.hp+30);log('💊 '+s.name+' curado');profile(i);save()}
function equip(id){const k=S.inv.findIndex(x=>x.id===id);if(k<0)return;const it=S.inv[k];S.inv.splice(k,1);if(S.eq[it.sl])S.inv.push(S.eq[it.sl]);S.eq[it.sl]=it;openEquip();save()}
function unequip(sl){if(!S.eq[sl])return;S.inv.push(S.eq[sl]);S.eq[sl]=null;openEquip();save()}
// ---------- zombies
function revealed(){const r=lightR();return CAVES.filter(c=>Math.hypot(c[0]-180,c[1]-400)<r+40)}
function spawnZ(x,y,sleepy){const lv=S.fire;Z.push({x,y,hp:30+lv*12,max:30+lv*12,atk:5+lv*2,cd:0,hit:0,sp:R(14,22)})}
function wave(){const n=2+S.fire+Math.floor(S.cave/8);const cs=revealed().length?revealed():CAVES.slice(0,3);
 for(let i=0;i<n;i++){const c=pick(cs);spawnZ(c[0]+R(-8,8),c[1]+R(-8,8))}toast('🧟 ¡Oleada! '+n+' zombis salen de la oscuridad')}
// ---------- UI modals
const M=$('modal'),C=$('card');function openM(h){C.innerHTML=h;M.classList.remove('hide')}function closeM(){M.classList.add('hide')}
M.addEventListener('click',e=>{if(e.target===M)closeM();const b=e.target.closest('[data-f]');if(!b||b.disabled)return;const f=b.dataset.f,v=b.dataset.v;
 ({close:closeM,exp:()=>expedition(+v),fire:upFire,rep:()=>repair(v),heal:()=>heal(+v),eq:()=>equip(+v),uneq:()=>unequip(v),reset:()=>{if(confirm('¿Borrar partida?')){localStorage.removeItem(KEY);location.reload()}},profile:()=>profile(+v)})[f]()});
const X='<button class="btn" data-f="close">Cerrar</button>';
function openExp(){let h='<h3>🧭 Expedición</h3><p>Elige quién sale (20-40 s). Riesgo de heridas.</p>';
 S.surv.forEach((s,i)=>{const ok=!s.away&&s.hp>=s.max*.3;h+='<button class="btn" data-f="exp" data-v="'+i+'" '+(ok?'':'disabled')+'>'+s.name+' · nv '+s.lv+' · ♥'+Math.round(s.hp)+(s.away?' (fuera '+Math.ceil(s.away)+'s)':'')+'</button>'});openM(h+X)}
function openFire(){const c=fireCost();let h='<h3>🔥 Gran Hoguera · nivel '+S.fire+'</h3><p>Mejorar revela más pared, construye estructuras y sube supervivientes máx ('+maxSurv()+').</p><p>Coste: '+resStr(c)+'</p><button class="btn" data-f="fire" '+(has(c)?'':'disabled')+'>Mejorar a nivel '+(S.fire+1)+'</button>';
 for(const k in S.bld){if(S.bld[k].broken)h+='<button class="btn" data-f="rep" data-v="'+k+'" '+(has({madera:4,piedra:2})?'':'disabled')+'>Reparar '+BUILD[k].n+' (4 madera, 2 piedra)</button>'}
 h+='<p style="opacity:.7">Próxima oleada en '+Math.ceil(S.wave)+' s</p>';openM(h+X)}
function gearHTML(){return Object.keys(SLOTS).map(sl=>{const it=S.eq[sl];return'<div class="it"><span>'+SLOTS[sl]+': '+(it?'<b class="r'+it.r+'">'+it.n+'</b> +'+it.b+' '+it.st:'—')+'</span>'+(it?'<button data-f="uneq" data-v="'+sl+'">Quitar</button>':'')+'</div>'}).join('')}
function openEquip(){let h='<h3>🎒 Equipo</h3>'+gearHTML()+'<h3 style="margin-top:10px">Inventario</h3>';
 if(!S.inv.length)h+='<p style="opacity:.6">Vacío. Cava o sal de expedición.</p>';
 S.inv.forEach(it=>{h+='<div class="it"><span class="r'+it.r+'">'+it.n+' <small>(+'+it.b+' '+it.st+')</small></span><button data-f="eq" data-v="'+it.id+'">Equipar</button></div>'});
 h+='<p>'+Object.entries(S.res).map(([k,v])=>k+': '+v).join(' · ')+'</p>';openM(h+X)}
function profile(i){const s=S.surv[i];let h='<h3 style="color:'+s.col+'">'+s.name+'</h3>Nivel '+s.lv+' · XP '+s.xp+'/'+s.lv*20+'<br>♥ '+Math.round(s.hp)+'/'+s.max+' · Hambre '+Math.round(s.hunger)+'%<br>Fuerza '+stat(s,'fu')+' · Velocidad '+stat(s,'ve')+' · Valor '+stat(s,'va')+'<br>Estado: '+(s.sick?'<b style="color:#8f8">ENFERMO</b>':'sano')+(s.away?' · de expedición':'');
 if(s.role==='player')h+='<h3 style="margin-top:8px">Equipo</h3>'+gearHTML()+(S.dog?'<p>🐕 Perro: ♥'+Math.round(S.dog.hp)+'</p>':'');
 if(s.sick||s.hp<s.max)h+='<button class="btn" data-f="heal" data-v="'+i+'" '+(S.res.medicina>0?'':'disabled')+'>Usar medicina ('+S.res.medicina+')</button>';openM(h+X)}
function settings(){openM('<h3>⚙ Ajustes</h3><p>La Caverna · prototipo v0.1<br>La partida se guarda sola en este dispositivo.</p><button class="btn" data-f="reset">Reiniciar partida</button>'+X)}
$('gear').onclick=settings;
document.querySelectorAll('#bar button').forEach(b=>b.addEventListener('click',()=>({dig,exp:openExp,fire:openFire,equip:openEquip})[b.dataset.a]()));
cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
 let best=-1,bd=26;S.surv.forEach((s,i)=>{if(s.out)return;const d=Math.hypot(s.x-x,s.y-10-y);if(d<bd){bd=d;best=i}});if(best>=0)profile(best)});
// ---------- update
function near(a,list){let b=null,bd=1e9;for(const o of list){const d=Math.hypot(o.x-a.x,o.y-a.y);if(d<bd){bd=d;b=o}}return[b,bd]}
function update(dt){const t=S.tick+=dt;
 S.en=Math.min(10,S.en+dt/3);S.wave-=dt;if(S.wave<=0){wave();S.wave=Math.max(45,85-S.fire*6)}
 S.storyT-=dt;if(S.storyT<=0&&S.story<STORY.length){const[a,b]=STORY[S.story++];toast(a+': '+b);if(S.story===STORY.length)FX.push({t:'splash',x:200,y:540,l:2});S.storyT=40}
 const home=S.surv.filter(s=>!s.out&&s.hp>0);
 for(const s of S.surv){
  if(s.away>0){s.away-=dt;if(!s.out){mv(s,s.tx,s.ty,40,dt);if(Math.hypot(s.x-s.tx,s.y-s.ty)<3){s.ty=60;s.tx=180;if(s.y<64)s.out=true}}if(s.away<=0){s.away=0;returnExp(s)}continue}
  s.hunger+=dt*.5;if(s.hunger>=100){if(S.res.comida>0){S.res.comida--;s.hunger=0}else{s.hunger=100;s.hp-=dt*.5}}
  if(s.sick)s.hp-=dt*.4;if(!s.sick&&s.hunger<100)s.hp=Math.min(s.max,s.hp+dt*.3);
  if(s.hp<=0){s.hp=1;s.sick=false;s.hunger=50;log('💀 '+s.name+' cae inconsciente y se recupera junto al fuego');s.x=180;s.y=410}
  const[z,d]=near(s,Z);s.cd-=dt;s.hit=Math.max(0,s.hit-dt);
  if(z&&d<160){if(d>14)mv(s,z.x,z.y,30+stat(s,'ve')*2,dt);else if(s.cd<=0){z.hp-=4+stat(s,'fu')*1.5;z.hit=.15;s.cd=1;FX.push({t:'hit',x:z.x,y:z.y-8,l:.3});if(z.hp<=0)addXP(s,6)}}
  else{if(Math.hypot(s.x-s.tx,s.y-s.ty)<2&&Math.random()<dt*.4){s.tx=R(95,265);s.ty=R(388,425)}mv(s,s.tx,s.ty,14,dt)}
 }
 if(S.dog){const d=S.dog,p=P();d.cd-=dt;const[z,dz]=near(d,Z);if(z&&dz<150){if(dz>12)mv(d,z.x,z.y,60,dt);else if(d.cd<=0){z.hp-=8;z.hit=.15;d.cd=.8}}else mv(d,p.x+14,p.y+4,p.out?0:40,dt);d.hp=Math.min(d.max,d.hp+dt)}
 for(const z of Z){z.cd-=dt;z.hit=Math.max(0,z.hit-dt);
  const tgts=home.slice();if(S.dog)tgts.push(S.dog);for(const k in S.bld)if(!S.bld[k].broken)tgts.push({x:BUILD[k].x,y:BUILD[k].y,bk:k});
  const[tg,d]=near(z,tgts);if(!tg)continue;if(d>12)mv(z,tg.x,tg.y,z.sp,dt);else if(z.cd<=0){z.cd=1.3;
   if(tg.bk){if(Math.random()<.25){S.bld[tg.bk].broken=true;toast('¡Los zombis rompen '+BUILD[tg.bk].n+'!')}}
   else{tg.hp-=z.atk;tg.hit=.2;if(tg.name&&Math.random()<.12&&!tg.sick){tg.sick=true;log('🦠 '+tg.name+' ha sido mordido: enfermo')}}}}
 const dead=Z.filter(z=>z.hp<=0);if(dead.length){Z=Z.filter(z=>z.hp>0);S.res.comida+=0;if(!Z.length)log('✔ Oleada repelida')}
 // medic & fire keeper
 const med=S.surv[3];if(med&&!med.away&&t%20<dt){const sk=S.surv.find(s=>s.sick&&!s.away&&s!==med);if(sk){sk.sick=false;log('🩺 Dra. Inés cura a '+sk.name)}}
 FX.forEach(f=>f.l-=dt);FX=FX.filter(f=>f.l>0);
 if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
 saveT+=dt;if(saveT>5){saveT=0;save()}}
function mv(o,x,y,sp,dt){const dx=x-o.x,dy=y-o.y,d=Math.hypot(dx,dy);if(d<1)return;const s=Math.min(d,sp*dt);o.x+=dx/d*s;o.y+=dy/d*s}
// ---------- draw
const fog=document.createElement('canvas');fog.width=W;fog.height=H;const fx=fog.getContext('2d');
const rocks=[];for(let i=0;i<140;i++)rocks.push([Math.random()*W,Math.random()*470,R(6,26),R(.15,.4)]);
function bg(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a1d16');g.addColorStop(.6,'#1b120d');g.addColorStop(1,'#0a0705');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(const r of rocks){ctx.fillStyle='rgba(70,50,38,'+r[3]+')';ctx.beginPath();ctx.ellipse(r[0],r[1],r[2],r[2]*.6,0,0,7);ctx.fill()}
 // tunnel exit
 const tg=ctx.createRadialGradient(180,50,4,180,50,40);tg.addColorStop(0,'#bcd6ff');tg.addColorStop(.5,'#5a7aa8');tg.addColorStop(1,'rgba(40,50,70,0)');ctx.fillStyle=tg;ctx.beginPath();ctx.ellipse(180,52,34,26,0,0,7);ctx.fill();
 ctx.strokeStyle='#5a3c26';ctx.lineWidth=3;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(180,78);ctx.lineTo(176,380);ctx.stroke();ctx.setLineDash([]);
 for(const c of CAVES){ctx.fillStyle='#050302';ctx.beginPath();ctx.ellipse(c[0],c[1],14,10,0,0,7);ctx.fill()}
 // player cave
 const cs=Math.min(34,12+S.cave*1.5);ctx.fillStyle='#120a06';ctx.beginPath();ctx.ellipse(70,300,cs,cs*.65,0,0,7);ctx.fill();ctx.strokeStyle='#8a5a2a';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#ffb35a';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('Tu cueva nv'+S.cave,70,300-cs*.65-4);
 // ledge
 ctx.fillStyle='#4a3424';ctx.beginPath();ctx.moveTo(60,380);ctx.quadraticCurveTo(180,360,300,380);ctx.lineTo(320,440);ctx.quadraticCurveTo(180,460,40,440);ctx.closePath();ctx.fill();
 ctx.fillStyle='#5e4430';ctx.fillRect(60,376,240,6)}
function lake(t){const g=ctx.createLinearGradient(0,465,0,H);g.addColorStop(0,'#0b1620');g.addColorStop(1,'#020509');ctx.fillStyle=g;ctx.fillRect(0,462,W,H-462);
 for(let i=0;i<26;i++){const y=470+i*7,a=.25*(1-i/26)*(.6+.4*Math.sin(t*3+i));ctx.fillStyle='rgba(255,150,60,'+a+')';const w=40-i+Math.sin(t*2+i*1.7)*10;ctx.fillRect(180-w+Math.sin(t*1.5+i)*6,y,w*2,2)}
 for(let i=0;i<12;i++){ctx.fillStyle='rgba(120,160,200,.08)';ctx.fillRect((i*53+t*12)%W,480+(i*37)%150,18,1)}}
function fire(t){const l=S.fire,s=1+l*.15;const g=ctx.createRadialGradient(180,395,4,180,395,90*s);g.addColorStop(0,'rgba(255,170,60,.55)');g.addColorStop(1,'rgba(255,100,20,0)');ctx.fillStyle=g;ctx.fillRect(0,250,W,250);
 ctx.fillStyle='#3a2a1e';for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(180+Math.cos(i)*16*s,404+Math.sin(i)*3,4,0,7);ctx.fill()}
 for(let i=0;i<9;i++){const fl=Math.sin(t*9+i*2)*.5+.5;ctx.fillStyle=['#ff4a14','#ff8a1e','#ffd04a'][i%3];ctx.beginPath();const x=180+(i-4)*3.5*s,h=(16+fl*14)*s*(1-Math.abs(i-4)/6);ctx.moveTo(x-6*s,404);ctx.quadraticCurveTo(x,404-h*1.6,x+6*s,404);ctx.fill()}}
function buildings(){for(const k in S.bld){const b=BUILD[k],br=S.bld[k].broken;ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha=br?.5:1;ctx.fillStyle='#7a5232';ctx.strokeStyle='#2a1a0e';ctx.lineWidth=2;
 if(b.n==='Taller'){ctx.fillRect(-14,-16,28,16);ctx.beginPath();ctx.moveTo(-17,-16);ctx.lineTo(0,-28);ctx.lineTo(17,-16);ctx.fillStyle='#a33';ctx.fill()}
 else if(b.n==='Puente'){ctx.beginPath();ctx.moveTo(-40,0);ctx.quadraticCurveTo(-20,10,0,0);ctx.stroke();for(let i=-38;i<0;i+=6)ctx.fillRect(i,1,4,3)}
 else if(b.n==='Atalaya'){ctx.fillRect(-3,-40,6,40);ctx.fillRect(-12,-48,24,10)}
 else {ctx.fillRect(-22,0,44,5);ctx.fillRect(-20,5,3,10);ctx.fillRect(17,5,3,10)}
 ctx.globalAlpha=1;ctx.fillStyle=br?'#f55':'#ffd9a0';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillText(b.n+(br?' (roto)':''),0,br?-30:12);ctx.restore()}}
function person(s,t){if(s.out)return;const bob=Math.sin(t*6+s.x)*1.2,x=s.x,y=s.y+bob;ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(s.x,s.y+2,7,2.5,0,0,7);ctx.fill();
 const kid=s.role==='kid'?.75:1;ctx.save();ctx.translate(x,y);ctx.scale(kid,kid);
 ctx.fillStyle=s.hit>0?'#fff':'#222';ctx.fillRect(-5,-8,4,8);ctx.fillRect(1,-8,4,8);
 ctx.fillStyle=s.hit>0?'#fff':s.col;ctx.fillRect(-7,-20,14,13);ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.strokeRect(-7,-20,14,13);
 ctx.fillStyle=s.sick?'#9c9':'#f0c090';ctx.beginPath();ctx.arc(0,-25,6,0,7);ctx.fill();ctx.stroke();
 ctx.fillStyle='#000';ctx.fillRect(-3,-26,2,2);ctx.fillRect(1,-26,2,2);
 if(s.role==='fire'){ctx.fillStyle='#ddd';ctx.fillRect(-6,-32,12,4)}if(s.role==='medic'){ctx.fillStyle='#e22';ctx.fillRect(-1.5,-18,3,9);ctx.fillRect(-4.5,-15,9,3)}
 if(s.role==='player'){if(S.eq.arma){ctx.fillStyle=RCOL[S.eq.arma.r];ctx.fillRect(7,-22,3,14)}if(S.eq.cabeza){ctx.fillStyle=RCOL[S.eq.cabeza.r];ctx.fillRect(-7,-33,14,5)}if(S.eq.linterna){ctx.fillStyle='#ffe28a';ctx.beginPath();ctx.arc(-9,-12,2.5,0,7);ctx.fill()}}
 if(s.role==='scout'){ctx.fillStyle='#265';ctx.fillRect(-7,-32,14,4)}
 ctx.restore();bar(x,y-38,s.hp/s.max,s.sick?'#8c4':'#4c4');ctx.fillStyle='#fff';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(s.name.split(' ').pop()+' '+s.lv,x,y-41)}
function bar(x,y,f,c){ctx.fillStyle='#000';ctx.fillRect(x-10,y,20,3);ctx.fillStyle=c;ctx.fillRect(x-10,y,20*Math.max(0,f),3)}
function zombie(z,t){const y=z.y+Math.sin(t*4+z.x)*1.5;ctx.save();ctx.translate(z.x,y);ctx.fillStyle=z.hit>0?'#fff':'#4a6a3a';ctx.fillRect(-6,-18,12,12);ctx.fillRect(-5,-6,4,6);ctx.fillRect(1,-6,4,6);
 ctx.fillRect(6,-17+Math.sin(t*5)*2,8,3);ctx.fillStyle=z.hit>0?'#fff':'#7a9a5a';ctx.beginPath();ctx.arc(0,-23,6,0,7);ctx.fill();ctx.fillStyle='#f22';ctx.fillRect(-3,-25,2,2);ctx.fillRect(1,-25,2,2);ctx.restore();bar(z.x,y-34,z.hp/z.max,'#d33')}
function dog(d,t){ctx.save();ctx.translate(d.x,d.y);ctx.fillStyle='#a06a3a';ctx.fillRect(-7,-8,14,6);ctx.fillRect(5,-12,6,6);ctx.fillRect(-6,-2,2,3);ctx.fillRect(4,-2,2,3);ctx.fillRect(-10,-9+Math.sin(t*12)*2,4,2);ctx.restore()}
function drawFog(t){fx.globalCompositeOperation='source-over';fx.clearRect(0,0,W,H);fx.fillStyle='rgba(0,0,0,.93)';fx.fillRect(0,0,W,H);fx.globalCompositeOperation='destination-out';
 const r=lightR()*(1+Math.sin(t*3)*.02);const g=fx.createRadialGradient(180,400,r*.35,180,400,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g;fx.fillRect(0,0,W,H);
 const g2=fx.createRadialGradient(180,50,5,180,50,70);g2.addColorStop(0,'rgba(0,0,0,.9)');g2.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g2;fx.fillRect(0,0,W,160);
 const g3=fx.createRadialGradient(70,300,5,70,300,60);g3.addColorStop(0,'rgba(0,0,0,.8)');g3.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g3;fx.fillRect(0,200,160,200);
 fx.fillRect(0,0,0,0);ctx.drawImage(fog,0,0)}
function draw(t){bg();buildings();fire(t);lake(t);
 const all=S.surv.filter(s=>!s.out).map(s=>({o:s,f:person})).concat(Z.map(z=>({o:z,f:zombie})));if(S.dog)all.push({o:S.dog,f:dog});all.sort((a,b)=>a.o.y-b.o.y).forEach(e=>e.f(e.o,t));
 // reflection of fire in lake
 for(const f of FX){if(f.t==='hit'){ctx.fillStyle='rgba(255,240,180,'+f.l*3+')';ctx.beginPath();ctx.arc(f.x,f.y,8*(1-f.l*2),0,7);ctx.fill()}
  if(f.t==='dust'){ctx.fillStyle='rgba(160,120,90,'+f.l*.6+')';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(f.x+Math.cos(i)*20*(1-f.l),f.y+Math.sin(i)*12*(1-f.l),4,0,7);ctx.fill()}}
  if(f.t==='splash'){ctx.strokeStyle='rgba(180,220,255,'+f.l/2+')';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(f.x,f.y,(2-f.l)*30+i*10,(2-f.l)*8+i*3,0,0,7);ctx.stroke()}}}
 drawFog(t);
 if(S.story>=STORY.length){const a=.1+.1*Math.sin(t*.7);ctx.fillStyle='rgba(200,255,220,'+a+')';ctx.beginPath();ctx.ellipse(220+Math.sin(t*.3)*60,560,18,3,0,0,7);ctx.fill()}}
function hud(){const r=S.res;$('top').innerHTML='<b>🪵'+r.madera+'</b><b>⚙'+r.metal+'</b><b>🍖'+r.comida+'</b><b>💊'+r.medicina+'</b><b>🪨'+r.piedra+'</b><b>💧'+r.agua+'</b><b>⚡'+Math.floor(S.en)+'/10</b><b>🔥'+S.fire+'</b><b>🧟'+(Z.length?Z.length:Math.ceil(S.wave)+'s')+'</b>'}
function loop(now){const dt=Math.min(.1,(now-last)/1000);last=now;try{update(dt);draw(now/1000)}catch(e){console.error(e)}if(Math.floor(now/250)!==Math.floor((now-dt*1000)/250))hud();requestAnimationFrame(loop)}
renderLog();hud();if(!S.log.length)toast('Bienvenido a La Caverna. Mantén viva la Gran Hoguera.');
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
window.__G={get S(){return S},get Z(){return Z},update,draw,dig,wave,expedition,upFire};
requestAnimationFrame(loop)})();
