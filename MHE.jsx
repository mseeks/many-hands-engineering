import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw,
  Eye, EyeOff, Sparkles, ArrowDown, ArrowRight,
  List, X, Compass, Map as MapIcon, Wind, Layers, Target,
  Repeat, Activity, Shield, AlertTriangle, GitBranch,
  Hand, Zap, Trophy, Scale, Boxes, Bot,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────
   PALETTE — earthen, paper-and-ink, warm gold accents
   ──────────────────────────────────────────────────────────────────── */
const PALETTE = {
  bg:        '#13110d',
  bgDeep:    '#0a0907',
  panel:     '#181613',
  card:      '#211e18',
  cardHi:    '#2a261e',
  border:    '#312c24',
  borderHi:  '#5a4f3d',
  text:      '#ece4d3',
  textDim:   '#a89a82',
  textMute:  '#5e564a',
  accent:    '#d4a85a', // warm gold
  accentSoft:'#a8884a',
  inbound:   '#e8a85c', // success / food trail
  outbound:  '#5a8aa6', // exploration
  food:      '#c97a4f',
  nest:      '#9bbb9c',
  steward:   '#b08858',
  danger:    '#c85040',
  ok:        '#7fa07a',
};

/* ────────────────────────────────────────────────────────────────────
   VOCAB — toggle between biology & engineering vocabulary
   ──────────────────────────────────────────────────────────────────── */
const VOCAB = {
  bio: {
    ants: 'ants', forager: 'forager', returner: 'returner',
    colony: 'colony', trail: 'trail', pheromone: 'pheromone',
    food: 'food', nest: 'nest', field: 'field', commons: 'field',
    decay: 'evaporation γ', deposit: 'deposit R',
  },
  eng: {
    ants: 'agents', forager: 'searcher', returner: 'finisher',
    colony: 'team', trail: 'merge path', pheromone: 'signal',
    food: 'task', nest: 'main', field: 'commons', commons: 'commons',
    decay: 'staleness γ', deposit: 'reinforcement R',
  },
};

/* ────────────────────────────────────────────────────────────────────
   SIMULATION — grid, ants, pheromones, physics
   Path-integration model: foragers follow trails or random-walk;
   returners always know where home is (sun-compass / step counter).
   ──────────────────────────────────────────────────────────────────── */
const GRID_W = 160;
const GRID_H = 100;
const MAX_ANTS = 80;
const TUNED = { decayRate: 0.0085, deposit: 1.0, diffuse: 0.06 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function makeAnt(homeX, homeY) {
  return {
    x: homeX + (Math.random() - 0.5) * 4,
    y: homeY + (Math.random() - 0.5) * 4,
    angle: Math.random() * Math.PI * 2,
    state: 'forage',
    sinceHome: 0, sinceFood: 0, age: 0,
  };
}

function createWorld(w, h, antCount, foodSites, nestSite) {
  const pheroOut = new Float32Array(w * h);
  const pheroIn  = new Float32Array(w * h);
  const walls    = new Uint8Array(w * h);
  const ants = [];
  for (let i = 0; i < antCount; i++) ants.push(makeAnt(nestSite.x, nestSite.y));
  return {
    w, h, pheroOut, pheroIn, walls, ants,
    foodSites: foodSites.map(f => ({ ...f, picked: 0, life: f.life ?? Infinity })),
    nestSite, tick: 0, totalDelivered: 0,
  };
}

function decayDiffuse(field, decay, diff, w, h, scratch) {
  const dec = 1 - decay;
  for (let i = 0; i < field.length; i++) field[i] *= dec;
  if (diff <= 0) return;
  scratch.set(field);
  const k = diff, k4 = 1 - 4 * k;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      field[i] = scratch[i] * k4 + (scratch[i-1] + scratch[i+1] + scratch[i-w] + scratch[i+w]) * k;
    }
  }
}

function senseAhead(field, ax, ay, angle, dist, w, h) {
  const sx = ax + Math.cos(angle) * dist;
  const sy = ay + Math.sin(angle) * dist;
  return field[clamp(Math.floor(sy), 0, h - 1) * w + clamp(Math.floor(sx), 0, w - 1)];
}

function step(world, params) {
  const { decayRate, deposit, diffuse, scratch } = params;
  const { w, h, ants, pheroOut, pheroIn, walls, foodSites, nestSite } = world;

  decayDiffuse(pheroOut, decayRate, diffuse, w, h, scratch);
  decayDiffuse(pheroIn,  decayRate, diffuse, w, h, scratch);

  const SPEED = 0.7, SENSE_DIST = 7, SENSE_ANGLE = 0.55, NOISE = 0.12, TURN_BIAS = 0.45;

  for (const ant of ants) {
    ant.age++; ant.sinceHome++; ant.sinceFood++;

    let turn;
    if (ant.state === 'forage') {
      const aL = ant.angle - SENSE_ANGLE, aC = ant.angle, aR = ant.angle + SENSE_ANGLE;
      const sL = senseAhead(pheroIn, ant.x, ant.y, aL, SENSE_DIST, w, h);
      const sC = senseAhead(pheroIn, ant.x, ant.y, aC, SENSE_DIST, w, h);
      const sR = senseAhead(pheroIn, ant.x, ant.y, aR, SENSE_DIST, w, h);
      const maxS = Math.max(sL, sC, sR);
      if (maxS < 0.04 || (sC >= sL && sC >= sR)) {
        turn = (Math.random() - 0.5) * NOISE;
      } else if (sL > sR) {
        turn = -TURN_BIAS + (Math.random() - 0.5) * NOISE;
      } else {
        turn = TURN_BIAS + (Math.random() - 0.5) * NOISE;
      }
    } else {
      // path integration: returners always know where home is
      const homeDx = nestSite.x - ant.x, homeDy = nestSite.y - ant.y;
      const homeAngle = Math.atan2(homeDy, homeDx);
      let diff = homeAngle - ant.angle;
      while (diff >  Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      turn = diff * 0.18 + (Math.random() - 0.5) * NOISE;
    }
    ant.angle += turn;

    let nx = ant.x + Math.cos(ant.angle) * SPEED;
    let ny = ant.y + Math.sin(ant.angle) * SPEED;
    if (nx < 1) { nx = 1; ant.angle = Math.PI - ant.angle + (Math.random()-0.5)*0.6; }
    if (nx > w-2) { nx = w-2; ant.angle = Math.PI - ant.angle + (Math.random()-0.5)*0.6; }
    if (ny < 1) { ny = 1; ant.angle = -ant.angle + (Math.random()-0.5)*0.6; }
    if (ny > h-2) { ny = h-2; ant.angle = -ant.angle + (Math.random()-0.5)*0.6; }
    const ix = Math.floor(nx), iy = Math.floor(ny);
    if (ix >= 0 && iy >= 0 && ix < w && iy < h && walls[iy * w + ix]) {
      ant.angle += Math.PI + (Math.random()-0.5)*0.8;
      nx = ant.x; ny = ant.y;
    }
    ant.x = nx; ant.y = ny;

    const cx = Math.floor(ant.x), cy = Math.floor(ant.y), ci = cy * w + cx;
    if (ant.state === 'return') {
      pheroIn[ci] += deposit * Math.exp(-ant.sinceFood * 0.004);
    } else {
      pheroOut[ci] += deposit * 0.15 * Math.exp(-ant.sinceHome * 0.005);
    }

    if (ant.state === 'forage') {
      for (const f of foodSites) {
        const dx = ant.x - f.x, dy = ant.y - f.y;
        if (dx*dx + dy*dy < (f.r||5) * (f.r||5)) {
          ant.state = 'return';
          ant.angle += Math.PI + (Math.random()-0.5)*0.4;
          ant.sinceFood = 0;
          f.picked = (f.picked || 0) + 1;
          if (Number.isFinite(f.life)) f.life -= 1;
          break;
        }
      }
    } else {
      const dx = ant.x - nestSite.x, dy = ant.y - nestSite.y;
      if (dx*dx + dy*dy < (nestSite.r||6) * (nestSite.r||6)) {
        ant.state = 'forage';
        ant.angle += Math.PI + (Math.random()-0.5)*0.4;
        ant.sinceHome = 0;
        world.totalDelivered++;
      }
    }

    if (ant.age > 1500) {
      ant.x = nestSite.x + (Math.random()-0.5)*4;
      ant.y = nestSite.y + (Math.random()-0.5)*4;
      ant.state = 'forage';
      ant.age = 0; ant.sinceHome = 0; ant.sinceFood = 0;
    }
  }

  // exhausted food sites die off
  for (let i = world.foodSites.length - 1; i >= 0; i--) {
    if (world.foodSites[i].life !== undefined && world.foodSites[i].life <= 0) {
      world.foodSites.splice(i, 1);
    }
  }
  world.tick++;
}

/* ────────────────────────────────────────────────────────────────────
   RENDER — paint the simulation into a canvas
   ──────────────────────────────────────────────────────────────────── */
function render(ctx, world, fieldImg, fieldCtx, canvas, opts) {
  const { showField, showAnts, showCommons } = opts;
  const W = canvas.clientWidth || canvas.width;
  const H = canvas.clientHeight || canvas.height;
  const sx = W / world.w, sy = H / world.h;

  ctx.fillStyle = PALETTE.bgDeep;
  ctx.fillRect(0, 0, W, H);

  // grid
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = PALETTE.borderHi;
  for (let x = 0; x <= world.w; x += 10) {
    ctx.beginPath(); ctx.moveTo(x*sx, 0); ctx.lineTo(x*sx, H); ctx.stroke();
  }
  for (let y = 0; y <= world.h; y += 10) {
    ctx.beginPath(); ctx.moveTo(0, y*sy); ctx.lineTo(W, y*sy); ctx.stroke();
  }
  ctx.restore();

  // pheromone field
  if (showField) {
    const data = fieldImg.data;
    const { pheroOut, pheroIn } = world;
    for (let i = 0, j = 0; i < pheroOut.length; i++, j += 4) {
      const o = Math.min(1, pheroOut[i] * 1.6);
      const n = Math.min(1, pheroIn[i]  * 1.0);
      data[j  ] = Math.min(255, n * 232 + o * 70);
      data[j+1] = Math.min(255, n * 168 + o * 140);
      data[j+2] = Math.min(255, n * 92  + o * 200);
      data[j+3] = Math.min(255, (o * 0.6 + n * 1.2) * 200);
    }
    fieldCtx.putImageData(fieldImg, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(fieldCtx.canvas, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  // walls
  ctx.save();
  ctx.fillStyle = PALETTE.steward;
  ctx.globalAlpha = 0.55;
  for (let y = 0; y < world.h; y++) {
    for (let x = 0; x < world.w; x++) {
      if (world.walls[y * world.w + x]) ctx.fillRect(x*sx, y*sy, sx+0.5, sy+0.5);
    }
  }
  ctx.restore();

  // commons frame
  if (showCommons) {
    ctx.save();
    ctx.strokeStyle = PALETTE.accent;
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.setLineDash([]);
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = PALETTE.accent;
    ctx.globalAlpha = 0.65;
    ctx.fillText('THE  COMMONS', 14, 22);
    ctx.restore();
  }

  // food
  for (const f of world.foodSites) {
    const fx = f.x * sx, fy = f.y * sy;
    const fade = Number.isFinite(f.life) ? clamp(f.life / 40, 0.2, 1) : 1;
    ctx.save();
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, (f.r||5) * 2.5 * sx);
    grad.addColorStop(0, `${PALETTE.food}cc`);
    grad.addColorStop(1, `${PALETTE.food}00`);
    ctx.globalAlpha = fade;
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(fx, fy, (f.r||5) * 2.5 * sx, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = PALETTE.food;
    ctx.beginPath(); ctx.arc(fx, fy, (f.r||5) * 0.7 * sx, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // nest
  const nx = world.nestSite.x * sx, ny = world.nestSite.y * sy;
  ctx.save();
  const nestGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, world.nestSite.r * 3 * sx);
  nestGrad.addColorStop(0, `${PALETTE.nest}88`);
  nestGrad.addColorStop(1, `${PALETTE.nest}00`);
  ctx.fillStyle = nestGrad;
  ctx.beginPath(); ctx.arc(nx, ny, world.nestSite.r * 3 * sx, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = PALETTE.nest;
  ctx.beginPath(); ctx.arc(nx, ny, world.nestSite.r * 0.55 * sx, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ants
  if (showAnts) {
    const N = world.ants.length;
    const sc = N <= 3 ? 1.7 : (N <= 12 ? 1.25 : 1.0);
    for (const a of world.ants) {
      const ax = a.x * sx, ay = a.y * sy;
      const ret = a.state === 'return';
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(a.angle);
      if (N <= 12) {
        ctx.fillStyle = ret ? 'rgba(232,168,92,0.18)' : 'rgba(236,228,211,0.10)';
        ctx.beginPath(); ctx.arc(0, 0, 5.5 * sc, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = ret ? PALETTE.inbound : PALETTE.text;
      ctx.beginPath();
      ctx.moveTo(4 * sc, 0);
      ctx.lineTo(-2.8 * sc, 1.7 * sc);
      ctx.lineTo(-2.8 * sc, -1.7 * sc);
      ctx.closePath();
      ctx.fill();
      if (ret) {
        ctx.fillStyle = 'rgba(232,168,92,0.5)';
        ctx.beginPath(); ctx.arc(0, 0, 2.8 * sc, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }
}

/* ────────────────────────────────────────────────────────────────────
   PRIMITIVE COMPONENTS
   ──────────────────────────────────────────────────────────────────── */

const Slider = ({ label, value, min, max, step, onChange, format, hint, color = PALETTE.accent, sweetMin, sweetMax }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const a = sweetMin != null ? ((sweetMin - min) / (max - min)) * 100 : null;
  const b = sweetMax != null ? ((sweetMax - min) / (max - min)) * 100 : null;
  return (
    <div className="mb-5 select-none">
      <div className="flex items-baseline justify-between mb-2">
        <label className="mono-font text-[10px] uppercase tracking-[0.2em]" style={{color: PALETTE.textDim}}>
          {label}
        </label>
        <span className="mono-font text-sm tabular-nums" style={{color: PALETTE.text}}>
          {format ? format(value) : value}
        </span>
      </div>
      <div className="relative h-7 flex items-center group">
        <div className="absolute left-0 right-0 h-2 rounded-full"
          style={{background: PALETTE.bgDeep, border: `1px solid ${PALETTE.border}`}}/>
        {a != null && b != null && (
          <div className="absolute h-2 rounded-full pointer-events-none"
            style={{left: `${a}%`, width: `${b-a}%`, background: `${color}22`,
              border: `1px dashed ${color}55`}}/>
        )}
        <div className="absolute left-0 h-2 rounded-full pointer-events-none"
          style={{width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 10px ${color}55`}}/>
        <div className="absolute pointer-events-none transition-transform group-hover:scale-110"
          style={{left: `calc(${pct}% - 11px)`, width: 22, height: 22, borderRadius: '50%',
            background: color, border: `3px solid ${PALETTE.bg}`,
            boxShadow: `0 0 0 1px ${color}, 0 2px 10px rgba(0,0,0,0.6), 0 0 14px ${color}88`}}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
          style={{margin: 0, padding: 0}}/>
      </div>
      {(hint || a != null) && (
        <p className="mt-1.5 text-[11px] italic"
          style={{color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>
          {hint || 'Highlighted band: values that produce a working trail.'}
        </p>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className="px-3 py-1.5 mono-font text-[10px] uppercase tracking-[0.2em] transition-all rounded-sm"
    style={{
      background: active ? PALETTE.accent : 'transparent',
      color: active ? PALETTE.bg : PALETTE.textDim,
      fontWeight: active ? 600 : 400,
    }}>
    {children}
  </button>
);

// Section marker — appears at the top of each reading-style chapter
const Kicker = ({ children }) => (
  <div className="mono-font text-[10px] uppercase tracking-[0.3em] mb-3"
    style={{color: PALETTE.accent}}>{children}</div>
);

// Headings inside reading content
const H1 = ({ children }) => (
  <h2 className="display-font text-3xl xl:text-[2.6rem] leading-[1.05] mb-3"
    style={{color: PALETTE.text, fontWeight: 400, letterSpacing: '-0.01em'}}>{children}</h2>
);
const Sub = ({ children }) => (
  <p className="display-font italic text-lg leading-snug mb-7"
    style={{color: PALETTE.accent, fontWeight: 300}}>{children}</p>
);
const Body = ({ children }) => (
  <p className="text-[15px] leading-relaxed mb-5"
    style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{children}</p>
);
const Small = ({ children }) => (
  <p className="text-[13px] leading-relaxed mb-4"
    style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{children}</p>
);

const Callout = ({ label, children, color = PALETTE.accent }) => (
  <div className="my-6 p-4 rounded-sm" style={{
    background: `linear-gradient(180deg, ${PALETTE.cardHi}, ${PALETTE.card})`,
    border: `1px solid ${PALETTE.border}`,
    borderLeft: `2px solid ${color}`,
  }}>
    <div className="mono-font text-[9px] uppercase tracking-[0.3em] mb-2" style={{color}}>{label}</div>
    <div className="text-[13.5px] leading-relaxed"
      style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>
      {children}
    </div>
  </div>
);

const MathBlock = ({ children }) => (
  <div className="my-6 p-4 rounded-sm" style={{
    background: PALETTE.bgDeep,
    border: `1px solid ${PALETTE.border}`,
  }}>
    <div className="mono-font text-[9px] uppercase tracking-[0.3em] mb-2 flex items-center gap-2"
      style={{color: PALETTE.textDim}}>
      <Activity size={10}/> The mathematics
    </div>
    <div className="text-[13px] leading-relaxed"
      style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>
      {children}
    </div>
  </div>
);


/* ────────────────────────────────────────────────────────────────────
   FRAMEWORK DIAGRAM COMPONENTS
   Each one is a small visualization for a specific concept
   ──────────────────────────────────────────────────────────────────── */

// Mapping bridge: bio → eng
const BridgeMap = () => {
  const rows = [
    { bio: 'ant',       eng: 'agent',                     note: 'human or AI; whoever is making the change' },
    { bio: 'pheromone', eng: 'signal',                    note: 'test status, freshness, ownership, telemetry' },
    { bio: 'trail',     eng: 'shared knowledge',          note: 'in code, conventions, reviews, the test suite' },
    { bio: 'food',      eng: 'a closed task',             note: 'the discrete unit of completed work' },
    { bio: 'nest',      eng: 'main / production',         note: 'where finished work lands and is real' },
    { bio: 'field',     eng: 'the commons',               note: 'repo, evals, pipeline, namespace — every shared substrate' },
    { bio: 'gardener',  eng: 'steward',                   note: 'tech lead, platform team, maintainer' },
  ];
  return (
    <div className="my-7 rounded-sm overflow-hidden"
      style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
      <div className="grid grid-cols-[auto_auto_1fr] gap-x-4 gap-y-3 p-5">
        <div className="mono-font text-[10px] uppercase tracking-[0.25em]" style={{color: PALETTE.textDim}}>biology</div>
        <div className="mono-font text-[10px] uppercase tracking-[0.25em]" style={{color: PALETTE.textDim}}>engineering</div>
        <div className="mono-font text-[10px] uppercase tracking-[0.25em]" style={{color: PALETTE.textDim}}>what it actually is</div>
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            <div className="display-font text-base italic" style={{color: PALETTE.text}}>{r.bio}</div>
            <div className="display-font text-base" style={{color: PALETTE.accent}}>{r.eng}</div>
            <div className="text-[12.5px] leading-relaxed self-center"
              style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{r.note}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Spectrum visualizer — slider showing how 10 properties shift
const Spectrum = () => {
  const [v, setV] = useState(50);
  const rows = [
    ['authority',    'central',       'distributed'],
    ['knowledge',    'concentrated',  'dispersed'],
    ['spec',         'prescriptive',  'descriptive'],
    ['integration',  'scheduled',     'continuous'],
    ['verification', 'against spec',  'through convergence'],
    ['coupling',     'explicit',      'implicit'],
    ['coordination', 'command',       'environmental signal'],
    ['failure',      'hard, total',   'soft, local'],
    ['strength',     'guarantees',    'adaptivity'],
    ['weakness',     'brittleness',   'commons degradation'],
  ];
  const t = v / 100;
  return (
    <div className="my-7">
      {/* the slider */}
      <div className="flex items-center justify-between mono-font text-[10px] uppercase tracking-[0.25em] mb-2">
        <span style={{color: t < 0.5 ? PALETTE.text : PALETTE.textMute}}>Planned</span>
        <span style={{color: t > 0.5 ? PALETTE.text : PALETTE.textMute}}>Emergent</span>
      </div>
      <div className="relative h-9 flex items-center">
        <div className="absolute left-0 right-0 h-1.5 rounded-full"
          style={{background: `linear-gradient(90deg, ${PALETTE.outbound}, ${PALETTE.inbound})`, opacity: 0.6}}/>
        <div className="absolute" style={{left: `calc(${v}% - 14px)`, width: 28, height: 28, borderRadius: '50%',
          background: PALETTE.accent, border: `3px solid ${PALETTE.bg}`,
          boxShadow: `0 0 0 1px ${PALETTE.accent}, 0 0 16px ${PALETTE.accent}aa`,
          pointerEvents: 'none',
        }}/>
        <input type="range" min="0" max="100" value={v} onChange={e => setV(+e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"/>
      </div>
      <div className="flex justify-between text-[11px] mb-5 mt-2"
        style={{color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>
        <span><i>e.g.</i> auth, schema, payments</span>
        <span><i>e.g.</i> dep patches, internal tools</span>
      </div>
      {/* the matrix */}
      <div className="rounded-sm overflow-hidden" style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
        {rows.map(([label, left, right], i) => {
          const leftAct = t < 0.5, rightAct = t > 0.5;
          return (
            <div key={i} className="grid grid-cols-[80px_1fr_1fr] items-center gap-3 px-4 py-2.5"
              style={{borderTop: i ? `1px solid ${PALETTE.border}` : 'none'}}>
              <div className="mono-font text-[10px] uppercase tracking-[0.2em]" style={{color: PALETTE.textDim}}>{label}</div>
              <div className="text-[13px] transition-all"
                style={{color: leftAct ? PALETTE.text : PALETTE.textMute,
                  fontFamily: 'Newsreader, serif',
                  fontWeight: leftAct ? 500 : 400}}>{left}</div>
              <div className="text-[13px] transition-all text-right"
                style={{color: rightAct ? PALETTE.text : PALETTE.textMute,
                  fontFamily: 'Newsreader, serif',
                  fontWeight: rightAct ? 500 : 400}}>{right}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Placement: 2D scatter with examples in quadrants. Click highlights.
const PlacementChart = () => {
  const items = [
    { id: 'auth',  label: 'Auth system',          x: 0.18, y: 0.85, mode: 'planned',  why: 'irreversible; specified by standards; coupled to everything' },
    { id: 'sch',   label: 'Schema migration',     x: 0.10, y: 0.72, mode: 'planned',  why: 'irreversible; specified by data shape; everything reads from it' },
    { id: 'pay',   label: 'Payments',             x: 0.05, y: 0.92, mode: 'planned',  why: 'literally money; regulated; bottom-left of "irreversible"' },
    { id: 'api',   label: 'Public API contract',  x: 0.22, y: 0.68, mode: 'planned',  why: 'breaking it breaks every consumer you can\'t see' },
    { id: 'patch', label: 'Dep patch bump',       x: 0.85, y: 0.4,  mode: 'emergent', why: 'one revert undoes it; tests catch regressions' },
    { id: 'flag',  label: 'Feature flag',         x: 0.78, y: 0.55, mode: 'emergent', why: 'flip on, flip off; no permanent state change' },
    { id: 'tool',  label: 'Internal dev tool',    x: 0.72, y: 0.20, mode: 'emergent', why: 'cheap to revert; many right answers; varied needs' },
    { id: 'proto', label: 'Prototype agent',      x: 0.86, y: 0.12, mode: 'emergent', why: 'whole point is to throw it away after learning' },
    { id: 'novel', label: 'Novel ML rollout',     x: 0.16, y: 0.18, mode: 'danger',   why: 'irreversible damage paired with unknown behavior. Make it reversible first.' },
  ];
  const [sel, setSel] = useState(null);
  const W = 600, H = 360;
  const px = (x) => 60 + x * (W - 90);
  const py = (y) => H - 50 - y * (H - 80);
  return (
    <div className="my-7 rounded-sm" style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
      <div className="relative" style={{padding: '12px'}}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* danger zone */}
          <rect x="60" y={H-50-(H-80)*0.5} width={(W-90)*0.5} height={(H-80)*0.5} fill={PALETTE.danger} opacity="0.08"/>
          <rect x="60" y={H-50-(H-80)*0.5} width={(W-90)*0.5} height={(H-80)*0.5} fill="none"
            stroke={PALETTE.danger} strokeOpacity="0.4" strokeDasharray="4,3"/>
          <text x="80" y={H-50-(H-80)*0.5+22} fontSize="10" fill={PALETTE.danger} opacity="0.85"
            style={{fontFamily: 'ui-monospace', textTransform: 'uppercase', letterSpacing: '0.2em'}}>danger zone</text>
          {/* axes */}
          <line x1="60" y1={H-50} x2={W-30} y2={H-50} stroke={PALETTE.border} strokeWidth="1"/>
          <line x1="60" y1="30" x2="60" y2={H-50} stroke={PALETTE.border} strokeWidth="1"/>
          {/* axis labels */}
          <text x="60" y={H-30} fontSize="10" fill={PALETTE.textDim}
            style={{fontFamily: 'ui-monospace', textTransform: 'uppercase', letterSpacing: '0.2em'}}>← Reversible · Irreversible →</text>
          <text x="60" y="22" fontSize="10" fill={PALETTE.textDim}
            style={{fontFamily: 'ui-monospace', textTransform: 'uppercase', letterSpacing: '0.2em'}}>↑ Specified · ↓ Exploratory</text>
          {/* items */}
          {items.map(it => {
            const cx = px(1 - it.x), cy = py(it.y);
            const c = it.mode === 'planned' ? PALETTE.outbound : it.mode === 'emergent' ? PALETTE.inbound : PALETTE.danger;
            const active = sel?.id === it.id;
            return (
              <g key={it.id} style={{cursor: 'pointer'}} onClick={() => setSel(sel?.id === it.id ? null : it)}>
                <circle cx={cx} cy={cy} r={active ? 11 : 8} fill={c} opacity={active ? 1 : 0.85}
                  stroke={active ? PALETTE.text : 'none'} strokeWidth="1.5"/>
                <text x={cx + 14} y={cy + 4} fontSize="11" fill={active ? PALETTE.text : PALETTE.textDim}
                  style={{fontFamily: 'Newsreader, serif'}}>{it.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {sel ? (
        <div className="px-5 py-3 border-t" style={{borderColor: PALETTE.border}}>
          <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-1.5"
            style={{color: sel.mode === 'planned' ? PALETTE.outbound : sel.mode === 'emergent' ? PALETTE.inbound : PALETTE.danger}}>
            {sel.mode === 'planned' ? 'Planned' : sel.mode === 'emergent' ? 'Emergent' : 'Don\'t put work here'}
          </div>
          <div className="text-[13px] leading-relaxed"
            style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>
            <span className="display-font" style={{color: PALETTE.text}}>{sel.label}.</span> {sel.why}
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 border-t text-[12px] italic"
          style={{borderColor: PALETTE.border, color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>
          Tap any decision to see why it lands where it does.
        </div>
      )}
    </div>
  );
};

// Pace layers diagram — six horizontal bands
const PaceLayers = () => {
  const layers = [
    { rate: 'Years',   name: 'Governance',     ex: 'policy, accountability, compliance posture',           c: PALETTE.steward },
    { rate: 'Months',  name: 'Architecture',   ex: 'platform primitives, schemas, contracts, trust model', c: PALETTE.outbound },
    { rate: 'Weeks',   name: 'Capabilities',   ex: 'tools, connectors, retrieval, eval harnesses',         c: PALETTE.nest },
    { rate: 'Days',    name: 'Orchestration',  ex: 'agent graphs, routing, delegation',                    c: PALETTE.accent },
    { rate: 'Hours',   name: 'Agents',         ex: 'system prompts, strategies, tool selections',          c: PALETTE.inbound },
    { rate: 'Minutes', name: 'Invocations',    ex: 'a single task run',                                    c: PALETTE.food },
  ];
  return (
    <div className="my-7 rounded-sm overflow-hidden"
      style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
      <div className="px-5 pt-4 pb-2 mono-font text-[10px] uppercase tracking-[0.25em]"
        style={{color: PALETTE.textDim}}>
        slowest at top — fastest at bottom
      </div>
      {layers.map((l, i) => (
        <div key={i} className="grid grid-cols-[110px_140px_1fr_auto] gap-4 items-center px-5 py-3.5"
          style={{borderTop: i ? `1px solid ${PALETTE.border}` : 'none',
            background: `linear-gradient(90deg, ${l.c}10, transparent 60%)`}}>
          <div className="mono-font text-xs uppercase tracking-[0.2em]" style={{color: l.c}}>{l.rate}</div>
          <div className="display-font text-base" style={{color: PALETTE.text}}>{l.name}</div>
          <div className="text-[12.5px] italic"
            style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{l.ex}</div>
          <div className="w-2 h-2 rounded-full" style={{background: l.c, boxShadow: `0 0 8px ${l.c}`}}/>
        </div>
      ))}
      <div className="px-5 py-3 border-t flex items-center justify-between"
        style={{borderColor: PALETTE.border}}>
        <div className="flex items-center gap-2 mono-font text-[10px] uppercase tracking-[0.2em]"
          style={{color: PALETTE.textMute}}>
          <ArrowDown size={11}/> authority flows down
        </div>
        <div className="flex items-center gap-2 mono-font text-[10px] uppercase tracking-[0.2em]"
          style={{color: PALETTE.textMute}}>
          signals bubble up <ArrowDown size={11} style={{transform: 'rotate(180deg)'}}/>
        </div>
      </div>
    </div>
  );
};


// Loop anatomy — animated 5-stage cycle as SVG
const LoopAnatomy = () => {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(v => (v + 1) % 5), 1400);
    return () => clearInterval(id);
  }, []);
  const stages = [
    { name: 'Signal',   note: 'a trace in the terrain fires the loop',      c: PALETTE.outbound },
    { name: 'Action',   note: 'an agent does scoped work',                  c: PALETTE.text },
    { name: 'Verify',   note: 'an outside reference checks the work',       c: PALETTE.nest },
    { name: 'Commit',   note: 'the result lands — or rolls back',           c: PALETTE.inbound },
    { name: 'Update',   note: 'outcome feeds back as new signal',           c: PALETTE.accent },
  ];
  const cx = 200, cy = 200, R = 130;
  return (
    <div className="my-7 rounded-sm grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6 p-5"
      style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-[400px]">
          <circle cx={cx} cy={cy} r={R} fill="none"
            stroke={PALETTE.border} strokeWidth="1" strokeDasharray="3,3"/>
          {stages.map((s, i) => {
            const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = cx + Math.cos(a) * R;
            const y = cy + Math.sin(a) * R;
            const active = i === t;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={active ? 26 : 18} fill={active ? s.c : PALETTE.bgDeep}
                  stroke={s.c} strokeWidth={active ? 2 : 1}
                  style={{transition: 'r 250ms, fill 250ms'}}/>
                <text x={x} y={y + 4} textAnchor="middle" fontSize="11"
                  fill={active ? PALETTE.bg : s.c} fontWeight="500"
                  style={{fontFamily: 'ui-monospace', textTransform: 'uppercase', letterSpacing: '0.1em'}}>
                  {i + 1}
                </text>
                <text x={x} y={y + (a > Math.PI/2 || a < -Math.PI/2 ? 50 : -32)}
                  textAnchor="middle" fontSize="13" fill={active ? PALETTE.text : PALETTE.textDim}
                  style={{fontFamily: 'Fraunces, serif', transition: 'fill 250ms'}}>
                  {s.name}
                </text>
              </g>
            );
          })}
          {/* center label */}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill={PALETTE.textMute}
            style={{fontFamily: 'ui-monospace', textTransform: 'uppercase', letterSpacing: '0.25em'}}>
            one loop
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="14" fill={PALETTE.text}
            style={{fontFamily: 'Fraunces, serif', fontStyle: 'italic'}}>
            closes on itself
          </text>
        </svg>
      </div>
      <div className="flex flex-col justify-center gap-3">
        {stages.map((s, i) => (
          <div key={i} className="flex gap-3 items-start"
            style={{opacity: i === t ? 1 : 0.55, transition: 'opacity 250ms'}}>
            <div className="mono-font text-[10px] mt-1 px-1.5 py-0.5 rounded-sm"
              style={{color: s.c, border: `1px solid ${s.c}66`, fontWeight: 600}}>
              {i + 1}
            </div>
            <div>
              <div className="display-font text-base mb-0.5" style={{color: PALETTE.text}}>{s.name}</div>
              <div className="text-[12.5px]"
                style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{s.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loop catalog — twelve real loops as cards
const LoopCatalog = () => {
  const [tier, setTier] = useState('starter');
  const loops = {
    starter: [
      { name: 'Dependency patch',   one: 'Bump version, run tests, merge if green.',           use: 'every codebase' },
      { name: 'Stale doc refresh',  one: 'Detect drift between code and docs, rewrite, flag uncertain claims.', use: 'mature docs' },
      { name: 'Flaky test',         one: 'Detect flakiness, attempt scoped fix, quarantine if persistent.', use: 'CI > 200 tests' },
      { name: 'Dead code',          one: 'Combine coverage + telemetry + imports, propose deletion.', use: 'long-lived repos' },
    ],
    middle: [
      { name: 'Triage',             one: 'Read the full signal field, rank work for the next sprint.', use: 'when starter loops accumulate' },
      { name: 'On-call assist',     one: 'Pull runbook + recent deploys + similar incidents, draft hypothesis.', use: 'mature alerting' },
      { name: 'Refactor candidate', one: 'Combine churn + coupling + fragility into a refactor-pressure score.', use: 'quarterly hygiene' },
      { name: 'Test backfill',      one: 'Pin coverage on hot fragile code, mark behavioral vs specified.', use: 'untested critical paths' },
      { name: 'Security patch',     one: 'CVE → matched dep → PR with advisory and version.', use: 'any prod system' },
    ],
    advanced: [
      { name: 'Feature prototype',     one: 'Agents build competing implementations against acceptance assertions.',  use: 'mature terrain only' },
      { name: 'Spec by adversary',     one: 'Subagents try to falsify each assertion against the implementation.',     use: 'well-bounded interfaces' },
      { name: 'Migration',             one: 'Decompose long migration into independently-reversible shards.',          use: 'schema/framework moves' },
      { name: 'Capacity routing',      one: 'Match incoming work to the agent whose track record fits the class.',     use: 'multi-agent fleets' },
      { name: 'Disturbance',           one: 'Deliberately break things to surface hidden dependencies.',                use: 'monthly cadence' },
    ],
  };
  return (
    <div className="my-7">
      <div className="flex gap-2 mb-4">
        {['starter', 'middle', 'advanced'].map(k => (
          <button key={k} onClick={() => setTier(k)}
            className="px-3 py-1.5 mono-font text-[10px] uppercase tracking-[0.2em] rounded-sm transition-all"
            style={{
              background: tier === k ? PALETTE.accent : 'transparent',
              color: tier === k ? PALETTE.bg : PALETTE.textDim,
              border: `1px solid ${tier === k ? PALETTE.accent : PALETTE.border}`,
            }}>
            {k}
          </button>
        ))}
        <span className="mono-font text-[10px] uppercase tracking-[0.2em] self-center ml-2" style={{color: PALETTE.textMute}}>
          {tier === 'starter' ? 'high reversibility, narrow scope' :
           tier === 'middle' ? 'richer signals, still reversible' :
           'attempt only after starter & middle are durable'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loops[tier].map((l, i) => (
          <div key={i} className="p-4 rounded-sm transition-all hover:translate-y-[-1px]"
            style={{background: PALETTE.card, border: `1px solid ${PALETTE.border}`,
              borderLeft: `2px solid ${PALETTE.accent}`}}>
            <div className="display-font text-base mb-1.5" style={{color: PALETTE.text}}>{l.name}</div>
            <div className="text-[12.5px] leading-relaxed mb-2"
              style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{l.one}</div>
            <div className="mono-font text-[9px] uppercase tracking-[0.2em]" style={{color: PALETTE.textMute}}>
              {l.use}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Death-spirals comparison — two-column failure modes
const DeathSpirals = () => {
  const cols = [
    {
      title: 'Emergent collapse',
      sub:   'reinforcement without counter-force runs away',
      icon:  Repeat,
      color: PALETTE.inbound,
      arch:  'the ant mill',
      arch_note: 'army ants who lose the trail follow each other in a circle until the colony dies of exhaustion',
      software: ['retry storms', 'agents citing each other into ungrounded confidence', 'recommendation loops narrowing onto local optima', 'evals that drift to reward surface features agents then optimize for'],
      symptom: 'signal-to-noise declining while activity rises; same patterns recurring across unrelated tasks; eval scores diverging from real outcomes',
      remedy: 'inject variety; increase decay; add an outside reference; tighten trust; in severe cases, evacuate and restart',
    },
    {
      title: 'Planned collapse',
      sub:   'specification loses contact with reality faster than it can update',
      icon:  AlertTriangle,
      color: PALETTE.outbound,
      arch:  'the airport baggage system',
      arch_note: 'Denver, NHS NPfIT, Healthcare.gov — requirements changed during development; spec couldn\'t keep up; integration revealed the gap, catastrophically',
      software: ['central orchestrator that plans fully before executing', 'top-level coordinator becomes bottleneck', 'spec-first workflow locks in an interface that turns out wrong', 'single reviewer becomes the bus-factor-of-one'],
      symptom: 'backlog of exceptions grows faster than the plan absorbs them; WIP accumulates; outputs are superficially correct but fail in composition; the spec becomes ceremony',
      remedy: 'shorten the integration cycle; decentralize what doesn\'t need central authority; turn the spec into executable contract; distribute approval by domain',
    },
  ];
  return (
    <div className="my-7 grid grid-cols-1 md:grid-cols-2 gap-4">
      {cols.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="p-5 rounded-sm" style={{
            background: PALETTE.card, border: `1px solid ${PALETTE.border}`,
            borderTop: `2px solid ${c.color}`,
          }}>
            <Icon size={18} style={{color: c.color}}/>
            <div className="display-font text-xl mt-2 mb-1" style={{color: PALETTE.text}}>{c.title}</div>
            <div className="display-font italic text-sm mb-4" style={{color: c.color}}>{c.sub}</div>

            <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-1" style={{color: PALETTE.textDim}}>archetype</div>
            <div className="text-[13px] mb-1" style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{c.arch}</div>
            <div className="text-[12px] italic mb-4" style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{c.arch_note}</div>

            <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-2" style={{color: PALETTE.textDim}}>in software</div>
            <ul className="mb-4 space-y-1">
              {c.software.map((s, j) => (
                <li key={j} className="text-[12.5px] pl-3"
                  style={{color: PALETTE.text, fontFamily: 'Newsreader, serif',
                    borderLeft: `2px solid ${c.color}55`}}>{s}</li>
              ))}
            </ul>

            <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-1" style={{color: PALETTE.textDim}}>warning sign</div>
            <div className="text-[12.5px] mb-4" style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{c.symptom}</div>

            <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-1" style={{color: PALETTE.textDim}}>remedy</div>
            <div className="text-[12.5px]" style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{c.remedy}</div>
          </div>
        );
      })}
    </div>
  );
};

// Guardrail layers — four classes stacked
const GuardrailLayers = () => {
  const rails = [
    { name: 'Structural',   ask: 'Can this even happen?',                   ex: 'schema validation, capability scoping, sandboxing, type systems', note: 'cheapest, most reliable: forbidden actions are simply impossible' },
    { name: 'Reactive',     ask: 'Did this just happen, should it continue?', ex: 'rate limits, circuit breakers, content filters, test gates',     note: 'fires at the moment of action; must not depend on the thing it\'s guarding' },
    { name: 'Dynamic',      ask: 'Is the system drifting?',                 ex: 'approval rates, error budgets, eval drift, canaries',              note: 'operates over time; main design challenge is avoiding false-positive fatigue' },
    { name: 'Reflective',   ask: 'Are our guardrails still working?',       ex: 'postmortems, chaos engineering, meta-evals',                       note: 'most important — without it, the others decay silently' },
  ];
  return (
    <div className="my-7 rounded-sm overflow-hidden"
      style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
      {rails.map((r, i) => (
        <div key={i} className="p-5 flex flex-col md:flex-row gap-4"
          style={{borderTop: i ? `1px solid ${PALETTE.border}` : 'none',
            background: `linear-gradient(90deg, ${PALETTE.accent}${i === 3 ? '12' : '06'}, transparent 40%)`}}>
          <div className="md:w-[180px] flex-shrink-0">
            <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-1"
              style={{color: PALETTE.accent}}>Layer {i + 1}</div>
            <div className="display-font text-xl" style={{color: PALETTE.text}}>{r.name}</div>
          </div>
          <div className="flex-1">
            <div className="display-font italic text-base mb-2" style={{color: PALETTE.textDim}}>"{r.ask}"</div>
            <div className="text-[13px] mb-1" style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{r.ex}</div>
            <div className="text-[12px] italic" style={{color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>{r.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Approval economics — interactive gate/rate/budget calculator
const ApprovalCalc = () => {
  const [inflow, setInflow] = useState(40);
  const [rate, setRate] = useState(85);
  const [budget, setBudget] = useState(30);
  const queue = Math.max(0, inflow - budget);
  const sustainable = inflow <= budget;
  const burned = budget * (1 - rate / 100);
  return (
    <div className="my-7 p-5 rounded-sm"
      style={{background: PALETTE.card, border: `1px solid ${PALETTE.border}`}}>
      <Slider label="Proposals entering gates / week" value={inflow} min={0} max={120} step={1}
        onChange={setInflow} color={PALETTE.outbound}
        hint="raw output of the agent loops"/>
      <Slider label="Approval rate (%)" value={rate} min={0} max={100} step={1}
        onChange={setRate} color={PALETTE.inbound}
        format={v => `${v}%`}
        hint="fraction of gated proposals that earn a yes"/>
      <Slider label="Steward budget (approvals / week)" value={budget} min={0} max={120} step={1}
        onChange={setBudget} color={PALETTE.accent}
        hint="fixed by reality — humans can only consider so many things carefully"/>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-sm" style={{background: PALETTE.bgDeep, border: `1px solid ${PALETTE.border}`}}>
          <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-1" style={{color: PALETTE.textDim}}>queue / week</div>
          <div className="display-font text-2xl" style={{color: queue > 0 ? PALETTE.danger : PALETTE.ok}}>
            {queue > 0 ? `+${queue}` : '0'}
          </div>
          <div className="text-[11px] italic"
            style={{color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>
            {queue > 0 ? 'work piles up; rubber-stamping or stalls follow' : 'sustainable — for now'}
          </div>
        </div>
        <div className="p-3 rounded-sm" style={{background: PALETTE.bgDeep, border: `1px solid ${PALETTE.border}`}}>
          <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-1" style={{color: PALETTE.textDim}}>budget on this loop</div>
          <div className="display-font text-2xl" style={{color: PALETTE.text}}>
            {Math.min(inflow, budget).toFixed(0)}
          </div>
          <div className="text-[11px] italic"
            style={{color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>
            considered approvals consumed
          </div>
        </div>
        <div className="p-3 rounded-sm" style={{background: PALETTE.bgDeep, border: `1px solid ${PALETTE.border}`}}>
          <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-1" style={{color: PALETTE.textDim}}>signal</div>
          <div className="display-font text-2xl" style={{color: rate > 92 ? PALETTE.accent : (rate < 70 ? PALETTE.danger : PALETTE.text)}}>
            {rate > 92 ? 'widen gate' : rate < 70 ? 'narrow gate' : 'hold'}
          </div>
          <div className="text-[11px] italic"
            style={{color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>
            {rate > 92 ? 'consistently approving — automate this class' : rate < 70 ? 'agent drifting on this class' : 'the gate is well-placed'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Trust properties — five cards
const TrustProperties = () => {
  const props = [
    { name: 'Earned',      ex: 'through track record on a specific class — not by fiat' },
    { name: 'Narrow',      ex: 'auto-merge on patches transfers nothing to schema changes' },
    { name: 'Conditional', ex: 'depends on the model, tools, codebase that earned it' },
    { name: 'Revocable',   ex: 'withdrawable instantly on evidence of failure' },
    { name: 'Expiring',    ex: 'decays without renewal; old grants reset to a lower baseline' },
  ];
  return (
    <div className="my-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
      {props.map((p, i) => (
        <div key={i} className="p-4 rounded-sm"
          style={{background: PALETTE.card, border: `1px solid ${PALETTE.border}`,
            borderTop: `2px solid ${PALETTE.accent}`}}>
          <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-2" style={{color: PALETTE.textDim}}>0{i+1}</div>
          <div className="display-font text-lg mb-2" style={{color: PALETTE.text}}>{p.name}</div>
          <div className="text-[12px] leading-relaxed italic"
            style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{p.ex}</div>
        </div>
      ))}
    </div>
  );
};

// Authority levels — read/write/commit/deploy/external
const AuthorityLevels = () => {
  const ls = [
    { name: 'Read',     def: 'wide by default — agents need context',                             c: PALETTE.outbound },
    { name: 'Write',    def: 'narrow by default — class-by-class expansion',                      c: PALETTE.nest },
    { name: 'Commit',   def: 'none by default — earned per class through track record',           c: PALETTE.accent },
    { name: 'Deploy',   def: 'never autonomous on the irreversible — agents propose, humans yes', c: PALETTE.steward },
    { name: 'External', def: 'API calls with cost, emails, filings, trades — explicit grants only', c: PALETTE.danger },
  ];
  return (
    <div className="my-6 rounded-sm overflow-hidden"
      style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
      {ls.map((l, i) => (
        <div key={i} className="grid grid-cols-[100px_1fr_auto] items-center gap-4 px-5 py-3"
          style={{borderTop: i ? `1px solid ${PALETTE.border}` : 'none'}}>
          <div className="mono-font text-xs uppercase tracking-[0.2em]" style={{color: l.c}}>{l.name}</div>
          <div className="text-[12.5px] italic"
            style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{l.def}</div>
          <div className="w-1.5 h-1.5 rounded-full" style={{background: l.c, boxShadow: `0 0 8px ${l.c}`}}/>
        </div>
      ))}
    </div>
  );
};

// Staged transition — 7 stages as horizontal journey
const Journey = () => {
  const stages = [
    { n: 0, name: 'Legible terrain',    one: 'Instrument the environment for non-human readers and writers — before any agent does meaningful work.' },
    { n: 1, name: 'Close one loop',     one: 'Pick one small reversible loop. Make it work end-to-end.' },
    { n: 2, name: 'Replicate',          one: 'Build more loops of the same shape. Resist broadening any one.' },
    { n: 3, name: 'Coordinate',         one: 'Let loops interact through signals in the terrain.' },
    { n: 4, name: 'Plan',               one: 'Introduce planners and routers that read the full signal field.' },
    { n: 5, name: 'Earn the approval',  one: 'Class by class, move agent-task pairs from propose to auto-apply with sampling review.' },
    { n: 6, name: 'De-automate gracefully', one: 'Maintain the ability to revoke an earned approval when failure modes outgrow it.' },
  ];
  return (
    <div className="my-7 space-y-3">
      {stages.map((s, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-sm"
          style={{background: PALETTE.card, border: `1px solid ${PALETTE.border}`,
            borderLeft: `2px solid ${i === 0 ? PALETTE.danger : PALETTE.accent}`}}>
          <div className="flex-shrink-0 w-12 h-12 rounded-sm flex items-center justify-center display-font text-2xl"
            style={{background: PALETTE.bgDeep, color: PALETTE.accent, border: `1px solid ${PALETTE.border}`}}>
            {s.n}
          </div>
          <div className="flex-1">
            <div className="display-font text-base mb-1" style={{color: PALETTE.text}}>{s.name}</div>
            <div className="text-[12.5px] leading-relaxed"
              style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{s.one}</div>
          </div>
        </div>
      ))}
      <div className="text-[12px] italic mt-2 px-1"
        style={{color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>
        Stages overlap. The order is real. You can't skip Stage 0 — the most often skipped, and the most often the reason the rest of the work fails.
      </div>
    </div>
  );
};

// Health signature — five indicators
const HealthSignature = () => {
  const indicators = [
    { name: 'Variety high but bounded',     ex: 'different agents solve similar problems differently, within recognized range' },
    { name: 'Flow steady',                  ex: 'arrival ≈ completion over moderate windows' },
    { name: 'Escalations rare but real',    ex: 'humans called only for things that genuinely need judgment' },
    { name: 'Signals correlate with reality', ex: 'when evals say quality is up, users say quality is up' },
    { name: 'Commons stays clean',          ex: 'stale signals pruned; abandoned branches die; unused tools retire' },
  ];
  return (
    <div className="my-7 grid grid-cols-1 md:grid-cols-2 gap-3">
      {indicators.map((it, i) => (
        <div key={i} className="p-4 rounded-sm flex gap-3 items-start"
          style={{background: PALETTE.card, border: `1px solid ${PALETTE.border}`}}>
          <div className="w-2 h-2 mt-2 rounded-full"
            style={{background: PALETTE.ok, boxShadow: `0 0 10px ${PALETTE.ok}`}}/>
          <div>
            <div className="display-font text-[15px] mb-1" style={{color: PALETTE.text}}>{it.name}</div>
            <div className="text-[12px] italic"
              style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{it.ex}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Eras visualization — for the opening hero
const ErasTable = () => {
  const eras = [
    { era: 'Lines',   unit: 'the instruction',     role: 'Author',    matter: 'writing it well' },
    { era: 'Modules', unit: 'the component',       role: 'Architect', matter: 'arranging them well' },
    { era: 'Loops',   unit: 'the autonomous cycle', role: 'Steward',   matter: 'shaping conditions where work happens', active: true },
  ];
  return (
    <div className="rounded-sm overflow-hidden mb-4"
      style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
      <div className="grid grid-cols-[80px_1fr_1fr_2fr] gap-4 px-5 py-3 mono-font text-[10px] uppercase tracking-[0.25em]"
        style={{color: PALETTE.textMute, borderBottom: `1px solid ${PALETTE.border}`}}>
        <div>Era</div><div>Unit of work</div><div>Engineer's role</div><div>What mattered</div>
      </div>
      {eras.map((e, i) => (
        <div key={i} className="grid grid-cols-[80px_1fr_1fr_2fr] gap-4 px-5 py-4 items-baseline"
          style={{borderTop: i ? `1px solid ${PALETTE.border}` : 'none',
            background: e.active ? `${PALETTE.accent}10` : 'transparent'}}>
          <div className="display-font text-xl"
            style={{color: e.active ? PALETTE.accent : PALETTE.text}}>{e.era}</div>
          <div className="text-[13px] italic"
            style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{e.unit}</div>
          <div className="display-font text-base"
            style={{color: e.active ? PALETTE.accent : PALETTE.text}}>{e.role}</div>
          <div className="text-[13px]"
            style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{e.matter}</div>
        </div>
      ))}
    </div>
  );
};

// Five composition patterns
const CompositionPatterns = () => {
  const ps = [
    { name: 'Shell and core',       one: 'A firm planned interface around an emergent interior.', ex: 'microservice contracts, OS kernels, constitutions' },
    { name: 'Scaffold and release', one: 'Planned builds the initial structure; emergent takes over.', ex: 'failure mode is overstaying the planned phase' },
    { name: 'Nested zones',         one: 'Planned zones contain emergent zones contain planned zones.', ex: 'handle things at the lowest layer that can hold them' },
    { name: 'Alternating breath',   one: 'The two modes take turns in time.',  ex: 'divergent · convergent · divergent · convergent' },
    { name: 'Zoning',               one: 'Risk-stratified coexistence.',       ex: 'payments stay planned; feature flags stay emergent — same system' },
  ];
  return (
    <div className="my-6 space-y-2">
      {ps.map((p, i) => (
        <div key={i} className="grid grid-cols-[140px_1fr_1fr] gap-4 p-3 rounded-sm items-start"
          style={{background: PALETTE.card, border: `1px solid ${PALETTE.border}`}}>
          <div className="display-font text-base" style={{color: PALETTE.accent}}>{p.name}</div>
          <div className="text-[12.5px]" style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{p.one}</div>
          <div className="text-[12px] italic" style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{p.ex}</div>
        </div>
      ))}
    </div>
  );
};

// The eight Ostrom commons principles, condensed
const CommonsPrinciples = () => {
  const ps = [
    'Clear boundaries — every emitter has identity, every consumer a stated interest',
    'Congruence — rules fit the resource',
    'Collective choice — those affected can modify the rules',
    'Monitoring — watchers accountable to users, not distant authority',
    'Graduated sanctions — first offense lighter than the third',
    'Cheap conflict resolution — expensive resolution → hidden conflict → worse',
    'Rights to organize — meaningful local autonomy',
    'Nested enterprises — large commons are layered commons',
  ];
  return (
    <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-2">
      {ps.map((p, i) => (
        <div key={i} className="flex gap-3 items-baseline p-3 rounded-sm"
          style={{background: PALETTE.card, border: `1px solid ${PALETTE.border}`}}>
          <div className="mono-font text-[10px]" style={{color: PALETTE.accent}}>0{i+1}</div>
          <div className="text-[12.5px]" style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{p}</div>
        </div>
      ))}
    </div>
  );
};

// Vocab map for the simulation chapters
const VocabMap = ({ vocabMode }) => {
  const items = [
    ['ant',       'agent'],
    ['pheromone', 'signal'],
    ['trail',     'merge path / shared knowledge'],
    ['food',      'closed task'],
    ['nest',      'main / production'],
    ['field',     'the commons'],
    ['gardener',  'steward'],
  ];
  return (
    <div className="rounded-sm overflow-hidden"
      style={{border: `1px solid ${PALETTE.border}`, background: PALETTE.card}}>
      {items.map(([b, e], i) => (
        <div key={i} className="grid grid-cols-2 gap-3 px-3 py-2.5"
          style={{borderTop: i ? `1px solid ${PALETTE.border}` : 'none'}}>
          <div className="text-[13px] italic"
            style={{color: vocabMode === 'eng' ? PALETTE.textMute : PALETTE.text,
              fontFamily: 'Newsreader, serif'}}>{b}</div>
          <div className="text-[13px]"
            style={{color: vocabMode === 'eng' ? PALETTE.text : PALETTE.textMute,
              fontFamily: 'Newsreader, serif'}}>{e}</div>
        </div>
      ))}
    </div>
  );
};


/* ────────────────────────────────────────────────────────────────────
   CHAPTERS — the workbook
   types: 'hero' | 'sim' | 'reading'
   ──────────────────────────────────────────────────────────────────── */

const CHAPTERS = [
  // ── Part I: Setting the stage ──────────────────────────────
  {
    id: 'welcome',
    type: 'hero',
    kicker: 'Begin',
    title: 'Many Hands Engineering',
    subtitle: 'How software gets made when many of the hands aren\'t human.',
    blocks: [
      { kind: 'body', text: 'Software used to be a thing you wrote. It is now, increasingly, a thing you grow. Some of the hands typing the code are human; some are not. Some of the work is fast, some is slow; some carries judgment, some shouldn\'t. None of the old engineering wisdom is obsolete — but it has stopped being enough.' },
      { kind: 'body', text: 'This is a guide to growing software well in that world. The ideas come from biology, economics, distributed systems, commons governance, and the lived experience of building at scale. We\'ll start with something you can watch — a colony of ants — and end somewhere you can use on Monday morning.' },
      { kind: 'cta', text: 'Begin →' },
    ],
  },
  {
    id: 'turn',
    type: 'hero',
    kicker: 'The turn',
    title: 'The unit of work has shifted before.',
    subtitle: 'We\'re past two of three eras already.',
    blocks: [
      { kind: 'body', text: 'Engineering has gone through this kind of shift before. Each time, the unit of work changes; each time, the engineer\'s role moves with it.' },
      { kind: 'eras' },
      { kind: 'body', text: 'It used to be building the thing. Now it\'s building the thing that makes the thing. The work the engineer does still matters — it has just moved upstream, into the design of the conditions under which other work happens.' },
      { kind: 'small', text: 'What does that look like? It\'s easier to show you a system you\'ve already seen. The colony, by ants. The colony, by us.' },
    ],
  },

  // ── Part II: The metaphor — colonies first ──────────────────
  {
    id: 'colony',
    type: 'sim',
    kicker: 'Chapter 01',
    title: 'A working colony.',
    subtitle: 'Watch first. Theory later.',
    body: 'These ants are looking for food. They have no map, no leader, no central planner. They\'re each running the same simple loop, alone. After about thirty seconds, something appears between the nest and the food that no individual ant designed. Just watch.',
    callout: { label: 'Try', text: 'Click anywhere on the field to drop another food source. The colony will find it.' },
    bridge: 'Nothing in any single ant\'s head explains the trail. The trail is in the field, not the ants. Hold that idea — it\'s where everything else starts.',
    config: { antCount: 35, ...TUNED, foods: 'one' },
    showSliders: [],
    interactive: 'food-place',
    timedHint: { delay: 8000, text: 'Click anywhere to drop another food source.' },
  },
  {
    id: 'algorithm',
    type: 'sim',
    kicker: 'Chapter 02',
    title: 'The algorithm.',
    subtitle: 'Almost nothing, repeated thousands of times.',
    body: 'Reduce the colony to one. The whole program every ant runs fits on an index card: walk forward, sense the ground ahead, leave a small mark. That\'s it. No thinking, no map, no intent. The colony\'s intelligence cannot live inside this ant — there isn\'t room. So where does it live?',
    callout: { label: 'The puzzle', text: 'Where does the trail come from, if not from any individual?' },
    bridge: 'Not in any ant. Not in a controller — there isn\'t one. The intelligence is somewhere else.',
    math: 'Each ant\'s state: position, heading, mode (foraging or returning). About a dozen bits. The decision per step: which way am I leaning, what\'s strongest in front of me, do I take that direction or wander. No more.',
    config: { antCount: 1, decayRate: 0.008, deposit: 1.0, diffuse: 0.06, foods: 'close-one' },
    showSliders: ['deposit'],
    interactive: 'food-place',
  },
  {
    id: 'decay',
    type: 'sim',
    kicker: 'Chapter 03',
    title: 'The mark must fade.',
    subtitle: 'A signal that lasts forever isn\'t a signal.',
    body: 'A permanent mark would tell the colony where ants used to go. That\'s history, not information. The chemical evaporates, and that evaporation is what turns a stain into a question — is this still relevant? — answered by its current strength. Decay is what makes a signal mean something now.',
    callout: { label: 'Try', text: 'Crank decay all the way up. Then all the way down. Find the band where a trail can hold at all.' },
    bridge: 'The trail isn\'t a record of where ants have been. It\'s a record of where ants are still going. Without decay, that distinction collapses.',
    math: 'γ controls the field\'s memory. Decay too slow → the field saturates and means nothing. Decay too fast → no path can hold. The healthy band is roughly γ ≈ R / (n · t), where R is deposit rate, n the colony size, t the round-trip time. The same shape will reappear when we talk about engineering signals.',
    config: { antCount: 3, decayRate: 0.008, deposit: 1.0, diffuse: 0.06, foods: 'close-one' },
    showSliders: ['deposit', 'decay'],
    sweetSpots: { decay: [0.004, 0.018], deposit: [0.6, 1.6] },
    interactive: 'food-place',
  },
  {
    id: 'emergence',
    type: 'sim',
    kicker: 'Chapter 04',
    title: 'Many hands.',
    subtitle: 'The structure is in the field, not the workers.',
    body: 'Now turn the colony back up. Thirty ants, each running the same trivial loop, none of them coordinating. The marks accumulate where ants happen to walk. Stronger marks attract more ants. More ants make stronger marks. The first vague streak feeds itself, gets sharper, beats out competitors. A path appears that no individual designed and no individual could have designed.',
    callout: { label: 'Watch', text: 'The trail isn\'t drawn — it\'s argued for. Every ant casts a tiny vote in pheromone, and the strongest path wins.' },
    bridge: 'This pattern — many independent loops, leaving fading traces in a shared substrate, summing into structure — has another name when humans do it. We\'ll get there.',
    math: 'The dynamics are reaction-diffusion: ∂C/∂t = R · n(x,t) − γC + D∇²C. Concentration C, deposit R, decay γ, diffusion D, ant density n. The same equation describes slime mold aggregating, neural patterning, traffic forming, engineering teams converging on shared idioms. Sharp traveling fronts emerge when amplification beats dissipation.',
    config: { antCount: 30, ...TUNED, foods: 'two' },
    showSliders: ['population', 'decay', 'deposit', 'diffuse'],
    sweetSpots: { decay: [0.004, 0.018], deposit: [0.6, 1.6], diffuse: [0.04, 0.12] },
    interactive: 'food-place',
  },
  {
    id: 'threshold',
    type: 'sim',
    kicker: 'Chapter 05',
    title: 'Below this number — no colony.',
    subtitle: 'Coordination is a phase transition.',
    body: 'How many ants do you need? Below a critical count, marks fade before any other ant arrives, and the field never accumulates enough to bias anyone. Above it, a trail snaps into being almost suddenly. There\'s no smooth middle. Coordination has a threshold — n*. Below: a crowd. Above: a colony.',
    callout: { label: 'Try', text: 'Drop the population to 4. The field stays quiet. Slide past 12. Something switches on.' },
    bridge: 'The same threshold exists for human teams. Three people coordinate by talking. Thirty have no choice but to coordinate through the substrate around them — the codebase, the test suite, the conventions, the shared language. The mechanism we\'ve been watching is theirs.',
    math: 'Self-reinforcing dynamics change qualitatively when a control parameter crosses a critical value. Below n*, perturbations die. Above, they grow until something stops them. The transition is sharp because reinforcement is autocatalytic — more signal causes more signal. That\'s the math of how a path goes from imaginary to inevitable in a few seconds.',
    config: { antCount: 8, ...TUNED, foods: 'one' },
    showSliders: ['population'],
    interactive: 'food-place',
    showPhase: true,
  },

  // ── Part III: Pivot from biology to software ────────────────
  {
    id: 'bridge',
    type: 'reading',
    kicker: 'Chapter 06',
    title: 'Same mechanism. Different units.',
    subtitle: 'What you\'ve been watching is also how software gets built.',
    blocks: [
      { kind: 'body', text: 'Everything in the simulation has a software analog. The mechanism — many local actors, each running a small loop, leaving fading traces in a shared substrate — is identical. The mathematics is identical. From this page on, when we point at the colony, we mean a team. When we say pheromone, we mean signal. When we say nest, we mean main. Like this:' },
      { kind: 'bridge_map' },
      { kind: 'body', text: 'If a colony of ants can build durable structure with a one-page algorithm and chemical traces, a team of engineers — human, AI, both — can do far more, with the same shape. The rest of this guide names the parts and shows you how to use them.' },
      { kind: 'callout', label: 'A note on names', text: 'You\'ll see "agent" used for any actor — a developer, a CI runner, an AI tool, a linter, an on-call. Whatever shows up to make a change. The framework is about the system around the agents, not which kind of agent runs which loop.' },
    ],
  },

  // ── Part IV: The vocabulary ─────────────────────────────────
  {
    id: 'two_modes',
    type: 'reading',
    kicker: 'Chapter 07',
    title: 'Two ways to coordinate.',
    subtitle: 'Plans and trails.',
    blocks: [
      { kind: 'body', text: 'There are two clean ways to organize work, and most real systems mix them. Both work, when they work. Both fail, when they fail. The interesting question is always: which one belongs here?' },
      { kind: 'spectrum' },
      { kind: 'body', text: 'These properties travel together. A decision made in a central, spec-verified way is also integrated on a schedule and fails hard when wrong. A decision made in a distributed, convergence-verified way integrates continuously and fails softly. Mixing halfway — central authority with continuous async integration, for example — usually produces governance theater: the form of one mode and the substance of the other, with the strengths of neither.' },
      { kind: 'callout', label: 'The trade', text: 'At any boundary, guarantees and adaptivity trade against each other. You can\'t have both in the same region. You can have them in different regions, connected by well-designed boundaries.' },
    ],
  },
  {
    id: 'placement',
    type: 'reading',
    kicker: 'Chapter 08',
    title: 'Placement is the craft.',
    subtitle: 'It\'s not what you build. It\'s where on the spectrum it sits.',
    blocks: [
      { kind: 'body', text: 'Architectural arguments used to be about what — what framework, what database, what pattern. The harder, more useful question is where. Given that we need authentication, where on the spectrum does it belong? Planned: irreversible, regulated, coupled to everything. Given that we need internal tooling, where? Emergent: cheap to revert, varied needs, no single right answer.' },
      { kind: 'body', text: 'Three questions place any decision of consequence — and they\'re empirical, not aesthetic.' },
      { kind: 'qlist', items: [
        ['Reversibility', 'If this goes wrong, how expensive is it to undo? Cheap → emergent. Expensive → planned. The most important question.'],
        ['Legibility',    'Is the problem well-specified and stable, or exploratory and shifting? Specified → planned. Exploratory → emergent.'],
        ['Coupling',      'Does a local change force changes elsewhere? Tight → planned. Loose → emergent.'],
      ]},
      { kind: 'placement_chart' },
      { kind: 'body', text: 'Write the placement down for every decision of consequence. Implementation follows from placement, not the other way around. Disagreements about what something should be often dissolve into agreements about where it belongs — and you can settle where without first agreeing on what.' },
      { kind: 'callout', label: 'The danger zone', text: 'Bottom-left — irreversible and exploratory — is where engineering disasters live. Never let agents work there without first making the decision reversible (deploy gates, blue-green, dry runs) or making the problem legible (specify, contract, test).' },
    ],
  },
  {
    id: 'patterns',
    type: 'reading',
    kicker: 'Chapter 09',
    title: 'Five ways planned and emergent compose.',
    subtitle: 'Most real systems are hybrids.',
    blocks: [
      { kind: 'body', text: 'Once you can name a region as planned or emergent, you can compose them. These are the five patterns that recur in every well-designed system, named so you can recognize them — and notice when one is being applied wrong.' },
      { kind: 'patterns' },
      { kind: 'body', text: 'The dangerous moves are the hybrids: a heavily-specified system whose specs are never enforced (planned in form, emergent in substance) or a lightly-specified system whose informal norms have ossified into uneditable custom (the reverse). The honest test of a system isn\'t what mode it claims; it\'s what mode its actual decisions are made in.' },
    ],
  },
  {
    id: 'pace_layers',
    type: 'reading',
    kicker: 'Chapter 10',
    title: 'Six rates. One stack.',
    subtitle: 'Don\'t mix signals across time scales.',
    blocks: [
      { kind: 'body', text: 'A working many-hands platform isn\'t one system, it\'s six. Each one changes at its own pace. Mixing them is a category error: governance that updates weekly is theater; an invocation that needs an architectural review is a slow IDE.' },
      { kind: 'pace_layers' },
      { kind: 'body', text: 'Each layer fails its own way. Governance becomes irrelevant. Architecture becomes brittle. Capabilities sprawl. Orchestration drowns in combinatorics. Agents drift. Invocations error transiently. Pitch fixes at the layer where the actual failure lives — not the layer where it\'s loudest.' },
      { kind: 'callout', label: 'How signals travel', text: 'Signals flow up; authority flows down. A pattern observed at the invocation layer can bubble up — capability, architecture, governance — but only by ratification at each layer, not by fiat from below. A governance change reshapes the constraints every layer below operates under.' },
    ],
  },

  // ── Part V: The substrate ───────────────────────────────────
  {
    id: 'commons',
    type: 'sim',
    kicker: 'Chapter 11',
    title: 'The whole field is yours to keep.',
    subtitle: 'Every shared substrate is a commons.',
    body: 'The repository. The vector store. The eval harness. The deploy pipeline. The production namespace. These are not passive storage. They are commons — resources every agent draws from and deposits into. Without governance, every commons degrades. With it, the platform becomes durable the way long-lived open-source projects and healthy markets are durable.',
    callout: { label: 'See it', text: 'The dashed boundary marks the commons. Click anywhere to add tasks. Notice that the trails — the things that survive across agents — exist in the substrate, not in any individual.' },
    bridge: 'Elinor Ostrom spent her career documenting commons that worked. The principles translate almost line-for-line — and they\'re what we apply next.',
    config: { antCount: 30, ...TUNED, foods: 'two' },
    showSliders: [],
    interactive: 'food-place',
    showCommons: true,
    extraPanel: 'commons_principles',
  },

  // ── Part VI: How work happens ───────────────────────────────
  {
    id: 'loop',
    type: 'reading',
    kicker: 'Chapter 12',
    title: 'The shape of all autonomous work.',
    subtitle: 'Five stages that close on themselves.',
    blocks: [
      { kind: 'body', text: 'Every loop — the smallest and the largest — has the same anatomy. Five stages, closed on themselves. A loop missing any of these isn\'t a loop yet; it\'s a script looking for a home.' },
      { kind: 'loop_anatomy' },
      { kind: 'body', text: 'The dependency-patch loop has all five. A signal: a new patch is available, with a clean changelog. Bounded action: open a PR with the version bump and the quoted changelog. Verification: CI runs the test suite. Commit or revert: green merges, red stays open for a human. Update: the agent\'s track record on this class moves a tick.' },
      { kind: 'callout', label: 'Six ingredients, one rule', text: 'Signal · bounded action · outside-reference verification · cheap reversibility · signal update · explicit authority surface. Anything missing turns the loop into debt. The steward holds veto on anything irreversible at stage four. Everything else can be earned.' },
    ],
  },
  {
    id: 'catalog',
    type: 'reading',
    kicker: 'Chapter 13',
    title: 'A field of loops.',
    subtitle: 'Twelve patterns you can build this quarter.',
    blocks: [
      { kind: 'body', text: 'These are skeletons — independent of any specific tool, vendor, or pipeline. Each is a shape that recurs in mature platforms. Begin with starter loops: high reversibility, narrow scope, clean signals. Add middle loops once the terrain has signal worth reading. Attempt advanced loops only after the foundation is durable.' },
      { kind: 'catalog' },
      { kind: 'callout', label: 'How loops compose', text: 'No loop calls another. Each reads the terrain and writes to it. The dead-code loop produces a map of cold regions; the refactor-candidate loop reads it; the test-backfill loop avoids cold regions. The coordination is in the environment — the way it always was for the colony.' },
    ],
  },
  {
    id: 'forces',
    type: 'sim',
    kicker: 'Chapter 14',
    title: 'Four forces shape every signal field.',
    subtitle: 'Tune them, or be tuned by them.',
    body: 'Every working system is a balance between four forces. Reinforcement strengthens signals with use. Decay weakens them with time. When reinforcement runs ahead of decay, you get runaway: the colony locks onto the first path it finds, even a wrong one. When the world changes faster than the field updates, you get drift: the trail still says food is over here, but the food moved. Click each card to break the colony in a specific way — and try painting on the field to interfere directly.',
    callout: { label: 'Watch', text: 'These aren\'t just modes of failure. A healthy colony lives in tension between them — they\'re always present, just balanced. Test suites that grow stale (decay > reinforcement). Code patterns that lock in early (runaway). Documentation that drifts from the code (drift). Every team has these four.' },
    bridge: 'When the balance breaks badly enough, a system collapses. There are exactly two ways that collapse looks. We\'ll see them next.',
    math: 'Each maps to a known regime of reaction-diffusion systems. Runaway: γ → 0, dC/dt unbounded when n > 0. Drift: position of food source shifts faster than 1/γ. Sub-critical: trivial fixed point dominates. Healthy: all four present, none dominant.',
    config: { antCount: 25, ...TUNED, foods: 'one' },
    showSliders: ['decay', 'deposit'],
    sweetSpots: { decay: [0.004, 0.018], deposit: [0.6, 1.6] },
    interactive: 'paint',
    showForces: true,
  },
  {
    id: 'collapse',
    type: 'reading',
    kicker: 'Chapter 15',
    title: 'Two ways everything goes wrong.',
    subtitle: 'Learn to recognize each from the first symptom.',
    blocks: [
      { kind: 'body', text: 'Many-hands systems fail in two characteristic families. Both are well-documented, both have biological and historical archetypes, and both have signature warning signs that show up months before the visible failure.' },
      { kind: 'death_spirals' },
      { kind: 'callout', label: 'The most dangerous failures are hybrids', text: 'Form of one mode, substance of the other. A heavily-specified system whose specs are never enforced inherits the weaknesses of both. A lightly-specified system whose informal norms have ossified into uneditable custom is the same disease in reverse. Governance theater. Ivory-tower architecture. The inner-platform effect. The honest test isn\'t what the system claims — it\'s what mode its actual decisions are made in.' },
    ],
  },
  {
    id: 'guardrails',
    type: 'reading',
    kicker: 'Chapter 16',
    title: 'Four layers of immune response.',
    subtitle: 'Guardrails are load-bearing, not decoration.',
    blocks: [
      { kind: 'body', text: 'Guardrails aren\'t add-ons. They\'re the system\'s immune response — the work that keeps the rest of the platform from drifting into one of the two collapses. They fall into four classes, each answering a different question.' },
      { kind: 'guardrails' },
      { kind: 'body', text: 'Grade each guardrail honestly along five axes — coverage, latency, blast radius, false-positive rate, recovery cost. Most guardrails are doing less than they appear to. A review gate with a 95% approval rate is rubber-stamping. A rate limit set at ten times peak is decorative. The exercise of grading forces the question of whether each one earns its keep.' },
      { kind: 'callout', label: 'Guardrails decay too', text: 'They\'re subject to the same dynamics they guard. They can run away (a retry policy causing the overload it was protecting against). They can Goodhart (an eval used as a gate gets optimized against). They can atrophy. Add decay to them. Add variety. Add reflection. Add escape valves. The fractal pattern from §pace-layers applies: every layer of the system needs the work the rest of it needs.' },
    ],
  },
  {
    id: 'entropy',
    type: 'reading',
    kicker: 'Chapter 17',
    title: 'Every terrain decays.',
    subtitle: 'Disturb it on purpose.',
    blocks: [
      { kind: 'body', text: 'Documentation goes stale. Tests rot. Dead code accumulates. Evals drift from the work they were meant to measure. Conventions ossify into dogma. Trust grants outlive the conditions they were earned under. Branches abandoned in the corner of a repository quietly turn into landmines.' },
      { kind: 'body', text: 'This is not pessimism — it\'s thermodynamics, applied to software. Order requires work. A many-hands platform fights entropy on three fronts at once.' },
      { kind: 'qlist', items: [
        ['Designed decay',     'Signals that don\'t fade become noise. Trust grants that don\'t expire become liabilities. Conventions that don\'t get questioned become cargo cults. Build the fading in.'],
        ['Garbage collection', 'Loops whose only job is to fight accumulation. Dead-code detection. Stale-doc refresh. Stale-grant expiry. Unglamorous, load-bearing.'],
        ['Adversarial pressure', 'Deliberate disturbance of an otherwise functioning system to keep it honest. The part teams skip because it feels counterintuitive: things are working, why break them?'],
      ]},
      { kind: 'body', text: 'The third front is the one most teams underdo. Systems that aren\'t disturbed converge on whatever path was reinforced first. The exploration knob decays alongside everything else, and the system locks onto a local optimum that may have been wrong from the beginning.' },
      { kind: 'qlist', items: [
        ['Daily',     'Small disturbances built into normal operation — random retry jitter, cache misses, occasional eval shuffling.'],
        ['Weekly',    'Deliberate fault injection in non-critical paths. Mutation tests on recent changes.'],
        ['Monthly',   'Chaos game days. Full red-team passes against new agent classes. Reviews of trust grants for evidence of staleness.'],
        ['Quarterly', 'Removal experiments — take away a context source, a tool, a heuristic. Observe what breaks. If it collapses, you\'ve found a hidden dependency. If it adapts, the dependency wasn\'t load-bearing.'],
      ]},
      { kind: 'callout', label: 'Testing and adversarial pressure are different things', text: 'Testing asks whether the system meets a known specification. Adversarial pressure asks whether the system is quietly relying on things no one specified. The first is verification. The second is discovery. Both matter. They are not the same.' },
    ],
  },
  {
    id: 'steward',
    type: 'sim',
    kicker: 'Chapter 18',
    title: 'Someone shapes the place.',
    subtitle: 'Lower frequency. Higher authority.',
    body: 'The colony isn\'t controlled — but it\'s not free of design either. Someone shapes the substrate the workers move through. Walls steer. Food positions create demand. A pruning hand wipes stale trails so the colony stops following dogma. The steward doesn\'t tell any worker where to go. The steward shapes the place where going happens.',
    callout: { label: 'Try', text: 'Pick a tool. Wall the colony in. Move the food. Prune a stale trail and watch a new one form. You\'re editing the commons, not the workers.' },
    bridge: 'In software the steward is the tech lead, the platform team, the maintainer. Their power isn\'t in directing engineers — it\'s in shaping the codebase\'s shape, the merge gates, the test suite, the conventions. The work that actually happens is still many hands.',
    math: 'Stewardship interventions perturb the substrate, not the agents. ∂walls(x,t) and ∂foodSites(x,t) reshape the constraint landscape. The colony\'s response is governed by the same physics — the steward just changes where the physics applies.',
    config: { antCount: 30, ...TUNED, foods: 'two' },
    showSliders: ['population'],
    interactive: 'steward',
  },

  // ── Part VII: The economics of human judgment ───────────────
  {
    id: 'approval',
    type: 'reading',
    kicker: 'Chapter 19',
    title: 'The considered yes.',
    subtitle: 'Approval is scarce by design.',
    blocks: [
      { kind: 'body', text: 'The visible act of engineering in this era is the approval — the looks good to me on a pull request, the ship-it in a review, the considered yes at the moment where autonomous work meets human judgment. It can look trivial. It is not. When the system around the hands is built well, that approval is the load-bearing moment: the place where the work becomes real.' },
      { kind: 'body', text: 'Three operational levers throttle agent output against human attention. They\'re coupled — you can\'t change one without changing the others.' },
      { kind: 'qlist', items: [
        ['The gate',   'Where a human confirms an agent\'s proposal, per task class. Proposals that don\'t cross a gate auto-apply within their envelope.'],
        ['The rate',   'Fraction of gated proposals that earn approval, tracked per agent and class. The track record that justifies moving the gate.'],
        ['The budget', 'The steward\'s finite capacity for considered approvals per unit time. Not a wish — a real constraint, like an SRE error budget.'],
      ]},
      { kind: 'approval_calc' },
      { kind: 'callout', label: 'Heroics is not the answer', text: 'When inflow exceeds budget, queues build. Queues produce rubber-stamping or stalls. Both are signals, not solutions. The fix is structural: widen the autonomy envelope where rates are consistently high (move the gate to auto-merge); narrow it where rates have drifted (move the gate up). The lever that stays constant is the budget. Stewards aren\'t supposed to work harder — they\'re supposed to place the gates better.' },
      { kind: 'small', text: 'A concrete example: a four-engineer rotation, 30 considered approvals/week each. The dep-patch loop produces 18 proposals/week at 96% approval. Eighteen out of thirty on a single class is too many. Move the gate: green-CI patch bumps auto-merge; minor-version bumps and any failing CI come up for review. The loop now costs three approvals/week. The reclaimed budget covers the new on-call assist loop — or, on a slow week, frees the steward for upstream terrain work. The numbers told the team where the gate belonged.' },
    ],
  },
  {
    id: 'trust',
    type: 'reading',
    kicker: 'Chapter 20',
    title: 'What real trust looks like.',
    subtitle: 'Five properties. Miss one, get surprised.',
    blocks: [
      { kind: 'body', text: 'Useful is not the same as trusted. Readable is not the same as authoritative. A system can let an agent see something without letting it act on it. A system can trust an agent\'s work on Tuesday and re-verify on Wednesday when a dependency changed overnight. Authority is a design dimension, not an afterthought.' },
      { kind: 'trust_props' },
      { kind: 'body', text: 'Trust belongs to a task class in a specific environment. Change the environment, and some trust resets — even without a single failure. A model upgrade. A new permission set. A major refactor. None of these requires evidence of harm; the trust resets because the environment it was anchored to has shifted.' },
      { kind: 'body', text: 'Authority itself comes in distinct levels — five of them — and the right to one does not imply the right to the next.' },
      { kind: 'authority' },
      { kind: 'callout', label: 'How trust comes apart', text: 'Silent environmental drift (model changed, no one reset). Class-boundary erosion (agents do work adjacent to their grant). Invisible rubber-stamping (the rate stayed high but the review got thinner). Reputation drag (easy cases got auto-merge, hard ones got rubber-stamped because the easy ones trained the steward to trust). All four counter the same way: triangulate the trust signal — track record plus sampled deep review plus adversarial probing plus post-merge defect rate — they cannot all lie at once.' },
    ],
  },

  // ── Part VIII: Putting it to work ───────────────────────────
  {
    id: 'journey',
    type: 'reading',
    kicker: 'Chapter 21',
    title: 'Stage by stage.',
    subtitle: 'You can\'t skip Stage 0.',
    blocks: [
      { kind: 'body', text: 'Teams that jump from traditional engineering to autonomous agents almost always stumble. The stumble is rarely in the agents. It\'s in the terrain they were dropped into.' },
      { kind: 'journey' },
      { kind: 'callout', label: 'The two most common mistakes', text: 'Skipping Stage 0 — smart agents acting on dumb terrain produces high activity, low signal, no compounding. And broadening Stage 1 before replicating it: a dozen simple loops compounding will always beat one sophisticated loop burning attention.' },
    ],
  },
  {
    id: 'health',
    type: 'reading',
    kicker: 'Chapter 22',
    title: 'What "working" looks like in motion.',
    subtitle: 'Five signs to keep checking.',
    blocks: [
      { kind: 'body', text: 'A system in this framework is a dynamical system. It doesn\'t have a single steady state — it has a healthy mode and a few collapsing ones, and the work is keeping it in the healthy mode. Five signs together are worth more than any checklist.' },
      { kind: 'health' },
      { kind: 'body', text: 'When all five hold, the system is, in this framework\'s sense, alive. Keep it alive — not by freezing it, which kills it, but by maintaining the conditions under which it stays a healthy dynamical system. That maintenance is what the steward does.' },
    ],
  },
  {
    id: 'monday',
    type: 'hero',
    kicker: 'On Monday',
    title: 'Pick one small loop. Make it work end-to-end.',
    subtitle: 'The point of the first loop isn\'t the loop. It\'s the template.',
    blocks: [
      { kind: 'body', text: 'When a team reads through everything we\'ve covered and asks what do we do first, the answer is almost always the same. Not the most interesting loop. Not the highest-ROI one. The one you can fully instrument, test, and control inside a short cycle. Dependency patches are the canonical starter — clean signals, clean reactions, cheap reversal, and humans generally dislike doing them.' },
      { kind: 'body', text: 'Once one works end-to-end, the second is dramatically cheaper. By the fifth, you have a pattern you apply almost mechanically. The platform grows by adding loops, not by making any single loop smarter. Everything in this guide — placement, the spectrum, the pace layers, the commons, the four forces, the guardrails, trust, the staged transition — is in service of making the nth loop cheaper than the (n−1)th.' },
      { kind: 'body', text: 'A team with one working loop and confidence it can replicate the pattern is further along than a team with elaborate architecture and no working loop. Start there.' },
      { kind: 'closer' },
    ],
  },
];


/* ────────────────────────────────────────────────────────────────────
   BLOCK DISPATCHER — maps block.kind to a component
   Used inside reading-layout chapters to embed inline visualizations.
   ──────────────────────────────────────────────────────────────────── */

const RenderBlock = ({ block }) => {
  switch (block.kind) {
    case 'body':       return <Body>{block.text}</Body>;
    case 'small':      return <Small>{block.text}</Small>;
    case 'callout':    return <Callout label={block.label}>{block.text}</Callout>;
    case 'eras':       return <ErasTable />;
    case 'bridge_map': return <BridgeMap />;
    case 'spectrum':   return <Spectrum />;
    case 'placement_chart': return <PlacementChart />;
    case 'patterns':   return <CompositionPatterns />;
    case 'pace_layers': return <PaceLayers />;
    case 'loop_anatomy': return <LoopAnatomy />;
    case 'catalog':    return <LoopCatalog />;
    case 'death_spirals': return <DeathSpirals />;
    case 'guardrails': return <GuardrailLayers />;
    case 'approval_calc': return <ApprovalCalc />;
    case 'trust_props': return <TrustProperties />;
    case 'authority':  return <AuthorityLevels />;
    case 'journey':    return <Journey />;
    case 'health':     return <HealthSignature />;
    case 'commons_principles': return <CommonsPrinciples />;
    case 'qlist':
      return (
        <div className="my-5 space-y-2.5">
          {block.items.map(([k, v], i) => (
            <div key={i} className="grid grid-cols-[140px_1fr] gap-4 p-3 rounded-sm items-baseline"
              style={{background: PALETTE.card, border: `1px solid ${PALETTE.border}`,
                borderLeft: `2px solid ${PALETTE.accent}`}}>
              <div className="display-font text-[15px]" style={{color: PALETTE.accent}}>{k}</div>
              <div className="text-[13px] leading-relaxed"
                style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>{v}</div>
            </div>
          ))}
        </div>
      );
    case 'cta':
      return (
        <div className="mt-8 mb-2">
          <span className="display-font italic text-base" style={{color: PALETTE.textDim}}>{block.text}</span>
        </div>
      );
    case 'closer':
      return (
        <div className="mt-10 pt-7 border-t" style={{borderColor: PALETTE.border}}>
          <div className="display-font italic text-xl leading-snug mb-2" style={{color: PALETTE.text}}>
            "It used to be building the thing.
          </div>
          <div className="display-font italic text-xl leading-snug" style={{color: PALETTE.accent}}>
            Now it's building the thing that makes the thing."
          </div>
        </div>
      );
    default:           return null;
  }
};

/* ────────────────────────────────────────────────────────────────────
   SHARED HEADER
   ──────────────────────────────────────────────────────────────────── */

const TopBar = ({ chIdx, total, onPrev, onNext, onIndex, vocabMode, setVocabMode, showVocab }) => (
  <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b z-10 flex-shrink-0"
    style={{borderColor: PALETTE.border, background: PALETTE.bg, backdropFilter: 'blur(8px)'}}>
    <div className="flex items-center gap-3 min-w-0">
      <button onClick={onIndex}
        className="p-1.5 rounded-sm transition-colors flex-shrink-0"
        style={{color: PALETTE.textDim, border: `1px solid ${PALETTE.border}`}}
        aria-label="Open contents">
        <List size={14}/>
      </button>
      <div className="min-w-0">
        <div className="mono-font text-[10px] uppercase tracking-[0.3em] truncate"
          style={{color: PALETTE.textDim}}>
          Many Hands Engineering
        </div>
        <div className="display-font italic text-xs truncate"
          style={{color: PALETTE.textMute}}>
          building the thing that makes the thing
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      {showVocab && (
        <div className="hidden sm:flex items-center gap-1 mr-2 p-0.5 rounded-sm"
          style={{background: PALETTE.bgDeep, border: `1px solid ${PALETTE.border}`}}>
          <TabButton active={vocabMode === 'bio'} onClick={() => setVocabMode('bio')}>Bio</TabButton>
          <TabButton active={vocabMode === 'eng'} onClick={() => setVocabMode('eng')}>Eng</TabButton>
        </div>
      )}
      <span className="mono-font text-[11px] tabular-nums" style={{color: PALETTE.textDim}}>
        {String(chIdx + 1).padStart(2, '0')} <span style={{color: PALETTE.textMute}}>/ {total}</span>
      </span>
      <button onClick={onPrev} disabled={chIdx === 0}
        className="p-1.5 transition-colors rounded-sm"
        style={{color: chIdx === 0 ? PALETTE.textMute : PALETTE.text,
          opacity: chIdx === 0 ? 0.3 : 1,
          border: `1px solid ${PALETTE.border}`}}
        aria-label="Previous">
        <ChevronLeft size={16}/>
      </button>
      <button onClick={onNext} disabled={chIdx === total - 1}
        className="p-1.5 transition-colors rounded-sm"
        style={{color: chIdx === total - 1 ? PALETTE.textMute : PALETTE.bg,
          background: chIdx === total - 1 ? 'transparent' : PALETTE.accent,
          opacity: chIdx === total - 1 ? 0.3 : 1,
          border: `1px solid ${chIdx === total - 1 ? PALETTE.border : PALETTE.accent}`}}
        aria-label="Next">
        <ChevronRight size={16}/>
      </button>
    </div>
  </header>
);

const ChapterIndex = ({ open, onClose, chIdx, onPick }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-stretch sm:items-center sm:justify-center p-0 sm:p-6"
      style={{background: 'rgba(10,9,7,0.85)', backdropFilter: 'blur(4px)'}}
      onClick={onClose}>
      <div className="w-full max-w-3xl mx-auto rounded-sm overflow-y-auto"
        style={{background: PALETTE.bg, border: `1px solid ${PALETTE.border}`,
          maxHeight: '92vh'}}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b sticky top-0"
          style={{borderColor: PALETTE.border, background: PALETTE.bg}}>
          <div className="mono-font text-[10px] uppercase tracking-[0.3em]" style={{color: PALETTE.textDim}}>
            Contents
          </div>
          <button onClick={onClose} className="p-1.5 rounded-sm"
            style={{color: PALETTE.textDim, border: `1px solid ${PALETTE.border}`}}>
            <X size={14}/>
          </button>
        </div>
        <ol className="p-2">
          {CHAPTERS.map((c, i) => {
            const isCurrent = i === chIdx;
            const partLabel = i === 0 ? 'Begin' :
              i === 1 ? 'The argument' :
              i === 2 ? 'In the colony' :
              i === 7 ? 'The bridge' :
              i === 8 ? 'The framework' :
              i === 12 ? 'In the commons' :
              i === 13 ? 'How work happens' :
              i === 18 ? 'Stewardship' :
              i === 21 ? 'Putting it to work' :
              i === 23 ? 'Monday' : null;
            return (
              <React.Fragment key={c.id}>
                {partLabel && (
                  <li className="px-3 pt-4 pb-1 mono-font text-[9px] uppercase tracking-[0.3em]"
                    style={{color: PALETTE.accent}}>
                    {partLabel}
                  </li>
                )}
                <li>
                  <button onClick={() => onPick(i)}
                    className="w-full grid grid-cols-[40px_1fr] gap-3 px-3 py-2.5 rounded-sm text-left transition-all"
                    style={{
                      background: isCurrent ? PALETTE.cardHi : 'transparent',
                      border: `1px solid ${isCurrent ? PALETTE.accent : 'transparent'}`,
                    }}>
                    <span className="mono-font text-[10px] tabular-nums self-start mt-0.5"
                      style={{color: isCurrent ? PALETTE.accent : PALETTE.textMute}}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <span className="display-font text-[15px] block leading-snug"
                        style={{color: isCurrent ? PALETTE.accent : PALETTE.text}}>
                        {c.title}
                      </span>
                      {c.subtitle && (
                        <span className="display-font italic text-[12px] leading-snug"
                          style={{color: PALETTE.textMute}}>
                          {c.subtitle}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </div>
  );
};


/* ────────────────────────────────────────────────────────────────────
   HERO LAYOUT — full-screen title page (welcome, the turn, monday)
   ──────────────────────────────────────────────────────────────────── */

const HeroLayout = ({ ch, chIdx, total, onContinue }) => {
  const isFinal = chIdx === total - 1;
  return (
    <div className="flex-1 overflow-y-auto" style={{background: PALETTE.bg}}>
      <div className="min-h-full flex items-center justify-center px-6 py-12 sm:py-20">
        <div className="w-full max-w-2xl">
          {ch.kicker && (
            <div className="mono-font text-[11px] uppercase tracking-[0.4em] mb-6"
              style={{color: PALETTE.accent}}>
              {ch.kicker}
            </div>
          )}
          <h1 className="display-font text-[2.4rem] sm:text-[3rem] xl:text-[3.6rem] leading-[1.02] mb-5"
            style={{color: PALETTE.text, fontWeight: 400, letterSpacing: '-0.015em'}}>
            {ch.title}
          </h1>
          {ch.subtitle && (
            <p className="display-font italic text-xl sm:text-2xl leading-snug mb-10"
              style={{color: PALETTE.accent, fontWeight: 300}}>
              {ch.subtitle}
            </p>
          )}
          <div>
            {ch.blocks?.map((b, i) => <RenderBlock key={i} block={b}/>)}
          </div>
          <div className="mt-10">
            <button onClick={onContinue}
              className="group flex items-center gap-3 px-6 py-3 rounded-sm transition-all hover:translate-x-0.5"
              style={{
                background: PALETTE.accent, color: PALETTE.bg,
                border: `1px solid ${PALETTE.accent}`,
                boxShadow: `0 0 24px ${PALETTE.accent}55`,
              }}>
              <span className="mono-font text-[11px] uppercase tracking-[0.3em] font-semibold">
                {isFinal ? 'Begin again' : chIdx === 0 ? 'Begin' : 'Continue'}
              </span>
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────
   READING LAYOUT — full-width centered content with embedded widgets
   ──────────────────────────────────────────────────────────────────── */

const ReadingLayout = ({ ch, chIdx, total, onContinue }) => (
  <div className="flex-1 overflow-y-auto" style={{background: PALETTE.bg}}>
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      {ch.kicker && <Kicker>{ch.kicker}</Kicker>}
      <H1>{ch.title}</H1>
      {ch.subtitle && <Sub>{ch.subtitle}</Sub>}
      <div>
        {ch.blocks?.map((b, i) => <RenderBlock key={i} block={b}/>)}
      </div>
      <div className="mt-10 pt-6 flex items-center justify-between border-t"
        style={{borderColor: PALETTE.border}}>
        <span className="mono-font text-[10px] uppercase tracking-[0.3em]" style={{color: PALETTE.textMute}}>
          {String(chIdx + 1).padStart(2, '0')} of {String(total).padStart(2, '0')}
        </span>
        {chIdx < total - 1 && (
          <button onClick={onContinue}
            className="flex items-center gap-2 px-4 py-2 rounded-sm transition-all hover:translate-x-0.5"
            style={{
              background: PALETTE.accent, color: PALETTE.bg,
              border: `1px solid ${PALETTE.accent}`,
            }}>
            <span className="mono-font text-[10px] uppercase tracking-[0.3em] font-semibold">Continue</span>
            <ChevronRight size={14}/>
          </button>
        )}
      </div>
    </div>
  </div>
);


/* ────────────────────────────────────────────────────────────────────
   SIM LAYOUT — split (canvas + side panel)
   On mobile: canvas sticky at top, content scrolls below
   On desktop: canvas left, content right
   ──────────────────────────────────────────────────────────────────── */

const ForceCard = ({ icon: Icon, title, sub, active, onClick, color }) => (
  <button onClick={onClick}
    className="text-left p-3 rounded-sm transition-all"
    style={{
      background: active ? PALETTE.cardHi : PALETTE.card,
      border: `1px solid ${active ? color : PALETTE.border}`,
      borderLeft: `2px solid ${color}`,
    }}>
    <div className="flex items-center gap-2 mb-1.5">
      <Icon size={13} style={{color}}/>
      <span className="mono-font text-[10px] uppercase tracking-[0.2em]"
        style={{color: active ? color : PALETTE.text, fontWeight: active ? 600 : 400}}>{title}</span>
    </div>
    <div className="text-[11.5px] leading-snug"
      style={{color: PALETTE.textDim, fontFamily: 'Newsreader, serif'}}>{sub}</div>
  </button>
);

const SimLayout = ({ ch, chIdx, total, onContinue, vocabMode }) => {
  const cfg = ch.config;
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fieldCanvasRef = useRef(null);
  const fieldImgRef = useRef(null);
  const fieldCtxRef = useRef(null);
  const worldRef = useRef(null);
  const scratchRef = useRef(new Float32Array(GRID_W * GRID_H));
  const rafRef = useRef(null);
  const lastInteractRef = useRef(0);
  const paintingRef = useRef(false);

  const [running, setRunning]   = useState(true);
  const [showField, setShowField] = useState(true);
  const [showAnts,  setShowAnts]  = useState(true);
  const [activeForce, setActiveForce] = useState(null);
  const [activeStewardTool, setActiveStewardTool] = useState('food');
  const [hint, setHint] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // sliders state
  const [population, setPopulation] = useState(cfg.antCount);
  const [decayRate,  setDecayRate]  = useState(cfg.decayRate ?? TUNED.decayRate);
  const [deposit,    setDeposit]    = useState(cfg.deposit ?? TUNED.deposit);
  const [diffuse,    setDiffuse]    = useState(cfg.diffuse ?? TUNED.diffuse);

  const [statsTick, setStatsTick] = useState(0);

  // build initial world
  useEffect(() => {
    const nest = { x: 30, y: GRID_H / 2, r: 4 };
    const foods = (() => {
      switch (cfg.foods) {
        case 'one':       return [{ x: 130, y: GRID_H / 2, r: 4 }];
        case 'close-one': return [{ x: 110, y: GRID_H / 2, r: 4 }];
        case 'two':       return [{ x: 130, y: 30, r: 4 }, { x: 130, y: GRID_H - 30, r: 4 }];
        default:          return [{ x: 130, y: GRID_H / 2, r: 4 }];
      }
    })();
    worldRef.current = createWorld(GRID_W, GRID_H, population, foods, nest);
    // hint timing
    if (ch.timedHint) {
      const t = setTimeout(() => setShowHint(true), ch.timedHint.delay);
      return () => clearTimeout(t);
    }
  }, [ch.id]);

  // population changes — adjust ants without rebuilding world
  useEffect(() => {
    const w = worldRef.current; if (!w) return;
    while (w.ants.length < population) w.ants.push(makeAnt(w.nestSite.x, w.nestSite.y));
    while (w.ants.length > population) w.ants.pop();
  }, [population]);

  // canvas + field setup
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const fieldCanvas = document.createElement('canvas');
    fieldCanvas.width = GRID_W; fieldCanvas.height = GRID_H;
    fieldCanvasRef.current = fieldCanvas;
    fieldCtxRef.current = fieldCanvas.getContext('2d');
    fieldImgRef.current = fieldCtxRef.current.createImageData(GRID_W, GRID_H);

    const fitCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width  = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fitCanvas();

    // ResizeObserver — fix for "only top half clickable" bug
    const ro = new ResizeObserver(fitCanvas);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', fitCanvas);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fitCanvas);
    };
  }, []);

  // animation loop
  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    const tickHz = 60;
    const tickMs = 1000 / tickHz;

    const loop = (now) => {
      const dt = Math.min(33, now - last);
      last = now;
      if (running) {
        acc += dt;
        const params = { decayRate, deposit, diffuse, scratch: scratchRef.current };
        while (acc >= tickMs) {
          step(worldRef.current, params);
          acc -= tickMs;
        }
      }
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && worldRef.current) {
        render(ctx, worldRef.current, fieldImgRef.current, fieldCtxRef.current,
          canvasRef.current,
          { showField, showAnts, showCommons: ch.showCommons });
      }
      // periodic stats refresh for live counters
      if (now - lastInteractRef.current > 250) {
        lastInteractRef.current = now;
        setStatsTick(t => t + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, decayRate, deposit, diffuse, showField, showAnts, ch.showCommons]);

  // canvas → grid coords
  const canvasToGrid = useCallback((ev) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ev0 = ev.touches?.[0] ?? ev;
    const px = ev0.clientX - rect.left;
    const py = ev0.clientY - rect.top;
    return { gx: (px / rect.width) * GRID_W, gy: (py / rect.height) * GRID_H, px, py };
  }, []);

  // interaction handler — depends on chapter's interactive mode
  const handleCanvasDown = useCallback((ev) => {
    ev.preventDefault();
    const w = worldRef.current; if (!w) return;
    const { gx, gy } = canvasToGrid(ev);
    const mode = ch.interactive;
    if (mode === 'paint') {
      paintingRef.current = ev.shiftKey ? 'erase' : 'paint';
      paintAt(gx, gy, paintingRef.current);
    } else if (mode === 'steward') {
      const tool = activeStewardTool;
      if (tool === 'food')  w.foodSites.push({ x: gx, y: gy, r: 4, life: 50 });
      if (tool === 'wall') {
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const ix = clamp(Math.floor(gx + dx), 0, GRID_W - 1);
          const iy = clamp(Math.floor(gy + dy), 0, GRID_H - 1);
          w.walls[iy * GRID_W + ix] = 1;
        }
      }
      if (tool === 'prune') paintAt(gx, gy, 'erase', 6);
      if (tool === 'erase') {
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
          const ix = clamp(Math.floor(gx + dx), 0, GRID_W - 1);
          const iy = clamp(Math.floor(gy + dy), 0, GRID_H - 1);
          w.walls[iy * GRID_W + ix] = 0;
        }
      }
    } else {
      // food-place default
      w.foodSites.push({ x: gx, y: gy, r: 4, life: 60 });
    }
    setShowHint(false);
  }, [ch.interactive, canvasToGrid, activeStewardTool]);

  const handleCanvasMove = useCallback((ev) => {
    if (!paintingRef.current) return;
    ev.preventDefault();
    const { gx, gy } = canvasToGrid(ev);
    paintAt(gx, gy, paintingRef.current);
  }, [canvasToGrid]);

  const handleCanvasUp = useCallback(() => {
    paintingRef.current = false;
  }, []);

  const paintAt = (gx, gy, kind, radius = 4) => {
    const w = worldRef.current; if (!w) return;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const ix = clamp(Math.floor(gx + dx), 0, GRID_W - 1);
        const iy = clamp(Math.floor(gy + dy), 0, GRID_H - 1);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > radius) continue;
        const falloff = 1 - dist / radius;
        const idx = iy * GRID_W + ix;
        if (kind === 'paint') {
          w.pheroIn[idx] = Math.min(3, w.pheroIn[idx] + 0.6 * falloff);
        } else if (kind === 'erase') {
          w.pheroIn[idx] *= (1 - falloff * 0.85);
          w.pheroOut[idx] *= (1 - falloff * 0.85);
        }
      }
    }
  };

  // reset everything
  const handleReset = useCallback(() => {
    const w = worldRef.current; if (!w) return;
    w.pheroIn.fill(0);
    w.pheroOut.fill(0);
    w.walls.fill(0);
    setDecayRate(cfg.decayRate ?? TUNED.decayRate);
    setDeposit(cfg.deposit ?? TUNED.deposit);
    setDiffuse(cfg.diffuse ?? TUNED.diffuse);
  }, [cfg]);

  // forces — buttons that perturb the world
  const applyForce = useCallback((force) => {
    setActiveForce(force);
    if (force === 'runaway')      { setDecayRate(0.0008); setDeposit(1.6); }
    else if (force === 'drift')   {
      const w = worldRef.current; if (!w) return;
      w.foodSites.forEach(f => { f.x = Math.max(20, f.x - 50); });
    }
    else if (force === 'reinforce') { setDecayRate(0.012); setDeposit(1.6); }
    else if (force === 'decay')   { setDecayRate(0.04); setDeposit(0.4); }
    else if (force === null) handleReset();
  }, [handleReset]);

  const w = worldRef.current;
  const trailCount = w ? w.totalDelivered : 0;
  const hasShowFood = ch.interactive === 'food-place' || ch.interactive === 'steward';

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden" style={{background: PALETTE.bg}}>

      {/* CANVAS REGION — sticky on mobile, full-flex on desktop */}
      <div ref={containerRef}
        className="relative flex-shrink-0 lg:flex-1 lg:min-h-0"
        style={{
          height: 'min(50vh, 420px)',
          minHeight: 280,
          background: PALETTE.bgDeep,
          borderBottom: `1px solid ${PALETTE.border}`,
        }}>
        <canvas ref={canvasRef}
          onMouseDown={handleCanvasDown}
          onMouseMove={handleCanvasMove}
          onMouseUp={handleCanvasUp}
          onMouseLeave={handleCanvasUp}
          onTouchStart={handleCanvasDown}
          onTouchMove={handleCanvasMove}
          onTouchEnd={handleCanvasUp}
          style={{
            width: '100%', height: '100%', display: 'block',
            cursor: ch.interactive === 'paint' ? 'crosshair' :
                    ch.interactive === 'steward' ? 'cell' : 'pointer',
            touchAction: 'none',
          }}/>

        {/* contextual hint that fades in */}
        {showHint && ch.timedHint && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-sm text-center pointer-events-none"
            style={{
              background: `${PALETTE.accent}ee`, color: PALETTE.bg,
              maxWidth: '90%',
              animation: 'fadein 600ms ease-out',
            }}>
            <span className="mono-font text-[10px] uppercase tracking-[0.25em] font-semibold">
              {ch.timedHint.text}
            </span>
          </div>
        )}

        {/* canvas overlay controls (top-right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button onClick={() => setRunning(r => !r)}
            className="p-1.5 rounded-sm flex items-center gap-1.5"
            style={{background: `${PALETTE.bg}cc`, color: PALETTE.text, border: `1px solid ${PALETTE.border}`,
              backdropFilter: 'blur(4px)'}}>
            {running ? <Pause size={12}/> : <Play size={12}/>}
            <span className="mono-font text-[9px] uppercase tracking-[0.2em] hidden sm:inline">
              {running ? 'Pause' : 'Play'}
            </span>
          </button>
          <button onClick={handleReset}
            className="p-1.5 rounded-sm flex items-center gap-1.5"
            style={{background: `${PALETTE.bg}cc`, color: PALETTE.text, border: `1px solid ${PALETTE.border}`,
              backdropFilter: 'blur(4px)'}}>
            <RotateCcw size={12}/>
            <span className="mono-font text-[9px] uppercase tracking-[0.2em] hidden sm:inline">Reset</span>
          </button>
          <button onClick={() => { setShowField(s => !s); setShowAnts(true); }}
            className="p-1.5 rounded-sm flex items-center gap-1.5"
            style={{background: `${PALETTE.bg}cc`,
              color: showField ? PALETTE.accent : PALETTE.textDim,
              border: `1px solid ${PALETTE.border}`,
              backdropFilter: 'blur(4px)'}}>
            {showField ? <Eye size={12}/> : <EyeOff size={12}/>}
            <span className="mono-font text-[9px] uppercase tracking-[0.2em] hidden sm:inline">Trail</span>
          </button>
        </div>

        {/* live stats (bottom-left) */}
        <div className="absolute bottom-3 left-3 flex gap-2 mono-font text-[10px] tabular-nums"
          style={{color: PALETTE.textDim}}>
          <span>delivered <span style={{color: PALETTE.text}}>{trailCount}</span></span>
          <span>·</span>
          <span>tick <span style={{color: PALETTE.text}}>{w?.tick ?? 0}</span></span>
        </div>

        {/* steward toolbox */}
        {ch.interactive === 'steward' && (
          <div className="absolute bottom-3 right-3 flex gap-1 p-1 rounded-sm"
            style={{background: `${PALETTE.bg}dd`, border: `1px solid ${PALETTE.border}`,
              backdropFilter: 'blur(4px)'}}>
            {[
              ['food', 'Food'],
              ['wall', 'Wall'],
              ['prune', 'Prune'],
              ['erase', 'Erase'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setActiveStewardTool(id)}
                className="px-2 py-1 mono-font text-[9px] uppercase tracking-[0.2em] rounded-sm transition-all"
                style={{
                  background: activeStewardTool === id ? PALETTE.steward : 'transparent',
                  color: activeStewardTool === id ? PALETTE.bg : PALETTE.text,
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* paint tool helper */}
        {ch.interactive === 'paint' && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-sm mono-font text-[9px] uppercase tracking-[0.2em] flex items-center gap-2"
            style={{background: `${PALETTE.bg}dd`, color: PALETTE.textDim,
              border: `1px solid ${PALETTE.border}`, backdropFilter: 'blur(4px)'}}>
            <Hand size={11} style={{color: PALETTE.accent}}/>
            <span>drag to paint · shift to erase</span>
          </div>
        )}
      </div>

      {/* SIDE PANEL */}
      <aside className="flex-1 lg:w-[460px] lg:flex-none lg:border-l overflow-y-auto"
        style={{borderColor: PALETTE.border, background: PALETTE.bg}}>
        <div className="px-5 py-6">
          {ch.kicker && <Kicker>{ch.kicker}</Kicker>}
          <h2 className="display-font text-[1.6rem] sm:text-[1.9rem] leading-[1.05] mb-2"
            style={{color: PALETTE.text, fontWeight: 400, letterSpacing: '-0.01em'}}>
            {ch.title}
          </h2>
          <p className="display-font italic text-base leading-snug mb-5"
            style={{color: PALETTE.accent, fontWeight: 300}}>
            {ch.subtitle}
          </p>
          <p className="text-[14px] leading-relaxed mb-5"
            style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>
            {ch.body}
          </p>

          {ch.callout && (
            <Callout label={ch.callout.label}>{ch.callout.text}</Callout>
          )}

          {/* sliders */}
          {ch.showSliders?.includes('population') && (
            <Slider label="Colony size" value={population} min={1} max={MAX_ANTS} step={1}
              onChange={setPopulation} color={PALETTE.text}
              format={v => `${v} agents`}
              hint={ch.showPhase ? 'Below ~12, the field can\'t hold a trail. Above, it snaps on.' : undefined}/>
          )}
          {ch.showSliders?.includes('decay') && (
            <Slider label={VOCAB[vocabMode].decay} value={decayRate} min={0.001} max={0.06} step={0.001}
              onChange={setDecayRate} color={PALETTE.inbound}
              format={v => v.toFixed(3)}
              sweetMin={ch.sweetSpots?.decay?.[0]} sweetMax={ch.sweetSpots?.decay?.[1]}/>
          )}
          {ch.showSliders?.includes('deposit') && (
            <Slider label={VOCAB[vocabMode].deposit} value={deposit} min={0.1} max={3} step={0.05}
              onChange={setDeposit} color={PALETTE.text}
              format={v => v.toFixed(2)}
              sweetMin={ch.sweetSpots?.deposit?.[0]} sweetMax={ch.sweetSpots?.deposit?.[1]}/>
          )}
          {ch.showSliders?.includes('diffuse') && (
            <Slider label="Diffusion D" value={diffuse} min={0} max={0.2} step={0.01}
              onChange={setDiffuse} color={PALETTE.outbound}
              format={v => v.toFixed(2)}
              sweetMin={ch.sweetSpots?.diffuse?.[0]} sweetMax={ch.sweetSpots?.diffuse?.[1]}/>
          )}

          {/* forces panel — for chapter 14 */}
          {ch.showForces && (
            <div className="my-6">
              <div className="mono-font text-[10px] uppercase tracking-[0.25em] mb-2.5"
                style={{color: PALETTE.textDim}}>break it on purpose</div>
              <div className="grid grid-cols-2 gap-2">
                <ForceCard icon={Activity} title="Reinforcement" sub="signal grows with use"
                  active={activeForce === 'reinforce'} onClick={() => applyForce('reinforce')}
                  color={PALETTE.inbound}/>
                <ForceCard icon={Wind} title="Decay" sub="signal fades with time"
                  active={activeForce === 'decay'} onClick={() => applyForce('decay')}
                  color={PALETTE.outbound}/>
                <ForceCard icon={Zap} title="Runaway" sub="reinforce without counter-force"
                  active={activeForce === 'runaway'} onClick={() => applyForce('runaway')}
                  color={PALETTE.danger}/>
                <ForceCard icon={GitBranch} title="Drift" sub="world moves, trail stays"
                  active={activeForce === 'drift'} onClick={() => applyForce('drift')}
                  color={PALETTE.steward}/>
              </div>
              <button onClick={() => applyForce(null)}
                className="mt-2 w-full px-3 py-1.5 rounded-sm mono-font text-[10px] uppercase tracking-[0.2em]"
                style={{background: 'transparent', color: PALETTE.textDim,
                  border: `1px solid ${PALETTE.border}`}}>
                restore balance
              </button>
            </div>
          )}

          {/* extra panels */}
          {ch.extraPanel === 'commons_principles' && (
            <div className="mt-5">
              <Kicker>Eight principles</Kicker>
              <CommonsPrinciples/>
            </div>
          )}

          {/* math block — inline, NOT collapsed */}
          {ch.math && <MathBlock>{ch.math}</MathBlock>}

          {/* bridge — what this means in software */}
          {ch.bridge && (
            <div className="my-6 p-4 rounded-sm" style={{
              background: `${PALETTE.accent}0d`,
              border: `1px solid ${PALETTE.accent}33`,
              borderLeft: `2px solid ${PALETTE.accent}`,
            }}>
              <div className="mono-font text-[9px] uppercase tracking-[0.3em] mb-2 flex items-center gap-2"
                style={{color: PALETTE.accent}}>
                <ArrowRight size={11}/> what this means in software
              </div>
              <p className="text-[13px] leading-relaxed italic"
                style={{color: PALETTE.text, fontFamily: 'Newsreader, serif'}}>
                {ch.bridge}
              </p>
            </div>
          )}

          {/* vocab map — only on biology chapters before the bridge */}
          {chIdx >= 2 && chIdx <= 6 && (
            <div className="mt-6">
              <Kicker>Same word, different system</Kicker>
              <VocabMap vocabMode={vocabMode}/>
              <p className="text-[11px] italic mt-2"
                style={{color: PALETTE.textMute, fontFamily: 'Newsreader, serif'}}>
                Toggle the header switch to see the engineering terms. We'll commit to those after Chapter 06.
              </p>
            </div>
          )}

          {/* continue */}
          <div className="mt-8 pt-6 flex items-center justify-between border-t"
            style={{borderColor: PALETTE.border}}>
            <span className="mono-font text-[10px] uppercase tracking-[0.3em]" style={{color: PALETTE.textMute}}>
              {String(chIdx + 1).padStart(2, '0')} of {String(total).padStart(2, '0')}
            </span>
            {chIdx < total - 1 && (
              <button onClick={onContinue}
                className="flex items-center gap-2 px-4 py-2 rounded-sm transition-all hover:translate-x-0.5"
                style={{background: PALETTE.accent, color: PALETTE.bg,
                  border: `1px solid ${PALETTE.accent}`}}>
                <span className="mono-font text-[10px] uppercase tracking-[0.3em] font-semibold">Continue</span>
                <ChevronRight size={14}/>
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};


/* ────────────────────────────────────────────────────────────────────
   MAIN APP
   ──────────────────────────────────────────────────────────────────── */

export default function MHEWorkbook() {
  const [chIdx, setChIdx] = useState(0);
  const [vocabMode, setVocabMode] = useState('bio');
  const [indexOpen, setIndexOpen] = useState(false);

  const ch = CHAPTERS[chIdx];

  // commit to engineering vocab once we cross the bridge
  useEffect(() => {
    if (chIdx >= 7) setVocabMode('eng');
  }, [chIdx]);

  const onContinue = () => {
    setChIdx(i => Math.min(CHAPTERS.length - 1, i + 1));
    window.scrollTo(0, 0);
    if (ch?.type === 'reading' || ch?.type === 'hero') {
      // make sure on continue from reading we're at top of next
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-scroll-area]').forEach(el => el.scrollTop = 0);
      });
    }
  };
  const onPrev = () => setChIdx(i => Math.max(0, i - 1));
  const onPick = (i) => { setChIdx(i); setIndexOpen(false); };

  // wrap layout so we can route by type
  const layout = ch.type === 'hero' ? (
    <HeroLayout ch={ch} chIdx={chIdx} total={CHAPTERS.length} onContinue={onContinue}/>
  ) : ch.type === 'reading' ? (
    <ReadingLayout ch={ch} chIdx={chIdx} total={CHAPTERS.length} onContinue={onContinue}/>
  ) : (
    <SimLayout ch={ch} chIdx={chIdx} total={CHAPTERS.length} onContinue={onContinue} vocabMode={vocabMode}/>
  );

  // show vocab toggle only inside biology sims
  const showVocab = chIdx >= 2 && chIdx <= 6;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans"
      style={{background: PALETTE.bg, color: PALETTE.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500;600&family=Newsreader:ital,wght@0,400;0,500;1,400&display=swap');
        .display-font { font-family: 'Fraunces', serif; }
        .mono-font { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        @keyframes fadein { from { opacity: 0; transform: translate(-50%, -4px); } to { opacity: 1; transform: translate(-50%, 0); } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${PALETTE.bgDeep}; }
        ::-webkit-scrollbar-thumb { background: ${PALETTE.border}; border-radius: 0; }
        ::-webkit-scrollbar-thumb:hover { background: ${PALETTE.borderHi}; }
        button:focus-visible, [role=button]:focus-visible {
          outline: 2px solid ${PALETTE.accent}; outline-offset: 2px;
        }
      `}</style>

      <TopBar
        chIdx={chIdx} total={CHAPTERS.length}
        onPrev={onPrev} onNext={onContinue} onIndex={() => setIndexOpen(true)}
        vocabMode={vocabMode} setVocabMode={setVocabMode}
        showVocab={showVocab}/>

      {layout}

      <ChapterIndex open={indexOpen} onClose={() => setIndexOpen(false)}
        chIdx={chIdx} onPick={onPick}/>
    </div>
  );
}
