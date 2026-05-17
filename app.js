// ═══════════════════════════════════════════════════════════════

window.firebaseReady = false;
// STORAGE — artifact persistent storage API
// ═══════════════════════════════════════════════════════════════
const storage = window.storage || {
  async get(k,s){try{const v=localStorage.getItem((s?'shared_':'')+k);return v?{value:v}:null}catch{return null}},
  async set(k,v,s){try{localStorage.setItem((s?'shared_':'')+k,v);return{value:v}}catch{return null}},
  async list(p,s){try{const keys=Object.keys(localStorage).filter(k=>k.startsWith((s?'shared_':'')+p));return{keys:keys.map(k=>k.replace(s?'shared_':'',''))}}catch{return{keys:[]}}}
};
window.startGame = function(user) {
  $('loading-overlay').classList.add('hidden');
  addLog('Welcome to the city. Build your empire.', 'info');

  showGame?.();   // if you have it
  renderAll?.();  // if you have it
};
// ═══════════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════════
let audioCtx=null;
function getAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function playTone(freq,type,dur,vol,delay=0,freqEnd=null){
  try{const ctx=getAudio(),osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.connect(gain);gain.connect(ctx.destination);osc.type=type;
  osc.frequency.setValueAtTime(freq,ctx.currentTime+delay);
  if(freqEnd)osc.frequency.linearRampToValueAtTime(freqEnd,ctx.currentTime+delay+dur);
  gain.gain.setValueAtTime(vol,ctx.currentTime+delay);
  gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+delay+dur);
  osc.start(ctx.currentTime+delay);osc.stop(ctx.currentTime+delay+dur);}catch(e){}
}
const SFX={
  success(){playTone(330,'sine',.08,.18);playTone(440,'sine',.08,.18,.09);playTone(550,'sine',.15,.18,.18)},
  fail(){playTone(200,'sawtooth',.2,.15,0,80)},
  cash(){playTone(600,'sine',.06,.12);playTone(800,'sine',.06,.12,.07)},
  bust(){playTone(180,'square',.08,.15);playTone(160,'square',.08,.15,.09);playTone(140,'square',.12,.12,.18)},
  levelUp(){[330,392,494,659].forEach((f,i)=>playTone(f,'sine',.12,.2,i*.1))},
  travel(){playTone(440,'sine',.06,.1,0,550)},
  attack(){playTone(120,'sawtooth',.04,.2);playTone(80,'square',.08,.18,.05,40)},
  win(){[440,550,660,880].forEach((f,i)=>playTone(f,'sine',.15,.15,i*.08))},
  click(){playTone(800,'sine',.04,.06)},
  mission(){[494,587,740].forEach((f,i)=>playTone(f,'sine',.1,.18,i*.09))},
  buy(){playTone(500,'sine',.06,.1);playTone(650,'sine',.08,.1,.07)}
};

// ═══════════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════════
const DISTRICTS=[
  {id:0,name:'Downtown',x:300,y:190},{id:1,name:'Northside',x:300,y:65},
  {id:2,name:'The Docks',x:100,y:190},{id:3,name:'Eastgate',x:500,y:190},
  {id:4,name:'Southport',x:300,y:315},{id:5,name:'Westside',x:100,y:65},
  {id:6,name:'Industrial',x:100,y:315},{id:7,name:'Richlands',x:500,y:65},
  {id:8,name:'Bayfront',x:500,y:315}
];
const GANG_DEFS=[
  {id:'serpents',name:'Serpents',color:'#4a8a50',initPower:30,initTurf:[1,5]},
  {id:'reds',name:'Red Kings',color:'#b52a1d',initPower:45,initTurf:[3,7]},
  {id:'harbor',name:'Harbor Co.',color:'#2a5a9a',initPower:25,initTurf:[2,6]},
  {id:'none',name:'Neutral',color:'#5a5548',initPower:0,initTurf:[0,4,8]}
];
const GANG_COLORS={serpents:'#4a8a50',reds:'#b52a1d',harbor:'#2a5a9a',player:'#e8b830',none:'#252219'};
const REP_TIERS=['STREET RAT','ASSOCIATE','SOLDIER','CAPO','BOSS'];
const REP_THRESHOLDS=[0,20,60,120,200];
const D_NEIGHBORS={0:[1,2,3,4],1:[0,5,7],2:[0,5,6],3:[0,7,8],4:[0,6,8],5:[1,2],6:[2,4],7:[1,3],8:[3,4]};

const CAR_CLASSES={
  sports:{label:'SPORTS',color:'#5090cc'},muscle:{label:'MUSCLE',color:'#e03020'},
  luxury:{label:'LUXURY',color:'#e8b830'},truck:{label:'TRUCK',color:'#5a5548'},
  bike:{label:'BIKE',color:'#5aaa5a'},armored:{label:'ARMORED',color:'#9a6acc'},
  hyper:{label:'HYPER',color:'#ff6600'}
};

const CAR_DATABASE=[
  {brand:'Honda',model:'Civic',year:1998,cls:'sports',rarity:'common',baseValue:800,speed:55,storage:2,heat:1,escapeBonus:5,missionBonus:5},
  {brand:'Ford',model:'Mustang GT',year:2005,cls:'muscle',rarity:'common',baseValue:4500,speed:72,storage:1,heat:2,escapeBonus:12,missionBonus:10},
  {brand:'BMW',model:'M5',year:2019,cls:'luxury',rarity:'uncommon',baseValue:28000,speed:82,storage:2,heat:3,escapeBonus:20,missionBonus:18},
  {brand:'Mercedes',model:'G-Wagon',year:2021,cls:'luxury',rarity:'uncommon',baseValue:35000,speed:70,storage:4,heat:2,escapeBonus:15,missionBonus:20},
  {brand:'Dodge',model:'Challenger SRT',year:2020,cls:'muscle',rarity:'uncommon',baseValue:18000,speed:85,storage:1,heat:3,escapeBonus:18,missionBonus:14},
  {brand:'Ford',model:'F-150 Raptor',year:2022,cls:'truck',rarity:'common',baseValue:12000,speed:60,storage:6,heat:1,escapeBonus:8,missionBonus:22},
  {brand:'Ducati',model:'Panigale V4',year:2023,cls:'bike',rarity:'uncommon',baseValue:22000,speed:95,storage:0,heat:2,escapeBonus:35,missionBonus:8},
  {brand:'Lamborghini',model:'Huracán',year:2022,cls:'hyper',rarity:'rare',baseValue:280000,speed:98,storage:1,heat:5,escapeBonus:45,missionBonus:25},
  {brand:'Rolls Royce',model:'Phantom',year:2023,cls:'luxury',rarity:'rare',baseValue:450000,speed:65,storage:3,heat:2,escapeBonus:20,missionBonus:35},
  {brand:'Toyota',model:'Land Cruiser',year:2019,cls:'truck',rarity:'common',baseValue:8500,speed:58,storage:5,heat:1,escapeBonus:10,missionBonus:18},
  {brand:'Audi',model:'RS7',year:2021,cls:'sports',rarity:'uncommon',baseValue:32000,speed:88,storage:2,heat:2,escapeBonus:25,missionBonus:20},
  {brand:'Cadillac',model:'Escalade ESV',year:2022,cls:'luxury',rarity:'uncommon',baseValue:40000,speed:63,storage:5,heat:2,escapeBonus:12,missionBonus:28},
  {brand:'Bugatti',model:'Chiron',year:2021,cls:'hyper',rarity:'legendary',baseValue:3200000,speed:100,storage:0,heat:5,escapeBonus:60,missionBonus:20},
  {brand:'Mercedes',model:'Sprinter (Blacked)',year:2020,cls:'truck',rarity:'uncommon',baseValue:14000,speed:52,storage:10,heat:2,escapeBonus:5,missionBonus:40},
  {brand:'Range Rover',model:'SVR',year:2022,cls:'luxury',rarity:'uncommon',baseValue:36000,speed:75,storage:4,heat:2,escapeBonus:22,missionBonus:25}
];

const PROPERTY_DEFS=[
  {id:'apartment',name:'Apartment',icon:'🏠',location:'Downtown',desc:'A low-key safehouse. Basic storage and crew housing.',cost:5000,income:200,storage:5,crewSlots:2,bonus:'escape',category:'safehouse'},
  {id:'warehouse',name:'Warehouse',icon:'🏭',location:'Industrial',desc:'Large storage for contraband, vehicles and operations base.',cost:15000,income:500,storage:20,crewSlots:5,bonus:'storage',category:'safehouse'},
  {id:'mansion',name:'Mansion',icon:'🏰',location:'Richlands',desc:'A luxury estate. Crew morale boost and passive income.',cost:80000,income:2000,storage:10,crewSlots:10,bonus:'income',category:'property'},
  {id:'bunker',name:'Hidden Bunker',icon:'🔒',location:'Industrial',desc:'Underground operations center. Maximum security.',cost:50000,income:800,storage:15,crewSlots:8,bonus:'escape',category:'safehouse'},
  {id:'drug-lab',name:'Drug Lab',icon:'⚗️',location:'Southport',desc:'Produces drug supply automatically each day. High risk.',cost:25000,income:1200,storage:3,crewSlots:3,bonus:'drugs',category:'operation'},
  {id:'chop-shop',name:'Chop Shop',icon:'🔧',location:'The Docks',desc:'Strip stolen cars for parts. +50% sell value on all vehicles.',cost:20000,income:400,storage:8,crewSlots:4,bonus:'cars',category:'operation'},
  {id:'casino-front',name:'Casino Front',icon:'🎲',location:'Downtown',desc:'Launder money through the tables. Doubles casino winnings.',cost:60000,income:1500,storage:2,crewSlots:6,bonus:'casino',category:'operation'},
  {id:'port-dock',name:'Port Dock',icon:'⚓',location:'Bayfront',desc:'International smuggling hub. Unlocks Cartel operations.',cost:45000,income:1000,storage:25,crewSlots:8,bonus:'smuggle',category:'operation'}
];

const MISSION_DEFS=[
  {id:'m0',title:'First Blood',desc:'Commit 5 crimes to prove yourself on the streets.',reward:{cash:300,xp:30,respect:5},req:null,type:'crimes',goal:5},
  {id:'m1',title:'Moving On Up',desc:'Reach level 3. The bosses are watching.',reward:{cash:500,xp:50,respect:10},req:'level:3',reqLabel:'Requires Level 3',type:'level',goal:3},
  {id:'m2',title:'Territorial',desc:'Claim your first district. Show the gangs who runs this city.',reward:{cash:600,xp:60,respect:15},req:'level:2',reqLabel:'Requires Level 2',type:'turf',goal:1},
  {id:'m3',title:'The Syndicate',desc:'Control 3 districts simultaneously.',reward:{cash:2000,xp:150,respect:40},req:'turf:1',reqLabel:'Requires 1 District',type:'turf',goal:3},
  {id:'m4',title:'High Roller',desc:'Win $1000 or more at the casino in one go.',reward:{cash:1000,xp:80,respect:20},req:'level:2',reqLabel:'Requires Level 2',type:'casinowin',goal:1000},
  {id:'m5',title:'Top of the Food Chain',desc:'Achieve CAPO reputation.',reward:{cash:5000,xp:300,respect:80},req:'rep:3',reqLabel:'Requires SOLDIER rank',type:'rep',goal:3},
  {id:'m6',title:'Car Collector',desc:'Acquire 3 vehicles for your garage.',reward:{cash:1500,xp:100,respect:25},req:'level:3',reqLabel:'Requires Level 3',type:'cars',goal:3},
  {id:'m7',title:'Kingpin',desc:'Own 3 properties.',reward:{cash:8000,xp:400,respect:100},req:'rep:2',reqLabel:'Requires SOLDIER rank',type:'properties',goal:3},
  {id:'m8',title:'Big Score',desc:'Complete a bank heist successfully.',reward:{cash:3000,xp:200,respect:50},req:'level:5',reqLabel:'Requires Level 5',type:'heist',goal:1},
  {id:'m9',title:'The Empire',desc:'Control all 9 districts.',reward:{cash:25000,xp:1000,respect:300},req:'rep:4',reqLabel:'Requires CAPO rank',type:'turf',goal:9}
];

const ITEM_DATA={
  lockpick:{cost:150,label:'Lockpick',use:'crime:store:+15'},
  gloves:{cost:100,label:'Gloves',use:'crime:all:+10'},
  fakeid:{cost:200,label:'Fake ID',use:'bust:-2'},
  weapon:{cost:350,label:'Piece',use:'attack:+20'},
  vest:{cost:300,label:'Vest',use:'damage:-30'},
  'hacking-kit':{cost:400,label:'Hacking Kit',use:'crime:hack:+25'},
  scanner:{cost:250,label:'Police Scanner',use:'bust:-40'},
  energy:{cost:50,label:'Energy Drink',use:'energy:+40'},
  'drugs-supply':{cost:500,label:'Drug Supply',use:'crime:drugs:enable'},
  explosives:{cost:800,label:'Explosives',use:'crime:heist:enable'},
  'burner-phone':{cost:120,label:'Burner Phone',use:'wanted:-1'},
  drone:{cost:600,label:'Spy Drone',use:'crime:heist:+30'},
  medkit:{cost:80,label:'Med Kit',use:'health:+50'},
  lawyer:{cost:1000,label:'Lawyer',use:'wanted:clear'},
  silencer:{cost:450,label:'Silencer',use:'heat:-50'},
  'stash-bag':{cost:150,label:'Stash Bag',use:'loot:+25'}
};

const GUN_DATA=[
  {id:'snub',name:'Snub Revolver',type:'Sidearm',cost:650,power:12,stealth:7,heat:1,desc:'Cheap, concealable, reliable enough.'},
  {id:'nine',name:'9mm Pistol',type:'Sidearm',cost:1200,power:18,stealth:10,heat:1,desc:'Balanced street weapon for daily work.'},
  {id:'magnum',name:'Magnum Revolver',type:'Hand Cannon',cost:2400,power:32,stealth:4,heat:2,desc:'Loud, heavy, persuasive.'},
  {id:'smg',name:'Compact SMG',type:'Automatic',cost:5200,power:46,stealth:2,heat:3,desc:'Fast pressure for territory fights.'},
  {id:'shotgun',name:'Sawed-Off Shotgun',type:'Shotgun',cost:4300,power:42,stealth:1,heat:3,desc:'Brutal close-range power.'},
  {id:'rifle',name:'Assault Rifle',type:'Rifle',cost:9000,power:65,stealth:0,heat:4,desc:'War gear for serious expansion.'},
  {id:'marksman',name:'Marksman Rifle',type:'Precision',cost:14000,power:78,stealth:3,heat:4,desc:'High control, high cost.'},
  {id:'gold-pistol',name:'Gold Custom Pistol',type:'Luxury Sidearm',cost:25000,power:50,stealth:8,heat:2,desc:'Status symbol with teeth.'}
];

const LUXURY_DATA=[
  {id:'steel-watch',name:'Steel Chronograph',category:'Watch',cost:900,value:900,respect:1,desc:'Entry-level shine.'},
  {id:'diamond-watch',name:'Diamond Watch',category:'Watch',cost:12000,value:13000,respect:8,desc:'Hard to ignore.'},
  {id:'signet-ring',name:'Family Signet Ring',category:'Jewelry',cost:1600,value:1700,respect:2,desc:'Quiet authority.'},
  {id:'diamond-chain',name:'Diamond Chain',category:'Jewelry',cost:8500,value:9000,respect:6,desc:'Loud money.'},
  {id:'tailored-suit',name:'Tailored Suit',category:'Clothes',cost:2500,value:2200,respect:3,desc:'For meetings that matter.'},
  {id:'leather-coat',name:'Leather Coat',category:'Clothes',cost:1200,value:900,respect:1,desc:'Street classic.'},
  {id:'designer-shades',name:'Designer Shades',category:'Accessory',cost:750,value:650,respect:1,desc:'Confidence in glass.'},
  {id:'rare-art',name:'Rare Painting',category:'Collectible',cost:30000,value:36000,respect:12,desc:'Laundered taste.'}
];

const NPC_DEFS=[
  {id:'mara',name:'Mara Voss',role:'Fixer',cost:400,trust:2,perk:'Lower cooldown on your next job by 10 seconds.',action:'fixer'},
  {id:'enzo',name:'Enzo Bell',role:'Gun Runner',cost:750,trust:3,perk:'Discounts your next gun purchase by $500.',action:'gun_discount'},
  {id:'lena',name:'Lena Cross',role:'Hacker',cost:900,trust:3,perk:'Adds cyber fraud odds and posts market intel.',action:'hack_boost'},
  {id:'brick',name:'Brick Malone',role:'Enforcer',cost:650,trust:2,perk:'Restores health and boosts territory attack power.',action:'muscle'},
  {id:'violet',name:'Violet Kane',role:'Fence',cost:500,trust:2,perk:'Creates a higher-value luxury resale contact.',action:'fence'},
  {id:'doc',name:'Doc Mercer',role:'Back-Alley Doctor',cost:350,trust:1,perk:'Restores health without advancing time.',action:'doctor'}
];

const NPC_INTEL=[
  'Richlands crews are flashing expensive cars tonight.',
  'The Docks are paying better for smuggling runs.',
  'Police scanners are picking up extra heat near Downtown.',
  'Auction buyers are overpaying for luxury sedans.',
  'ShadowNet traders prefer guns and watches over basic gear.'
];

const TRADE_ITEM_TYPES=[
  {key:'cash',label:'Cash'},
  {key:'guns',label:'Gun'},
  {key:'luxury',label:'Luxury'},
  {key:'items',label:'Inventory Item'}
];

const GARAGE_UPGRADES=[
  {id:'small',name:'Small Garage',slots:3,cost:0,label:'Starting garage'},
  {id:'warehouse-garage',name:'Warehouse Garage',slots:6,cost:10000,label:'Fits 6 vehicles'},
  {id:'luxury-showroom',name:'Luxury Showroom',slots:10,cost:40000,label:'Fits 10 vehicles'},
  {id:'underground',name:'Underground Garage',slots:20,cost:100000,label:'Hidden — 20 vehicles, no heat'}
];

// ═══════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════
let player=null;
let districtOwners={};
let gangPowers={};
let missions=[];
let garage=[];        // array of car objects
let properties=[];   // array of owned property ids
let garageLevel=0;   // index into GARAGE_UPGRADES
let selectedDistrict=null;
let cooldownInterval=null;
let cooldownMax=0;
let logCount=0;
let casinoStats={won:0,lost:0,bigWin:0,streak:0};
let activeGarageTab='owned';
let activeLeaderboard='networth';
let shadownetPosts=[];
let allPlayers=[];
let tradeOffers=[];
let playerId=null;

const $=id=>document.getElementById(id);

function defaultPlayer(overrides={}){
  return {
    name:overrides.name||overrides.username||'Player',
    level:1,xp:0,cash:500,health:100,energy:100,
    respect:0,wanted:0,day:1,hour:8,
    inventory:[],cooldown:0,
    currentDistrict:0,turfOwned:[],takedowns:0,
    crimeCount:0,heistCount:0,
    casinoWon:0,casinoLost:0,casinoBigWin:0,casinoStreak:0,
    activeCar:null,equippedGun:null,npcRep:{},tradeHistory:[],gunDiscount:0,
    luxuryResaleBoost:0,hackBoost:0,muscleBoost:0,
    ...overrides
  };
}

function buildSaveData(){
  return {
    version:5,
    savedAt:Date.now(),
    player,districtOwners,gangPowers,missions,garage,properties,garageLevel,casinoStats
  };
}

function normalizeSaveData(raw){
  if(!raw)return null;
  let data=raw;
  if(typeof data==='string'){
    try{data=JSON.parse(data);}catch{return null;}
  }
  if(!data||typeof data!=='object')return null;

  if(data.player&&typeof data.player==='object'){
    return {
      version:data.version||0,
      savedAt:Number(data.savedAt||data.updatedAt||0),
      player:defaultPlayer(data.player),
      districtOwners:data.districtOwners&&typeof data.districtOwners==='object'?data.districtOwners:null,
      gangPowers:data.gangPowers&&typeof data.gangPowers==='object'?data.gangPowers:null,
      missions:Array.isArray(data.missions)?data.missions:null,
      garage:Array.isArray(data.garage)?data.garage:[],
      properties:Array.isArray(data.properties)?data.properties:[],
      garageLevel:Number.isFinite(data.garageLevel)?data.garageLevel:0,
      casinoStats:data.casinoStats&&typeof data.casinoStats==='object'?data.casinoStats:{won:0,lost:0,bigWin:0,streak:0},
      complete:!!(data.districtOwners&&data.gangPowers&&Array.isArray(data.missions))
    };
  }

  if(data.name||data.username||Number.isFinite(data.cash)||Number.isFinite(data.level)){
    return {
      version:data.version||0,
      savedAt:Number(data.savedAt||data.updatedAt||0),
      player:defaultPlayer(data),
      districtOwners:null,gangPowers:null,missions:null,
      garage:[],properties:[],garageLevel:0,
      casinoStats:{won:0,lost:0,bigWin:0,streak:0},
      complete:false
    };
  }

  return null;
}

const LOCAL_SAVE_KEYS=['mafia_v3_save','mafia_v3_autosave','mafia_v3_backup'];
let memorySaveRaw=null;

function setStartMessage(text){
  const msg=$('start-msg');
  if(msg)msg.textContent=text||'';
}

function saveLocally(save){
  const raw=JSON.stringify(save);
  memorySaveRaw=raw;
  LOCAL_SAVE_KEYS.forEach(key=>{
    try{localStorage.setItem(key,raw);}catch(e){}
  });
  try{localStorage.setItem('mafia_has_save','1');}catch(e){}
}

async function getLocalSaveCandidates(){
  const candidates=[];
  const memorySave=normalizeSaveData(memorySaveRaw);
  if(memorySave)candidates.push({source:'memory',priority:-1,save:memorySave});
  LOCAL_SAVE_KEYS.forEach((key,idx)=>{
    let raw=null;
    try{raw=localStorage.getItem(key);}catch(e){}
    const save=normalizeSaveData(raw);
    if(save)candidates.push({source:key,priority:idx,save});
  });

  try{
    const scoped=await storage.get('player_save_'+playerId,false);
    const save=normalizeSaveData(scoped&&scoped.value);
    if(save)candidates.push({source:'scoped',priority:3,save});
  }catch(e){}

  return candidates;
}

function pickBestSave(candidates){
  const valid=candidates.filter(c=>c&&c.save&&c.save.player);
  if(!valid.length)return null;
  valid.sort((a,b)=>{
    const completeDiff=(b.save.complete?1:0)-(a.save.complete?1:0);
    if(completeDiff)return completeDiff;
    const timeDiff=(b.save.savedAt||0)-(a.save.savedAt||0);
    if(timeDiff)return timeDiff;
    return (a.priority||0)-(b.priority||0);
  });
  return valid[0];
}

function withTimeout(promise,timeoutMs){
  return Promise.race([
    promise,
    new Promise(resolve=>setTimeout(()=>resolve(null),timeoutMs))
  ]);
}

function hydrateGame(save){
  player=defaultPlayer(save.player);
  districtOwners=save.districtOwners||{};
  gangPowers=save.gangPowers||{};
  missions=save.missions||[];
  garage=save.garage||[];
  properties=save.properties||[];
  garageLevel=save.garageLevel||0;
  casinoStats=save.casinoStats||{won:0,lost:0,bigWin:0,streak:0};

  if(!Object.keys(districtOwners).length||!Object.keys(gangPowers).length||!missions.length){
    initWorld();
  }

  if(!Array.isArray(player.inventory))player.inventory=[];
  if(!Array.isArray(player.turfOwned))player.turfOwned=[];
  if(!player.npcRep||typeof player.npcRep!=='object')player.npcRep={};
  if(!Array.isArray(player.tradeHistory))player.tradeHistory=[];
  if(!Number.isFinite(player.currentDistrict))player.currentDistrict=0;
  if(!Number.isFinite(player.gunDiscount))player.gunDiscount=0;
  if(!Number.isFinite(player.luxuryResaleBoost))player.luxuryResaleBoost=0;
  if(!Number.isFinite(player.hackBoost))player.hackBoost=0;
  if(!Number.isFinite(player.muscleBoost))player.muscleBoost=0;
  cooldownMax=Math.max(cooldownMax,player.cooldown||0);
}

function waitForFirebaseReady(timeout=8000){
  if(window.firebaseReady||window.currentUser)return Promise.resolve(true);
  return new Promise(resolve=>{
    const start=Date.now();
    const timer=setInterval(()=>{
      if(window.firebaseReady||window.currentUser){
        clearInterval(timer);
        resolve(true);
      }else if(Date.now()-start>=timeout){
        clearInterval(timer);
        resolve(false);
      }
    },150);
  });
}

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  buildRepTrack();

  playerId = 'pid_' + Math.random().toString(36).slice(2,10);

  try {
    const s = await storage.get('player_save_' + playerId, false);
    const ls = localStorage.getItem('mafia_local_pid');
    if (ls) playerId = ls;

    const localSave = await getLocalSaveCandidates();
    if (localSave.length) setStartMessage('Saved game found. Press continue to load it.');

  } catch (e) {}

  try{localStorage.setItem('mafia_local_pid', playerId);}catch(e){}

  // ❌ DO NOT start game yet
  // DO NOT hide loading screen here anymore

  loadShadowFeed();
  loadAllPlayers();

  setTimeout(()=>{
    if(!window.firebaseReady){
      $('loading-overlay')?.classList.add('hidden');
      $('load-btn').style.display='block';
      setStartMessage('Firebase is still connecting. Local save/load is ready.');
    }
  },4000);
});

function buildRepTrack(){
  const el=$('repTrack');el.innerHTML='';
  for(let i=0;i<4;i++){const d=document.createElement('div');d.className='rep-tier';d.id='rep-tier-'+i;el.appendChild(d);}
}

// ═══════════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════
function switchTab(name){
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  $('tab-'+name).classList.add('active');
  const tabs=$('nav-tabs').querySelectorAll('.nav-tab');
  const map=['home','city','garage','realestate','missions','market','armory','luxury','casino','trading','npcs','leaderboard','shadownet','players'];
  const idx=map.indexOf(name);
  if(idx>=0)tabs[idx].classList.add('active');
  if(name==='garage')renderGarageTab();
  if(name==='realestate')renderProperties();
  if(name==='city'&&player)renderMap();
  if(name==='armory')renderGunShop();
  if(name==='luxury')renderLuxuryShop();
  if(name==='trading')loadTrades();
  if(name==='npcs')renderNPCs();
  if(name==='leaderboard')loadLeaderboards();
  if(name==='shadownet')loadShadowFeed();
  if(name==='players')loadAllPlayers();
  SFX.click();
}

// ═══════════════════════════════════════════════════════════════
// CREATE / LOAD PLAYER
// ═══════════════════════════════════════════════════════════════
function createPlayer(){
  const name=$('playerName').value.trim();
  if(!name)return showToast('Enter a name','warn');
  SFX.click();
  player=defaultPlayer({name});
  garage=[];properties=[];garageLevel=0;missions=[];districtOwners={};gangPowers={};
  initWorld();
  showGame();
  addLog(player.name+' hit the streets.','info');
  startCooldown();
  renderAll();
  saveGame();
  publishPlayerProfile();
}

function initWorld(){
  GANG_DEFS.forEach(g=>{
    gangPowers[g.id]=g.initPower;
    g.initTurf.forEach(d=>{districtOwners[d]=g.id;});
  });
  missions=MISSION_DEFS.map(m=>({...m,done:false,active:false,progress:0,locked:!!m.req}));
}

function showGame(){
  $('start-screen').style.display='none';
  ['stats-panel','actions-panel','log-panel'].forEach(id=>{$(id).style.display='block';});
}

// ═══════════════════════════════════════════════════════════════
// SAVE / LOAD (local + shared)
// ═══════════════════════════════════════════════════════════════
async function saveGame(){
  if(!player)return showToast('Create a character first','warn');
  const save=buildSaveData();
  saveLocally(save);
  await storage.set('player_save_'+playerId,JSON.stringify(save),false);
  await publishPlayerProfile().catch(e=>console.warn('Profile save failed:',e));
  showToast('Saved locally','info');
  setStartMessage('Saved on this device. Firebase sync will run when connected.');

  if(typeof window.saveToFirebase==='function'){
    window.saveToFirebase(save)
      .then(()=>{showToast('Firebase synced','info');setStartMessage('Saved locally and synced to Firebase.');})
      .catch(err=>{console.warn('Firebase sync failed:',err);setStartMessage('Saved locally. Firebase sync failed, but your game is safe on this device.');});
  }else{
    setStartMessage('Saved locally. Firebase is not ready yet.');
  }
}

async function loadGame() {
  try {
    setStartMessage('Looking for saved game...');
    const candidates=await getLocalSaveCandidates();

    if (typeof window.loadFromFirebase === 'function') {
      await waitForFirebaseReady(5000);
    }

    if (typeof window.loadFromFirebase === 'function' && window.currentUser) {
      setStartMessage('Checking Firebase save...');
      const remoteRaw=await withTimeout(window.loadFromFirebase(),6000);
      const firebaseSave=normalizeSaveData(remoteRaw);
      if(firebaseSave)candidates.push({source:'firebase',priority:4,save:firebaseSave});
    }

    const best=pickBestSave(candidates);
    if (!best) {
      showToast('No save found','warn');
      setStartMessage('No saved game found. Create a player, then press SAVE.');
      return;
    }

    hydrateGame(best.save);
    showGame();
    startCooldown();
    renderAll();
    addLog('Loaded saved game from '+best.source+'.','info');
    showToast('Loaded','info');
    setStartMessage('');
    saveGame();
    console.log(best.save.complete ? 'Loaded full save' : 'Loaded legacy player save', best.source);
  } catch (err) {
    console.error("Load game error:", err);
    showToast('Load failed','warn');
    setStartMessage('Load failed. Check the browser console for details.');
  }
}

async function publishPlayerProfile(){
  if(!player)return;
  const carValue=garage.reduce((sum,c)=>sum+Math.floor((c.baseValue||0)*((c.condition||100)/100)),0);
  const propertyValue=properties.reduce((sum,pid)=>sum+(PROPERTY_DEFS.find(p=>p.id===pid)?.cost||0),0);
  const profile={
    id:playerId,name:player.name,level:player.level,
    rep:REP_TIERS[getRepTier()],repTier:getRepTier(),
    cash:player.cash,respect:player.respect,
    turf:player.turfOwned.length,takedowns:player.takedowns,
    cars:garage.length,properties:properties.length,
    guns:ownedGuns().length,luxury:ownedLuxury().length,luxuryValue:luxuryValue(),
    carValue,propertyValue,netWorth:netWorth(),
    activeCar:player.activeCar?`${player.activeCar.brand} ${player.activeCar.model}`:'none',
    equippedGun:getEquippedGun()?.name||'none',
    lastSeen:Date.now()
  };
  await storage.set('profile_'+playerId,JSON.stringify(profile),true);
}

// ═══════════════════════════════════════════════════════════════
// COOLDOWN
// ═══════════════════════════════════════════════════════════════
function startCooldown(){
  if(cooldownInterval)return;
  cooldownInterval=setInterval(()=>{
    if(!player)return;
    if(player.cooldown>0)player.cooldown--;
    const pct=cooldownMax>0?(player.cooldown/cooldownMax*100):0;
    $('cooldownFill').style.width=pct+'%';
    $('cooldownText').textContent=player.cooldown>0?'COOLING DOWN — '+player.cooldown+'s':'READY';
  },1000);
}

// ═══════════════════════════════════════════════════════════════
// RENDER ALL
// ═══════════════════════════════════════════════════════════════
function renderAll(){
  if(!player)return;
  updateStats();updateHUD();updateInventoryUI();
  renderGangList();renderMissions();renderMap();
  updateCasinoStats();renderProperties();renderGunShop();renderLuxuryShop();renderNPCs();renderTradeUI();renderLeaderboards();
}

function updateStats(){
  $('playerNameDisplay').textContent=player.name;
  $('levelBadge').textContent=player.level;
  $('repBadge').textContent=REP_TIERS[getRepTier()];
  $('sc-cash').textContent='$'+player.cash.toLocaleString();
  $('sc-respect').textContent=player.respect;
  $('sc-turf').textContent=player.turfOwned.length;
  $('sc-props').textContent=properties.length;
  $('bar-health').style.width=player.health+'%';$('val-health').textContent=player.health;
  $('bar-energy').style.width=player.energy+'%';$('val-energy').textContent=player.energy;
  const xpNeeded=player.level*50,xpIn=player.xp%xpNeeded;
  $('bar-xp').style.width=(xpIn/xpNeeded*100)+'%';$('val-xp').textContent=xpIn+'/'+xpNeeded;
  $('wantedStars').querySelectorAll('.star').forEach((s,i)=>s.classList.toggle('active',i<player.wanted));
  const tier=getRepTier();
  $('repBadge').textContent=REP_TIERS[tier];
  for(let i=0;i<4;i++){const el=$('rep-tier-'+i);if(el)el.classList.toggle('filled',i<tier);}
  $('active-car-hud').textContent=player.activeCar?'🚗 '+player.activeCar.brand+' '+player.activeCar.model:'No vehicle';
}

function updateHUD(){
  $('hud-cash').textContent='$'+player.cash.toLocaleString();
  $('hud-wanted').textContent='★'.repeat(player.wanted)+'☆'.repeat(5-player.wanted);
  const h=String(player.hour).padStart(2,'0');
  $('day-label').textContent=player.day;$('time-label').textContent=h+':00';
  $('city-district-label').textContent=DISTRICTS[player.currentDistrict].name.toUpperCase();
  const turfIncome=player.turfOwned.length*20*(getRepTier()+1);
  const propIncome=properties.reduce((s,pid)=>{const p=PROPERTY_DEFS.find(x=>x.id===pid);return s+(p?p.income:0);},0);
  $('income-label').textContent='$'+turfIncome.toLocaleString()+'/day';
  $('prop-income-label').textContent='$'+propIncome.toLocaleString()+'/day';
  $('vehicle-label').textContent=player.activeCar?player.activeCar.brand+' '+player.activeCar.model:'none';
}

function updateInventoryUI(){
  const el=$('inventoryDisplay');
  if(!player.inventory.length){el.innerHTML='<span style="font-family:\'JetBrains Mono\',monospace;font-size:8px;color:var(--mist);letter-spacing:1px">— empty —</span>';return;}
  el.innerHTML=player.inventory.map(i=>'<span class="inv-tag">'+i.toUpperCase()+'</span>').join('');
}

function getRepTier(){
  for(let i=REP_THRESHOLDS.length-1;i>=0;i--)if(player.respect>=REP_THRESHOLDS[i])return i;
  return 0;
}

function updateCasinoStats(){
  if(!player)return;
  $('casino-won').textContent='$'+(player.casinoWon||0).toLocaleString();
  $('casino-lost').textContent='$'+(player.casinoLost||0).toLocaleString();
  const net=(player.casinoWon||0)-(player.casinoLost||0);
  $('casino-net').textContent=(net>=0?'+':'')+'$'+net.toLocaleString();
  $('casino-net').style.color=net>=0?'var(--green-light)':'var(--blood)';
  $('casino-bigwin').textContent='$'+(player.casinoBigWin||0).toLocaleString();
  $('casino-streak').textContent=player.casinoStreak||0;
}

function itemLabel(id){
  return ITEM_DATA[id]?.label||GUN_DATA.find(g=>g.id===id)?.name||LUXURY_DATA.find(l=>l.id===id)?.name||id;
}

function ownedGuns(){
  return GUN_DATA.filter(g=>player&&player.inventory.includes(g.id));
}

function ownedLuxury(){
  return LUXURY_DATA.filter(l=>player&&player.inventory.includes(l.id));
}

function luxuryValue(){
  return ownedLuxury().reduce((sum,item)=>sum+item.value,0);
}

function getEquippedGun(){
  if(!player||!player.equippedGun)return null;
  return GUN_DATA.find(g=>g.id===player.equippedGun)||null;
}

function netWorth(profile){
  if(profile)return (profile.cash||0)+(profile.luxuryValue||0)+(profile.carValue||0)+(profile.propertyValue||0);
  const carValue=garage.reduce((sum,c)=>sum+Math.floor((c.baseValue||0)*((c.condition||100)/100)),0);
  const propValue=properties.reduce((sum,pid)=>sum+(PROPERTY_DEFS.find(p=>p.id===pid)?.cost||0),0);
  return (player?.cash||0)+luxuryValue()+carValue+propValue;
}

function renderGunShop(){
  const shop=$('gun-shop-list'), owned=$('owned-gun-list');
  if(!shop||!owned)return;
  if(!player){
    shop.innerHTML='<div class="empty-garage">Create a character to buy weapons.</div>';
    owned.innerHTML='';
    return;
  }
  const equipped=getEquippedGun();
  $('gun-equipped-label').textContent=equipped?equipped.name:'no weapon equipped';
  shop.innerHTML=GUN_DATA.map(g=>{
    const has=player.inventory.includes(g.id);
    const price=Math.max(0,g.cost-(player.gunDiscount||0));
    return`<div class="item-card">
      <div class="item-head"><div><div class="item-title">${g.name}</div><div class="item-sub">${g.type}</div></div><div class="item-price">$${price.toLocaleString()}</div></div>
      <div class="item-desc">${g.desc}</div>
      <div class="item-stats"><span>Power ${g.power}</span><span>Stealth ${g.stealth}</span><span>Heat +${g.heat}</span></div>
      <button class="property-btn ${has?'owned':'buy'}" onclick="${has?`equipGun('${g.id}')`:`buyGun('${g.id}')`}">${has?(player.equippedGun===g.id?'EQUIPPED':'EQUIP'):'BUY'}</button>
    </div>`;
  }).join('');
  const guns=ownedGuns();
  owned.innerHTML=guns.length?guns.map(g=>`<div class="inv-tag">${g.name}${player.equippedGun===g.id?' *':''}</div>`).join(''):'<div class="empty-garage">No weapons owned yet.</div>';
}

function renderLuxuryShop(){
  const shop=$('luxury-shop-list'), owned=$('luxury-owned-list');
  if(!shop||!owned)return;
  if(!player){
    shop.innerHTML='<div class="empty-garage">Create a character to buy luxury items.</div>';
    owned.innerHTML='';
    return;
  }
  $('luxury-value-label').textContent='$'+luxuryValue().toLocaleString()+' value';
  shop.innerHTML=LUXURY_DATA.map(item=>{
    const has=player.inventory.includes(item.id);
    const resale=Math.floor(item.value*(1+(player.luxuryResaleBoost||0)));
    return`<div class="item-card">
      <div class="item-head"><div><div class="item-title">${item.name}</div><div class="item-sub">${item.category}</div></div><div class="item-price">$${item.cost.toLocaleString()}</div></div>
      <div class="item-desc">${item.desc}</div>
      <div class="item-stats"><span>Respect +${item.respect}</span><span>Resale $${resale.toLocaleString()}</span></div>
      <button class="property-btn ${has?'owned':'buy'}" onclick="${has?`sellLuxury('${item.id}')`:`buyLuxury('${item.id}')`}">${has?'SELL':'BUY'}</button>
    </div>`;
  }).join('');
  const lux=ownedLuxury();
  owned.innerHTML=lux.length?lux.map(i=>`<div class="inv-tag">${i.category}: ${i.name}</div>`).join(''):'<div class="empty-garage">No luxury collection yet.</div>';
}

// ═══════════════════════════════════════════════════════════════
// CRIMES
// ═══════════════════════════════════════════════════════════════
function crime(type){
  if(!player)return showToast('Create a character first','warn');
  if(player.cooldown>0)return showToast('Wait '+player.cooldown+'s','warn');
  if(player.energy<10)return showToast('Too tired','warn');

  // Gate checks
  if(type==='drugs'&&!player.inventory.includes('drugs-supply'))return showToast('Need Drug Supply from market','warn');
  if(type==='heist'){
    if(!player.inventory.includes('explosives'))return showToast('Need Explosives from market','warn');
    if(player.level<5)return showToast('Need Level 5 for heists','warn');
  }

  const CRIME_TABLE={
    mugging:{success:80,min:20,max:60,xp:5,cd:25,label:'Mugging',heatGain:1},
    store:{success:55,min:80,max:200,xp:12,cd:45,label:'Store Robbery',heatGain:1},
    car:{success:40,min:0,max:0,xp:20,cd:70,label:'Vehicle Theft',heatGain:2,isCar:true},
    drugs:{success:60,min:300,max:800,xp:18,cd:60,label:'Drug Run',heatGain:2},
    hack:{success:65,min:150,max:400,xp:15,cd:50,label:'Cyber Fraud',heatGain:1},
    heist:{success:45,min:1000,max:5000,xp:60,cd:120,label:'Bank Heist',heatGain:3},
    smuggle:{success:55,min:400,max:900,xp:22,cd:80,label:'Smuggling Run',heatGain:2}
  };
  const t=CRIME_TABLE[type];
  let bonus=0;
  if(type==='store'&&player.inventory.includes('lockpick'))bonus+=15;
  if(player.inventory.includes('gloves'))bonus+=10;
  if(type==='hack'&&player.inventory.includes('hacking-kit'))bonus+=25;
  if(type==='hack'&&player.hackBoost)bonus+=player.hackBoost;
  if(type==='heist'&&player.inventory.includes('drone'))bonus+=30;
  if(player.turfOwned.includes(player.currentDistrict))bonus+=10;
  if(player.activeCar)bonus+=player.activeCar.missionBonus||0;
  const gun=getEquippedGun();
  if(gun&&['store','drugs','heist','smuggle'].includes(type))bonus+=Math.floor(gun.power/8);

  let lootBonus=player.inventory.includes('stash-bag')?1.25:1;

  player.cooldown=t.cd;cooldownMax=t.cd;
  player.energy=Math.max(0,player.energy-10);
  advanceTime(2);

  const roll=rand(1,100);
  if(roll<=Math.min(92,t.success+bonus)){
    // Success
    if(t.isCar){
      const car=randomStolenCar();
      addCarToGarage(car,true);
      addLog(t.label+' — stole a '+car.year+' '+car.brand+' '+car.model+'!','win');
      showToast('Car acquired!','win');
    } else {
      const reward=Math.floor(rand(t.min,t.max)*lootBonus);
      player.cash+=reward;player.xp+=t.xp;player.respect++;
      player.crimeCount=(player.crimeCount||0)+1;
      if(type==='heist')player.heistCount=(player.heistCount||0)+1;
      SFX.success();setTimeout(SFX.cash,300);
      addLog(t.label+' — success. +$'+reward.toLocaleString(),'win');showToast('+$'+reward.toLocaleString(),'win');
      missionProgress('crimes',1);
      if(type==='heist')missionProgress('heist',1);
    }
    // Heat
    let heatAdd=t.heatGain;
    if(player.inventory.includes('silencer'))heatAdd=Math.max(0,heatAdd-1);
    if(gun)heatAdd+=gun.heat>2?1:0;
    player.wanted=Math.min(5,player.wanted+heatAdd);
    SFX.success();
  } else {
    const dmg=player.inventory.includes('vest')?rand(5,15):rand(10,30);
    player.health=Math.max(0,player.health-dmg);
    player.wanted=Math.min(5,player.wanted+t.heatGain);
    SFX.fail();
    addLog(t.label+' — failed. -'+dmg+' HP.','loss');showToast('Failed — -'+dmg+' HP','loss');
    if(player.health<=0)return playerDied();
  }
  levelUp();policeCheck();checkMissions();renderAll();
}

function randomStolenCar(){
  const pool=CAR_DATABASE.filter(c=>c.rarity==='common'||c.rarity==='uncommon');
  const base=pool[rand(0,pool.length-1)];
  return {
    ...base,
    id:'car_'+Date.now()+'_'+rand(1000,9999),
    condition:rand(40,85),
    stolenPlates:true,
    painted:false,
    nickname:null,
    vinCloned:false
  };
}

function rest(){
  if(!player)return;
  if(player.cooldown>0)return showToast('Still busy for '+player.cooldown+'s','warn');
  player.cooldown=20;cooldownMax=20;
  player.energy=Math.min(100,player.energy+30);
  player.health=Math.min(100,player.health+20);
  advanceTime(8);SFX.click();
  addLog('Rested up.','info');renderAll();
}

function levelUp(){
  while(player.xp>=player.level*50){
    player.level++;player.energy=100;player.health=100;
    SFX.levelUp();
    addLog('★ LEVEL UP — Rank '+player.level+'.','win');showToast('LEVEL '+player.level+'!','win');
    checkMissions();
  }
}

function policeCheck(){
  if(!player.wanted)return;
  let bustChance=player.wanted*12;
  if(player.inventory.includes('scanner'))bustChance*=0.6;
  if(player.inventory.includes('burner-phone'))bustChance-=10;
  if(player.activeCar)bustChance-=(player.activeCar.escapeBonus||0)*0.3;
  if(rand(1,100)>bustChance)return;
  const fine=rand(50,200);
  player.cash=Math.max(0,player.cash-fine);
  player.health=Math.max(0,player.health-15);
  player.energy=Math.max(0,player.energy-10);
  player.wanted=Math.min(5,player.wanted+1);
  SFX.bust();
  if(player.inventory.includes('fakeid')){
    player.wanted=Math.max(0,player.wanted-2);
    addLog('Busted — showed fake ID. Fine: $'+fine+'.','warn');
  } else {
    addLog('BUSTED! Fine: $'+fine.toLocaleString()+'. Heat rising.','loss');
  }
  if(player.inventory.includes('lawyer')){
    player.wanted=0;
    const idx=player.inventory.indexOf('lawyer');
    player.inventory.splice(idx,1);
    addLog('Lawyer called. All charges dropped.','warn');
  }
  showToast('Busted — $'+fine,'loss');
  if(player.health<=0)playerDied();
}

function playerDied(){
  SFX.fail();
  openModal('YOU DIED',player.name+' has been taken off the streets. Your empire crumbles. Start fresh?',()=>{
    player=null;districtOwners={};gangPowers={};missions=[];garage=[];properties=[];
    ['stats-panel','actions-panel','log-panel'].forEach(id=>{$(id).style.display='none';});
    $('start-screen').style.display='block';
    $('log').innerHTML='';logCount=0;
    localStorage.removeItem('mafia_v3_save');
    addLog('A new story begins...','info');
  });
}

// ═══════════════════════════════════════════════════════════════
// MAP & TERRITORY
// ═══════════════════════════════════════════════════════════════
function renderMap(){
  if(!districtOwners)return;
  const ZONE_BASE={none:'#252219',player:'#2a2a10',serpents:'#162016',reds:'#201010',harbor:'#101020'};
  DISTRICTS.forEach(d=>{
    const owner=districtOwners[d.id];
    const isPlayer=player&&player.turfOwned.includes(d.id);
    const zone=$('zone-'+d.id);if(!zone)return;
    const fill=zone.querySelector('.zone-fill');
    const gc=isPlayer?'#2a2a10':(ZONE_BASE[owner]||'#252219');
    if(fill){fill.setAttribute('fill',gc);fill.setAttribute('stroke',isPlayer?'#e8b830':(GANG_COLORS[owner]||'#252219'));fill.setAttribute('stroke-width',isPlayer?'2':'1');}
    const sub=$('zone-sub-'+d.id);
    if(sub){
      if(isPlayer){sub.textContent='YOUR TURF';sub.setAttribute('fill','#e8b830');}
      else if(owner==='none'){sub.textContent='neutral';sub.setAttribute('fill','#5a5548');}
      else{const g=GANG_DEFS.find(x=>x.id===owner);sub.textContent=g?g.name:'';sub.setAttribute('fill',GANG_COLORS[owner]||'#5a5548');}
    }
  });
  if(player){
    const d=DISTRICTS[player.currentDistrict];
    const m=$('player-marker'),p=$('player-pulse');
    if(m){m.setAttribute('cx',d.x);m.setAttribute('cy',d.y);}
    if(p){p.setAttribute('cx',d.x);p.setAttribute('cy',d.y);}
    $('city-district-label').textContent=d.name.toUpperCase();
  }
  // Legend
  const seen=new Set(Object.values(districtOwners).filter(x=>x!=='none'));
  const extras=[...seen].map(g=>{const gd=GANG_DEFS.find(x=>x.id===g);return gd?`<div class="legend-item"><div class="legend-dot" style="background:${gd.color}"></div>${gd.name.toUpperCase()}</div>`:''}).join('');
  $('mapLegend').innerHTML=`<div class="legend-item"><div class="legend-dot" style="background:var(--gold-light)"></div>YOU</div><div class="legend-item"><div class="legend-dot" style="background:#5a5548"></div>NEUTRAL</div><div class="legend-item"><div class="legend-dot" style="background:#2a2a10;border:1px solid var(--gold)"></div>YOUR TURF</div>${extras}`;
}

function selectDistrict(id){
  SFX.click();
  selectedDistrict=id;
  const d=DISTRICTS[id];
  const owner=districtOwners[id];
  const isPlayer=player&&player.turfOwned.includes(id);
  const isCurrent=player&&player.currentDistrict===id;
  const gang=GANG_DEFS.find(g=>g.id===owner);
  $('di-name').textContent=d.name.toUpperCase();
  let gl='';
  if(isPlayer)gl='<span style="color:var(--gold-light)">YOUR TERRITORY</span>';
  else if(owner==='none')gl='<span style="color:var(--mist)">Unclaimed — no gang presence</span>';
  else gl='<span style="color:'+GANG_COLORS[owner]+'">'+gang.name.toUpperCase()+'</span> <span style="color:var(--mist)">· Power: '+gangPowers[owner]+'</span>';
  $('di-gang').innerHTML=gl;
  let btns='';
  if(!player){$('di-actions').innerHTML='';return;}
  if(!isCurrent)btns+='<button class="di-btn travel" onclick="travelTo('+id+')">✈ TRAVEL</button>';
  if(isCurrent&&!isPlayer&&owner==='none')btns+='<button class="di-btn defend" onclick="claimDistrict('+id+')">⚑ CLAIM</button>';
  if(isCurrent&&!isPlayer&&owner!=='none')btns+='<button class="di-btn attack" onclick="attackDistrict('+id+')">⚔ ATTACK ('+gangPowers[owner]+' PWR)</button>';
  if(isCurrent&&isPlayer)btns+='<span style="font-family:\'JetBrains Mono\',monospace;font-size:8px;color:var(--gold);letter-spacing:1px">✓ CONTROLLED</span>';
  $('di-actions').innerHTML=btns||'<span style="font-family:\'JetBrains Mono\',monospace;font-size:8px;color:var(--mist)">Travel here first</span>';
}

function travelTo(id){
  if(!player)return;
  if(player.cooldown>0)return showToast('Wait '+player.cooldown+'s','warn');
  SFX.travel();
  const escBonus=player.activeCar?(player.activeCar.escapeBonus||0)*0.1:0;
  player.currentDistrict=id;
  player.cooldown=Math.max(8,15-Math.floor(escBonus));cooldownMax=player.cooldown;
  advanceTime(2);
  addLog('Traveled to '+DISTRICTS[id].name+'.','info');
  renderAll();selectDistrict(id);showToast('Arrived: '+DISTRICTS[id].name,'info');
}

function claimDistrict(id){
  if(!player)return;
  if(player.cooldown>0)return showToast('Wait '+player.cooldown+'s','warn');
  SFX.success();
  districtOwners[id]='player';player.turfOwned.push(id);
  player.cooldown=30;cooldownMax=30;player.respect+=5;advanceTime(1);
  addLog('Claimed '+DISTRICTS[id].name+'.','win');showToast(DISTRICTS[id].name+' claimed!','win');
  missionProgress('turf',1);checkMissions();renderAll();selectDistrict(id);
}

function attackDistrict(id){
  if(!player)return;
  if(player.cooldown>0)return showToast('Wait '+player.cooldown+'s','warn');
  if(player.health<20)return showToast('Too wounded to fight','warn');
  const gang=GANG_DEFS.find(g=>g.id===districtOwners[id]);
  openModal('Attack '+DISTRICTS[id].name+'?','Going to war with '+gang.name+' (Power: '+gangPowers[gang.id]+'). This will cost health.',()=>executeAttack(id));
}

function executeAttack(id){
  SFX.attack();
  const owner=districtOwners[id];
  const power=gangPowers[owner];
  const gun=getEquippedGun();
  let str=30+(player.level*8)+(player.inventory.includes('weapon')?20:0)+(player.activeCar?(player.activeCar.missionBonus||0):0)+(gun?gun.power:0)+(player.muscleBoost||0);
  player.muscleBoost=0;
  player.cooldown=60;cooldownMax=60;advanceTime(3);
  const winChance=Math.min(85,Math.max(15,Math.round(str/(str+power)*100)));
  if(rand(1,100)<=winChance){
    gangPowers[owner]=Math.max(0,power-rand(10,20));
    districtOwners[id]='player';player.turfOwned.push(id);
    player.takedowns++;player.respect+=10;player.xp+=30;
    const dmg=player.inventory.includes('vest')?rand(5,12):rand(10,25);
    player.health=Math.max(1,player.health-dmg);
    SFX.success();
    addLog('VICTORY — '+DISTRICTS[id].name+' seized. -'+dmg+' HP.','win');showToast('District captured!','win');
    missionProgress('turf',1);levelUp();checkMissions();
  } else {
    const dmg=player.inventory.includes('vest')?rand(15,25):rand(25,45);
    player.health=Math.max(0,player.health-dmg);
    player.wanted=Math.min(5,player.wanted+1);
    SFX.fail();
    addLog('DEFEAT — Driven back from '+DISTRICTS[id].name+'. -'+dmg+' HP.','loss');showToast('Attack failed','loss');
    if(player.health<=0)return playerDied();
  }
  renderAll();selectDistrict(id);
}

function collectTurfIncome(){
  if(!player||!player.turfOwned.length)return;
  const income=player.turfOwned.length*20*(getRepTier()+1);
  player.cash+=income;
  addLog('Turf income: +$'+income.toLocaleString()+'.','win');SFX.cash();
}

function collectPropertyIncome(){
  if(!player||!properties.length)return;
  const income=properties.reduce((s,pid)=>{const p=PROPERTY_DEFS.find(x=>x.id===pid);return s+(p?p.income:0);},0);
  if(income>0){player.cash+=income;addLog('Property income: +$'+income.toLocaleString()+'.','win');}
  // Drug lab produces supply
  if(properties.includes('drug-lab')&&!player.inventory.includes('drugs-supply')){
    player.inventory.push('drugs-supply');addLog('Drug lab produced a supply batch.','info');
  }
}

function gangAggression(){
  if(!player||!player.turfOwned.length)return;
  [...player.turfOwned].forEach(dId=>{
    const nbs=D_NEIGHBORS[dId]||[];
    const neighborGang=nbs.map(n=>districtOwners[n]).find(g=>g&&g!=='none'&&g!=='player');
    if(!neighborGang)return;
    if(gangPowers[neighborGang]<5)return;
    if(rand(1,100)>20)return;
    const idx=player.turfOwned.indexOf(dId);
    player.turfOwned.splice(idx,1);
    districtOwners[dId]=neighborGang;
    const gang=GANG_DEFS.find(g=>g.id===neighborGang);
    const dmg=rand(5,15);player.health=Math.max(0,player.health-dmg);
    addLog('⚠ '+gang.name+' retook '+DISTRICTS[dId].name+'! -'+dmg+' HP.','loss');
    showToast(gang.name+' counter-attacked!','loss');SFX.bust();
  });
}

function renderGangList(){
  const el=$('gang-list');if(!el)return;
  el.innerHTML=GANG_DEFS.filter(g=>g.id!=='none').map(g=>{
    const owned=Object.entries(districtOwners).filter(([,v])=>v===g.id).length;
    const pow=gangPowers[g.id]||0;
    const pc=pow>40?'var(--blood)':pow>20?'var(--gold)':'var(--green-light)';
    return `<div class="gang-row"><div class="gang-color" style="background:${g.color}"></div><div class="gang-name">${g.name}</div><div class="gang-turf">${owned} districts</div><div class="gang-power" style="color:${pc}">PWR ${pow}</div></div>`;
  }).join('')+(player?`<div class="gang-row"><div class="gang-color" style="background:var(--gold-light)"></div><div class="gang-name" style="color:var(--gold-light)">${player.name.toUpperCase()}</div><div class="gang-turf">${player.turfOwned.length} districts</div><div class="gang-power" style="color:var(--gold-light)">LV ${player.level}</div></div>`:'');
}

// ═══════════════════════════════════════════════════════════════
// VEHICLES
// ═══════════════════════════════════════════════════════════════
function addCarToGarage(car,stolen=false){
  const cap=GARAGE_UPGRADES[garageLevel].slots;
  if(garage.length>=cap){showToast('Garage full — upgrade or sell','warn');return false;}
  garage.push(car);
  missionProgress('cars',1);
  SFX.success();
  return true;
}

function garageTab(tab){
  activeGarageTab=tab;
  document.querySelectorAll('.garage-tab').forEach(t=>t.classList.remove('active'));
  event.target.classList.add('active');
  ['owned','steal','auction','upgrade'].forEach(n=>$('garage-'+n).style.display='none');
  renderGarageTab();
}

function renderGarageTab(){
  const cap=GARAGE_UPGRADES[garageLevel];
  $('garage-capacity-label').textContent=garage.length+'/'+cap.slots+' slots — '+cap.name;
  if(activeGarageTab==='owned')renderGarageOwned();
  else if(activeGarageTab==='steal')renderGarageSteal();
  else if(activeGarageTab==='auction')renderGarageAuction();
  else if(activeGarageTab==='upgrade-garage')renderGarageUpgrade();
}

function renderGarageOwned(){
  const el=$('garage-owned');el.style.display='block';
  if(!garage.length){el.innerHTML='<div class="empty-garage">YOUR GARAGE IS EMPTY<br><span style="font-size:9px">Steal cars or buy from auction</span></div>';return;}
  el.innerHTML='<div class="g2">'+garage.map((c,i)=>carCardHTML(c,i)).join('')+'</div>';
}

function carCardHTML(car,idx){
  const cls=CAR_CLASSES[car.cls]||{label:'UNKNOWN',color:'#5a5548'};
  const rarityColors={common:'#5a5548',uncommon:'#5090cc',rare:'#c9951a',legendary:'#e03020'};
  const isActive=player&&player.activeCar&&player.activeCar.id===car.id;
  const repairCost=Math.floor((100-car.condition)/100*car.baseValue*0.2);
  return `<div class="car-card${isActive?' selected-car':''}">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
      <div class="car-brand">${car.brand}</div>
      ${car.stolenPlates?'<span style="font-family:\'JetBrains Mono\',monospace;font-size:7px;color:var(--blood);border:1px solid var(--blood);padding:1px 4px;letter-spacing:1px">HOT PLATES</span>':''}
      ${isActive?'<span style="font-family:\'JetBrains Mono\',monospace;font-size:7px;color:var(--gold);border:1px solid var(--gold);padding:1px 4px;letter-spacing:1px">ACTIVE</span>':''}
    </div>
    <div class="car-model">${car.year} ${car.model}${car.nickname?' "'+car.nickname+'"':''}</div>
    <div class="car-class-badge" style="border-color:${cls.color};color:${cls.color}">${cls.label}</div>
    <div class="car-stats">
      <div class="car-stat"><span>SPEED</span><span>${car.speed}</span></div>
      <div class="car-stat"><span>STORAGE</span><span>${car.storage}</span></div>
      <div class="car-stat"><span>ESCAPE</span><span>+${car.escapeBonus}%</span></div>
      <div class="car-stat"><span>RARITY</span><span style="color:${rarityColors[car.rarity]||'#5a5548'};text-transform:uppercase">${car.rarity}</span></div>
    </div>
    <div class="section-label" style="margin-top:7px">HEAT</div>
    <div class="car-heat">${Array.from({length:5},(_,i)=>'<div class="heat-pip'+(i<car.heat?' on':'')+'"></div>').join('')}</div>
    <div class="section-label" style="margin-top:6px">CONDITION</div>
    <div class="car-condition-bar"><div class="car-condition-fill" style="width:${car.condition}%;background:${car.condition>60?'var(--green-light)':car.condition>30?'var(--gold)':'var(--blood)'}"></div></div>
    <div class="car-value">$${Math.floor(car.baseValue*(car.condition/100)).toLocaleString()}</div>
    <div class="car-actions">
      ${!isActive?`<button class="car-action-btn drive" onclick="setActiveCar(${idx})">DRIVE</button>`:'<button class="car-action-btn" style="border-color:var(--mist);color:var(--mist)" onclick="setActiveCar(-1)">PARK</button>'}
      <button class="car-action-btn repair" onclick="repairCar(${idx})" ${car.condition>=100?'disabled':''}>REPAIR ($${repairCost.toLocaleString()})</button>
      ${car.stolenPlates?`<button class="car-action-btn plates" onclick="changePlates(${idx})">CHANGE PLATES ($500)</button>`:''}
      <button class="car-action-btn sell" onclick="sellCar(${idx})">SELL $${Math.floor(car.baseValue*(car.condition/100)*(properties.includes('chop-shop')?1.5:1)).toLocaleString()}</button>
      <button class="car-action-btn scrap" onclick="scrapCar(${idx})">SCRAP</button>
    </div>
  </div>`;
}

function setActiveCar(idx){
  if(idx===-1){player.activeCar=null;addLog('Vehicle parked.','info');}
  else{player.activeCar={...garage[idx]};addLog('Now driving: '+garage[idx].brand+' '+garage[idx].model+'.','info');}
  SFX.click();renderGarageTab();renderAll();
}

function repairCar(idx){
  const car=garage[idx];
  const cost=Math.floor((100-car.condition)/100*car.baseValue*0.2);
  if(!player||player.cash<cost)return showToast('Not enough cash','warn');
  player.cash-=cost;car.condition=100;
  SFX.buy();addLog('Repaired '+car.brand+' '+car.model+' — $'+cost+'.','info');
  showToast('Repaired!','gold');renderGarageTab();renderAll();
}

function changePlates(idx){
  if(!player||player.cash<500)return showToast('Need $500','warn');
  player.cash-=500;garage[idx].stolenPlates=false;garage[idx].heat=Math.max(0,garage[idx].heat-2);
  SFX.buy();addLog('Plates changed on '+garage[idx].brand+'.','info');
  showToast('Plates changed — heat reduced','gold');renderGarageTab();renderAll();
}

function sellCar(idx){
  const car=garage[idx];
  const chopBonus=properties.includes('chop-shop')?1.5:1;
  const val=Math.floor(car.baseValue*(car.condition/100)*chopBonus);
  openModal('Sell '+car.brand+' '+car.model+'?','You will receive $'+val.toLocaleString()+'.'+( chopBonus>1?' (Chop shop bonus applied!)':''),()=>{
    player.cash+=val;
    if(player.activeCar&&player.activeCar.id===car.id)player.activeCar=null;
    garage.splice(idx,1);
    SFX.cash();addLog('Sold '+car.brand+' '+car.model+' for $'+val.toLocaleString()+'.','win');
    showToast('+$'+val.toLocaleString(),'win');renderGarageTab();renderAll();
  });
}

function scrapCar(idx){
  const car=garage[idx];const val=Math.floor(car.baseValue*0.05);
  openModal('Scrap '+car.brand+' '+car.model+'?','You will get $'+val+' in parts.', ()=>{
    player.cash+=val;
    if(player.activeCar&&player.activeCar.id===car.id)player.activeCar=null;
    garage.splice(idx,1);
    addLog('Scrapped '+car.brand+'.','info');renderGarageTab();renderAll();
  });
}

function renderGarageSteal(){
  const el=$('garage-steal');el.style.display='block';
  if(!player){el.innerHTML='<div class="empty-garage">Create a character first</div>';return;}
  const pool=CAR_DATABASE.filter(c=>{
    if(player.level>=5)return true;
    if(player.level>=3)return c.rarity!=='legendary';
    return c.rarity==='common'||c.rarity==='uncommon';
  });
  el.innerHTML='<div style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--mist);margin-bottom:12px;letter-spacing:1px">VEHICLES SPOTTED IN THE CITY — attempt a theft</div><div class="g2">'+pool.slice(0,8).map(c=>{
    const cls=CAR_CLASSES[c.cls]||{label:'?',color:'#5a5548'};
    const successChance=Math.max(20,55-(c.baseValue/10000));
    return `<div class="car-card">
      <div class="car-brand">${c.brand}</div>
      <div class="car-model">${c.year} ${c.model}</div>
      <div class="car-class-badge" style="border-color:${cls.color};color:${cls.color}">${cls.label}</div>
      <div class="car-stats">
        <div class="car-stat"><span>VALUE</span><span>$${c.baseValue.toLocaleString()}</span></div>
        <div class="car-stat"><span>CHANCE</span><span>${Math.floor(successChance)}%</span></div>
      </div>
      <div class="car-actions"><button class="car-action-btn drive" onclick="stealSpecificCar('${c.brand}','${c.model}',${c.baseValue},${successChance},'${c.cls}','${c.rarity}',${c.speed},${c.storage},${c.heat},${c.escapeBonus},${c.missionBonus},${c.year})">ATTEMPT THEFT</button></div>
    </div>`;
  }).join('')+'</div>';
}

function stealSpecificCar(brand,model,baseValue,chance,cls,rarity,speed,storage,heat,escapeBonus,missionBonus,year){
  if(!player)return;
  if(player.cooldown>0)return showToast('Wait '+player.cooldown+'s','warn');
  if(player.energy<15)return showToast('Too tired','warn');
  let c=chance;
  if(player.inventory.includes('gloves'))c+=10;
  player.cooldown=50;cooldownMax=50;player.energy=Math.max(0,player.energy-15);advanceTime(2);
  if(rand(1,100)<=c){
    const car={brand,model,year,cls,rarity,baseValue,speed,storage,heat,escapeBonus,missionBonus,id:'car_'+Date.now(),condition:rand(50,90),stolenPlates:true,painted:false,nickname:null,vinCloned:false};
    addCarToGarage(car,true);
    player.wanted=Math.min(5,player.wanted+2);
    addLog('Stole '+year+' '+brand+' '+model+'!','win');showToast('Car stolen!','win');SFX.success();
    missionProgress('cars',1);
  } else {
    const dmg=rand(5,20);player.health=Math.max(0,player.health-dmg);
    player.wanted=Math.min(5,player.wanted+2);
    addLog('Failed to steal '+brand+' '+model+'. -'+dmg+' HP.','loss');showToast('Theft failed','loss');SFX.fail();
    if(player.health<=0)return playerDied();
  }
  checkMissions();renderAll();renderGarageTab();
}

function renderGarageAuction(){
  const el=$('garage-auction');el.style.display='block';
  const items=CAR_DATABASE.filter(c=>c.rarity==='rare'||c.rarity==='legendary').map(c=>({
    ...c,auctionPrice:Math.floor(c.baseValue*(0.8+Math.random()*0.4)),id:'auc_'+c.brand+'_'+c.model
  }));
  el.innerHTML='<div style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--mist);margin-bottom:12px;letter-spacing:1px">LIVE AUCTION — rare and legendary vehicles</div>'+
  items.map(c=>{
    const cls=CAR_CLASSES[c.cls]||{label:'?',color:'#5a5548'};
    return `<div class="auction-item">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px"><div class="car-brand">${c.brand} ${c.model}</div><span class="auction-badge">${c.rarity.toUpperCase()}</span></div>
        <div class="car-model">${c.year} · <span class="car-class-badge" style="border-color:${cls.color};color:${cls.color}">${cls.label}</span></div>
        <div class="car-stats" style="margin-top:5px"><div class="car-stat"><span>SPEED</span><span>${c.speed}</span></div><div class="car-stat"><span>ESCAPE</span><span>+${c.escapeBonus}%</span></div></div>
      </div>
      <div style="text-align:right">
        <div class="car-value">$${c.auctionPrice.toLocaleString()}</div>
        <button class="car-action-btn sell" style="margin-top:6px" onclick="buyAuctionCar('${c.brand}','${c.model}',${c.auctionPrice},'${c.cls}','${c.rarity}',${c.speed},${c.storage},${c.heat},${c.escapeBonus},${c.missionBonus},${c.year},${c.baseValue})">BID &amp; BUY</button>
      </div>
    </div>`;
  }).join('');
}

function buyAuctionCar(brand,model,price,cls,rarity,speed,storage,heat,escapeBonus,missionBonus,year,baseValue){
  if(!player||player.cash<price)return showToast('Not enough cash','warn');
  openModal('Buy at auction?',brand+' '+model+' for $'+price.toLocaleString(),()=>{
    player.cash-=price;
    const car={brand,model,year,cls,rarity,baseValue,speed,storage,heat,escapeBonus,missionBonus,id:'car_'+Date.now(),condition:100,stolenPlates:false,painted:false,nickname:null,vinCloned:false};
    if(!addCarToGarage(car,false))player.cash+=price;
    else{SFX.buy();addLog('Bought '+brand+' '+model+' at auction for $'+price.toLocaleString()+'.','win');showToast(brand+' acquired!','win');missionProgress('cars',1);}
    checkMissions();renderAll();renderGarageTab();
  });
}

function renderGarageUpgrade(){
  const el=$('garage-upgrade');el.style.display='block';
  el.innerHTML=GARAGE_UPGRADES.map((g,i)=>`<div class="property-card" style="${i===garageLevel?'border-color:var(--gold)':''}">
    <div class="property-icon" style="font-size:20px">🏗</div>
    <div class="property-info">
      <div class="property-name">${g.name} ${i===garageLevel?'<span style="color:var(--gold);font-size:10px">✓ CURRENT</span>':''}</div>
      <div class="property-desc">${g.label} · ${g.slots} vehicle slots</div>
      <div class="property-cost">${g.cost===0?'FREE':('$'+g.cost.toLocaleString())}</div>
      ${i>garageLevel?`<button class="property-btn buy" style="margin-top:7px" onclick="upgradeGarage(${i})">UPGRADE</button>`:''}
    </div>
  </div>`).join('');
}

function upgradeGarage(idx){
  const g=GARAGE_UPGRADES[idx];
  if(!player||player.cash<g.cost)return showToast('Need $'+g.cost.toLocaleString(),'warn');
  openModal('Upgrade to '+g.name+'?','Cost: $'+g.cost.toLocaleString()+'. Gives you '+g.slots+' vehicle slots.',()=>{
    player.cash-=g.cost;garageLevel=idx;
    SFX.buy();addLog('Upgraded to '+g.name+'.','win');showToast(g.name+' unlocked!','win');
    renderAll();renderGarageTab();
  });
}

// ═══════════════════════════════════════════════════════════════
// REAL ESTATE
// ═══════════════════════════════════════════════════════════════
function renderProperties(){
  const el=$('property-list');if(!el)return;
  $('prop-count-label').textContent=properties.length+' properties owned';
  el.innerHTML=PROPERTY_DEFS.map(p=>{
    const owned=properties.includes(p.id);
    const repReq=p.id==='casino-front'||p.id==='port-dock'?2:p.id==='mansion'||p.id==='bunker'?1:0;
    const canAfford=player&&player.cash>=p.cost;
    const hasRep=player&&getRepTier()>=repReq;
    const locked=!hasRep;
    return `<div class="property-card" style="${owned?'border-color:var(--green);':''}${locked&&!owned?'opacity:.5':''}">
      <div class="property-icon">${p.icon}</div>
      <div class="property-info">
        <div class="property-name">${p.name} <span class="income-badge">+$${p.income.toLocaleString()}/day</span></div>
        <div class="property-location">📍 ${p.location}</div>
        <div class="property-desc">${p.desc}</div>
        <div class="property-stats">
          <div>Storage: <span>${p.storage}</span></div>
          <div>Crew: <span>${p.crewSlots}</span></div>
          <div>Bonus: <span>${p.bonus}</span></div>
        </div>
        ${locked&&!owned?`<div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--blood);margin-bottom:5px">Requires ${REP_TIERS[repReq]} rank</div>`:''}
        <div class="property-cost">${owned?'OWNED':'$'+p.cost.toLocaleString()}</div>
        <button class="property-btn ${owned?'owned':'buy'}" style="margin-top:6px" onclick="${owned?'':'buyProperty(\''+p.id+'\')' }" ${owned||locked?'disabled':''}>
          ${owned?'✓ OWNED':'BUY'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function buyProperty(id){
  const p=PROPERTY_DEFS.find(x=>x.id===id);
  if(!player||!p)return;
  if(player.cash<p.cost)return showToast('Need $'+p.cost.toLocaleString(),'warn');
  openModal('Buy '+p.name+'?',p.desc+'\n\nCost: $'+p.cost.toLocaleString()+'\nIncome: $'+p.income.toLocaleString()+'/day',()=>{
    player.cash-=p.cost;properties.push(p.id);
    SFX.buy();addLog('Purchased '+p.name+' in '+p.location+'.','win');showToast(p.name+' acquired!','win');
    missionProgress('properties',1);checkMissions();renderAll();renderProperties();saveGame();
  });
}

// ═══════════════════════════════════════════════════════════════
// SHOP
// ═══════════════════════════════════════════════════════════════
function buyItem(item){
  if(!player)return showToast('Create a character first','warn');
  const d=ITEM_DATA[item];if(!d)return;
  if(player.cash<d.cost)return showToast('Not enough cash — need $'+d.cost,'warn');
  player.cash-=d.cost;SFX.buy();
  // Instant-use items
  if(item==='energy'){player.energy=Math.min(100,player.energy+40);showToast('+40 Energy','gold');}
  else if(item==='medkit'){player.health=Math.min(100,player.health+50);showToast('+50 HP','win');}
  else if(item==='lawyer'){player.wanted=0;showToast('All charges dropped','gold');}
  else{
    if(player.inventory.includes(item)){player.cash+=d.cost;return showToast('Already have '+d.label,'warn');}
    player.inventory.push(item);showToast(d.label+' acquired','gold');
  }
  addLog('Bought '+d.label+' for $'+d.cost+'.','info');renderAll();saveGame();
}

function buyGun(id){
  if(!player)return showToast('Create a character first','warn');
  const gun=GUN_DATA.find(g=>g.id===id);if(!gun)return;
  if(player.inventory.includes(id))return equipGun(id);
  const price=Math.max(0,gun.cost-(player.gunDiscount||0));
  if(player.cash<price)return showToast('Not enough cash','warn');
  player.cash-=price;
  player.gunDiscount=0;
  player.inventory.push(id);
  player.equippedGun=id;
  player.respect+=Math.max(1,Math.floor(gun.power/20));
  SFX.buy();
  addLog('Bought '+gun.name+' for $'+price.toLocaleString()+'.','info');
  showToast(gun.name+' equipped','gold');
  renderAll();saveGame();
}

function equipGun(id){
  if(!player)return;
  const gun=GUN_DATA.find(g=>g.id===id);
  if(!gun||!player.inventory.includes(id))return;
  player.equippedGun=id;
  addLog('Equipped '+gun.name+'.','info');
  showToast('Equipped '+gun.name,'info');
  renderAll();saveGame();
}

function buyLuxury(id){
  if(!player)return showToast('Create a character first','warn');
  const item=LUXURY_DATA.find(x=>x.id===id);if(!item)return;
  if(player.inventory.includes(id))return showToast('Already own '+item.name,'warn');
  if(player.cash<item.cost)return showToast('Not enough cash','warn');
  player.cash-=item.cost;
  player.inventory.push(id);
  player.respect+=item.respect;
  SFX.buy();
  addLog('Bought '+item.name+' for $'+item.cost.toLocaleString()+'.','info');
  showToast(item.name+' added','gold');
  renderAll();saveGame();
}

function sellLuxury(id){
  if(!player)return;
  const item=LUXURY_DATA.find(x=>x.id===id);if(!item)return;
  const idx=player.inventory.indexOf(id);
  if(idx<0)return;
  const resale=Math.floor(item.value*(1+(player.luxuryResaleBoost||0)));
  player.inventory.splice(idx,1);
  player.cash+=resale;
  player.respect=Math.max(0,player.respect-Math.ceil(item.respect/2));
  addLog('Sold '+item.name+' for $'+resale.toLocaleString()+'.','warn');
  showToast('Sold for $'+resale.toLocaleString(),'gold');
  renderAll();saveGame();
}

// ═══════════════════════════════════════════════════════════════
// CASINO
// ═══════════════════════════════════════════════════════════════
function casino(choice){
  if(!player)return showToast('Create a character first','warn');
  if(player.cooldown>0)return showToast('Wait '+player.cooldown+'s','warn');
  const bet=parseInt($('betAmount').value);
  if(!bet||bet<10)return showToast('Min bet is $10','warn');
  if(player.cash<bet)return showToast('Not enough cash','warn');
  player.cash-=bet;player.cooldown=8;cooldownMax=8;
  const r=rand(1,100);
  let win=false,payout=0;
  const ODDS={
    red:{chance:48,mult:2,label:'Red'},
    black:{chance:48,mult:2,label:'Black'},
    jackpot:{chance:5,mult:10,label:'Jackpot'},
    high:{chance:35,mult:3,label:'High Card'},
    sports:{chance:45,mult:2.2,label:'Sports Book'},
    slots:{chance:20,mult:5,label:'Slots'},
    blackjack:{chance:42,mult:2.4,label:'Blackjack'},
    poker:{chance:30,mult:4,label:'Poker Room'},
    roulette:{chance:12,mult:8,label:'Roulette Number'},
    dice:{chance:50,mult:1.9,label:'Dice'},
    baccarat:{chance:46,mult:2.1,label:'Baccarat'},
    horses:{chance:25,mult:5.5,label:'Horse Track'}
  };
  const o=ODDS[choice]||ODDS.red;
  let ch=o.chance;
  if(properties.includes('casino-front'))ch=Math.min(ch+5,60);
  if(r<=ch){win=true;payout=Math.floor(bet*o.mult*(properties.includes('casino-front')?2:1));}
  if(win){
    player.cash+=payout;player.respect++;
    player.casinoWon=(player.casinoWon||0)+payout;
    player.casinoStreak=(player.casinoStreak||0)+1;
    player.casinoBigWin=Math.max(player.casinoBigWin||0,payout);
    SFX.win();
    addLog('Casino — '+choice.toUpperCase()+' wins. +$'+payout.toLocaleString(),'win');
    showToast('+$'+payout.toLocaleString()+' 🎰','win');
    missionProgress('casinowin',payout);
  } else {
    player.casinoLost=(player.casinoLost||0)+bet;
    player.casinoStreak=0;
    SFX.fail();
    addLog('Casino — '+choice.toUpperCase()+' lost. -$'+bet,'loss');showToast('Lost $'+bet,'loss');
  }
  advanceTime(1);checkMissions();renderAll();saveGame();
}

// ═══════════════════════════════════════════════════════════════
// MISSIONS
// ═══════════════════════════════════════════════════════════════
function missionProgress(type,amount){
  if(!missions)return;
  missions.forEach(m=>{
    if(m.done||!m.active)return;
    if(m.type===type){
      if(type==='casinowin')m.progress=Math.max(m.progress,amount);
      else m.progress=Math.min(m.goal,m.progress+amount);
    }
  });
  checkMissions();
}

function checkMissions(){
  if(!player||!missions)return;
  missions.forEach(m=>{
    if(!m.locked)return;
    if(!m.req)return void(m.locked=false);
    const[k,v]=m.req.split(':');
    if(k==='level'&&player.level>=+v)m.locked=false;
    else if(k==='turf'&&player.turfOwned.length>=+v)m.locked=false;
    else if(k==='rep'&&getRepTier()>=+v)m.locked=false;
  });
  missions.forEach(m=>{
    if(!m.locked&&!m.done){
      if(m.type==='level')m.progress=player.level;
      if(m.type==='turf')m.progress=player.turfOwned.length;
      if(m.type==='rep')m.progress=getRepTier();
      if(m.type==='cars')m.progress=garage.length;
      if(m.type==='properties')m.progress=properties.length;
    }
    if(!m.locked&&!m.done&&m.progress>=m.goal){
      m.done=true;m.active=false;
      player.cash+=m.reward.cash;player.xp+=m.reward.xp;player.respect+=m.reward.respect;
      SFX.mission();
      addLog('✦ MISSION COMPLETE: '+m.title+' — +$'+m.reward.cash.toLocaleString()+', +'+m.reward.respect+' respect.','win');
      showToast('Mission: '+m.title,'win');levelUp();
    }
  });
  renderMissions();
}

function startMission(id){
  SFX.click();const m=missions.find(x=>x.id===id);
  if(!m||m.done||m.locked)return;
  missions.forEach(x=>x.active=false);m.active=true;
  addLog('Mission started: '+m.title,'info');showToast('Mission: '+m.title,'info');
  renderMissions();
}

function renderMissions(){
  const el=$('mission-list');if(!el||!missions.length)return;
  el.innerHTML=missions.map(m=>{
    if(m.locked)return`<div class="mission-card" style="opacity:.3;border-left-color:var(--mist)"><div class="mission-title" style="color:var(--mist)">${m.title}</div><div class="mission-desc" style="font-size:9px">${m.reqLabel||'Locked'}</div></div>`;
    const pct=m.goal>0?Math.min(100,Math.round(m.progress/m.goal*100)):0;
    return`<div class="mission-card ${m.done?'done':m.active?'active-m':''}">
      <div class="mission-title">${m.title}</div>
      <div class="mission-desc">${m.desc}</div>
      <div class="mission-reward">$${m.reward.cash.toLocaleString()} · +${m.reward.xp} XP · +${m.reward.respect} Respect</div>
      ${!m.done?'<div class="mission-progress"><div class="mission-progress-fill" style="width:'+pct+'%"></div></div><div style="font-family:\'JetBrains Mono\',monospace;font-size:8px;color:var(--mist);margin-top:2px">'+m.progress+' / '+m.goal+'</div>':''}
      <button class="mission-btn" style="margin-top:7px" onclick="startMission('${m.id}')" ${m.done||m.active?'disabled':''}>${m.done?'COMPLETE':m.active?'ACTIVE':'START'}</button>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// SHADOWNET — shared social feed
// ═══════════════════════════════════════════════════════════════
async function loadShadowFeed(){
  $('feed-loading').style.display='block';
  $('feed-list').innerHTML='';
  if(player)$('post-compose-area').style.display='block';
  try{
    const result=await storage.list('feed_post_',true);
    const posts=[];
    for(const key of (result.keys||[])){
      try{
        const raw=await storage.get(key,true);
        if(raw&&raw.value)posts.push(JSON.parse(raw.value));
      }catch(e){}
    }
    posts.sort((a,b)=>b.ts-a.ts);
    shadownetPosts=posts.slice(0,30);
    renderFeed();
  }catch(e){$('feed-loading').textContent='Could not load feed.';}
  $('feed-loading').style.display='none';
}

function renderFeed(){
  const el=$('feed-list');
  if(!shadownetPosts.length){el.innerHTML='<div style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--mist);text-align:center;padding:24px;letter-spacing:1px">No posts yet. Be the first to post.</div>';return;}
  const colors=['#b52a1d','#4a8a50','#2a5a9a','#c9951a','#6a3a9a','#3a7a7a'];
  el.innerHTML=shadownetPosts.map(p=>{
    const color=colors[p.name.charCodeAt(0)%colors.length];
    const isOwn=p.pid===playerId;
    const ago=Math.floor((Date.now()-p.ts)/60000);
    const agoStr=ago<1?'just now':ago<60?ago+'m ago':Math.floor(ago/60)+'h ago';
    return`<div class="feed-post${isOwn?' own-post':''}">
      <div class="post-header">
        <div class="post-avatar" style="background:${color}22;border:1px solid ${color};color:${color}">${p.name[0].toUpperCase()}</div>
        <div><div class="post-name">${p.name}</div><div class="post-rep">${p.rep||'STREET RAT'} · LV ${p.level||1}</div></div>
        <div class="post-time">${agoStr}</div>
      </div>
      <div class="post-body">${p.body}</div>
      <div class="post-tags">
        ${p.cash?'<span class="post-tag">$'+Number(p.cash).toLocaleString()+'</span>':''}
        ${p.turf?'<span class="post-tag">'+p.turf+' districts</span>':''}
        ${p.car?'<span class="post-tag">'+p.car+'</span>':''}
      </div>
    </div>`;
  }).join('');
}

async function submitPost(){
  const body=$('post-input').value.trim();
  if(!body)return showToast('Write something first','warn');
  if(!player)return showToast('Create a character first','warn');
  if(body.length>200)return showToast('Max 200 characters','warn');
  const post={
    pid:playerId,name:player.name,rep:REP_TIERS[getRepTier()],level:player.level,
    cash:player.cash,turf:player.turfOwned.length,
    car:player.activeCar?player.activeCar.brand+' '+player.activeCar.model:null,
    body,ts:Date.now()
  };
  const key='feed_post_'+playerId+'_'+Date.now();
  await storage.set(key,JSON.stringify(post),true);
  $('post-input').value='';
  SFX.click();showToast('Posted to ShadowNet','info');
  await loadShadowFeed();
}

// ═══════════════════════════════════════════════════════════════
// PLAYER PROFILES
// ═══════════════════════════════════════════════════════════════
async function loadAllPlayers(){
  $('player-list-loading').style.display='block';
  $('player-list').innerHTML='';
  try{
    const result=await storage.list('profile_',true);
    allPlayers=[];
    for(const key of (result.keys||[])){
      try{
        const raw=await storage.get(key,true);
        if(raw&&raw.value)allPlayers.push(JSON.parse(raw.value));
      }catch(e){}
    }
    allPlayers.sort((a,b)=>b.cash-a.cash);
    $('player-count-label').textContent=allPlayers.length+' players';
    renderPlayers();
  }catch(e){$('player-list-loading').textContent='Could not load player data.';}
  $('player-list-loading').style.display='none';
}

function renderPlayers(){
  const el=$('player-list');
  if(!allPlayers.length){el.innerHTML='<div style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--mist);text-align:center;padding:24px;letter-spacing:1px">No other players found yet.</div>';return;}
  const colors=['#b52a1d','#4a8a50','#2a5a9a','#c9951a','#6a3a9a','#3a7a7a'];
  const now=Date.now();
  el.innerHTML=allPlayers.map((p,rank)=>{
    const color=colors[p.name.charCodeAt(0)%colors.length];
    const isOnline=(now-p.lastSeen)<300000;
    const isMe=p.id===playerId;
    return`<div class="player-profile-card" style="${isMe?'border-color:var(--gold)':''}">
      <div class="profile-header">
        <div class="profile-avatar" style="background:${color}22;border:2px solid ${color};color:${color}">${p.name[0].toUpperCase()}</div>
        <div>
          <div class="profile-name">#${rank+1} ${p.name} ${isMe?'<span style="color:var(--gold);font-size:9px">(YOU)</span>':''} <span class="online-badge${isOnline?' online':''}"></span></div>
          <div class="profile-title">${p.rep||'STREET RAT'} · Level ${p.level}</div>
        </div>
      </div>
      <div class="profile-stats">
        <div class="profile-stat"><div class="profile-stat-val">$${Number(p.cash||0).toLocaleString()}</div><div class="profile-stat-key">CASH</div></div>
        <div class="profile-stat"><div class="profile-stat-val">${p.respect||0}</div><div class="profile-stat-key">RESPECT</div></div>
        <div class="profile-stat"><div class="profile-stat-val">${p.turf||0}</div><div class="profile-stat-key">DISTRICTS</div></div>
        <div class="profile-stat"><div class="profile-stat-val">${p.cars||0}</div><div class="profile-stat-key">CARS</div></div>
        <div class="profile-stat"><div class="profile-stat-val">${p.properties||0}</div><div class="profile-stat-key">PROPS</div></div>
        <div class="profile-stat"><div class="profile-stat-val">${p.takedowns||0}</div><div class="profile-stat-key">TAKEDOWNS</div></div>
      </div>
      ${p.activeCar&&p.activeCar!=='none'?`<div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--mist);margin-top:6px;letter-spacing:1px">🚗 DRIVING: <span style="color:var(--bone)">${p.activeCar}</span></div>`:''}
      ${!isMe?`<div class="profile-actions">
        <button class="profile-btn send-money" onclick="sendMoney('${p.id}','${p.name}')">SEND MONEY</button>
        <button class="profile-btn challenge" onclick="challenge('${p.name}')">CHALLENGE</button>
      </div>`:''}
    </div>`;
  }).join('');
}

async function loadLeaderboards(){
  await loadAllPlayers();
  renderLeaderboards();
}

function leaderboardTab(tab){
  activeLeaderboard=tab;
  document.querySelectorAll('.leaderboard-tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.leaderboard-tab').forEach(b=>{if(b.textContent.toLowerCase().includes(tab==='networth'?'net':tab))b.classList.add('active');});
  renderLeaderboards();
}

function renderLeaderboards(){
  const el=$('leaderboard-list');
  if(!el)return;
  const rows=[...allPlayers];
  if(player){
    const me={
      id:playerId,name:player.name,level:player.level,rep:REP_TIERS[getRepTier()],
      cash:player.cash,respect:player.respect,turf:player.turfOwned.length,
      cars:garage.length,properties:properties.length,takedowns:player.takedowns,
      luxuryValue:luxuryValue(),netWorth:netWorth(),lastSeen:Date.now()
    };
    const idx=rows.findIndex(p=>p.id===playerId);
    if(idx>=0)rows[idx]=me;else rows.push(me);
  }
  const key=activeLeaderboard;
  rows.sort((a,b)=>{
    const scoreA=key==='networth'?(a.netWorth||netWorth(a)):key==='turf'?(a.turf||0):key==='cars'?(a.cars||0):key==='level'?(a.level||0):(a.respect||0);
    const scoreB=key==='networth'?(b.netWorth||netWorth(b)):key==='turf'?(b.turf||0):key==='cars'?(b.cars||0):key==='level'?(b.level||0):(b.respect||0);
    return scoreB-scoreA;
  });
  $('leaderboard-count-label').textContent=rows.length+' ranked';
  el.innerHTML=rows.slice(0,25).map((p,i)=>{
    const score=key==='networth'?'$'+Number(p.netWorth||netWorth(p)).toLocaleString():key==='turf'?(p.turf||0)+' districts':key==='cars'?(p.cars||0)+' cars':key==='level'?'Level '+(p.level||1):(p.respect||0)+' respect';
    return`<div class="leader-row ${p.id===playerId?'me':''}">
      <div class="leader-rank">#${i+1}</div>
      <div class="leader-main"><div class="leader-name">${p.name||'Unknown'}</div><div class="leader-sub">${p.rep||'STREET RAT'} · $${Number(p.cash||0).toLocaleString()} cash</div></div>
      <div class="leader-score">${score}</div>
    </div>`;
  }).join('')||'<div class="empty-garage">No leaderboard data yet.</div>';
}

async function loadTrades(){
  const result=await storage.list('trade_',true);
  tradeOffers=[];
  for(const key of (result.keys||[])){
    try{
      const raw=await storage.get(key,true);
      if(raw&&raw.value)tradeOffers.push(JSON.parse(raw.value));
    }catch(e){}
  }
  tradeOffers=tradeOffers.filter(t=>!t.closed).sort((a,b)=>b.ts-a.ts).slice(0,30);
  renderTradeUI();
}

function renderTradeUI(){
  const board=$('trade-board'), create=$('trade-create'), history=$('trade-history');
  if(!board||!create||!history)return;
  if(!player){
    board.innerHTML='<div class="empty-garage">Create a character to trade.</div>';
    create.innerHTML='';
    history.innerHTML='';
    return;
  }
  const sellables=player.inventory.filter(id=>GUN_DATA.some(g=>g.id===id)||LUXURY_DATA.some(l=>l.id===id)||ITEM_DATA[id]);
  create.innerHTML=`<div class="trade-form">
    <select class="trade-select" id="trade-offer-item">${sellables.map(id=>`<option value="${id}">${itemLabel(id)}</option>`).join('')}</select>
    <input class="modal-input" id="trade-ask-cash" type="number" min="1" value="500" placeholder="Ask cash">
    <button class="btn-primary" onclick="postTrade()">POST TRADE</button>
  </div>`;
  board.innerHTML=tradeOffers.length?tradeOffers.map(t=>`<div class="trade-card">
    <div class="item-head"><div><div class="item-title">${t.itemName}</div><div class="item-sub">Seller: ${t.sellerName}</div></div><div class="item-price">$${Number(t.askCash||0).toLocaleString()}</div></div>
    <div class="item-desc">${t.note||'Open trade offer.'}</div>
    ${t.sellerId!==playerId?`<button class="property-btn buy" onclick="acceptTrade('${t.id}')">BUY</button>`:'<span class="inv-tag">YOUR LISTING</span>'}
  </div>`).join(''):'<div class="empty-garage">No open trades yet.</div>';
  history.innerHTML=(player.tradeHistory||[]).slice(-8).reverse().map(h=>`<div class="inv-tag">${h}</div>`).join('')||'<div class="empty-garage">No trades yet.</div>';
}

async function postTrade(){
  if(!player)return;
  const itemId=$('trade-offer-item')?.value;
  const askCash=parseInt($('trade-ask-cash')?.value,10);
  if(!itemId||!player.inventory.includes(itemId))return showToast('Choose an item to trade','warn');
  if(!askCash||askCash<1)return showToast('Set an asking price','warn');
  const trade={id:'trade_'+playerId+'_'+Date.now(),sellerId:playerId,sellerName:player.name,itemId,itemName:itemLabel(itemId),askCash,note:'Cash sale',ts:Date.now(),closed:false};
  await storage.set(trade.id,JSON.stringify(trade),true);
  player.tradeHistory.push('Listed '+trade.itemName+' for $'+askCash.toLocaleString());
  showToast('Trade posted','info');
  await loadTrades();saveGame();
}

async function acceptTrade(id){
  if(!player)return;
  const trade=tradeOffers.find(t=>t.id===id);
  if(!trade)return showToast('Trade unavailable','warn');
  if(player.cash<trade.askCash)return showToast('Not enough cash','warn');
  player.cash-=trade.askCash;
  player.inventory.push(trade.itemId);
  player.tradeHistory.push('Bought '+trade.itemName+' for $'+Number(trade.askCash).toLocaleString());
  trade.closed=true;trade.buyerId=playerId;trade.buyerName=player.name;
  await storage.set(trade.id,JSON.stringify(trade),true);
  await storage.set('feed_post_trade_'+Date.now(),JSON.stringify({pid:playerId,name:player.name,rep:REP_TIERS[getRepTier()],level:player.level,cash:player.cash,body:'Closed a trade for '+trade.itemName+' on the board.',ts:Date.now()}),true);
  addLog('Trade closed: '+trade.itemName+'.','info');
  showToast('Trade complete','gold');
  await loadTrades();renderAll();saveGame();
}

function renderNPCs(){
  const list=$('npc-list'), intel=$('npc-intel');
  if(!list||!intel)return;
  if(!player){
    list.innerHTML='<div class="empty-garage">Create a character to meet contacts.</div>';
    intel.innerHTML='';
    return;
  }
  list.innerHTML=NPC_DEFS.map(n=>{
    const trust=player.npcRep[n.id]||0;
    return`<div class="npc-card">
      <div class="item-head"><div><div class="item-title">${n.name}</div><div class="item-sub">${n.role} · Trust ${trust}</div></div><div class="item-price">$${n.cost}</div></div>
      <div class="item-desc">${n.perk}</div>
      <button class="property-btn buy" onclick="hireNPC('${n.id}')">CALL IN FAVOR</button>
    </div>`;
  }).join('');
  const line=NPC_INTEL[(player.day+player.level+player.respect)%NPC_INTEL.length];
  intel.innerHTML=`<div class="feed-post"><div class="post-body">${line}</div><div class="post-tags"><span class="post-tag">contacts update daily</span><span class="post-tag">trust unlocks better perks</span></div></div>`;
}

function hireNPC(id){
  if(!player)return;
  const npc=NPC_DEFS.find(n=>n.id===id);if(!npc)return;
  if(player.cash<npc.cost)return showToast('Need $'+npc.cost,'warn');
  player.cash-=npc.cost;
  player.npcRep[npc.id]=(player.npcRep[npc.id]||0)+npc.trust;
  if(npc.action==='fixer')player.cooldown=Math.max(0,(player.cooldown||0)-10);
  if(npc.action==='gun_discount')player.gunDiscount=500;
  if(npc.action==='hack_boost')player.hackBoost=15;
  if(npc.action==='muscle'){player.health=Math.min(100,player.health+20);player.muscleBoost=20;}
  if(npc.action==='fence')player.luxuryResaleBoost=.15;
  if(npc.action==='doctor')player.health=100;
  addLog(npc.name+' helped you. '+npc.perk,'info');
  showToast(npc.role+' helped','info');
  renderAll();saveGame();
}

async function sendMoney(targetId,targetName){
  if(!player)return showToast('Create a character first','warn');
  openModal('Send Money to '+targetName,'How much do you want to send? (you have $'+player.cash.toLocaleString()+')',async()=>{
    const amt=parseInt($('modal-input').value);
    if(!amt||amt<=0||amt>player.cash)return showToast('Invalid amount','warn');
    player.cash-=amt;
    // Write a transfer record
    const key='transfer_'+playerId+'_to_'+targetId+'_'+Date.now();
    await storage.set(key,JSON.stringify({from:playerId,fromName:player.name,to:targetId,amount:amt,ts:Date.now()}),true);
    // Post to feed
    const post={pid:playerId,name:player.name,rep:REP_TIERS[getRepTier()],level:player.level,cash:player.cash,body:'Just wired $'+amt.toLocaleString()+' to '+targetName+'. Stay loyal.',ts:Date.now()};
    await storage.set('feed_post_'+playerId+'_send_'+Date.now(),JSON.stringify(post),true);
    SFX.cash();addLog('Sent $'+amt.toLocaleString()+' to '+targetName+'.','warn');
    showToast('$'+amt.toLocaleString()+' sent','gold');renderAll();
    await publishPlayerProfile();
  },true,'Enter amount');
}

function challenge(name){
  if(!player)return;
  openModal('Challenge '+name+'?','Send a public challenge on ShadowNet. They will see your stats.',async()=>{
    const post={pid:playerId,name:player.name,rep:REP_TIERS[getRepTier()],level:player.level,cash:player.cash,turf:player.turfOwned.length,body:'🔥 '+name+' — I am coming for your territory. Watch your back. — '+player.name,ts:Date.now()};
    await storage.set('feed_post_challenge_'+Date.now(),JSON.stringify(post),true);
    SFX.attack();showToast('Challenge posted to ShadowNet','info');
  });
}

// ═══════════════════════════════════════════════════════════════
// TIME
// ═══════════════════════════════════════════════════════════════
function advanceTime(hours){
  if(!player)return;
  player.hour+=hours;
  while(player.hour>=24){
    player.hour-=24;player.day++;
    if(player.wanted>0&&rand(1,100)<=25){player.wanted--;addLog('Heat cooled overnight.','info');}
    collectTurfIncome();
    collectPropertyIncome();
    gangAggression();
    // Damage car condition over time
    garage.forEach(c=>{if(c.condition>0)c.condition=Math.max(0,c.condition-rand(0,3));});
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

function addLog(text,type){
  const div=document.createElement('div');
  div.className='log-entry'+(type?' log-'+type:'');
  const h=player?String(player.hour).padStart(2,'0'):'00';
  const d=player?player.day:1;
  div.innerHTML='<span class="log-time">D'+d+'·'+h+':00</span><span class="log-text">'+text+'</span>';
  $('log').prepend(div);
  if(++logCount>80){const entries=$('log').querySelectorAll('.log-entry');entries[entries.length-1]?.remove();}
}

let toastTimeout;
function showToast(msg,type){
  const t=$('toast');t.textContent=msg;
  t.className='show'+(type==='win'?' t-win':type==='gold'?' t-gold':type==='info'?' t-info':type==='purple'?' t-purple':'');
  clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>{t.className='';},2400);
}

// ═══════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════
let modalCb=null;
function openModal(title,body,cb,showInput=false,placeholder=''){
  $('modal-title').textContent=title;$('modal-body').textContent=body;
  $('modal-input-wrap').style.display=showInput?'block':'none';
  if(showInput){$('modal-input').value='';$('modal-input').placeholder=placeholder;}
  modalCb=cb;$('modal-overlay').classList.add('open');
}
function closeModal(){$('modal-overlay').classList.remove('open');modalCb=null;}
$('modal-confirm').onclick=()=>{closeModal();if(modalCb)modalCb();};

Object.assign(window,{
  switchTab,createPlayer,saveGame,loadGame,crime,rest,buyItem,casino,
  selectDistrict,travelTo,attackDistrict,claimDistrict,garageTab,
  sellCar,scrapCar,repairCar,changePlates,setActiveCar,stealSpecificCar,
  buyAuctionCar,upgradeGarage,buyProperty,startMission,buyGun,equipGun,
  buyLuxury,sellLuxury,leaderboardTab,postTrade,acceptTrade,hireNPC,
  submitPost,sendMoney,challenge,closeModal
});
