// ═══════════════════════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════════════════════
let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type, dur, vol, delay=0, freqEnd=null) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + delay + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur);
  } catch(e) {}
}

const SFX = {
  success() {
    playTone(330, 'sine', .08, .18);
    playTone(440, 'sine', .08, .18, .09);
    playTone(550, 'sine', .15, .18, .18);
  },
  fail() {
    playTone(200, 'sawtooth', .2, .15, 0, 80);
  },
  cash() {
    playTone(600, 'sine', .06, .12);
    playTone(800, 'sine', .06, .12, .07);
  },
  bust() {
    playTone(180, 'square', .08, .15);
    playTone(160, 'square', .08, .15, .09);
    playTone(140, 'square', .12, .12, .18);
  },
  levelUp() {
    [330,392,494,659].forEach((f,i) => playTone(f,'sine',.12,.2,i*.1));
  },
  travel() {
    playTone(440, 'sine', .06, .1, 0, 550);
  },
  attack() {
    playTone(120, 'sawtooth', .04, .2);
    playTone(80, 'square', .08, .18, .05, 40);
  },
  win() {
    [440,550,660,880].forEach((f,i) => playTone(f,'sine',.15,.15,i*.08));
  },
  click() {
    playTone(800, 'sine', .04, .06);
  },
  mission() {
    [494,587,740].forEach((f,i) => playTone(f,'sine',.1,.18,i*.09));
  }
};

// ═══════════════════════════════════════════════════════
// DATA DEFINITIONS
// ═══════════════════════════════════════════════════════
const DISTRICTS = [
  { id:0, name:'Downtown',   x:300, y:190, svgX:204, svgY:134, w:192, h:112 },
  { id:1, name:'Northside',  x:300, y:65,  svgX:204, svgY:4,   w:192, h:122 },
  { id:2, name:'The Docks',  x:100, y:190, svgX:4,   svgY:134, w:192, h:112 },
  { id:3, name:'Eastgate',   x:500, y:190, svgX:404, svgY:134, w:192, h:112 },
  { id:4, name:'Southport',  x:300, y:315, svgX:204, svgY:254, w:192, h:122 },
  { id:5, name:'Westside',   x:100, y:65,  svgX:4,   svgY:4,   w:192, h:122 },
  { id:6, name:'Industrial', x:100, y:315, svgX:4,   svgY:254, w:192, h:122 },
  { id:7, name:'Richlands',  x:500, y:65,  svgX:404, svgY:4,   w:192, h:122 },
  { id:8, name:'Bayfront',   x:500, y:315, svgX:404, svgY:254, w:192, h:122 },
];

const GANGS = [
  { id:'serpents', name:'Serpents',   color:'#4a8a50', power:30, turf:[1,5],   desc:'Old guard. Control the north.' },
  { id:'reds',     name:'Red Kings',  color:'#b52a1d', power:45, turf:[3,7],   desc:'Violent. Deep pockets.' },
  { id:'harbor',   name:'Harbor Co.', color:'#2a5a9a', power:25, turf:[2,6],   desc:'Smugglers. Own the docks.' },
  { id:'none',     name:'Neutral',    color:'#5a5548', power:0,  turf:[0,4,8], desc:'' },
];

const GANG_COLORS = { serpents:'#4a8a50', reds:'#b52a1d', harbor:'#2a5a9a', player:'#e8b830', none:'#252219' };

const REP_TIERS = ['STREET RAT','ASSOCIATE','SOLDIER','CAPO','BOSS'];
const REP_THRESHOLDS = [0, 20, 60, 120, 200];

const MISSIONS = [
  {
    id:'m0', title:'First Blood', locked:false, done:false, active:false,
    desc:'The streets don\'t respect talk. Commit 3 crimes to prove yourself.',
    reward:{ cash:200, xp:30, respect:5 },
    req:null,
    type:'crimes', goal:3, progress:0
  },
  {
    id:'m1', title:'Moving On Up', locked:true, done:false, active:false,
    desc:'Reach level 3. The bosses are watching.',
    reward:{ cash:400, xp:50, respect:10 },
    req:'level:3', reqLabel:'Requires Level 3',
    type:'level', goal:3, progress:0
  },
  {
    id:'m2', title:'Territorial', locked:true, done:false, active:false,
    desc:'Claim your first district. Show the gangs who runs this city.',
    reward:{ cash:500, xp:60, respect:15 },
    req:'level:2', reqLabel:'Requires Level 2',
    type:'turf', goal:1, progress:0
  },
  {
    id:'m3', title:'The Syndicate', locked:true, done:false, active:false,
    desc:'Control 3 districts simultaneously. You\'re building an empire.',
    reward:{ cash:1500, xp:150, respect:40 },
    req:'turf:3', reqLabel:'Requires 3 Districts',
    type:'turf', goal:3, progress:0
  },
  {
    id:'m4', title:'High Roller', locked:true, done:false, active:false,
    desc:'Win $500 at the casino in a single run.',
    reward:{ cash:800, xp:80, respect:20 },
    req:'level:2', reqLabel:'Requires Level 2',
    type:'casinowin', goal:500, progress:0
  },
  {
    id:'m5', title:'Top of the Food Chain', locked:true, done:false, active:false,
    desc:'Achieve CAPO reputation. The city fears your name.',
    reward:{ cash:3000, xp:300, respect:80 },
    req:'rep:3', reqLabel:'Requires SOLDIER rank',
    type:'rep', goal:3, progress:0
  },
];

// ═══════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════
let player = null;
let cooldownInterval = null;
let cooldownMax = 0;
let selectedDistrict = null;
let districtOwners = {};  // districtId -> gangId
let gangPowers = {};      // gangId -> power
let missions = [];
let logCount = 0;

const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('mafia_save')) {
    $('load-btn').style.display = 'block';
  }
  buildRepTrack();
});

function buildRepTrack() {
  const el = $('repTrack');
  el.innerHTML = '';
  for (let i = 0; i < REP_TIERS.length - 1; i++) {
    const div = document.createElement('div');
    div.className = 'rep-tier';
    div.id = 'rep-tier-' + i;
    el.appendChild(div);
  }
}

function initWorld() {
  districtOwners = {};
  gangPowers = {};
  GANGS.forEach(g => {
    gangPowers[g.id] = g.power;
    g.turf.forEach(d => { districtOwners[d] = g.id; });
  });
  missions = JSON.parse(JSON.stringify(MISSIONS));
}

// ═══════════════════════════════════════════════════════
// CREATE / SHOW GAME
// ═══════════════════════════════════════════════════════
function createPlayer() {
  const name = $('playerName').value.trim();
  if (!name) return showToast('Enter a name first', 'warn');
  SFX.click();

  player = {
    name, level:1, xp:0,
    cash:200, health:100, energy:100,
    respect:0, wanted:0,
    day:1, hour:8,
    inventory:[], cooldown:0,
    currentDistrict:0,
    turfOwned:[], takedowns:0,
    casinoWinStreak:0
  };

  initWorld();
  showGame();
  addLog(player.name + ' hit the streets. Welcome to the city.', 'info');
  startCooldown();
  renderAll();
}

function showGame() {
  $('start-screen').style.display = 'none';
  ['stats-panel','map-panel','actions-panel','gang-panel','missions-panel','shop-panel','casino-panel'].forEach(id => {
    $(id).style.display = 'block';
  });
  renderGangList();
  renderMissions();
  renderMap();
}

// ═══════════════════════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════════════════════
function saveGame() {
  if (!player) return showToast('No game to save', 'warn');
  SFX.click();
  const save = { player, districtOwners, gangPowers, missions };
  localStorage.setItem('mafia_save', JSON.stringify(save));
  showToast('Game saved', 'info');
  addLog('Game saved.', 'info');
}

function loadGame() {
  const raw = localStorage.getItem('mafia_save');
  if (!raw) return showToast('No save found', 'warn');
  SFX.click();
  try {
    const save = JSON.parse(raw);
    player = save.player;
    districtOwners = save.districtOwners;
    gangPowers = save.gangPowers;
    missions = save.missions;
    showGame();
    startCooldown();
    renderAll();
    addLog('Save loaded. Welcome back, ' + player.name + '.', 'info');
    showToast('Save loaded', 'info');
  } catch(e) {
    showToast('Corrupt save data', 'warn');
  }
}

// ═══════════════════════════════════════════════════════
// COOLDOWN
// ═══════════════════════════════════════════════════════
function startCooldown() {
  if (cooldownInterval) return;
  cooldownInterval = setInterval(() => {
    if (!player) return;
    if (player.cooldown > 0) player.cooldown--;
    if (player) {
      const pct = cooldownMax > 0 ? (player.cooldown / cooldownMax * 100) : 0;
      $('cooldownFill').style.width = pct + '%';
      $('cooldownText').textContent = player.cooldown > 0 ? 'COOLING DOWN — ' + player.cooldown + 's' : 'READY';
    }
  }, 1000);
}

// ═══════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════
function renderAll() {
  if (!player) return;
  updateStats();
  updateHUD();
  updateInventoryUI();
  renderMap();
  renderMissions();
  renderGangList();
}

function updateStats() {
  $('playerNameDisplay').textContent = player.name;
  $('levelBadge').textContent = player.level;
  $('sc-cash').textContent = '$' + player.cash;
  $('sc-respect').textContent = player.respect;
  $('sc-turf').textContent = player.turfOwned.length;
  $('sc-kills').textContent = player.takedowns;
  $('bar-health').style.width = player.health + '%';
  $('val-health').textContent = player.health;
  $('bar-energy').style.width = player.energy + '%';
  $('val-energy').textContent = player.energy;
  const xpNeeded = player.level * 50;
  const xpInLevel = player.xp % xpNeeded;
  $('bar-xp').style.width = (xpInLevel / xpNeeded * 100) + '%';
  $('val-xp').textContent = xpInLevel + ' / ' + xpNeeded;

  // Stars
  $('wantedStars').querySelectorAll('.star').forEach((s,i) => s.classList.toggle('active', i < player.wanted));

  // Reputation tier
  const tier = getRepTier();
  $('repBadge').textContent = REP_TIERS[tier];
  for (let i = 0; i < 4; i++) {
    const el = $('rep-tier-' + i);
    if (el) el.classList.toggle('filled', i < tier);
  }
}

function updateHUD() {
  const h = String(player.hour).padStart(2,'0');
  $('hud-center').textContent = 'Day ' + player.day + '  ·  ' + h + ':00  ·  ' + DISTRICTS[player.currentDistrict].name.toUpperCase();
  $('hud-cash').textContent = '$' + player.cash;
  $('hud-wanted').textContent = '★'.repeat(player.wanted) + '☆'.repeat(5 - player.wanted);
  $('hud-rep').textContent = REP_TIERS[getRepTier()];
}

function updateInventoryUI() {
  const el = $('inventoryDisplay');
  if (!player.inventory.length) {
    el.innerHTML = '<span style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--mist);letter-spacing:1px">— empty —</span>';
    return;
  }
  el.innerHTML = player.inventory.map(i => '<span class="inv-tag">' + i.toUpperCase() + '</span>').join('');
}

function getRepTier() {
  for (let i = REP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (player.respect >= REP_THRESHOLDS[i]) return i;
  }
  return 0;
}

// ═══════════════════════════════════════════════════════
// MAP
// ═══════════════════════════════════════════════════════
const ZONE_BASE_COLORS = {
  none:'#252219', player:'#2a2a0a',
  serpents:'#162016', reds:'#201010', harbor:'#101020'
};

function renderMap() {
  if (!districtOwners) return;
  DISTRICTS.forEach(d => {
    const owner = districtOwners[d.id];
    const zone = $('zone-' + d.id);
    if (!zone) return;
    const fill = zone.querySelector('.zone-fill');
    const isPlayer = player.turfOwned.includes(d.id);
    const gc = isPlayer ? '#2a2a10' : (ZONE_BASE_COLORS[owner] || '#252219');
    if (fill) fill.setAttribute('fill', gc);
    if (fill) fill.setAttribute('stroke', isPlayer ? '#e8b830' : GANG_COLORS[owner] || '#252219');
    if (fill) fill.setAttribute('stroke-width', isPlayer ? '2' : '1');

    const sub = $('zone-sub-' + d.id);
    const gang = GANGS.find(g => g.id === owner);
    if (sub) {
      if (isPlayer) { sub.textContent = 'YOUR TURF'; sub.setAttribute('fill','#e8b830'); }
      else if (owner === 'none') { sub.textContent = 'neutral'; sub.setAttribute('fill','#5a5548'); }
      else { sub.textContent = gang ? gang.name : ''; sub.setAttribute('fill', GANG_COLORS[owner] || '#5a5548'); }
    }
  });

  // Move player marker
  const d = DISTRICTS[player.currentDistrict];
  const marker = $('player-marker');
  const pulse = $('player-pulse');
  if (marker) { marker.setAttribute('cx', d.x); marker.setAttribute('cy', d.y); }
  if (pulse)  { pulse.setAttribute('cx', d.x); pulse.setAttribute('cy', d.y); }

  $('current-district-label').textContent = d.name.toUpperCase();

  // Legend
  const legendEl = $('mapLegend');
  const gangsSeen = new Set();
  Object.values(districtOwners).forEach(g => gangsSeen.add(g));
  const extras = [...gangsSeen].filter(g => g !== 'none').map(g => {
    const gd = GANGS.find(x => x.id === g);
    return gd ? `<div class="legend-item"><div class="legend-dot" style="background:${gd.color}"></div>${gd.name.toUpperCase()}</div>` : '';
  }).join('');
  legendEl.innerHTML = `<div class="legend-item"><div class="legend-dot" style="background:var(--gold-light)"></div>YOU</div><div class="legend-item"><div class="legend-dot" style="background:#5a5548"></div>NEUTRAL</div><div class="legend-item"><div class="legend-dot" style="background:#e8b830;opacity:.5"></div>YOUR TURF</div>${extras}`;
}

function selectDistrict(id) {
  SFX.click();
  selectedDistrict = id;
  const d = DISTRICTS[id];
  const owner = districtOwners[id];
  const isPlayer = player.turfOwned.includes(id);
  const isCurrent = player.currentDistrict === id;
  const gang = GANGS.find(g => g.id === owner);

  $('di-name').textContent = d.name.toUpperCase();

  let gangLabel = '';
  if (isPlayer) gangLabel = '<span style="color:var(--gold-light)">YOUR TERRITORY</span>';
  else if (owner === 'none') gangLabel = '<span style="color:var(--mist)">Unclaimed — no gang presence</span>';
  else gangLabel = '<span style="color:' + GANG_COLORS[owner] + '">' + gang.name.toUpperCase() + '</span> <span style="color:var(--mist)">· Power: ' + gangPowers[owner] + '</span>';

  $('di-gang').innerHTML = gangLabel;

  let btns = '';
  if (!isCurrent) btns += '<button class="di-btn travel" onclick="travelTo(' + id + ')">✈ TRAVEL</button>';
  if (isCurrent && !isPlayer && owner === 'none') btns += '<button class="di-btn defend" onclick="claimDistrict(' + id + ')">⚑ CLAIM</button>';
  if (isCurrent && !isPlayer && owner !== 'none' && owner !== 'player') btns += '<button class="di-btn attack" onclick="attackDistrict(' + id + ')">⚔ ATTACK</button>';
  if (isCurrent && isPlayer) btns += '<span style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--gold);letter-spacing:1px">✓ CONTROLLED — +$' + (20 * (getRepTier()+1)) + '/day</span>';

  $('di-actions').innerHTML = btns || '<span style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--mist)">Travel here first</span>';
}

function travelTo(id) {
  if (!player) return;
  if (player.cooldown > 0) return showToast('Wait ' + player.cooldown + 's', 'warn');
  SFX.travel();
  player.currentDistrict = id;
  player.cooldown = 15;
  cooldownMax = 15;
  advanceTime(2);
  addLog('Traveled to ' + DISTRICTS[id].name + '.', 'info');
  renderAll();
  selectDistrict(id);
  showToast('Arrived: ' + DISTRICTS[id].name, 'info');
}

function claimDistrict(id) {
  if (player.cooldown > 0) return showToast('Wait ' + player.cooldown + 's', 'warn');
  SFX.success();
  districtOwners[id] = 'player';
  player.turfOwned.push(id);
  player.cooldown = 30;
  cooldownMax = 30;
  player.respect += 5;
  advanceTime(1);
  addLog('Claimed ' + DISTRICTS[id].name + '. New territory established.', 'win');
  showToast(DISTRICTS[id].name + ' claimed!', 'win');
  checkMissions();
  renderAll();
  selectDistrict(id);
}

function attackDistrict(id) {
  if (player.cooldown > 0) return showToast('Wait ' + player.cooldown + 's', 'warn');
  if (player.health < 20) return showToast('Too wounded to fight', 'warn');
  const owner = districtOwners[id];
  const gang = GANGS.find(g => g.id === owner);
  openModal(
    'Attack ' + DISTRICTS[id].name + '?',
    'You\'re about to go to war with ' + gang.name + ' (Power: ' + gangPowers[owner] + '). This will cost health. Make sure you\'re ready.',
    () => executeAttack(id)
  );
}

function executeAttack(id) {
  SFX.attack();
  const owner = districtOwners[id];
  const gang = GANGS.find(g => g.id === owner);
  let power = gangPowers[owner];
  let playerStrength = 30 + (player.level * 8) + (player.inventory.includes('weapon') ? 20 : 0);
  player.cooldown = 60;
  cooldownMax = 60;
  advanceTime(3);

  const roll = rand(1, 100);
  const winChance = Math.min(85, Math.max(15, Math.round(playerStrength / (playerStrength + power) * 100)));

  if (roll <= winChance) {
    gangPowers[owner] = Math.max(0, power - rand(10, 20));
    districtOwners[id] = 'player';
    player.turfOwned.push(id);
    player.takedowns++;
    player.respect += 10;
    player.xp += 30;
    const dmg = player.inventory.includes('vest') ? rand(5,15) : rand(10,30);
    player.health = Math.max(1, player.health - dmg);
    SFX.success();
    addLog('VICTORY — ' + DISTRICTS[id].name + ' seized from ' + gang.name + '. -' + dmg + ' HP.', 'win');
    showToast('District captured!', 'win');
    levelUp();
    checkMissions();
  } else {
    const dmg = player.inventory.includes('vest') ? rand(15,30) : rand(25,50);
    player.health = Math.max(0, player.health - dmg);
    player.wanted = Math.min(5, player.wanted + 1);
    SFX.fail();
    addLog('DEFEAT — Driven back from ' + DISTRICTS[id].name + '. -' + dmg + ' HP.', 'loss');
    showToast('Attack failed — -' + dmg + ' HP', 'loss');
    if (player.health === 0) playerDied();
  }

  renderAll();
  selectDistrict(id);
}

// Gang income each day
function collectTurfIncome() {
  if (!player || !player.turfOwned.length) return;
  const income = player.turfOwned.length * 20 * (getRepTier() + 1);
  player.cash += income;
  addLog('Turf income: +$' + income + ' (' + player.turfOwned.length + ' districts).', 'win');
  SFX.cash();
}

// Gang counter-attack over time
function gangAggression() {
  if (!player || !player.turfOwned.length) return;
  player.turfOwned.forEach(dId => {
    const neighbors = getNeighborGang(dId);
    if (!neighbors) return;
    const gang = GANGS.find(g => g.id === neighbors);
    if (!gang || gangPowers[gang.id] < 5) return;
    if (rand(1,100) > 25) return;
    // Gang retakes
    const idx = player.turfOwned.indexOf(dId);
    player.turfOwned.splice(idx, 1);
    districtOwners[dId] = gang.id;
    const dmg = rand(5,15);
    player.health = Math.max(0, player.health - dmg);
    addLog('⚠ ' + gang.name + ' retook ' + DISTRICTS[dId].name + '! -' + dmg + ' HP.', 'loss');
    showToast(gang.name + ' counter-attacked!', 'loss');
    SFX.bust();
  });
}

function getNeighborGang(districtId) {
  const neighbors = { 0:[1,2,3,4], 1:[0,5,7], 2:[0,5,6], 3:[0,7,8], 4:[0,6,8], 5:[1,2], 6:[2,4], 7:[1,3], 8:[3,4] };
  const nbs = neighbors[districtId] || [];
  for (const nb of nbs) {
    const owner = districtOwners[nb];
    if (owner && owner !== 'none' && owner !== 'player') return owner;
  }
  return null;
}

// ═══════════════════════════════════════════════════════
// CRIMES
// ═══════════════════════════════════════════════════════
function crime(type) {
  if (!player) return;
  if (player.cooldown > 0) return showToast('Wait ' + player.cooldown + 's', 'warn');
  if (player.energy < 10) return showToast('Too tired to work', 'warn');

  const types = {
    mugging: { success:80, min:20, max:60, xp:5, cd:30, label:'Mugging' },
    store:   { success:55, min:80, max:180, xp:12, cd:50, label:'Store robbery' },
    car:     { success:35, min:200, max:500, xp:25, cd:80, label:'Car theft' },
  };
  const t = types[type];
  let bonus = 0;
  if (type === 'store' && player.inventory.includes('lockpick')) bonus += 15;
  if (player.inventory.includes('gloves')) bonus += 10;

  // Turf bonus: operating in your district = +10%
  if (player.turfOwned.includes(player.currentDistrict)) bonus += 10;

  player.cooldown = t.cd;
  cooldownMax = t.cd;
  player.energy = Math.max(0, player.energy - 10);
  advanceTime(2);

  if (rand(1,100) <= t.success + bonus) {
    const reward = rand(t.min, t.max);
    player.cash += reward;
    player.xp += t.xp;
    player.respect++;
    SFX.success();
    setTimeout(SFX.cash, 300);
    addLog(t.label + ' — success. +$' + reward, 'win');
    showToast('+$' + reward, 'win');
    missionProgress('crimes', 1);
  } else {
    const dmg = rand(5, 20);
    player.health = Math.max(0, player.health - dmg);
    player.wanted = Math.min(5, player.wanted + 1);
    SFX.fail();
    addLog(t.label + ' — failed. -' + dmg + ' HP, heat up.', 'loss');
    showToast('Operation failed', 'loss');
    if (player.health === 0) return playerDied();
  }
  levelUp();
  policeCheck();
  checkMissions();
  renderAll();
}

function rest() {
  if (!player) return;
  if (player.cooldown > 0) return showToast('Still busy for ' + player.cooldown + 's', 'warn');
  player.cooldown = 20; cooldownMax = 20;
  player.energy = Math.min(100, player.energy + 30);
  player.health = Math.min(100, player.health + 20);
  advanceTime(8);
  addLog('Rested up. HP and energy restored.', 'info');
  SFX.click();
  renderAll();
}

function levelUp() {
  while (player.xp >= player.level * 50) {
    player.level++;
    player.energy = 100;
    player.health = 100;
    SFX.levelUp();
    addLog('★ LEVEL UP — Rank ' + player.level + '. Full health restored.', 'win');
    showToast('LEVEL ' + player.level + '!', 'win');
    checkMissions();
  }
}

function policeCheck() {
  if (!player.wanted) return;
  if (rand(1,100) > player.wanted * 12) return;
  const fine = rand(30, 120);
  player.cash = Math.max(0, player.cash - fine);
  player.health = Math.max(0, player.health - 10);
  player.energy = Math.max(0, player.energy - 10);
  player.wanted = Math.min(5, player.wanted + 1);
  SFX.bust();
  if (player.inventory.includes('fakeid')) {
    player.wanted = Math.max(0, player.wanted - 2);
    addLog('Busted — showed fake ID. Fine: $' + fine + '.', 'warn');
  } else {
    addLog('BUSTED! Fine: $' + fine + '. Heat rising.', 'loss');
  }
  showToast('Busted — $' + fine, 'loss');
  if (player.health <= 0) playerDied();
}

function playerDied() {
  SFX.fail();
  openModal('YOU DIED', player.name + ' has been taken off the streets. The city doesn\'t care. Your run ends here — but legends never truly die. Start fresh?', () => {
    player = null; districtOwners = {}; gangPowers = {}; missions = [];
    ['stats-panel','map-panel','actions-panel','gang-panel','missions-panel','shop-panel','casino-panel'].forEach(id => { $(id).style.display = 'none'; });
    $('start-screen').style.display = 'block';
    $('log').innerHTML = '';
    logCount = 0;
    localStorage.removeItem('mafia_save');
    addLog('A new story begins...', 'info');
  });
}

// ═══════════════════════════════════════════════════════
// SHOP
// ═══════════════════════════════════════════════════════
const itemData = {
  lockpick:{ cost:150, label:'Lockpick' },
  gloves:  { cost:100, label:'Gloves' },
  fakeid:  { cost:200, label:'Fake ID' },
  weapon:  { cost:350, label:'Piece' },
  vest:    { cost:300, label:'Vest' },
  energy:  { cost:50,  label:'Energy Drink' },
};

function buyItem(item) {
  if (!player) return;
  const d = itemData[item];
  if (player.cash < d.cost) return showToast('Not enough cash', 'warn');
  player.cash -= d.cost;
  SFX.cash();
  if (item === 'energy') {
    player.energy = Math.min(100, player.energy + 40);
    addLog('Drank energy drink. +40 energy.', 'info');
    showToast('+40 Energy', 'gold');
  } else {
    if (!player.inventory.includes(item)) player.inventory.push(item);
    else { player.cash += d.cost; return showToast('Already have ' + d.label, 'warn'); }
    addLog('Bought ' + d.label + ' for $' + d.cost + '.', 'info');
    showToast(d.label + ' acquired', 'gold');
  }
  renderAll();
}

// ═══════════════════════════════════════════════════════
// CASINO
// ═══════════════════════════════════════════════════════
function casino(choice) {
  if (!player) return;
  if (player.cooldown > 0) return showToast('Wait ' + player.cooldown + 's', 'warn');
  const bet = parseInt($('betAmount').value);
  if (!bet || bet < 10) return showToast('Min bet is $10', 'warn');
  if (player.cash < bet) return showToast('Not enough cash', 'warn');
  player.cash -= bet;
  player.cooldown = 8; cooldownMax = 8;
  const r = rand(1,100);
  let win = false, payout = 0;
  if ((choice==='red'||choice==='black') && r<=48) { win=true; payout=bet*2; }
  if (choice==='jackpot' && r<=5) { win=true; payout=bet*10; }
  if (win) {
    player.cash += payout;
    player.respect++;
    SFX.win();
    addLog('Casino — ' + choice.toUpperCase() + ' wins. +$' + payout, 'win');
    showToast('+$' + payout + ' 🎰', 'win');
    missionProgress('casinowin', payout);
  } else {
    SFX.fail();
    addLog('Casino — ' + choice.toUpperCase() + ' lost. -$' + bet, 'loss');
    showToast('Lost $' + bet, 'loss');
  }
  advanceTime(1);
  renderAll();
}

// ═══════════════════════════════════════════════════════
// MISSIONS
// ═══════════════════════════════════════════════════════
function missionProgress(type, amount) {
  missions.forEach(m => {
    if (m.done || !m.active) return;
    if (m.type === type) {
      if (type === 'casinowin') m.progress = Math.max(m.progress, amount);
      else m.progress = Math.min(m.goal, m.progress + amount);
    }
  });
  checkMissions();
}

function checkMissions() {
  if (!player) return;
  missions.forEach(m => {
    // Unlock checks
    if (m.locked) {
      if (m.req === null) m.locked = false;
      else if (m.req && m.req.startsWith('level:') && player.level >= parseInt(m.req.split(':')[1])) m.locked = false;
      else if (m.req && m.req.startsWith('turf:') && player.turfOwned.length >= parseInt(m.req.split(':')[1])) m.locked = false;
      else if (m.req && m.req.startsWith('rep:') && getRepTier() >= parseInt(m.req.split(':')[1])) m.locked = false;
    }
    // Auto-progress for level/turf/rep missions
    if (!m.locked && !m.done) {
      if (m.type === 'level') m.progress = player.level;
      if (m.type === 'turf') m.progress = player.turfOwned.length;
      if (m.type === 'rep') m.progress = getRepTier();
    }
    // Complete
    if (!m.locked && !m.done && m.progress >= m.goal) {
      m.done = true;
      m.active = false;
      player.cash += m.reward.cash;
      player.xp += m.reward.xp;
      player.respect += m.reward.respect;
      SFX.mission();
      addLog('✦ MISSION COMPLETE: ' + m.title + ' — +$' + m.reward.cash + ', +' + m.reward.respect + ' respect.', 'win');
      showToast('Mission done: ' + m.title, 'win');
      levelUp();
    }
  });
  renderMissions();
}

function startMission(id) {
  SFX.click();
  const m = missions.find(x => x.id === id);
  if (!m || m.done || m.locked) return;
  missions.forEach(x => x.active = false);
  m.active = true;
  addLog('Mission started: ' + m.title, 'info');
  showToast('Mission: ' + m.title, 'info');
  renderMissions();
}

function renderMissions() {
  const el = $('mission-list');
  if (!el || !missions.length) return;
  el.innerHTML = missions.map(m => {
    if (m.locked) return `<div class="mission-card" style="opacity:.35;border-left-color:var(--mist)"><div class="mission-title" style="color:var(--mist)">${m.title}</div><div class="mission-desc" style="font-size:10px">${m.reqLabel || 'Locked'}</div></div>`;
    const pct = m.goal > 0 ? Math.min(100, Math.round(m.progress / m.goal * 100)) : 0;
    const btnLabel = m.done ? 'COMPLETE' : m.active ? 'ACTIVE' : 'START';
    return `<div class="mission-card ${m.done ? 'done' : m.active ? 'active-m' : ''}">
      <div class="mission-title">${m.title}</div>
      <div class="mission-desc">${m.desc}</div>
      <div class="mission-reward">Reward: $${m.reward.cash} · +${m.reward.xp} XP · +${m.reward.respect} Respect</div>
      ${!m.done ? '<div class="mission-progress"><div class="mission-progress-fill" style="width:'+pct+'%"></div></div><div style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--mist);margin-top:3px">'+m.progress+' / '+m.goal+'</div>' : ''}
      <button class="mission-btn" style="margin-top:8px" onclick="startMission('${m.id}')" ${m.done||m.active?'disabled':''}>${btnLabel}</button>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════
// GANG LIST
// ═══════════════════════════════════════════════════════
function renderGangList() {
  const el = $('gang-list');
  if (!el) return;
  el.innerHTML = GANGS.filter(g => g.id !== 'none').map(g => {
    const ownedDistricts = Object.entries(districtOwners).filter(([,v]) => v === g.id).length;
    const pow = gangPowers[g.id] || 0;
    const powColor = pow > 40 ? 'var(--blood)' : pow > 20 ? 'var(--gold)' : 'var(--green-light)';
    return `<div class="gang-row">
      <div class="gang-color" style="background:${g.color}"></div>
      <div class="gang-name">${g.name}</div>
      <div class="gang-turf">${ownedDistricts} district${ownedDistricts!==1?'s':''}</div>
      <div class="gang-power" style="color:${powColor}">PWR ${pow}</div>
    </div>`;
  }).join('') + `<div class="gang-row">
    <div class="gang-color" style="background:var(--gold-light)"></div>
    <div class="gang-name" style="color:var(--gold-light)">${player ? player.name.toUpperCase() : 'YOU'}</div>
    <div class="gang-turf">${player ? player.turfOwned.length : 0} district${player && player.turfOwned.length!==1?'s':''}</div>
    <div class="gang-power" style="color:var(--gold-light)">LV ${player ? player.level : 1}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// TIME
// ═══════════════════════════════════════════════════════
function advanceTime(hours) {
  player.hour += hours;
  while (player.hour >= 24) {
    player.hour -= 24;
    player.day++;
    if (player.wanted > 0 && rand(1,100) <= 25) {
      player.wanted--;
      addLog('Heat cooled overnight.', 'info');
    }
    collectTurfIncome();
    gangAggression();
  }
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addLog(text, type) {
  const div = document.createElement('div');
  div.className = 'log-entry' + (type ? ' log-' + type : '');
  const h = player ? String(player.hour).padStart(2,'0') : '00';
  const d = player ? player.day : 1;
  div.innerHTML = '<span class="log-time">D' + d + '·' + h + ':00</span><span class="log-text">' + text + '</span>';
  $('log').prepend(div);
  if (++logCount > 80) {
    const entries = $('log').querySelectorAll('.log-entry');
    entries[entries.length - 1]?.remove();
  }
}

let toastTimeout;
function showToast(msg, type) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show' + (type==='win' ? ' t-win' : type==='gold' ? ' t-gold' : type==='info' ? ' t-info' : '');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { t.className = ''; }, 2400);
}

// ═══════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════
let modalCallback = null;
function openModal(title, body, cb) {
  $('modal-title').textContent = title;
  $('modal-body').textContent = body;
  modalCallback = cb;
  $('modal-overlay').classList.add('open');
}
function closeModal() { $('modal-overlay').classList.remove('open'); modalCallback = null; }
$('modal-confirm').onclick = () => { closeModal(); if (modalCallback) modalCallback(); };

// startup
addLog('Welcome to the city. Build your empire.', 'info');