'use strict';
(function(){
const W=360,H=640,cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const KEY='la_caverna_v1';
const RAR=['Gris','Verde','Azul','Morado','Naranja'],RCOL=['#b8b0a2','#4fd04a','#3f8cff','#b45cff','#ff9a1f'];
const XSLOTS={manos:'Manos',pies:'Pies',mochila:'Mochila'},MAXF=8;
const CLS={luchador:{n:'Luchador',i:'⚔',t:[[['fuerte','Golpe fuerte','+30% daño'],['piel','Piel dura','-30% daño recibido']],[['rapido','Ataque rápido','Golpeas 35% más rápido'],['grito','Grito de guerra','Aliados +2 fuerza']],[['furia','Furia','+60% daño'],['aguante','Aguante','+40 vida máx']]]},
 explorador:{n:'Explorador',i:'🧭',t:[[['veloz','Pies ligeros','Expediciones 30% más cortas'],['ojo','Ojo avizor','+50% botín de expedición']],[['minero','Minero','Más alijos al cavar'],['incansable','Incansable','Energía +50% más rápida']],[['tesoro','Cazatesoros','Objetos de mayor rareza'],['sigilo','Sigilo','Nunca herido en expedición']]]},
 medico:{n:'Médico',i:'⚕',t:[[['vendas','Vendas','Curas a aliados cercanos'],['botica','Botica','Medicina al cavar (25%)']],[['inmune','Inmune','Los mordiscos no te enferman'],['regen','Regeneración','Te curas 3x más rápido']],[['milagro','Milagro','50% curar sin gastar medicina'],['aura','Aura','Todos regeneran 2x']]]},
 ingeniero:{n:'Ingeniero',i:'🔧',t:[[['ahorro','Ahorro','Hoguera 20% más barata'],['manitas','Manitas','Reparar es gratis']],[['refuerzo','Refuerzo','Las estructuras no se rompen'],['cantero','Cantero','+2 piedra al cavar']],[['trampas','Trampas','Zombis 30% más lentos'],['forja','Forja','Objetos nuevos +2 bonus']]]}};
const NEXT=[null,null,'Taller: objetos de alijo mejores','Puente + expediciones de 2 personas','Atalaya: +10% daño en defensa','Muelle en el lago','Huerto: comida cada 30 s','Forja: objetos +1 bonus','Santuario: todos regeneran más'];
const SLOTS={arma:'Arma',cabeza:'Cabeza',cuerpo:'Cuerpo',linterna:'Linterna'};
const NAMES={arma:['Palo','Machete','Hacha','Lanza'],cabeza:['Gorro','Casco','Capucha'],cuerpo:['Chaqueta','Peto','Abrigo'],linterna:['Vela','Linterna','Farol']};
const STAT={arma:'fu',cabeza:'va',cuerpo:'va',linterna:'ve'};
const BUILD=[null,null,{n:'Taller',x:250,y:372},{n:'Puente',x:90,y:368},{n:'Atalaya',x:300,y:330},{n:'Muelle',x:180,y:458},{n:'Huerto',x:70,y:420},{n:'Forja',x:295,y:415},{n:'Santuario',x:180,y:330}];
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
const VI={player:4,fire:1,scout:7,medic:4,kid:3};
function migrate(d){for(const q of d.surv||[])if(q.vi==null)q.vi=VI[q.role]||3;d.eq=Object.assign({arma:null,cabeza:null,cuerpo:null,linterna:null},d.eq||{});d.inv=d.inv||[];d.pts=d.pts||0;d.cls=d.cls||null;d.tal=d.tal||[];d.bld=d.bld||{};d.sel=[];d.tab=d.tab||'eq';for(const s of d.surv){s.mate=s.mate==null?null:s.mate}return d}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.surv)return migrate(d)}catch(e){}return migrate(fresh())}
function T(k){return S.tal.indexOf(k)>=0}
function tpts(){const p=P();return Math.max(0,p.lv-2)-S.tal.length}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
S=load();S.surv.forEach(s=>{if(s.away)s.y=60});
const P=()=>S.surv[0];
function log(m){S.log.unshift(m);S.log=S.log.slice(0,5);renderLog()}
function renderLog(){$('log').innerHTML=S.log.map((m,i)=>'<div style="opacity:'+(1-i*.17)+'">'+m+'</div>').join('')}
function toast(m){$('toast').textContent=m;$('toast').classList.add('on');toastT=3.5;log(m)}
const R=(a,b)=>a+Math.random()*(b-a),RI=(a,b)=>Math.floor(R(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
function maxSurv(){return 4+S.fire}
function lootT(){return Math.min(3,Math.floor((S.fire-1)/2))}
const DEST=[{n:'Túnel cercano',lv:1,m:1,g:{}},{n:'Supermercado',lv:3,m:1.3,g:{comida:4,agua:3}},{n:'Hospital',lv:5,m:1.5,g:{medicina:2}},{n:'Base militar',lv:7,m:1.8,g:{metal:5},r:1}];
const UNL=[null,null,['🏠 Taller: alijos de rareza mejor','👥 Supervivientes máx 6'],['🌉 Puente','👫 Expediciones de 2 personas','🛒 Destino: Supermercado','🎁 Botín nivel 1 (Verde+)'],['🗼 Atalaya: +10% daño en defensa','👥 Supervivientes máx 8'],['⚓ Muelle','🏥 Destino: Hospital','🎁 Botín nivel 2 (Azul+)','🌊 Aparece El Ahogado (jefe)'],['🌱 Huerto: comida cada 30 s','💰 Zombis sueltan más botín'],['⚒ Forja: fabricar objetos Azul+, +1 bonus','🪖 Destino: Base militar','🎁 Botín nivel 3 (Morado+)'],['⛩ Santuario: todos regeneran más','⚒ Forja fabrica Morado/Naranja']];
function craftCost(){return{metal:6+S.fire,madera:6}}
function craft(){const c=craftCost();if(!S.bld[7]||!has(c))return;pay(c);const it=mkItem(S.fire>=8?3:2);S.inv.push(it);toast('⚒ Forjas: '+it.n);save();openFire()}
function lightR(){return Math.round((95+S.fire*45)*(S.dim?.65:1))}
function gearB(k){let v=0;for(const q in S.eq){const it=S.eq[q];if(it&&it.st===k)v+=it.b}return v}
function stat(s,k){let v=s[k]+s.lv;if(s.role==='player')v+=gearB(k);else if(k==='fu'&&T('grito'))v+=2;return v}
function dmgMul(s){return s.role==='player'?(1+(T('fuerte')?.3:0)+(T('furia')?.6:0)):1}
function addXP(s,n){s.xp+=n;while(s.xp>=s.lv*20){s.xp-=s.lv*20;s.lv++;s.max+=10;s.hp=s.max;if(s.role==='player'){S.pts+=3;toast('¡Subes a nivel '+s.lv+'! +3 puntos de atributo'+(s.lv>=3?(S.cls?' y +1 talento':' · ¡Elige clase en Equipo!'):''))}else{const k=pick(['fu','ve','va','vi']);s[k]+=2;s.fu++;toast(s.name+' sube a nivel '+s.lv+'!')}}}
function mkItem(minR){const r=Math.min(4,Math.max(minR||0,(()=>{const x=Math.random();return x<.5?0:x<.78?1:x<.92?2:x<.985?3:4})()));const sl=pick(Object.keys(SLOTS));
 return{id:Date.now()+Math.random(),sl,n:pick(NAMES[sl])+' '+RAR[r].toLowerCase(),r,st:STAT[sl],b:1+r*2+RI(0,1)+(T('forja')?2:0)+(S.bld[7]&&!S.bld[7].broken?1:0)}}
function resStr(o){return Object.entries(o).filter(e=>e[1]>0).map(([k,v])=>v+' '+k).join(', ')}
function has(c){return Object.entries(c).every(([k,v])=>(S.res[k]||0)>=v)}
function pay(c){for(const k in c)S.res[k]-=c[k]}
// ---------- actions
function dig(){if(S.en<3){toast('Sin energía. Descansa un poco.');return}
 S.en-=3;S.cave++;const p=P();addXP(p,4);let x=Math.random();if(T('minero')&&x>.75&&x<.9)x=.4;if(T('cantero'))S.res.piedra+=2;if(T('botica')&&Math.random()<.25){S.res.medicina++;log('💊 Encuentras medicina')}FX.push({t:'dust',x:70,y:300,l:1});
 if(x<.35){const n=RI(2,5);S.res.piedra+=n;if(Math.random()<.4){S.res.metal++;log('⛏ Cueva nv '+S.cave+': '+n+' piedra y mineral (+1 metal)')}else log('⛏ Cueva nv '+S.cave+': '+n+' piedra')}
 else if(x<.55){const it=mkItem(T('tesoro')?2:1);S.inv.push(it);S.res.comida+=RI(1,3);toast('¡Alijo escondido! '+it.n)}
 else if(x<.75){if(Math.random()<.65){S.res.agua+=RI(2,4);log('💧 Encuentras agua limpia')}else{S.res.agua+=2;if(Math.random()<.5){p.sick=true;toast('Agua mala... te pones enfermo')}else log('💧 Agua turbia. Mejor hervirla.')}}
 else if(x<.9){toast('¡Un zombi dormido en la cueva!');spawnZ(70,300,true)}
 else{S.res.madera+=RI(1,3);log('⛏ Raíces secas: madera')}
 save()}
function canGo(s){return s&&!s.away&&s.hp>=s.max*.3}
function expedition(i,j){const a=S.surv[i],b=j!=null?S.surv[j]:null;if(!canGo(a)||(b&&!canGo(b)))return;let d=R(20,40)*(T('veloz')&&(a.role==='player'||(b&&b.role==='player'))?.7:1);
 for(const s of b?[a,b]:[a]){s.dest=S.dest||0;s.away=d;s.dur=d;s.tx=180+(s===b?10:0);s.ty=90;s.out=false;s.mate=null;s.quiet=false}if(b){a.mate=j;b.quiet=true}
 log('🧭 '+a.name+(b?' y '+b.name:'')+' salen de expedición');S.sel=[];closeM();save()}
function returnExp(s){s.out=false;s.y=70;s.x=180;s.tx=R(110,260);s.ty=R(390,420);if(s.quiet){s.quiet=false;return}
 const b=s.mate!=null?S.surv[s.mate]:null;s.mate=null;const team=b?[s,b]:[s];const pl=team.some(q=>q.role==='player');
 const mul=(b?1.6:1)*(pl&&T('ojo')?1.5:1),R2=n=>Math.round(n*mul);
 const D=DEST[s.dest||0]||DEST[0],g={madera:R2(RI(2,6)*D.m),metal:R2(RI(0,3)*D.m),comida:R2(RI(1,5)*D.m)};for(const k in D.g)g[k]=(g[k]||0)+R2(RI(1,D.g[k]));if(Math.random()<.4*mul)g.medicina=1;
 for(const k in g)S.res[k]+=g[k];let m=team.map(q=>q.name).join(' y ')+(b?' vuelven: ':' vuelve: ')+resStr(g);team.forEach(q=>addXP(q,10+S.fire*3));
 if(Math.random()<(b?.55:.35)){const it=mkItem(Math.max(lootT()+(D.r||0),Math.random()<(b?.25:.1)?2:0));S.inv.push(it);m+=' + '+it.n}
 const ve=team.reduce((a,q)=>a+stat(q,'ve'),0);if(!(pl&&T('sigilo'))&&Math.random()*20>ve+3){const h=pick(team);h.hp=Math.max(10,h.hp-RI(15,40));m+=' ('+h.name+' herido)'}
 if(Math.random()<.12){s.sick=true;m+=' (enfermo)'}
 if(!S.dog&&Math.random()<.12){S.dog={hp:60,max:60,x:180,y:400,cd:0};m+=' ¡y un PERRO que te sigue!'}
 toast(m);save()}
function upFire(){const c=fireCost();if(S.fire>=MAXF||!has(c))return;pay(c);S.fire++;const b=BUILD[S.fire];if(b)S.bld[S.fire]={lv:1,broken:false};
 toast('🔥 Gran Hoguera nivel '+S.fire+'!'+(b?' Nuevo: '+b.n:'')+' La luz revela más cavernas.');closeM();save()}
function fireCost(){const l=S.fire,m=T('ahorro')?.8:1;return{madera:Math.ceil(8*l*m),piedra:Math.ceil(4*l*m),metal:Math.ceil(2*(l-1)*m)}}
function repair(k){const c=T('manitas')?{}:{madera:4,piedra:2};if(!has(c))return;pay(c);S.bld[k].broken=false;log('🔧 '+BUILD[k].n+' reparado');openFire();save()}
function heal(i){const s=S.surv[i];if(S.res.medicina<1)return;if(!(T('milagro')&&Math.random()<.5))S.res.medicina--;s.sick=false;s.hp=Math.min(s.max,s.hp+30);log('💊 '+s.name+' curado');profile(i);save()}
function equip(id){const k=S.inv.findIndex(x=>x.id===id);if(k<0)return;const it=S.inv[k];S.inv.splice(k,1);if(S.eq[it.sl])S.inv.push(S.eq[it.sl]);S.eq[it.sl]=it;openEquip();save()}
function unequip(sl){if(!S.eq[sl])return;S.inv.push(S.eq[sl]);S.eq[sl]=null;openEquip();save()}
// ---------- zombies
function revealed(){const r=lightR();return CAVES.filter(c=>Math.hypot(c[0]-180,c[1]-400)<r+40)}
const ZT={errante:{n:'Errante',lv:1,hp:1,sp:[12,18],atk:1,sz:1,c:'#5a7a3a',h:'#8aa060'},corredor:{n:'Corredor',lv:2,hp:.5,sp:[36,44],atk:.7,sz:.85,c:'#7a6a3a',h:'#b0a070'},
 bruto:{n:'Bruto',lv:3,hp:2.6,sp:[9,11],atk:1.8,sz:1.45,c:'#4a5a3a',h:'#6a8050',bk:.75},trepador:{n:'Trepador',lv:3,hp:.8,sp:[24,30],atk:.9,sz:.9,c:'#5a4a6a',h:'#8a7aa0'},
 escupidor:{n:'Escupidor',lv:4,hp:.8,sp:[13,16],atk:.6,sz:1,c:'#6a8a2a',h:'#a0c040',rng:75},ahogado:{n:'El Ahogado',lv:5,hp:9,sp:[10,12],atk:2.5,sz:2,c:'#2a5a6a',h:'#4a8a9a',boss:1}};
function fireEff(){return S.fire*(S.dim?.5:1)}
function spawnZ(x,y,sleepy,ty){ty=ty||'errante';const d=ZT[ty],lv=S.fire,hp=Math.round((30+lv*12)*d.hp);Z.push({x,y,ty,hp,max:hp,atk:(5+lv*2)*d.atk,cd:1,hit:0,sp:R(d.sp[0],d.sp[1])})}
function zType(){const ok=Object.keys(ZT).filter(k=>!ZT[k].boss&&ZT[k].lv<=S.fire);const w=ok.map(k=>k==='errante'?5:k==='corredor'?3:2);let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<ok.length;i++){r-=w[i];if(r<0)return ok[i]}return'errante'}
function spawnAt(ty){if(ty==='trepador')return Math.random()<.5?[180+R(-20,20),60]:[Math.random()<.5?12:348,R(120,300)];if(ty==='ahogado')return[R(120,240),560];const cs=revealed().length?revealed():CAVES.slice(0,3),c=pick(cs);return[c[0]+R(-8,8),c[1]+R(-8,8)]}
function spawnGroup(n,boss){for(let i=0;i<n;i++){const ty=zType(),p=spawnAt(ty);spawnZ(p[0],p[1],false,ty)}if(boss){spawnZ(180,560,false,'ahogado');FX.push({t:'splash',x:180,y:555,l:2})}}
// fire-driven attraction: random events, chance per second grows with fire level
function attract(dt){if(S.pend){S.pend.t-=dt;if(S.pend.t<=0){spawnGroup(S.pend.n,S.pend.b);if(S.pend.b)toast('🌊 ¡EL AHOGADO surge del lago!');S.pend=null}return}
 const fe=fireEff(),p=(.03+fe*.005)*dt;if(Math.random()>p)return;const r=Math.random(),lv=S.fire;
 if(lv>=5&&!Z.some(z=>z.ty==='ahogado')&&r<.02+lv*.005){S.pend={t:6,n:2+lv,b:1};toast('🌊 El lago burbujea... ¡algo enorme sube!');return}
 if(r<.06+fe*.012){const n=Math.round(5+fe*2+R(0,3));S.pend={t:5,n};toast('🧟 ¡HORDA! '+n+' zombis atraídos por la hoguera');return}
 if(r<.3+fe*.02){const n=RI(2,3+Math.ceil(fe/2));S.pend={t:4,n};toast('👀 Algo se acerca... ('+n+')');return}
 spawnGroup(1);log('🧟 Un zombi errante se acerca a la luz')}
function wave(){spawnGroup(2+S.fire);toast('🧟 ¡Horda!')}
function zDrop(z){const d=ZT[z.ty||'errante'];if(d.boss){const it=mkItem(S.fire>=7?4:3);S.inv.push(it);S.res.metal+=5;S.res.medicina+=2;toast('🏆 ¡El Ahogado cae! Botín: '+it.n+', 5 metal, 2 medicina');return}
 if(Math.random()<.02*S.fire){const it=mkItem(lootT());S.inv.push(it);log('🧟 Botín de zombi: '+it.n)}
 if(Math.random()<.4+(S.fire>=6?.2:0)){const k=pick(['madera','metal','comida','piedra']),n=Math.ceil((d.sz>1.3?3:1)*(1+S.fire*.25));S.res[k]+=n;FX.push({t:'loot',x:z.x,y:z.y-10,l:1,s:'+'+n+' '+k})}}
// ---------- UI modals
const M=$('modal'),C=$('card');function openM(h){C.innerHTML=h;M.classList.remove('hide')}function closeM(){M.classList.add('hide')}
M.addEventListener('click',e=>{if(e.target===M)closeM();const b=e.target.closest('[data-f]');if(!b||b.disabled)return;const f=b.dataset.f,v=b.dataset.v;
 ({close:closeM,exp:()=>expedition(+v),fire:upFire,rep:()=>repair(v),heal:()=>heal(+v),eq:()=>equip(+v),uneq:()=>unequip(v),sel:()=>selExp(+v),go:()=>{const a=S.sel;if(a.length)expedition(a[0],a[1])},slot:()=>detail('s',v),inv:()=>detail('i',+v),stp:()=>{if(S.pts>0){P()[v]++;S.pts--;save();openEquip()}},tab:()=>{S.tab=v;openEquip()},cls:()=>{if(P().lv>=3&&!S.cls){S.cls=v;save();openEquip()}},tal:()=>learn(v),craft,dest:()=>{S.dest=+v;openExp()},dim:()=>{S.dim=!S.dim;toast(S.dim?'🌑 Bajas el fuego: menos luz, menos zombis':'🔥 Avivas el fuego');save();openFire()},reset:()=>{if(confirm('¿Borrar partida?')){localStorage.removeItem(KEY);location.reload()}},profile:()=>profile(+v)})[f]()});
const X='<button class="btn" data-f="close">Cerrar</button>';
function openExp(){const duo=S.fire>=3;let h='<h3>🧭 Expedición</h3><p>'+(duo?'Elige 1 o 2 supervivientes. En pareja: +60% botín, menos riesgo y ambos ganan XP (pero hay menos defensores).':'Elige quién sale (20-40 s). Riesgo de heridas.')+'</p>'+(duo?'':'<p class="lock">🔒 Expediciones de 2 personas: Hoguera nivel 3</p>');
 S.surv.forEach((s,i)=>{const ok=canGo(s),on=S.sel.indexOf(i)>=0;h+='<button class="btn'+(on?' on':'')+'" data-f="'+(duo?'sel':'exp')+'" data-v="'+i+'" '+(ok?'':'disabled')+'>'+(on?'✔ ':'')+s.name+' · nv '+s.lv+' · ♥'+Math.round(s.hp)+' · Vel '+stat(s,'ve')+(s.away?' (fuera '+Math.ceil(s.away)+'s)':'')+'</button>'});
 h+='<p><b>Destino:</b></p><div class="row">'+DEST.map((d,i)=>'<button class="btn'+((S.dest||0)===i?' on':'')+'" data-f="dest" data-v="'+i+'" '+(S.fire>=d.lv?'':'disabled')+'>'+(S.fire>=d.lv?'':'🔒')+d.n+'<small>'+(S.fire>=d.lv?'x'+d.m+' botín':'Hoguera nv '+d.lv)+'</small></button>').join('')+'</div>';
 if(duo)h+='<button class="btn gold" data-f="go" '+(S.sel.length?'':'disabled')+'>Enviar '+(S.sel.length===2?'pareja':'')+'</button>';openM(h+X)}
function selExp(i){const k=S.sel.indexOf(i);if(k>=0)S.sel.splice(k,1);else{S.sel.push(i);if(S.sel.length>2)S.sel.shift()}openExp()}
function openFire(){const c=fireCost(),mx=S.fire>=MAXF;let h='<h3>🔥 Gran Hoguera · nivel '+S.fire+'/'+MAXF+'</h3><div class="lvbar">'+Array.from({length:MAXF},(_,i)=>'<i class="'+(i<S.fire?'on':'')+'">'+(i+1)+'</i>').join('')+'</div><p>Luz: '+lightR()+' · 💚 Calor: '+warmR()+' · Grutas reveladas: '+revealed().length+'/'+CAVES.length+' · Supervivientes máx '+maxSurv()+'</p>';
 if(mx)h+='<p class="gold">¡Hoguera al máximo!</p>';else h+='<div class="next"><b>Siguiente nivel '+(S.fire+1)+' desbloquea:</b><br>• '+(UNL[S.fire+1]||[]).join('<br>• ')+'<br>• 🔥 Más pared y lago revelados (luz '+(95+(S.fire+1)*45)+')<br>• 🧟 Más atracción: zombis '+(['','','Corredor','Bruto, Trepador','Escupidor','El Ahogado','','',''][S.fire+1]||'más numerosos')+'<br><b>Coste:</b> '+resStr(c)+'</div><button class="btn gold" data-f="fire" '+(has(c)?'':'disabled')+'>Mejorar a nivel '+(S.fire+1)+'</button>';
 h+='<p style="opacity:.75">'+UNL.map((n,i)=>n&&i<=S.fire?'✔ '+n.join(' · '):'').filter(Boolean).join('<br>')+'</p>';if(S.bld[7]){const cc=craftCost();h+='<button class="btn gold" data-f="craft" '+(has(cc)?'':'disabled')+'>⚒ Forjar objeto '+(S.fire>=8?'Morado+':'Azul+')+' ('+resStr(cc)+')</button>'}
 for(const k in S.bld){if(S.bld[k].broken)h+='<button class="btn" data-f="rep" data-v="'+k+'" '+(T('manitas')||has({madera:4,piedra:2})?'':'disabled')+'>Reparar '+BUILD[k].n+(T('manitas')?' (gratis)':' (4 madera, 2 piedra)')+'</button>'}
 h+='<div class="next"><b>Atracción de zombis: '+'🧟'.repeat(Math.max(1,Math.round(fireEff())))+'</b><br><small>Cuanto más grande el fuego, más zombis atrae y más duros (nv2 Corredor, nv3 Bruto y Trepador, nv4 Escupidor, nv5 El Ahogado).</small></div><button class="btn'+(S.dim?' on':'')+'" data-f="dim">'+(S.dim?'🔥 Avivar fuego (luz y bonus completos)':'🌑 Bajar fuego (menos luz, menos zombis, huerto más lento)')+'</button>';openM(h+X)}
const SL_L=['cabeza','cuerpo','manos'],SL_R=['arma','linterna','pies','mochila'];
function slotHTML(sl){const it=S.eq[sl],ex=!SLOTS[sl];return'<div class="slot'+(it?' rb'+it.r:'')+(ex?' empty':'')+'" data-f="slot" data-v="'+sl+'"><canvas class="ic" width="20" height="20" data-ic="'+(it?'e:'+sl:'')+'"></canvas><small>'+(SLOTS[sl]||XSLOTS[sl])+'</small></div>'}
const SN={fu:'Fuerza',ve:'Velocidad',va:'Valor',vi:'Vitalidad'};
function warmR(){return Math.round((45+S.fire*14)*(S.dim?.6:1))}
function nearFire(s){return Math.hypot(s.x-180,(s.y-400)*1.6)<warmR()}
function rosaWarm(){const r=S.surv[1];return r&&r.role==='fire'&&!r.away&&nearFire(r)}
function rec(s,where){if(s.sick)return 0;let v=.4+stat(s,'vi')*.12;if(s.role==='medic')v*=1.3;if(s.role==='player'){if(T('regen'))v*=3;if(S.cls==='medico')v*=1.25}if(T('aura'))v*=2;if(S.bld[8]&&!S.bld[8].broken)v*=1.5;if(s.role!=='fire'&&rosaWarm())v*=1.25;if(s.hunger>=100)v*=.3;return(where===undefined?nearFire(s):where)?v:v*.1}
function recTxt(s){const v=rec(s,true);return s.sick?'detenida (enfermo)':v.toFixed(1)+' ♥/s junto al fuego · lleno en '+Math.ceil(s.max/v)+' s'}
function sheetHead(){const p=P(),c=S.cls&&CLS[S.cls];return'<div class="nm"><b>'+p.name+'</b> · Nivel '+p.lv+' · '+(c?c.i+' '+c.n:'Superviviente')+'</div><div class="xb"><i style="width:'+Math.min(100,p.xp/(p.lv*20)*100)+'%"></i><span>XP '+p.xp+'/'+p.lv*20+'</span></div><div class="xb hp"><i style="width:'+p.hp/p.max*100+'%"></i><span>♥ '+Math.round(p.hp)+'/'+p.max+'</span></div>'}
function gearHTML(){const p=P();let h='<div class="doll"><div class="col">'+SL_L.map(slotHTML).join('')+'</div><div class="mid"><canvas id="doll" width="96" height="60"></canvas></div><div class="col">'+SL_R.map(slotHTML).join('')+'</div></div>';
 h+='<div class="stats">'+(S.pts?'<div class="pts">✨ '+S.pts+' puntos para repartir</div>':'')+Object.keys(SN).map(k=>{const g=gearB(k);return'<div class="st"><span>'+SN[k]+'</span><b>'+stat(p,k)+'</b>'+(g?'<em>(+'+g+')</em>':'<em></em>')+(S.pts?'<button data-f="stp" data-v="'+k+'">+</button>':'')+'</div>'}).join('')+(S.dog?'<div class="st"><span>🐕 Perro</span><b>♥'+Math.round(S.dog.hp)+'</b><em></em></div>':'')+'<div class="st" style="grid-column:1/-1;display:block">💚 Recuperación: <b>'+recTxt(p)+'</b></div></div><div id="det" class="det">Toca una casilla u objeto.</div>';return h}
function talentHTML(){const p=P();if(p.lv<3)return'<p class="lock">🔒 Al nivel 3 eliges clase y desbloqueas talentos (1 punto por nivel).<br>Te faltan '+(3-p.lv)+' nivel(es).</p>';
 if(!S.cls)return'<p>Elige tu clase (definitiva):</p>'+Object.keys(CLS).map(k=>{const c=CLS[k];return'<button class="btn" data-f="cls" data-v="'+k+'">'+c.i+' '+c.n+'<small>'+c.t[0].map(x=>x[1]).join(' · ')+'</small></button>'}).join('');
 const c=CLS[S.cls];let h='<p class="pts">'+c.i+' '+c.n+' · Puntos de talento: '+tpts()+'</p><div class="tree">';
 c.t.forEach((tier,ti)=>{const open=ti===0||c.t[ti-1].some(x=>T(x[0]));h+='<div class="tier">'+tier.map(x=>{const on=T(x[0]),can=!on&&open&&tpts()>0;return'<div class="node'+(on?' on':can?' can':'')+'" data-f="tal" data-v="'+x[0]+'"><b>'+x[1]+'</b><small>'+x[2]+'</small></div>'}).join('')+'</div>'+(ti<2?'<div class="link'+(tier.some(x=>T(x[0]))?' on':'')+'"></div>':'')});return h+'</div>'}
function learn(k){const c=CLS[S.cls];if(!c||tpts()<1||T(k))return;const ti=c.t.findIndex(t=>t.some(x=>x[0]===k));if(ti>0&&!c.t[ti-1].some(x=>T(x[0])))return;S.tal.push(k);if(k==='aguante')P().max+=40;toast('Talento aprendido: '+c.t[ti].find(x=>x[0]===k)[1]);save();openEquip()}
function itemInfo(it){return'<b class="r'+it.r+'">'+it.n+'</b><br>'+RAR[it.r]+' · '+(SLOTS[it.sl])+' · +'+it.b+' '+SN[it.st]}
function detail(t,v){const d=$('det');if(!d)return;if(t==='s'){const it=S.eq[v];d.innerHTML=it?itemInfo(it)+' <button data-f="uneq" data-v="'+v+'">Quitar</button>':(SLOTS[v]||XSLOTS[v])+': '+(SLOTS[v]?'vacío':'próximamente')}
 else{const it=S.inv.find(x=>x.id===v);if(!it)return;const cur=S.eq[it.sl];d.innerHTML=itemInfo(it)+(cur?'<br><small>Equipado: +'+cur.b+' ('+(it.b-cur.b>=0?'+':'')+(it.b-cur.b)+')</small>':'')+' <button data-f="eq" data-v="'+it.id+'">Equipar</button>'}}
function openEquip(){const p=P(),tab=S.tab==='tal'?'tal':'eq',tb=tpts()>0&&S.cls||(p.lv>=3&&!S.cls);
 let h='<div class="sheet">'+sheetHead()+'<div class="tabs"><button data-f="tab" data-v="eq" class="'+(tab==='eq'?'on':'')+'">Equipo</button><button data-f="tab" data-v="tal" class="'+(tab==='tal'?'on':'')+'">Talentos'+(tb?' ●':'')+'</button></div>';
 if(tab==='eq'){h+=gearHTML()+'<h3>Inventario</h3><div class="grid">';
  if(!S.inv.length)h+='<p style="opacity:.6">Vacío. Cava o sal de expedición.</p>';
  S.inv.forEach(it=>{h+='<div class="slot rb'+it.r+'" data-f="inv" data-v="'+it.id+'"><canvas class="ic" width="20" height="20" data-ic="i:'+it.id+'"></canvas></div>'});
  h+='</div><p class="res">'+Object.entries(S.res).map(([k,v])=>k+': '+v).join(' · ')+'</p>'}else h+=talentHTML();
 openM(h+X+'</div>');C.querySelectorAll('canvas.ic').forEach(cv=>{const a=cv.dataset.ic;if(!a)return;const it=a[0]==='e'?S.eq[a.slice(2)]:S.inv.find(x=>x.id===+a.slice(2));drawIcon(cv,it)});drawDoll()}
function profile(i){const s=S.surv[i];let h='<h3 style="color:'+s.col+'">'+s.name+'</h3>Nivel '+s.lv+' · XP '+s.xp+'/'+s.lv*20+'<br>♥ '+Math.round(s.hp)+'/'+s.max+' · Hambre '+Math.round(s.hunger)+'%<br>Fuerza '+stat(s,'fu')+' · Velocidad '+stat(s,'ve')+' · Valor '+stat(s,'va')+' · Vitalidad '+stat(s,'vi')+'<br>💚 Recuperación: '+recTxt(s)+(s.role==='fire'?'<br><small>🔥 Calienta a los demás: +25% recuperación junto al fuego</small>':'')+'<br>Estado: '+(s.sick?'<b style="color:#8f8">ENFERMO</b>':'sano')+(s.away?' · de expedición':'');
 if(s.role==='player'&&!s.sick&&s.hp>=s.max){openEquip();return}
 if(s.sick||s.hp<s.max)h+='<button class="btn" data-f="heal" data-v="'+i+'" '+(S.res.medicina>0?'':'disabled')+'>Usar medicina ('+S.res.medicina+')</button>';openM(h+X)}
function settings(){openM('<h3>⚙ Ajustes</h3><p>La Caverna · prototipo v0.1<br>La partida se guarda sola en este dispositivo.</p><button class="btn" data-f="reset">Reiniciar partida</button>'+X)}
$('gear').onclick=settings;
document.querySelectorAll('#bar button').forEach(b=>b.addEventListener('click',()=>({dig,exp:openExp,fire:openFire,equip:openEquip})[b.dataset.a]()));
cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
 let best=-1,bd=26;S.surv.forEach((s,i)=>{if(s.out)return;const d=Math.hypot(s.x-x,s.y-10-y);if(d<bd){bd=d;best=i}});if(best>=0)profile(best)});
// ---------- update
function near(a,list){let b=null,bd=1e9;for(const o of list){const d=Math.hypot(o.x-a.x,o.y-a.y);if(d<bd){bd=d;b=o}}return[b,bd]}
function update(dt){const t=S.tick+=dt;
 S.en=Math.min(10,S.en+dt/3*(T('incansable')?1.5:1));if(S.bld[6]&&!S.bld[6].broken&&t%(S.dim?60:30)<dt){S.res.comida++}attract(dt);
 S.storyT-=dt;if(S.storyT<=0&&S.story<STORY.length){const[a,b]=STORY[S.story++];toast(a+': '+b);if(S.story===STORY.length)FX.push({t:'splash',x:200,y:540,l:2});S.storyT=40}
 const home=S.surv.filter(s=>!s.out&&s.hp>0);
 for(const s of S.surv){
  if(s.away>0){s.away-=dt;if(!s.out){mv(s,s.tx,s.ty,40,dt);if(Math.hypot(s.x-s.tx,s.y-s.ty)<3){s.ty=60;s.tx=180;if(s.y<64)s.out=true}}if(s.away<=0){s.away=0;returnExp(s)}continue}
  s.hunger+=dt*.5;if(s.hunger>=100){if(S.res.comida>0){S.res.comida--;s.hunger=0}else{s.hunger=100;s.hp-=dt*.5}}
  if(s.sick)s.hp-=dt*.4;if(s.hp<s.max){const r=rec(s);if(r>0){const h=Math.min(s.max-s.hp,r*dt);s.hp+=h;s.hq=(s.hq||0)+h;s.heal=nearFire(s)?.3:0;if(s.hq>=3&&nearFire(s)){FX.push({t:'loot',x:s.x+R(-4,4),y:s.y-30,l:1,s:'+'+Math.round(s.hq),c:'120,255,120'});s.hq=0}}}else s.heal=0;
  if(s.role==='player'&&T('vendas')&&t%5<dt)for(const o of S.surv)if(o!==s&&!o.away&&Math.hypot(o.x-s.x,o.y-s.y)<60)o.hp=Math.min(o.max,o.hp+4);
  if(s.hp<=0){s.hp=1;s.sick=false;s.hunger=50;log('💀 '+s.name+' cae inconsciente y se recupera junto al fuego');s.x=180;s.y=410}
  const[z,d]=near(s,Z);s.cd-=dt;s.hit=Math.max(0,s.hit-dt);
  const low=s.hp<s.max*.45;if(low&&!nearFire(s)&&(!z||d>18)){s.tx=180+R(-30,30);s.ty=R(400,418);mv(s,s.tx,s.ty,30+stat(s,'ve'),dt)}
  else if(z&&d<160&&!(low&&d>18)){if(d>14)mv(s,z.x,z.y,30+stat(s,'ve')*2,dt);else if(s.cd<=0){z.hp-=(4+stat(s,'fu')*1.5)*dmgMul(s)*(S.bld[4]&&!S.bld[4].broken?1.1:1);z.hit=.15;s.cd=s.role==='player'&&T('rapido')?.65:1;FX.push({t:'hit',x:z.x,y:z.y-8,l:.3});if(z.hp<=0){addXP(s,z.ty==='ahogado'?60:6);z.dropped=1;zDrop(z)}}}
  else{if(Math.hypot(s.x-s.tx,s.y-s.ty)<2&&Math.random()<dt*.4){s.tx=R(95,265);s.ty=R(388,425)}mv(s,s.tx,s.ty,14,dt)}
 }
 if(S.dog){const d=S.dog,p=P();d.cd-=dt;const[z,dz]=near(d,Z);if(z&&dz<150){if(dz>12)mv(d,z.x,z.y,60,dt);else if(d.cd<=0){z.hp-=8;z.hit=.15;d.cd=.8}}else mv(d,p.x+14,p.y+4,p.out?0:40,dt);d.hp=Math.min(d.max,d.hp+dt)}
 for(const z of Z){z.cd-=dt;z.hit=Math.max(0,z.hit-dt);
  const tgts=home.slice();if(S.dog)tgts.push(S.dog);for(const k in S.bld)if(!S.bld[k].broken)tgts.push({x:BUILD[k].x,y:BUILD[k].y,bk:k});
  const[tg,d]=near(z,tgts);if(!tg)continue;const zt=ZT[z.ty||'errante'];if(zt.rng&&!tg.bk&&d<zt.rng){if(z.cd<=0){z.cd=2.4;FX.push({t:'spit',x:z.x,y:z.y-12,x2:tg.x,y2:tg.y-12,l:.4});tg.hp-=z.atk;tg.hit=.2;if(tg.name&&Math.random()<.3&&!tg.sick&&!(tg.role==='player'&&T('inmune'))){tg.sick=true;log('🤢 '+tg.name+' recibe un escupitajo: enfermo')}}continue}
  if(d>12)mv(z,tg.x,tg.y,z.sp*(T('trampas')?.7:1),dt);else if(z.cd<=0){z.cd=1.3;
   if(tg.bk){if(!T('refuerzo')&&Math.random()<(zt.bk||.25)){S.bld[tg.bk].broken=true;toast('¡Los zombis rompen '+BUILD[tg.bk].n+'!')}}
   else{tg.hp-=z.atk*(tg.role==='player'&&T('piel')?.7:1);tg.hit=.2;if(tg.name&&Math.random()<.12&&!tg.sick&&!(tg.role==='player'&&T('inmune'))){tg.sick=true;log('🦠 '+tg.name+' ha sido mordido: enfermo')}}}}
 const dead=Z.filter(z=>z.hp<=0);dead.forEach(z=>{if(!z.dropped)zDrop(z)});if(dead.length){Z=Z.filter(z=>z.hp>0);S.res.comida+=0;if(!Z.length)log('✔ Oleada repelida')}
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
function lake(t){const l=Math.max(1,fireEff()),g=ctx.createLinearGradient(0,462,0,H);g.addColorStop(0,'#1f6f86');g.addColorStop(.35,'#145368');g.addColorStop(1,'#08303f');ctx.fillStyle=g;ctx.fillRect(0,462,W,H-462);
 ctx.fillStyle='#3a6a70';ctx.fillRect(0,460,W,3);
 for(let i=0;i<34;i++){const y=470+(i*29)%170,x=(i*71+t*(8+i%5*3))%(W+40)-20,a=.18+.12*Math.sin(t*2+i);ctx.fillStyle='rgba(170,230,240,'+a+')';ctx.fillRect(Math.round(x),y,10+i%4*6,1)}
 const rows=10+l*6,wb=26+l*9,al=.35+l*.06;
 for(let i=0;i<rows;i++){const y=468+i*(170/rows)*Math.min(1,rows/34)*1.4,k=1-i/rows,a=al*k*(.6+.4*Math.sin(t*3+i));if(y>H)break;ctx.fillStyle='rgba(255,'+(150+Math.round(60*k))+',70,'+Math.min(.9,a)+')';const w=wb*(.5+k*.5)+Math.sin(t*2+i*1.7)*8;ctx.fillRect(Math.round(180-w+Math.sin(t*1.5+i)*5),Math.round(y),Math.round(w*2),2)}
 const rg=ctx.createRadialGradient(180,470,4,180,470,60+l*28);rg.addColorStop(0,'rgba(255,170,80,'+(.22+l*.03)+')');rg.addColorStop(1,'rgba(255,140,60,0)');ctx.fillStyle=rg;ctx.fillRect(0,462,W,H-462)}
function fire(t){ctx.strokeStyle='rgba(120,255,140,.13)';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.ellipse(180,400,warmR(),warmR()/1.6,0,0,7);ctx.stroke();ctx.setLineDash([]);const l=Math.max(1,fireEff()),s=.75+l*.3;const g=ctx.createRadialGradient(180,395,4,180,395,60+l*32);g.addColorStop(0,'rgba(255,170,60,'+Math.min(.85,.45+l*.05)+')');g.addColorStop(1,'rgba(255,100,20,0)');ctx.fillStyle=g;ctx.fillRect(0,200,W,280);
 ctx.fillStyle='#3a2a1e';const ring=5+l;for(let i=0;i<ring;i++){const a=i/ring*Math.PI*2;ctx.beginPath();ctx.arc(180+Math.cos(a)*(9+5*s),404+Math.sin(a)*3,3+s,0,7);ctx.fill()}
 const fn=7+l*2;for(let i=0;i<fn;i++){const c=(fn-1)/2,fl=Math.sin(t*9+i*2)*.5+.5;ctx.fillStyle=['#ff4a14','#ff8a1e','#ffd04a'][i%3];ctx.beginPath();const x=180+(i-c)*3*s,h=(14+fl*12)*s*(1-Math.abs(i-c)/(c+2));ctx.moveTo(x-5*s,404);ctx.quadraticCurveTo(x,404-h*1.6,x+5*s,404);ctx.fill()}
 const sp=3+l*5;for(let i=0;i<sp;i++){const p=((t*.6+i*.137)%1),x=180+Math.sin(i*12.9+t*2)*(6+p*14)*s,y=400-p*(30+l*12)*s;ctx.fillStyle='rgba(255,'+(200-Math.round(p*120))+',60,'+(1-p)+')';ctx.fillRect(Math.round(x),Math.round(y),2,2)}}
function buildings(){for(const k in S.bld){const b=BUILD[k],br=S.bld[k].broken;ctx.save();ctx.translate(b.x,b.y);ctx.globalAlpha=br?.5:1;ctx.fillStyle='#7a5232';ctx.strokeStyle='#2a1a0e';ctx.lineWidth=2;
 if(b.n==='Taller'){ctx.fillRect(-14,-16,28,16);ctx.beginPath();ctx.moveTo(-17,-16);ctx.lineTo(0,-28);ctx.lineTo(17,-16);ctx.fillStyle='#a33';ctx.fill()}
 else if(b.n==='Puente'){ctx.beginPath();ctx.moveTo(-40,0);ctx.quadraticCurveTo(-20,10,0,0);ctx.stroke();for(let i=-38;i<0;i+=6)ctx.fillRect(i,1,4,3)}
 else if(b.n==='Atalaya'){ctx.fillRect(-3,-40,6,40);ctx.fillRect(-12,-48,24,10)}
 else if(b.n==='Huerto'){ctx.fillStyle='#4a3020';ctx.fillRect(-18,-6,36,8);ctx.fillStyle='#5fbf3a';for(let i=-15;i<16;i+=6)ctx.fillRect(i,-11,3,6)}
 else if(b.n==='Forja'){ctx.fillStyle='#5a5a60';ctx.fillRect(-12,-14,24,14);ctx.fillStyle='#ff8a2a';ctx.fillRect(-5,-9,10,6);ctx.fillStyle='#333';ctx.fillRect(6,-26,5,12)}
 else if(b.n==='Santuario'){ctx.fillStyle='#8a8070';ctx.fillRect(-16,-6,32,6);ctx.fillRect(-13,-26,4,20);ctx.fillRect(9,-26,4,20);ctx.fillRect(-16,-30,32,5);ctx.fillStyle='#ffd86a';ctx.fillRect(-2,-20,4,4)}
 else {ctx.fillRect(-22,0,44,5);ctx.fillRect(-20,5,3,10);ctx.fillRect(17,5,3,10)}
 ctx.globalAlpha=1;ctx.fillStyle=br?'#f55':'#ffd9a0';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillText(b.n+(br?' (roto)':''),0,br?-30:12);ctx.restore()}}
function person(s,t){if(s.out)return;const bob=Math.round(Math.sin(t*6+s.x)*1.2),x=Math.round(s.x),y=Math.round(s.y)+bob;ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(s.x,s.y+2,8,2.5,0,0,7);ctx.fill();
 if(s.heal>0){ctx.fillStyle='rgba(120,255,120,'+(.12+.08*Math.sin(t*4))+')';ctx.beginPath();ctx.ellipse(x,y-14,13,20,0,0,7);ctx.fill()}
 const kid=s.role==='kid'?.75:1;ctx.save();ctx.translate(x,y);ctx.scale(kid,kid);hero(ctx,s,s.role==='player'?S.eq:null,t);ctx.restore();
 bar(x,y-42,s.hp/s.max,s.sick?'#8c4':'#4c4');ctx.fillStyle='#fff';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(s.name.split(' ').pop()+' '+s.lv,x,y-45)}
// ---------- pixel art (Warcraft-ish: chunky, bold outlines, warm palette)
const OL='#1a0e06';
function kind(it){return it?it.n.split(' ')[0]:''}
function shade(h,f){const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const c=v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f)));return'#'+((1<<24)+(c(r)<<16)+(c(g)<<8)+c(b)).toString(16).slice(1)}
function metal(r){return r?RCOL[r]:'#c9c4bb'}
function paint(c,L,flash){for(const q of L){c.fillStyle=OL;c.fillRect(q[0]-1,q[1]-1,q[2]+2,q[3]+2)}for(const q of L){c.fillStyle=flash?'#fff':q[4];c.fillRect(q[0],q[1],q[2],q[3])}}
function weaponRects(it,x,y){const k=kind(it),m=metal(it.r),w='#8a5a2c';
 if(k==='Palo')return[[x,y-16,2,18,w],[x,y-17,2,2,m]];
 if(k==='Machete')return[[x,y-2,2,4,'#5a3416'],[x-1,y-3,4,1,'#d8a040'],[x,y-15,3,12,m],[x+1,y-14,1,10,shade(m,1.4)]];
 if(k==='Hacha')return[[x,y-16,2,19,w],[x+2,y-16,4,7,m],[x+5,y-17,1,9,shade(m,1.3)]];
 return[[x,y-24,2,27,w],[x-1,y-28,4,4,m],[x,y-30,2,2,shade(m,1.3)],[x-1,y-21,4,1,'#c33']]}
function helmRects(it,top){const k=kind(it),m=metal(it.r);
 if(k==='Gorro')return[[-7,top,14,4,m],[-4,top-3,8,3,m],[-1,top-5,2,2,'#f3e6cf'],[-7,top+3,14,1,shade(m,.7)]];
 if(k==='Casco')return[[-7,top-1,14,5,m],[-7,top+4,2,4,m],[5,top+4,2,4,m],[-1,top+4,2,4,shade(m,.8)],[-5,top-1,10,1,shade(m,1.35)],[-1,top-3,2,2,'#d8a040']];
 return[[-7,top-1,14,4,m],[-8,top+3,2,8,m],[6,top+3,2,8,m],[-2,top-3,4,2,shade(m,.8)]]}
function hero(c,s,eq,t,flashOff){const f=!flashOff&&s.hit>0,skin=s.sick?'#a8c890':'#f0b07a',col=s.col,L=[];
 const arm=eq&&eq.cuerpo,body=arm?metal(arm.r):col;
 L.push([-5,-9,4,9,'#4a3020'],[1,-9,4,9,'#4a3020'],[-6,-3,5,3,'#2a1a0c'],[1,-3,5,3,'#2a1a0c']);
 L.push([-7,-21,14,13,body]);
 if(arm){L.push([-5,-19,10,7,shade(body,1.25)],[-1,-21,2,13,shade(body,.75)],[-7,-10,14,2,'#6a3a14'],[-1,-10,2,2,'#e8b040'])}else L.push([-7,-10,14,2,'#5a3a1a']);
 L.push([-10,-22,5,5,arm?shade(body,.85):shade(col,.8)],[5,-22,5,5,arm?shade(body,.85):shade(col,.8)]);
 if(arm)L.push([-10,-22,5,1,shade(body,1.4)],[5,-22,5,1,shade(body,1.4)]);
 L.push([-10,-17,3,6,shade(col,.8)],[7,-17,3,6,shade(col,.8)],[-11,-12,4,4,skin],[7,-12,4,4,skin]);
 L.push([-7,-34,14,13,skin],[-4,-28,2,2,'#1a0e06'],[2,-28,2,2,'#1a0e06'],[-2,-25,4,1,shade(skin,.7)]);
 const hair=s.role==='fire'?'#ddd':s.role==='kid'?'#e0a030':'#5a3014';L.push([-7,-35,14,4,hair],[-7,-31,2,4,hair],[5,-31,2,4,hair]);
 if(s.role==='medic')L.push([-1,-19,2,8,'#e22'],[-4,-16,8,2,'#e22']);
 if(s.role==='scout')L.push([-8,-37,16,4,'#2f6a3a'],[-8,-33,2,8,'#2f6a3a'],[6,-33,2,8,'#2f6a3a']);
 if(eq&&eq.cabeza)L.push(...helmRects(eq.cabeza,-36));
 if(eq&&eq.linterna)L.push([-11,-8,4,5,'#3a2410'],[-10,-7,2,3,shade(RCOL[eq.linterna.r],1.5)],[-11,-9,4,1,'#d8a040']);
 if(eq&&eq.arma)L.push(...weaponRects(eq.arma,8,-11));
 if(eq&&eq.linterna){const g=c.createRadialGradient(-9,-5,1,-9,-5,14+eq.linterna.r*3),lc=RCOL[eq.linterna.r];g.addColorStop(0,lc+'aa');g.addColorStop(1,lc+'00');c.fillStyle=g;c.beginPath();c.arc(-9,-5,14+eq.linterna.r*3,0,7);c.fill()}
 paint(c,L,f)}
function dogR(c){paint(c,[[-7,-8,14,6,'#a06a3a'],[5,-13,7,7,'#a06a3a'],[10,-10,3,2,'#2a1a0c'],[8,-11,1,1,'#000'],[6,-14,2,2,'#7a4a22'],[-6,-2,2,3,'#7a4a22'],[4,-2,2,3,'#7a4a22'],[-11,-10,4,2,'#a06a3a']])}
function iconRects(it){const k=kind(it),m=metal(it.r);
 if(it.sl==='arma'){const L=weaponRects(it,0,0);return L}
 if(it.sl==='cabeza')return helmRects(it,-4);
 if(it.sl==='cuerpo')return[[-6,-6,12,11,m],[-4,-4,8,5,shade(m,1.25)],[-1,-6,2,11,shade(m,.75)],[-8,-7,4,4,shade(m,.85)],[4,-7,4,4,shade(m,.85)],[-6,3,12,2,'#6a3a14']];
 const lc=RCOL[it.r];return[[-2,-8,4,2,'#d8a040'],[-4,-6,8,10,'#3a2410'],[-2,-4,4,6,shade(lc,1.5)],[-5,4,10,2,'#d8a040']]}
function drawIcon(cv,it){const c=cv.getContext('2d');c.clearRect(0,0,20,20);if(!it)return;c.save();
 if(it.sl==='arma'){c.translate(10,10);c.rotate(Math.PI/4);c.translate(-1,kind(it)==='Lanza'?12:8);paint(c,iconRects(it))}else{c.translate(10,10);paint(c,iconRects(it))}c.restore()}
function drawDoll(){const cv=$('doll');if(!cv)return;const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);
 c.fillStyle='rgba(255,170,60,.12)';c.beginPath();c.ellipse(42,52,22,4,0,0,7);c.fill();
 c.save();c.translate(42,52);hero(c,P(),S.eq,0,true);c.restore();if(S.dog){c.save();c.translate(74,52);dogR(c);c.restore()}}
function bar(x,y,f,c){ctx.fillStyle='#000';ctx.fillRect(x-10,y,20,3);ctx.fillStyle=c;ctx.fillRect(x-10,y,20*Math.max(0,f),3)}
function zombie(z,t){const d=ZT[z.ty||'errante'],k=d.sz,y=Math.round(z.y+Math.sin(t*4+z.x)*1.5),f=z.hit>0,sw=Math.round(Math.sin(t*5+z.x)*2),c=d.c,h=d.h;ctx.save();ctx.translate(Math.round(z.x),y);ctx.scale(k,k);
 if(d.boss){ctx.fillStyle='rgba(80,200,220,.25)';ctx.beginPath();ctx.ellipse(0,0,16,4,0,0,7);ctx.fill()}
 const L=[[-5,-7,4,7,shade(c,.7)],[1,-7,4,7,shade(c,.7)],[-7,-19,14,12,c],[-6,-12,12,2,'#3a2a1a']];
 if(z.ty==='bruto')L.push([-10,-20,5,6,h],[5,-20,5,6,h],[-3,-17,6,2,'#6a2a1a']);
 if(z.ty==='corredor')L.push([7,-16+sw,7,2,h],[-14,-15-sw,7,2,h]);else L.push([7,-17+sw,8,3,h],[-15,-17-sw,8,3,h]);
 L.push([-6,-30,12,11,h],[-4,-27,3,2,'#f22'],[1,-27,3,2,'#f22'],[-3,-22,6,1,'#2a1a0a']);
 if(z.ty==='escupidor')L.push([-2,-22,4,3,'#c8f040'],[-7,-32,14,2,'#4a6a1a']);
 if(z.ty==='trepador')L.push([-9,-6,3,3,h],[6,-6,3,3,h],[-6,-32,3,3,shade(c,.6)],[3,-32,3,3,shade(c,.6)]);
 if(d.boss)L.push([-7,-33,14,4,'#1a3a3a'],[-8,-29,2,10,'#1a3a3a'],[6,-29,2,10,'#1a3a3a'],[-4,-14,2,6,'#3a7a5a'],[3,-16,2,4,'#3a7a5a'],[-4,-27,3,2,'#6ff'],[1,-27,3,2,'#6ff']);
 paint(ctx,L,f);ctx.restore();bar(z.x,y-34*k-2,z.hp/z.max,d.boss?'#4cf':'#d33');if(d.boss||k>1.3||z.ty!=='errante'){ctx.fillStyle=d.boss?'#8ff':'#fbb';ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.fillText(d.n,z.x,y-34*k-5)}}
function dog(d,t){ctx.save();ctx.translate(d.x,d.y);ctx.fillStyle='#a06a3a';ctx.fillRect(-7,-8,14,6);ctx.fillRect(5,-12,6,6);ctx.fillRect(-6,-2,2,3);ctx.fillRect(4,-2,2,3);ctx.fillRect(-10,-9+Math.sin(t*12)*2,4,2);ctx.restore()}
function drawFog(t){fx.globalCompositeOperation='source-over';fx.clearRect(0,0,W,H);fx.fillStyle='rgba(0,0,0,.93)';fx.fillRect(0,0,W,462);fx.fillStyle='rgba(0,0,0,'+Math.max(.35,.62-S.fire*.04)+')';fx.fillRect(0,462,W,H-462);fx.globalCompositeOperation='destination-out';
 const r=lightR()*(1+Math.sin(t*3)*.02);const g=fx.createRadialGradient(180,400,r*.35,180,400,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g;fx.fillRect(0,0,W,H);
 const g2=fx.createRadialGradient(180,50,5,180,50,70);g2.addColorStop(0,'rgba(0,0,0,.9)');g2.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g2;fx.fillRect(0,0,W,160);
 const g3=fx.createRadialGradient(70,300,5,70,300,60);g3.addColorStop(0,'rgba(0,0,0,.8)');g3.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g3;fx.fillRect(0,200,160,200);
 fx.save();fx.translate(180,520);fx.scale(1,.42);const lr=70+S.fire*35,g4=fx.createRadialGradient(0,0,lr*.3,0,0,lr);g4.addColorStop(0,'rgba(0,0,0,.95)');g4.addColorStop(1,'rgba(0,0,0,0)');fx.fillStyle=g4;fx.fillRect(-W,-lr,W*2,lr*2);fx.restore();
 fx.globalCompositeOperation='source-over';ctx.drawImage(fog,0,0)}
function draw(t){bg();buildings();fire(t);lake(t);
 const all=S.surv.filter(s=>!s.out).map(s=>({o:s,f:person})).concat(Z.map(z=>({o:z,f:zombie})));if(S.dog)all.push({o:S.dog,f:dog});all.sort((a,b)=>a.o.y-b.o.y).forEach(e=>e.f(e.o,t));
 // reflection of fire in lake
 for(const f of FX){if(f.t==='hit'){ctx.fillStyle='rgba(255,240,180,'+f.l*3+')';ctx.beginPath();ctx.arc(f.x,f.y,8*(1-f.l*2),0,7);ctx.fill()}
  if(f.t==='dust'){ctx.fillStyle='rgba(160,120,90,'+f.l*.6+')';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(f.x+Math.cos(i)*20*(1-f.l),f.y+Math.sin(i)*12*(1-f.l),4,0,7);ctx.fill()}}
  if(f.t==='spit'){const p=1-f.l/.4;ctx.fillStyle='#c8f040';ctx.fillRect(Math.round(f.x+(f.x2-f.x)*p)-2,Math.round(f.y+(f.y2-f.y)*p)-2,4,4)}
  if(f.t==='loot'){ctx.fillStyle='rgba('+(f.c||'255,220,120')+','+f.l+')';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(f.s,f.x,f.y-(1-f.l)*14)}
  if(f.t==='splash'){ctx.strokeStyle='rgba(180,220,255,'+f.l/2+')';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(f.x,f.y,(2-f.l)*30+i*10,(2-f.l)*8+i*3,0,0,7);ctx.stroke()}}}
 drawFog(t);
 if(S.story>=STORY.length){const a=.1+.1*Math.sin(t*.7);ctx.fillStyle='rgba(200,255,220,'+a+')';ctx.beginPath();ctx.ellipse(220+Math.sin(t*.3)*60,560,18,3,0,0,7);ctx.fill()}}
function hud(){const r=S.res;$('top').innerHTML='<b>🪵'+r.madera+'</b><b>⚙'+r.metal+'</b><b>🍖'+r.comida+'</b><b>💊'+r.medicina+'</b><b>🪨'+r.piedra+'</b><b>💧'+r.agua+'</b><b>⚡'+Math.floor(S.en)+'/10</b><b>🔥'+S.fire+'</b><b>🧟'+Z.length+(S.pend?'⚠':'')+'</b>'+(S.dim?'<b>🌑</b>':'')+''}
function loop(now){const dt=Math.min(.1,(now-last)/1000);last=now;try{update(dt);draw(now/1000)}catch(e){console.error(e)}if(Math.floor(now/250)!==Math.floor((now-dt*1000)/250))hud();requestAnimationFrame(loop)}
renderLog();hud();if(!S.log.length)toast('Bienvenido a La Caverna. Mantén viva la Gran Hoguera.');
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
window.__G={get S(){return S},get Z(){return Z},update,draw,dig,wave,spawnZ,attract,expedition,upFire};
requestAnimationFrame(loop)})();
