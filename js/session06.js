(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY = 'dbm-session06-progress-v1';
  const THEME = 'dbm-session06-theme-v1';
  let state = { completed: [], values: {}, quizChecked: false };
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (stored && Array.isArray(stored.completed) && stored.values && typeof stored.values === 'object') {
      state = { completed: stored.completed.filter(n => Number.isInteger(n) && n >= 0 && n < 8), values: stored.values, quizChecked: !!stored.quizChecked };
    }
  } catch { $('#s6-storage-status').textContent = 'Saving is unavailable here. Your work still works in this tab.'; }
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { $('#s6-storage-status').textContent = 'Saving is unavailable here. Keep a copy of your notes.'; }
  };
  let toastTimer;
  const toast = message => {
    const el = $('#s6-toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  };
  const panels = $$('.lesson');
  let current = 0;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setMenu = open => {
    document.body.classList.toggle('nav-open', open);
    $('#s6-menu').setAttribute('aria-expanded', String(open));
    $('#s6-scrim').hidden = !open;
    if (open) $('.step-link', $('#s6-sidebar')).focus();
  };
  const renderProgress = () => {
    $$('.step-link').forEach((el, i) => {
      el.classList.toggle('active', i === current);
      el.classList.toggle('done', state.completed.includes(i));
      if (i === current) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    $$('[data-complete]').forEach(el => {
      const done = state.completed.includes(Number(el.dataset.complete));
      el.setAttribute('aria-pressed', String(done));
      el.textContent = done ? '✓ Step complete' : '✓ Mark step complete';
    });
    $('#s6-progress-text').textContent = `${state.completed.length} / 8`;
    $('#s6-progress').setAttribute('aria-valuenow', String(state.completed.length));
    $('#s6-progress-fill').style.width = `${state.completed.length / 8 * 100}%`;
  };
  const navigate = (index, options = {}) => {
    current = Math.max(0, Math.min(7, index));
    panels.forEach((panel, i) => { panel.hidden = i !== current; });
    renderProgress(); setMenu(false);
    if (!options.fromHash) history.replaceState(null, '', `#step-${String(current + 1).padStart(2, '0')}`);
    if (!options.initial) {
      window.scrollTo({top: 0, behavior: reducedMotion() ? 'auto' : 'smooth'});
      $(`#s6-title-${current}`).focus({preventScroll: true});
    }
  };
  $$('.step-link').forEach(el => el.addEventListener('click', () => navigate(Number(el.dataset.step))));
  $$('[data-prev]').forEach(el => el.addEventListener('click', () => navigate(current - 1)));
  $$('[data-next]').forEach(el => el.addEventListener('click', () => navigate(current + 1)));
  $$('[data-complete]').forEach(el => el.addEventListener('click', () => {
    const index = Number(el.dataset.complete);
    state.completed = state.completed.includes(index) ? state.completed.filter(n => n !== index) : [...state.completed, index];
    persist(); renderProgress(); toast(state.completed.includes(index) ? 'Step saved as complete.' : 'Step marked for another look.');
  }));
  $('#s6-menu').addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  $('#s6-close').addEventListener('click', () => { setMenu(false); $('#s6-menu').focus(); });
  $('#s6-scrim').addEventListener('click', () => { setMenu(false); $('#s6-menu').focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) { setMenu(false); $('#s6-menu').focus(); }
    if (event.key === 'Tab' && document.body.classList.contains('nav-open')) {
      const focusable = $$('button:not([disabled]), a[href]', $('#s6-sidebar')).filter(el => el.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 1000) setMenu(false); });
  const applyTheme = theme => {
    document.body.dataset.theme = theme;
    $('#s6-theme').setAttribute('aria-pressed', String(theme === 'dark'));
    $('#s6-theme').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  };
  let theme = 'light';
  try { theme = localStorage.getItem(THEME) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch {}
  applyTheme(theme === 'dark' ? 'dark' : 'light');
  $('#s6-theme').addEventListener('click', () => {
    const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(next);
    try { localStorage.setItem(THEME, next); } catch {}
  });
  $('#s6-sources-link').addEventListener('click', event => {
    event.preventDefault(); navigate(7);
    requestAnimationFrame(() => $('#sources').scrollIntoView({behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start'}));
  });
  window.addEventListener('hashchange', () => {
    const match = location.hash.match(/^#step-0?([1-8])$/);
    if (match) navigate(Number(match[1]) - 1, {fromHash: true});
  });
  const initial = location.hash.match(/^#step-0?([1-8])$/);
  navigate(initial ? Number(initial[1]) - 1 : 0, {initial: true, fromHash: true});
  if (location.hash === '#sources') { navigate(7, {initial: true}); requestAnimationFrame(() => $('#sources').scrollIntoView()); }

  document.addEventListener('click', async event => {
    const button = event.target.closest('.copy-btn'); if (!button) return;
    const code = $('pre code', button.closest('.code-shell'));
    if (!code) return;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(code.textContent);
      else {
        const temp = document.createElement('textarea'); temp.value = code.textContent;
        temp.style.position = 'fixed'; temp.style.opacity = '0'; document.body.appendChild(temp);
        temp.select(); const ok = document.execCommand('copy'); temp.remove(); if (!ok) throw new Error('copy');
      }
      toast('Code copied.');
    } catch { toast('Select the code and copy it with your keyboard.'); }
  });
  const codeBlock = (label, source) => `<div class="code-shell"><div class="code-head"><span>${esc(label)}</span><button class="copy copy-btn" type="button">Copy code</button></div><pre tabindex="0"><code>${esc(source)}</code></pre></div>`;
  const journey = [
    ['SQL Server table','SQL Server stores the rows. SSMS is one way to inspect them.','SELECT * FROM dbo.Items;','Stored data'],
    ['Entity model','Item maps to dbo.Items. Each property represents a mapped value.','public int Id { get; set; }\npublic string Name { get; set; } = "";','C# model definition'],
    ['DbContext & DbSet','InventoryDbContext is our database session in EF Core. Items lets us form queries over the Item entity set, not a list already fetched from SQL Server.','public DbSet<Item> Items => Set<Item>();','No rows fetched yet'],
    ['Connection settings','Last session the connection string pointed to Session 05. Today we will connect to a separate practice database in Step 02.','Database=DBM_Session05_Inventory;','Settings only'],
    ['Provider & options','Microsoft.EntityFrameworkCore.SqlServer is the provider. UseSqlServer selects/configures it.','var options = new DbContextOptionsBuilder<InventoryDbContext>()\n    .UseSqlServer(connection).Options;','Provider configured'],
    ['New context','The supplied constructor receives options. Constructing a context does not immediately open the connection.','using var db = new InventoryDbContext(options);','Context ready'],
    ['Compose a query','Where and OrderBy build a query. They describe which rows we want and their order.','var query = db.Items\n    .Where(i => i.IsActive && i.Stock > 0)\n    .OrderBy(i => i.Name);','Query defined'],
    ['Execute and read','ToListAsync executes the query and returns a list of Item objects. We can then print the list in the Console.','var items = await query.ToListAsync();','Result available in memory']
  ];
  $('#journey-nav').innerHTML = journey.map((stage,i)=>`<li><button type="button" data-journey="${i}" aria-pressed="false"><b>${i+1}</b><span>${esc(stage[0])}</span></button></li>`).join('');
  function showJourney(i) {
    const [title,desc,sample,status]=journey[i];
    $$('[data-journey]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.journey)===i)));
    $('#journey-detail').innerHTML=`<h3>${esc(title)}</h3><p>${esc(desc)}</p>${codeBlock('Journey checkpoint',sample)}<span class="s05-status">${esc(status)}</span>`;
  }
  $$('[data-journey]').forEach(el=>el.addEventListener('click',()=>showJourney(Number(el.dataset.journey))));
  showJourney(0);
  $('#recap-check').addEventListener('click',()=>{
    const choice=$('#recap-choice').value;
    $('#recap-feedback').textContent=!choice?'Choose an answer first.':choice==='no'?'Correct. The context does not open the connection just by being constructed.':'Try again. A context is a unit of work; an executed query fetches rows.';
    $('#recap-feedback').classList.toggle('good',choice==='no');
  });

  // A deliberately simplified, single-object snapshot tracking model. It is
  // NOT a database driver and does not issue SQL. All rows are plain JS objects.
  const copyRow = row => row ? {...row} : null;
  const money = val => Number(val).toFixed(2);
  const seed = () => ({id:1,name:'Top Gun',price:18,stock:5});
  let sim;
  function resetSim() {
    sim={rows:[seed()], nextId:101, focusId:1, memory:null, original:null,
      status:'Detached', active:true, note:'Start by retrieving Top Gun, or create a new object.', sql:'No database operation yet.', before:''};
    $('#sim-price').value='25.00';
  }
  function storedRow() {
    return sim.rows.find(row=>row.id===(sim.memory?sim.memory.id:sim.focusId)) || null;
  }
  function summary() {
    const row=storedRow();
    return `Memory: ${sim.memory?money(sim.memory.price):'none'} · state: ${sim.status} · stored: ${row?money(row.price):'no matching row'}`;
  }
  function trackedExisting() {return sim.status==='Unchanged'||sim.status==='Modified';}
  function detect() {
    // Once marked Modified, retain that pending modification until saving.
    // A change that is reverted before detection need not be marked at all.
    if (sim.status==='Unchanged' && sim.memory && sim.original && sim.memory.price!==sim.original.price) sim.status='Modified';
  }
  function rowText(row) {
    if(!row) return '<p class="s06-empty">No matching row/object.</p>';
    return `<dl class="s06-values"><dt>Id</dt><dd>${row.id===0?'0 (not generated)':row.id}</dd><dt>Name</dt><dd>${esc(row.name)}</dd><dt>UnitPrice</dt><dd class="s06-price">${money(row.price)}</dd><dt>Stock</dt><dd>${row.stock}</dd></dl>`;
  }
  function allowed(action) {
    const hasRow=sim.rows.some(r=>r.id===sim.focusId), obj=sim.memory;
    if(action==='reset'||action==='newContext')return true;
    if(action==='edit')return !!obj && sim.status!=='Deleted';
    if(!sim.active)return false;
    switch(action){
      case 'retrieve': return hasRow && (!obj || sim.status==='Detached' || obj.id===sim.focusId && trackedExisting());
      case 'noTrack': return hasRow && (!obj||sim.status==='Detached');
      case 'create': return !obj||sim.status==='Detached';
      case 'add': return !!obj && obj.id===0 && sim.status==='Detached';
      case 'detect':return trackedExisting();
      case 'remove':return trackedExisting()||sim.status==='Added';
      case 'save':return true;
      case 'dispose':return true;
      default:return false;
    }
  }
  function renderSim() {
    $('#sim-context').textContent=sim.active?'DbContext active':'DbContext disposed · no active tracker';
    $('#sim-row').innerHTML=sim.rows.length?sim.rows.map(r=>`<option value="${r.id}">${r.id} · ${esc(r.name)}</option>`).join(''):'<option value="">No stored rows</option>';
    if(sim.rows.some(r=>r.id===sim.focusId))$('#sim-row').value=String(sim.focusId);
    $('#sim-row').disabled=!sim.active||!!sim.memory&&sim.status!=='Detached';
    $('#sim-memory').innerHTML=rowText(sim.memory);
    const pending=trackedExisting()&&sim.original&&sim.memory.price!==sim.original.price&&sim.status==='Unchanged';
    $('#sim-tracker').innerHTML=`<div class="s06-state ${sim.status.toLowerCase()}">${sim.status}</div><dl class="s06-values"><dt>Original stored price</dt><dd>${sim.original?money(sim.original.price):'—'}</dd><dt>Current tracked price</dt><dd>${sim.memory&&sim.status!=='Detached'?money(sim.memory.price):'—'}</dd></dl><p class="small">${pending?'Price changed; detection is pending.':sim.status==='Detached'?'No tracked entry for this object.':sim.status==='Added'?'New object; no original stored row.':sim.status==='Deleted'?'Pending deletion; row still exists until saving.':'Tracker holds this entity in the current context.'}</p>`;
    $('#sim-db').innerHTML=rowText(storedRow())+`<p class="small">${sim.rows.length} stored row${sim.rows.length===1?'':'s'} in this simulated database.</p>`;
    $$('[data-sim]').forEach(b=>b.disabled=!allowed(b.dataset.sim));
    $('#sim-price').disabled=!sim.memory||sim.status==='Deleted';
    $('#sim-feedback').textContent=sim.note;
    $('#sim-before').textContent=sim.before?`${sim.before}\nAfter: ${summary()}`:`Now: ${summary()}`;
    $('#sim-sql').textContent=sim.sql;
  }
  function simAction(action) {
    if(!allowed(action))return;
    const before=summary();
    sim.sql='No database write for this action.';
    if(action==='reset') {resetSim();renderSim();return;}
    if(action==='retrieve'||action==='noTrack'){
      if(action==='retrieve'&&sim.memory&&trackedExisting()&&sim.memory.id===sim.focusId){sim.note='FindAsync can return the already tracked object. No second database query.';sim.sql='No SQL query needed (tracked key).';}
      else {
        sim.memory=copyRow(sim.rows.find(r=>r.id===sim.focusId));
        sim.status=action==='retrieve'?'Unchanged':'Detached';
        sim.original=action==='retrieve'?copyRow(sim.memory):null;
        sim.note=action==='retrieve'?'SQL row materialised into a C# object; this context tracks its original values.':'SQL row materialised; the new object is not tracked by this context.';
        sim.sql='SELECT ... FROM dbo.Items WHERE Id = @id;';
      }
    } else if(action==='create') {
      sim.memory={id:0,name:'Common Green Darner',price:12.50,stock:3};sim.original=null;sim.status='Detached';
      sim.note='new Item creates an in-memory object. SQL Server has no matching stored row yet.';
    } else if(action==='add') {
      sim.status='Added';sim.original=null;sim.note='Add schedules an insertion. The database is unchanged; the real ID arrives after saving.';
    } else if(action==='edit') {
      const input=$('#sim-price'); const raw=input.value.trim(); const p=Number(raw);
      if(!raw||!Number.isFinite(p)||p<0||p>99999999.99||Math.abs(p*100-Math.round(p*100))>0.00001){sim.note='Enter a valid non-negative price with at most two decimal places.';renderSim();return;}
      sim.memory.price=p;sim.note=sim.status==='Detached'?'Only this untracked object changed. Saving cannot persist it automatically.':sim.status==='Added'?'The new object price changed. It is still Added; its new values will be inserted when saved.':'Only the object in memory changed. The tracker detects differences when detection runs.';
    } else if(action==='detect') {
      detect();sim.note=`DetectChanges compared original and current prices. State: ${sim.status}. The row is still unchanged.`;
    } else if(action==='remove') {
      if(sim.status==='Added'){sim.status='Detached';sim.original=null;sim.note='Removing the new Added object cancels its pending insert.';}
      else {sim.status='Deleted';sim.note='Remove marked the existing entity as Deleted. The stored row still exists until save.';}
    } else if(action==='save') {
      detect();
      if(sim.status==='Added'){
        sim.memory.id=sim.nextId++;sim.rows.push(copyRow(sim.memory));sim.focusId=sim.memory.id;sim.original=copyRow(sim.memory);sim.status='Unchanged';
        sim.sql='INSERT INTO dbo.Items (Name, UnitPrice, Stock, ...) VALUES (@name, @price, @stock, ...);\n-- Read the SQL Server-generated ID.';
        sim.note=`Saved 1 entry. Generated simulated ID: ${sim.memory.id}. Now Unchanged.`;
      }else if(sim.status==='Modified'){
        const i=sim.rows.findIndex(r=>r.id===sim.memory.id);
        if(i>=0)sim.rows[i]=copyRow(sim.memory);
        sim.original=copyRow(sim.memory);sim.status='Unchanged';sim.sql='UPDATE dbo.Items SET UnitPrice = @price WHERE Id = @id;';sim.note='Automatic change detection and successful save: 1 entry written. Stored price now matches memory.';
      }else if(sim.status==='Deleted'){
        sim.rows=sim.rows.filter(r=>r.id!==sim.memory.id);sim.original=null;sim.status='Detached';sim.focusId=sim.rows[0]?.id??0;sim.sql='DELETE FROM dbo.Items WHERE Id = @id;';sim.note='Saved 1 entry. Stored row is gone. The remaining C# object is no longer tracked.';
      }else{sim.note='0 entries written: no detected pending changes in this context.';sim.sql='No INSERT, UPDATE or DELETE.';}
    } else if(action==='dispose') {
      sim.active=false;sim.status='Detached';sim.original=null;sim.note='Disposed the context without saving. Its tracking is gone. The C# reference and stored rows are separate.';
    } else if(action==='newContext') {
      sim.active=true;sim.memory=null;sim.original=null;sim.status='Detached';sim.focusId=sim.rows.find(r=>r.id===sim.focusId)?.id??sim.rows[0]?.id??0;sim.note='Started a fresh context, discarding any pending tracking without saving. Stored rows are unchanged. No connection opens yet.';
    }
    sim.before=`Before: ${before}`;renderSim();
  }
  $('#sim-row').addEventListener('change',e=>{sim.focusId=Number(e.target.value);sim.memory=null;sim.original=null;sim.status='Detached';sim.note='Selected a stored row. Retrieve it to create an object.';sim.sql='No database operation yet.';sim.before='';renderSim();});
  $$('[data-sim]').forEach(b=>b.addEventListener('click',()=>simAction(b.dataset.sim)));
  resetSim();renderSim();

  // A deliberately small example of the difference between stored rows,
  // materialized objects, and entries of ONE context. Nothing is written.
  let scopeLoaded={};
  const scopeActions={
    find1:[1,'tracked','var topGun = await db.Items.FindAsync(1);','Top Gun is loaded and tracked. It is Unchanged.'],
    read2:[2,'untracked','var starWars = await db.Items.AsNoTracking()\n    .SingleAsync(i => i.Id == 2);','Star Wars is loaded into memory, but this context does not track that object.'],
    find3:[3,'tracked','var starTrek = await db.Items.FindAsync(3);','Star Trek is loaded and tracked. The same tracker now holds both tracked objects if you also found Top Gun.']
  };
  const scopeBadge=(state)=>`<span class="s06-state ${state.toLowerCase()}">${esc(state)}</span>`;
  function renderScope(){
    for(const i of [1,2,3]){
      $('#scope-m'+i).textContent=scopeLoaded[i]?'Item object loaded':'Not loaded';
      $('#scope-t'+i).innerHTML=scopeLoaded[i]==='tracked'?scopeBadge('Unchanged'):(scopeLoaded[i]==='untracked'?scopeBadge('Detached')+'<small> · no tracked entry</small>':'None');
    }
    $('#scope-memory').textContent=Object.keys(scopeLoaded).length;
    $('#scope-tracked').textContent=Object.values(scopeLoaded).filter(x=>x==='tracked').length;
    $$('[data-scope]').forEach(b=>{const row=scopeActions[b.dataset.scope];b.disabled=!!row&&row[1]==='untracked'&&!!scopeLoaded[row[0]];});
  }
  function resetScope(){scopeLoaded={};$('#scope-feedback').textContent='A new context has no tracked objects yet.';$('#scope-code').textContent='using var db = new InventoryDbContext(options);';renderScope();}
  $$('[data-scope]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.scope==='reset'){resetScope();return;}
    const [id,mode,source,message]=scopeActions[b.dataset.scope];
    const repeated=scopeLoaded[id]==='tracked'&&mode==='tracked';
    scopeLoaded[id]=mode;$('#scope-code').textContent=source;$('#scope-feedback').textContent=repeated?'Already tracked: Find returns the same C# object. No new object, tracked entry or SQL query in this simulated step.':message;renderScope();
  }));
  resetScope();

  // Unit of work: three independent pending operations in one tracker, one save.
  let work={};
  function renderWork(){
    const n=Number(work.edit)+Number(work.remove)+Number(work.add);
    const saved=work.saved;
    $('#uow-count').textContent=2+Number(work.add)-Number(saved&&work.remove);
    $('#uow-pending').textContent=saved?0:n;
    $('#uow-writes').textContent=saved?n:0;
    $('#uow-edit-memory').textContent='Memory price: '+(work.edit?'25.00':'12.50');
    $('#uow-edit-state').innerHTML=scopeBadge(work.edit&&!saved?'Modified':'Unchanged');
    $('#uow-edit-stored').textContent=work.edit&&saved?'25.00':'12.50';
    $('#uow-delete-memory').textContent=work.remove?(saved?'Object remains, detached':'Remove requested'):'Object loaded';
    $('#uow-delete-state').innerHTML=scopeBadge(work.remove?(saved?'Detached':'Deleted'):'Unchanged');
    $('#uow-delete-stored').textContent=work.remove&&saved?'No row · deleted':'Row exists';
    $('#uow-add-memory').textContent=work.add?(saved?'New item · ID 103 (simulated)':'New Item · ID pending'):'No new object yet';
    $('#uow-add-state').innerHTML=work.add?scopeBadge(saved?'Unchanged':'Added'):'None';
    $('#uow-add-stored').textContent=work.add&&saved?'Row exists · ID 103':'No row';
    $$('[data-uow]').forEach(b=>{const a=b.dataset.uow;b.disabled=a==='reset'?false:a==='save'?saved||n===0:saved||work[a];});
    $('#uow-summary').textContent=saved?`${n} tracked state entr${n===1?'y':'ies'} written in this simplified example. Unloaded and untracked rows are unchanged.`:`${n} pending change${n===1?'':'s'}; no database writes so far.`;
    $('#uow-sql').textContent=saved?[
      work.edit?'UPDATE dbo.Items SET UnitPrice = @price WHERE Id = @editId;':'',
      work.remove?'DELETE FROM dbo.Items WHERE Id = @deleteId;':'',
      work.add?'INSERT INTO dbo.Items (Name, UnitPrice, Stock, ...) VALUES (...);':'',
      '-- Illustrative commands; one successful SaveChangesAsync call.'
    ].filter(Boolean).join('\n'):'No database write until SaveChangesAsync().';
  }
  function resetWork(){work={edit:false,remove:false,add:false,saved:false};$('#uow-feedback').textContent='No pending changes yet. Prepare the three operations.';renderWork();}
  $$('[data-uow]').forEach(b=>b.addEventListener('click',()=>{
    const a=b.dataset.uow;if(a==='reset'){resetWork();return;}
    if(a==='save'){work.saved=true;$('#uow-feedback').textContent='One successful save applies all pending tracked changes in this context.';}
    else {work[a]=true;$('#uow-feedback').textContent={edit:'The tracked price changed in memory and detection marked it Modified.',remove:'Remove marked the existing tracked item Deleted; the row is still stored.',add:'Add marked the new Item Added; no row has been inserted yet.'}[a];}
    renderWork();
  }));
  resetWork();

  const quiz=[
    {q:'What does creating a DbContext do immediately?',a:['Load all Items.','Prepare a unit of work; it does not open the connection immediately.','Generate an INSERT.'],correct:1,why:'A context and options prepare the session. A query or save uses the connection.'},
    {q:'FindAsync(id) returns null. What should you do?',a:['Access item.Name immediately.','Assume the ID was generated.','Handle the missing item and stop the operation.'],correct:2,why:'A valid ID may not match a row. Check the result before using the entity.'},
    {q:'After Add(item), before a save, what is the normal state?',a:['Added; no inserted row yet.','Unchanged; the row is already inserted.','Detached; Add does not track.'],correct:0,why:'Add registers a pending insertion. SQL Server generates the key when the insert succeeds at save.'},
    {q:'You fetched an Item with tracking and assigned its price. Why is Update() unnecessary?',a:['SQL Server notices C# assignments directly.','The context tracks original/current values; SaveChanges detects changes.','Assigning a property automatically sends SQL.'],correct:1,why:'The object changes in memory. EF detects the changes and persists them during saving.'},
    {q:'You edited a tracked item, then disposed its context without saving. What happened?',a:['An automatic UPDATE occurred.','The stored row changed only if the price was valid.','The pending tracked change was not saved.'],correct:2,why:'Disposal releases the context and its tracking; it does not call SaveChanges.'},
    {q:'What does Remove(item) normally do for an existing tracked row?',a:['Marks it Deleted; the database DELETE occurs during saving.','Deletes it immediately from SQL Server.','Makes it Added.'],correct:0,why:'Remove schedules the existing row for deletion. After successful default saving, the entity becomes Detached.'},
    {q:'What happens if you edit an AsNoTracking result and call SaveChanges with no other changes?',a:['The object is automatically attached.','No change to that database row is written.','The database schema is changed.'],correct:1,why:'The object still exists in memory, but it is not tracked by this context.'},
    {q:'What does SaveChangesAsync normally return?',a:['The ID of the item.','The number of changed SQL columns.','The number of state entries written.'],correct:2,why:'A changed entity can have several changed properties but count as one entry. A no-change save can return zero.'},
    {q:'In a fresh context, you Find two different existing IDs and read a third with AsNoTracking. How many tracked entries are there?',a:['All rows in Items.','Two.','Three.'],correct:1,why:'Only the two entities retrieved with tracking are entries in this context. The no-tracking object is still in memory.'},
    {q:'FindAsync returns the same existing key twice in the same context. What does the second call normally do?',a:['It returns the existing tracked object without a new SQL query.','It always runs a new SELECT and creates a second tracked object.','It saves pending changes.'],correct:0,why:'FindAsync checks for a tracked entity with that key before querying SQL Server. It does not save.'}
  ];
  $('#exit-quiz').innerHTML=quiz.map((q,i)=>`<fieldset class="s05-quiz-item"><legend>${i+1}. ${esc(q.q)}</legend>${q.a.map((a,j)=>`<label><input type="radio" name="exit-${i}" value="${j}" data-save="exit-${i}"><span>${esc(a)}</span></label>`).join('')}<p class="s05-answer" id="exit-answer-${i}" hidden></p></fieldset>`).join('')+'<button class="button s2-btn primary" id="exit-check" type="button">Check all answers</button><p id="exit-quiz-result" role="status"></p>';
  function scoreQuiz(silent=false) {
    const choices=quiz.map((_,i)=>$(`input[name="exit-${i}"]:checked`));
    if(choices.some(c=>!c)){if(!silent)$('#exit-quiz-result').textContent=`Answer all ${quiz.length} questions first.`;return;}
    let score=0;
    choices.forEach((c,i)=>{const good=Number(c.value)===quiz[i].correct;if(good)score++;const p=$(`#exit-answer-${i}`);p.hidden=false;p.textContent=(good?'Correct. ':'Review this one. ')+quiz[i].why;});
    $('#exit-quiz-result').textContent=`${score} / ${quiz.length} correct. Review the explanations.`;state.quizChecked=true;persist();
  }
  $('#exit-check').addEventListener('click',()=>scoreQuiz());
  $$('[data-save]').forEach(el=>{
    const value=state.values[el.dataset.save];
    if(el.type==='checkbox')el.checked=value===true;
    else if(el.type==='radio')el.checked=String(value)===el.value;
    else if(typeof value==='string')el.value=value;
    el.addEventListener(el.matches('textarea,input[type=text]')?'input':'change',()=>{
      state.values[el.dataset.save]=el.type==='checkbox'?el.checked:el.value;
      if(el.type==='radio'){state.quizChecked=false;$('#exit-quiz-result').textContent='';$$('.s05-answer').forEach(p=>p.hidden=true);}
      persist();
    });
  });
  if(state.quizChecked)scoreQuiz(true);
  const dialog=$('#s6-reset-dialog');
  $('#s6-reset').addEventListener('click',()=>dialog.showModal());
  $('#s6-cancel-reset').addEventListener('click',()=>dialog.close());
  $('#s6-confirm-reset').addEventListener('click',()=>{
    state={completed:[],values:{},quizChecked:false};persist();
    $$('[data-save]').forEach(el=>{if(el.type==='checkbox'||el.type==='radio')el.checked=false;else el.value='';});
    $$('.s05-answer').forEach(el=>el.hidden=true);$('#exit-quiz-result').textContent='';
    $('#recap-choice').value='';$('#recap-feedback').textContent='';
    $$('details').forEach(el=>el.open=false);showJourney(0);resetSim();renderSim();resetScope();resetWork();
    dialog.close();navigate(0);toast('Session 06 has been reset.');
  });
})();
