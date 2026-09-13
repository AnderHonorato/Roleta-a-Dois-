(() => {
  'use strict';

  const DATA = window.ROULETTE_DATA;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const key = 'roleta-a-dois-gpt-v2';

  const defaults = {
    maxLevel:'quente',
    sound:true,
    scores:{ander:0,lil:0},
    rounds:0,
    streak:1,
    startedAt:Date.now(),
    lastActionAt:Date.now(),
    history:[]
  };

  let state = load();
  let current = null;
  let locked = false;
  let timer = null;
  let audioCtx = null;

  function load(){
    try{
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      return {
        ...defaults,
        ...saved,
        scores:{...defaults.scores,...(saved.scores||{})},
        startedAt:Date.now(),
        lastActionAt:Date.now()
      };
    }catch{
      return {...defaults};
    }
  }

  function save(){
    try{ localStorage.setItem(key, JSON.stringify(state)); }catch{}
  }

  function format(ms){
    const total = Math.max(0, Math.floor(ms/1000));
    const m = String(Math.floor(total/60)).padStart(2,'0');
    const s = String(total%60).padStart(2,'0');
    return `${m}:${s}`;
  }

  function levelIndex(id){ return DATA.levels.findIndex(x=>x.id===id); }
  function levelMeta(id){ return DATA.levels.find(x=>x.id===id) || DATA.levels[1]; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function touch(){ state.lastActionAt = Date.now(); }

  function ensureAudio(){
    if(!state.sound) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    if(!audioCtx) audioCtx = new AC();
    if(audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    return audioCtx;
  }

  function tone(freq=220, dur=.08, gain=.04, type='sine', delay=0){
    const ctx = ensureAudio();
    if(!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(.0001, ctx.currentTime + delay);
    amp.gain.exponentialRampToValueAtTime(Math.max(.001,gain), ctx.currentTime + delay + .01);
    amp.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + delay + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + .02);
  }

  function soundClick(){ tone(260,.045,.025,'square',0); tone(180,.05,.02,'sine',.035); }
  function soundRoll(){ [160,210,140,260].forEach((f,i)=>tone(f,.055,.028,'triangle',i*.13)); tone(110,.08,.035,'sine',.58); }
  function soundWin(){ tone(420,.08,.04,'sine',0); tone(620,.08,.04,'sine',.09); tone(820,.12,.045,'triangle',.18); }
  function soundPartial(){ tone(300,.08,.035,'triangle',0); tone(420,.09,.035,'triangle',.1); }
  function soundLose(){ tone(210,.11,.035,'sawtooth',0); tone(145,.14,.035,'sawtooth',.1); }

  function init(){ wire(); renderLevels(); updateLevel(); updateStats(); startTimer(); }

  function wire(){
    $('#rollBtn').addEventListener('click', roll);
    $('#dieButton').addEventListener('click', roll);
    $('#finishBtn').addEventListener('click', showOutcome);
    $('#levelBtn').addEventListener('click', ()=>$('#levelDialog').showModal());

    $('#soundBtn').addEventListener('click', ()=>{
      state.sound = !state.sound;
      $('#soundBtn').textContent = state.sound ? '♪' : '×';
      $('#soundBtn').setAttribute('aria-label', state.sound ? 'Desativar sons' : 'Ativar sons');
      save();
      if(state.sound) soundClick();
    });

    $$('#outcomePanel [data-outcome]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ soundClick(); resolveOutcome(btn.dataset.outcome); });
    });

    ['pointerdown','keydown','touchstart'].forEach(ev=>{
      document.addEventListener(ev, touch, {passive:true});
    });
  }

  function renderLevels(){
    $('#levelOptions').innerHTML = DATA.levels.map(l=>`
      <button class="level-option ${l.id===state.maxLevel?'selected':''}" type="button" data-level="${l.id}">
        <span><strong>${l.label}</strong><small>${l.note}</small></span>
        <b>${l.score} pts</b>
      </button>
    `).join('');

    $$('#levelOptions [data-level]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.level;
        if(id === 'hardcore'){
          const ok = confirm('Hardcore libera desafios mais intensos. Confirma que todos são maiores de 18 anos e concordam com esse nível?');
          if(!ok) return;
        }
        state.maxLevel = id;
        save();
        updateLevel();
        renderLevels();
        $('#levelDialog').close();
        soundClick();
      });
    });
  }

  function updateLevel(){
    const m = levelMeta(state.maxLevel);
    $('#levelLabel').textContent = `${m.label.toUpperCase()} · ${m.score} PTS`;
  }

  function roll(){
    if(locked) return;
    locked = true;
    touch();
    soundClick();
    soundRoll();

    $('#outcomePanel').classList.add('hidden');
    $('#finishBtn').classList.add('hidden');
    $('#rollBtn').classList.add('hidden');

    const die = $('#die');
    const dieButton = $('#dieButton');
    die.classList.remove('rolling');
    dieButton.classList.remove('rolling');
    void die.offsetWidth;
    die.classList.add('rolling');
    dieButton.classList.add('rolling');

    const allowed = DATA.challenges.filter(c=>levelIndex(c.level)<=levelIndex(state.maxLevel) && c!==current);
    current = pick(allowed);

    setTimeout(()=>{
      reveal(current);
      state.rounds++;
      updateStats();
      save();
      locked = false;
      $('#finishBtn').classList.remove('hidden');
      dieButton.classList.remove('rolling');
    },1080);
  }

  function reveal(c){
    $('#wordA').textContent = c.a;
    $('#wordB').textContent = c.b;
    $('#challengeTitle').textContent = c.title;
    $('#challengeDesc').textContent = c.desc;
    $('#tease').textContent = pick(DATA.messages.rolled);

    const pair = $('#wordPair');
    pair.classList.remove('reveal');
    void pair.offsetWidth;
    pair.classList.add('reveal');

    const m = levelMeta(c.level);
    $('#levelLabel').textContent = `${m.label.toUpperCase()} · ${m.score} PTS`;
  }

  function showOutcome(){
    if(!current) return;
    soundClick();
    $('#finishBtn').classList.add('hidden');
    $('#outcomePanel').classList.remove('hidden');
    $('#outcomePanel').scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function resolveOutcome(type){
    if(!current || locked) return;
    locked = true;

    const base = levelMeta(current.level).score;
    const mult = Math.min(2.5, 1 + Math.max(0,state.streak-1)*.15);
    let aGain = 0;
    let lGain = 0;
    let cls = 'lose';
    let text = '';

    if(type === 'done'){
      aGain = Math.round(base * mult);
      lGain = Math.round(base * mult);
      state.streak++;
      cls = 'win';
      text = `🔥 Os dois fizeram: Ander +${aGain} · Lil +${lGain}`;
      $('#tease').textContent = pick(DATA.messages.win);
      soundWin();
      confetti();
    }else if(type === 'anderQuit'){
      lGain = Math.max(1, Math.round(base * .4));
      state.streak = 1;
      cls = 'partial';
      text = `Ander desistiu · Lil +${lGain} de coragem`;
      $('#tease').textContent = pick(DATA.messages.oneQuit);
      soundPartial();
    }else if(type === 'lilQuit'){
      aGain = Math.max(1, Math.round(base * .4));
      state.streak = 1;
      cls = 'partial';
      text = `Lil desistiu · Ander +${aGain} de coragem`;
      $('#tease').textContent = pick(DATA.messages.oneQuit);
      soundPartial();
    }else{
      state.streak = 1;
      cls = 'lose';
      text = 'Os dois desistiram · 0 pontos';
      $('#tease').textContent = pick(DATA.messages.bothQuit);
      soundLose();
    }

    state.scores.ander += aGain;
    state.scores.lil += lGain;
    state.history.unshift({at:Date.now(),combo:`${current.a} + ${current.b}`,outcome:type,ander:aGain,lil:lGain});
    state.history = state.history.slice(0,50);

    $('#lastResult').textContent = text;
    animateOutcome(cls, aGain, lGain);
    updateStats();
    save();

    setTimeout(()=>{ resetRound(); locked = false; },1100);
  }

  function animateOutcome(cls,aGain,lGain){
    const stage = $('#gameStage');
    stage.classList.remove('win','lose','partial');
    void stage.offsetWidth;
    stage.classList.add(cls);
    setTimeout(()=>stage.classList.remove(cls),700);
    if(aGain) pop($('#anderPoints'));
    if(lGain) pop($('#lilPoints'));
  }

  function pop(el){
    el.classList.remove('score-pop');
    void el.offsetWidth;
    el.classList.add('score-pop');
    setTimeout(()=>el.classList.remove('score-pop'),550);
  }

  function confetti(){
    const layer = $('#feedbackLayer');
    layer.innerHTML = '';
    for(let i=0;i<16;i++){
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.setProperty('--x', `${Math.round((Math.random()-.5)*280)}px`);
      s.style.setProperty('--y', `${Math.round(-40-Math.random()*180)}px`);
      s.style.setProperty('--rot', `${Math.round(Math.random()*180)}deg`);
      s.style.left = `${42 + Math.random()*16}%`;
      s.style.top = `${50 + Math.random()*12}%`;
      layer.appendChild(s);
    }
    setTimeout(()=>layer.innerHTML='',850);
  }

  function resetRound(){
    current = null;
    $('#outcomePanel').classList.add('hidden');
    $('#finishBtn').classList.add('hidden');
    $('#rollBtn').classList.remove('hidden');
    $('#wordA').textContent = 'TOQUE';
    $('#wordB').textContent = 'SURPRESA';
    $('#challengeTitle').textContent = 'Role o dado para continuar';
    $('#challengeDesc').textContent = 'A próxima combinação aparece acima. Depois vocês decidem o resultado da rodada.';
    updateLevel();
  }

  function updateStats(){
    const a = state.scores.ander;
    const l = state.scores.lil;

    $('#anderPoints').textContent = a;
    $('#lilPoints').textContent = l;
    $('#anderRankPts').textContent = a;
    $('#lilRankPts').textContent = l;
    $('#rounds').textContent = state.rounds;
    $('#streak').textContent = `×${state.streak}`;

    const max = Math.max(a,l,1);
    $('#anderBar').style.width = `${Math.round(a/max*100)}%`;
    $('#lilBar').style.width = `${Math.round(l/max*100)}%`;

    $('#scoreAnder').classList.toggle('leading',a>l);
    $('#scoreLil').classList.toggle('leading',l>a);

    if(a===l) $('#leaderText').textContent = 'Empatados';
    else $('#leaderText').textContent = a>l ? 'Ander na frente' : 'Lil na frente';

    const rankA = a===l ? '#1' : (a>l ? '#1' : '#2');
    const rankL = a===l ? '#1' : (l>a ? '#1' : '#2');
    $('#scoreAnder small').textContent = rankA;
    $('#scoreLil small').textContent = `${rankL} · Maurício`;
  }

  function startTimer(){
    clearInterval(timer);
    timer = setInterval(()=>{
      $('#sessionTime').textContent = format(Date.now()-state.startedAt);
      $('#idleTime').textContent = format(Date.now()-state.lastActionAt);
    },1000);
  }

  init();
})();