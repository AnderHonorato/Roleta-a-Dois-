(() => {
  'use strict';
  const DATA = window.ROULETTE_DATA;
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const storeKey = 'roleta-a-dois-gpt-v1';
  const initialState = {
    ageAccepted:false, setupDone:false, theme:'queer', maxLevel:'quente', names:['Ander','Par'], points:0, streak:1,
    rounds:0, done:0, skipped:0, startedAt:Date.now(), lastActionAt:Date.now(), history:[], achievements:[], sound:true,
    bannerIndex:0, userBanners:[]
  };
  let state = loadState();
  let setupStep = 1;
  let currentChallenge = null;
  let rollLocked = false;
  let idleToastMark = 0;
  let sessionTicker = null;
  let bannerTimer = null;

  function loadState(){
    try { return {...initialState, ...JSON.parse(localStorage.getItem(storeKey) || '{}'), startedAt:Date.now(), lastActionAt:Date.now()}; }
    catch { return {...initialState}; }
  }
  function persist(){
    try { localStorage.setItem(storeKey, JSON.stringify({...state, userBanners:state.userBanners.slice(0,4)})); } catch {}
  }
  function pick(list){ return list[Math.floor(Math.random()*list.length)]; }
  function escapeHtml(value=''){ return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function formatTime(ms){ const total=Math.max(0,Math.floor(ms/1000)); const m=Math.floor(total/60).toString().padStart(2,'0'); const s=(total%60).toString().padStart(2,'0'); return `${m}:${s}`; }
  function levelIndex(id){ return DATA.levels.findIndex(l=>l.id===id); }
  function levelMeta(id){ return DATA.levels.find(l=>l.id===id) || DATA.levels[1]; }
  function touch(){ state.lastActionAt=Date.now(); idleToastMark=0; }
  function toast(message){
    const node=document.createElement('div'); node.className='toast'; node.textContent=message; $('#toastStack').appendChild(node); setTimeout(()=>node.remove(),3500);
  }

  function init(){
    document.body.dataset.theme=state.theme;
    renderThemeChoices(); renderLevels(); wireBaseEvents(); updateCoupleUI(); renderBanners(); updateStats(); startTimers();
    if(state.ageAccepted){ $('#ageGate').hidden=true; state.setupDone ? showApp() : showSetup(); }
    else { $('#ageGate').hidden=false; }
  }

  function wireBaseEvents(){
    $('#consentCheck').addEventListener('change', e => $('#enterBtn').disabled=!e.target.checked);
    $('#enterBtn').addEventListener('click', () => { state.ageAccepted=true; persist(); $('#ageGate').hidden=true; showSetup(); });
    $('#setupBack').addEventListener('click', () => changeSetup(-1));
    $('#setupNext').addEventListener('click', () => changeSetup(1));
    $('#nameOne').addEventListener('input', e => state.names[0]=e.target.value.trim() || 'Pessoa 1');
    $('#nameTwo').addEventListener('input', e => state.names[1]=e.target.value.trim() || 'Pessoa 2');
    $('#rollBtn').addEventListener('click', rollChallenge);
    $('#doneBtn').addEventListener('click', completeChallenge);
    $('#skipBtn').addEventListener('click', skipChallenge);
    $('#settingsBtn').addEventListener('click', openSettings);
    $('#coupleTrigger').addEventListener('click', openProfile);
    $('#closeSheet').addEventListener('click', () => $('#sheet').close());
    $('#soundBtn').addEventListener('click', () => { state.sound=!state.sound; persist(); toast(state.sound?'Sons ativados.':'Sons silenciados.'); });
    $$('.bottom-nav button').forEach(btn => btn.addEventListener('click', () => handleNav(btn.dataset.panel, btn)));
    ['pointerdown','keydown','touchstart'].forEach(ev => document.addEventListener(ev, touch, {passive:true}));
  }

  function showSetup(){ $('#setupLayer').hidden=false; $('#appShell').hidden=true; renderSetupStep(); }
  function showApp(){ $('#setupLayer').hidden=true; $('#appShell').hidden=false; updateCoupleUI(); updateStats(); }
  function changeSetup(dir){
    if(dir>0 && setupStep===2 && state.maxLevel==='hardcore'){
      if(!confirm('Hardcore libera desafios mais intensos. Confirma que todos são maiores de 18 anos e concordam com esse nível?')) return;
    }
    if(dir>0 && setupStep===3){
      state.names=[$('#nameOne').value.trim()||'Pessoa 1',$('#nameTwo').value.trim()||'Pessoa 2']; state.setupDone=true; persist(); showApp(); toast('Perfil local pronto. Agora é com o dado.'); return;
    }
    setupStep=Math.min(3,Math.max(1,setupStep+dir)); renderSetupStep();
  }
  function renderSetupStep(){
    $$('.setup-step').forEach(step=>step.classList.toggle('active',Number(step.dataset.step)===setupStep));
    $('#stepLabel').textContent=`0${setupStep} / 03`; $('#progressFill').style.width=`${setupStep*33.34}%`; $('#setupBack').disabled=setupStep===1;
    $('#setupNext').innerHTML=setupStep===3?'Começar <svg><use href="#i-chevron"></use></svg>':'Continuar <svg><use href="#i-chevron"></use></svg>';
    $('#nameOne').value=state.names[0]; $('#nameTwo').value=state.names[1];
  }
  function renderThemeChoices(){
    $('#themeRail').innerHTML=DATA.themes.map(t=>`<button class="theme-choice ${state.theme===t.id?'selected':''}" style="--choice-accent:${t.accent}" data-theme-id="${t.id}" role="radio" aria-checked="${state.theme===t.id}"><strong>${t.label}</strong><small>${t.tagline}</small></button>`).join('');
    $$('.theme-choice').forEach(btn=>btn.addEventListener('click',()=>{
      state.theme=btn.dataset.themeId; document.body.dataset.theme=state.theme; $$('.theme-choice').forEach(x=>{x.classList.toggle('selected',x===btn);x.setAttribute('aria-checked',x===btn)}); persist();
    }));
  }
  function renderLevels(){
    $('#levelSpectrum').innerHTML=DATA.levels.map((l,i)=>`<button class="level-option ${state.maxLevel===l.id?'selected':''}" data-level-id="${l.id}"><span class="level-index">0${i+1}</span><span class="level-copy"><strong>${l.label}</strong><small>${l.note}</small></span><span class="level-score">+${l.score}</span></button>`).join('');
    $$('.level-option').forEach(btn=>btn.addEventListener('click',()=>{ state.maxLevel=btn.dataset.levelId; $$('.level-option').forEach(x=>x.classList.toggle('selected',x===btn)); persist(); }));
  }

  function rollChallenge(){
    if(rollLocked) return; rollLocked=true; touch(); $('#rollBtn').disabled=true; $('#resultActions').hidden=true;
    const die=$('#die'); die.classList.remove('rolling'); void die.offsetWidth; die.classList.add('rolling');
    playTone(160, .06, 0.12); setTimeout(()=>playTone(220,.05,.08),380); setTimeout(()=>playTone(120,.07,.1),940);
    const allowedIndex=levelIndex(state.maxLevel); const pool=DATA.challenges.filter(c=>levelIndex(c.level)<=allowedIndex && (!currentChallenge || c.title!==currentChallenge.title)); currentChallenge=pick(pool);
    setTimeout(()=>{ revealChallenge(currentChallenge); state.rounds++; updateStats(); rollLocked=false; $('#rollBtn').disabled=false; $('#rollBtn').hidden=true; $('#resultActions').hidden=false; persist(); checkAchievements(); },1260);
  }
  function revealChallenge(c){
    $('#wordLeft').textContent=c.left; $('#wordRight').textContent=c.right; $('#challengeTitle').textContent=c.title; $('#challengeDesc').textContent=c.desc;
    const meta=levelMeta(c.level); $('#intensityTag').textContent=`${meta.label.toUpperCase()} · +${meta.score}`; $('#promptBubble').textContent=pick(DATA.messages.rolled);
  }
  function completeChallenge(){
    if(!currentChallenge) return; touch(); const meta=levelMeta(currentChallenge.level); const mult=Math.min(3, 1+(Math.max(0,state.streak-1)*.25)); const gained=Math.round(meta.score*mult);
    state.points+=gained; state.done++; state.streak++; state.history.unshift({type:'done',title:currentChallenge.title,words:`${currentChallenge.left} ${currentChallenge.right}`,points:gained,at:Date.now()}); state.history=state.history.slice(0,40);
    $('#promptBubble').textContent=pick(DATA.messages.done); toast(`+${gained} pontos · sequência ×${state.streak}`); playTone(520,.08,.08); setTimeout(()=>playTone(720,.07,.06),100); resetRoundSoon(); persist(); updateStats(); checkAchievements();
  }
  function skipChallenge(){
    if(!currentChallenge) return; touch(); state.skipped++; state.streak=Math.max(1,state.streak-1); state.history.unshift({type:'skip',title:currentChallenge.title,words:`${currentChallenge.left} ${currentChallenge.right}`,points:0,at:Date.now()}); state.history=state.history.slice(0,40); $('#promptBubble').textContent=pick(DATA.messages.skipped); persist(); updateStats(); setTimeout(()=>{ $('#rollBtn').hidden=false; $('#resultActions').hidden=true; rollChallenge(); },420);
  }
  function resetRoundSoon(){
    setTimeout(()=>{ currentChallenge=null; $('#rollBtn').hidden=false; $('#resultActions').hidden=true; $('#wordLeft').textContent='DE NOVO'; $('#wordRight').textContent='?'; $('#challengeTitle').textContent='A próxima já está esperando.'; $('#challengeDesc').textContent='Quando estiverem prontos, rolem outra vez.'; },520);
  }

  function updateStats(){
    $('#points').textContent=state.points; $('#streak').textContent=`×${state.streak}`; $('#roundSummary').textContent=`${state.rounds} rodadas · ${state.done} feitas · ${state.skipped} trocas`; $('#streakFill').style.width=`${Math.min(100,(state.streak-1)*14)}%`;
    $('#sessionHint').textContent=state.streak>=5?'Vocês entraram no modo sequência. O multiplicador está alto.':'Complete rodadas em sequência para multiplicar os pontos.';
  }
  function startTimers(){
    clearInterval(sessionTicker); sessionTicker=setInterval(()=>{
      $('#sessionTime').textContent=formatTime(Date.now()-state.startedAt); const idle=Date.now()-state.lastActionAt; $('#idleTime').textContent=formatTime(idle);
      const minute=Math.floor(idle/60000); if(minute>=2 && minute!==idleToastMark && minute%2===0){ idleToastMark=minute; toast(pick(DATA.messages.idle)); }
    },1000);
  }

  function updateCoupleUI(){
    const [a,b]=state.names; $('#coupleName').textContent=`${a} × ${b}`; $('#avatarOne').textContent=(a[0]||'A').toUpperCase(); $('#avatarTwo').textContent=(b[0]||'P').toUpperCase();
  }

  function renderBanners(){
    const all=[...state.userBanners.map((src,i)=>({kicker:'NOSSO BANNER',title:`Imagem ${i+1}`,style:'user-image',src})),...DATA.banners];
    $('#bannerTrack').innerHTML=all.map((b,i)=>`<div class="banner-slide ${b.style} ${i===state.bannerIndex?'active':''}" ${b.src?`style="background-image:url('${b.src}')"`:''}></div>`).join('');
    $('#bannerDots').innerHTML=all.map((_,i)=>`<button class="${i===state.bannerIndex?'active':''}" data-banner="${i}" aria-label="Banner ${i+1}"></button>`).join('');
    $$('#bannerDots button').forEach(btn=>btn.addEventListener('click',()=>setBanner(Number(btn.dataset.banner))));
    const current=all[state.bannerIndex]||all[0]; $('#bannerKicker').textContent=current.kicker; $('#bannerTitle').textContent=current.title;
    clearInterval(bannerTimer); bannerTimer=setInterval(()=>setBanner((state.bannerIndex+1)%all.length),30000);
  }
  function setBanner(index){
    const all=[...state.userBanners.map((src,i)=>({kicker:'NOSSO BANNER',title:`Imagem ${i+1}`,style:'user-image',src})),...DATA.banners]; state.bannerIndex=(index+all.length)%all.length; $$('.banner-slide').forEach((el,i)=>el.classList.toggle('active',i===state.bannerIndex)); $$('#bannerDots button').forEach((el,i)=>el.classList.toggle('active',i===state.bannerIndex)); const current=all[state.bannerIndex]; $('#bannerKicker').textContent=current.kicker; $('#bannerTitle').textContent=current.title;
  }

  function handleNav(panel, button){
    $$('.bottom-nav button').forEach(x=>x.classList.toggle('nav-active',x===button)); if(panel==='game') return; if(panel==='history') openHistory(); if(panel==='achievements') openAchievements(); if(panel==='profile') openProfile();
  }
  function openSheet(title, eyebrow, html){ $('#sheetTitle').textContent=title; $('#sheetEyebrow').textContent=eyebrow; $('#sheetBody').innerHTML=html; $('#sheet').showModal(); }
  function openHistory(){
    const rows=state.history.length?state.history.map(h=>`<div class="history-line"><span class="history-bullet"></span><span class="history-copy"><strong>${escapeHtml(h.words)}</strong><small>${escapeHtml(h.title)} · ${new Date(h.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></span><span class="history-points">${h.points?`+${h.points}`:'troca'}</span></div>`).join(''):'<p class="lead">Nenhuma rodada registrada ainda.</p>';
    openSheet('Histórico da sessão','MEMÓRIA LOCAL',rows);
  }
  function openAchievements(){
    const rows=DATA.achievements.map(a=>{const unlocked=state.achievements.includes(a.id);return `<div class="achievement-line ${unlocked?'':'locked'}"><span class="achievement-sigil">✦</span><span class="history-copy"><strong>${a.title}</strong><small>${a.desc}</small></span><span>${unlocked?'Liberada':'Bloqueada'}</span></div>`}).join(''); openSheet('Conquistas','PROGRESSO',rows);
  }
  function openProfile(){
    openSheet('Perfil do casal','DOIS LOGINS · UM PERFIL',`
      <section class="sheet-section"><h3>Identidade</h3><div class="inline-grid"><div class="form-line"><label>Pessoa 1</label><input id="profileOne" value="${escapeHtml(state.names[0])}" maxlength="24"></div><div class="form-line"><label>Pessoa 2</label><input id="profileTwo" value="${escapeHtml(state.names[1])}" maxlength="24"></div></div><button class="sheet-action primary" id="saveProfile">Salvar nomes</button></section>
      <section class="sheet-section"><h3>Estrutura de conta</h3><p class="lead compact">Nesta versão local, não guardamos senha. O layout já prevê duas contas vinculadas ao mesmo perfil, mas autenticação real deve entrar apenas com backend e hash seguro.</p><div class="inline-grid"><div class="form-line"><label>E-mail 1 (demonstração)</label><input type="email" placeholder="pessoa1@email.com"></div><div class="form-line"><label>E-mail 2 (demonstração)</label><input type="email" placeholder="pessoa2@email.com"></div></div></section>
      <section class="sheet-section"><h3>Banners do casal</h3><p class="lead compact">Você pode adicionar imagens locais para testar o carrossel. Elas ficam somente neste navegador e podem ocupar bastante espaço.</p><input id="bannerInput" type="file" accept="image/*" multiple hidden><button class="sheet-action" id="pickBanners"><svg style="width:16px;height:16px;vertical-align:-3px;fill:none;stroke:currentColor"><use href="#i-image"></use></svg> Adicionar imagens</button> <button class="sheet-action" id="clearBanners">Limpar imagens</button></section>`);
    $('#saveProfile').addEventListener('click',()=>{state.names=[$('#profileOne').value.trim()||'Pessoa 1',$('#profileTwo').value.trim()||'Pessoa 2'];updateCoupleUI();persist();toast('Perfil atualizado.');});
    $('#pickBanners').addEventListener('click',()=>$('#bannerInput').click()); $('#clearBanners').addEventListener('click',()=>{state.userBanners=[];state.bannerIndex=0;persist();renderBanners();toast('Banners locais removidos.');});
    $('#bannerInput').addEventListener('change',handleBannerFiles);
  }
  function handleBannerFiles(e){
    const files=[...e.target.files].slice(0,4); if(!files.length)return; let remaining=files.length; const loaded=[]; files.forEach(file=>{if(file.size>1_500_000){toast(`${file.name}: imagem grande demais para o modo local.`);if(--remaining===0)finish();return;} const r=new FileReader();r.onload=()=>{loaded.push(r.result);if(--remaining===0)finish();};r.onerror=()=>{if(--remaining===0)finish();};r.readAsDataURL(file);}); function finish(){state.userBanners=[...state.userBanners,...loaded].slice(0,4);persist();renderBanners();toast(`${loaded.length} banner(s) adicionado(s).`);}
  }
  function openSettings(){
    const themeOptions=DATA.themes.map(t=>`<option value="${t.id}" ${state.theme===t.id?'selected':''}>${t.label}</option>`).join(''); const levelOptions=DATA.levels.map(l=>`<option value="${l.id}" ${state.maxLevel===l.id?'selected':''}>${l.label}</option>`).join('');
    openSheet('Preferências','AJUSTES',`<section class="sheet-section"><h3>Experiência</h3><div class="form-line"><label>Tema</label><select id="settingsTheme">${themeOptions}</select></div><div class="form-line"><label>Intensidade máxima</label><select id="settingsLevel">${levelOptions}</select></div><button class="sheet-action primary" id="saveSettings">Aplicar</button></section><section class="sheet-section"><h3>Dados locais</h3><p class="lead compact">Pontos, histórico e preferências estão no localStorage deste navegador.</p><button class="sheet-action" id="resetSession">Zerar sessão</button> <button class="sheet-action" id="resetEverything">Apagar demo</button></section>`);
    $('#saveSettings').addEventListener('click',()=>{const nextLevel=$('#settingsLevel').value;if(nextLevel==='hardcore'&&state.maxLevel!=='hardcore'&&!confirm('Confirma 18+ e consentimento para liberar Hardcore?'))return;state.theme=$('#settingsTheme').value;state.maxLevel=nextLevel;document.body.dataset.theme=state.theme;persist();toast('Preferências aplicadas.');});
    $('#resetSession').addEventListener('click',()=>{state.points=0;state.streak=1;state.rounds=0;state.done=0;state.skipped=0;state.history=[];state.achievements=[];state.startedAt=Date.now();state.lastActionAt=Date.now();persist();updateStats();$('#sheet').close();toast('Sessão zerada.');});
    $('#resetEverything').addEventListener('click',()=>{if(confirm('Apagar toda a demonstração local e voltar ao início?')){localStorage.removeItem(storeKey);location.reload();}});
  }

  function checkAchievements(){
    DATA.achievements.forEach(a=>{if(state.achievements.includes(a.id))return; const value=a.type==='done'?state.done:a.type==='streak'?state.streak:state.points; if(value>=a.threshold){state.achievements.push(a.id);persist();toast(`Conquista: ${a.title} ✦`);}});
  }
  function playTone(freq=220,duration=.06,volume=.05){
    if(!state.sound)return; try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.frequency.value=freq;osc.type='sine';gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration);osc.onended=()=>ctx.close();}catch{}
  }

  init();
})();
