const briefs=window.ATLAS_BRIEFS;
const colors={Space:'#62b8ff',Quantum:'#a682ff',Energy:'#f3a43b',Biotech:'#4ed09a',Materials:'#e26f86'};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let activeCategory='All',activeBrief=briefs[0],commandIndex=0;

const categories=['All',...new Set(briefs.map(b=>b.category))];
const scoring=b=>({
  Scientific:Math.min(10,b.score+.2),
  Commercial:Math.max(5.5,b.score-(b.signal.includes('Discovered')?2.2:.7)),
  Opportunity:Math.max(5.5,b.score-.4),
  Confidence:b.signal.includes('Evidence')||b.signal.includes('Confirmed')?9.2:8.1,
  Momentum:b.category==='Biotech'?9.0:b.category==='Energy'?8.6:b.category==='Space'?8.4:7.8
});
const enhancements={
 'SP-001':{related:['Robotics','Surface power','ISRU','Advanced materials'],companies:['NASA','SpaceX','Lockheed Martin','Northrop Grumman']},
 'SP-002':{related:['Cryogenics','Quantum sensing','Precision magnets','Fundamental physics'],companies:['CERN ecosystem','Cryogenic suppliers','Magnet manufacturers']},
 'SP-003':{related:['Spectroscopy','Scientific AI','Direct imaging','Astrobiology'],companies:['NASA','ESA','Optics suppliers','Scientific software']},
 'QT-001':{related:['Photonics','Quantum memory','Networking','Cybersecurity'],companies:['IBM','Google','Quantinuum','IonQ']},
 'QT-002':{related:['PKI','HSM','Identity','Critical infrastructure'],companies:['Cloud providers','Cybersecurity vendors','Semiconductor security']},
 'EN-001':{related:['Advanced ceramics','EVs','Robotics','Electric aviation'],companies:['QuantumScape','Solid Power','Toyota','Samsung SDI']},
 'BT-001':{related:['Scaffolds','Stem cells','Bioreactors','Surgery'],companies:['Regenerative medicine','Cell manufacturing','Bioprocess equipment']},
 'BT-002':{related:['Precision fermentation','Pollination','Food security','Microbial inputs'],companies:['Agri-biologicals','Fermentation platforms','Bee-health suppliers']},
 'EN-002':{related:['Concrete','Geologic storage','Pipelines','Carbon markets'],companies:['Capture developers','Cement companies','Pipeline operators']},
 'MS-001':{related:['Detectors','Scientific computing','Accelerators','Imaging'],companies:['Research instrumentation','Detector suppliers','Compute infrastructure']}
};

function route(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));
  $$('.side-nav a').forEach(a=>a.classList.toggle('active',a.dataset.route===name));
  $('#currentSection').textContent=name[0].toUpperCase()+name.slice(1);
  location.hash=name;
  scrollTo({top:0,behavior:'instant'});
}
$$('[data-route]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();route(a.dataset.route)}));
$$('[data-go]').forEach(b=>b.onclick=()=>route(b.dataset.go));
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if($(`[data-view="${h}"]`))route(h)});
if(location.hash&&$(`[data-view="${location.hash.slice(1)}"]`))route(location.hash.slice(1));

function renderMatrix(){
 const matrix=$('#signalMatrix'),pos=[[18,21],[73,20],[76,68],[18,68],[46,7]];
 matrix.innerHTML='<span class="matrix-core">2026</span>'+categories.slice(1).map((c,i)=>`<button class="matrix-node" data-cat="${c}" style="left:${pos[i][0]}%;top:${pos[i][1]}%;--node-color:${colors[c]};color:${colors[c]}">${c.toUpperCase()}</button>`).join('');
 matrix.querySelectorAll('button').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderFilters();renderBriefs();route('briefs')});
 $('#matrixBriefs').textContent=`${briefs.length} signals`;$('#matrixFields').textContent=`${categories.length-1} domains`;
}
function renderDashboard(){
 $('#metricBriefs').textContent=briefs.length;$('#metricImpact').textContent=Math.max(...briefs.map(b=>b.score)).toFixed(1);
 const top=[...briefs].sort((a,z)=>z.score-a.score)[0];activeBrief=top;
 $('#featuredTitle').textContent=top.title;$('#featuredScore').textContent=top.score.toFixed(1);$('#featuredTakeaway').textContent=top.takeaway;
 $('#featuredChain').innerHTML=top.chain.split('→').map((x,i,a)=>`<span>${x.trim()}</span>${i<a.length-1?'<i>→</i>':''}`).join('');
 $('#featuredOpen').onclick=()=>openDossier(top.id);
 const momentum={Space:8.4,Quantum:7.9,Energy:8.7,Biotech:9.1,Materials:7.2};
 $('#momentumBars').innerHTML=Object.entries(momentum).map(([k,v])=>`<div class="momentum-row"><span>${k}</span><div class="bar-track"><div class="bar-fill" style="width:${v*10}%;--bar-color:${colors[k]}"></div></div><b>${v.toFixed(1)}</b></div>`).join('');
}
function renderFilters(){
 $('#filters').innerHTML=categories.map(c=>`<button class="filter ${c===activeCategory?'active':''}" data-cat="${c}">${c}</button>`).join('');
 $$('#filters .filter').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderFilters();renderBriefs()});
}
function renderBriefs(){
 const term=$('#searchInput').value.trim().toLowerCase(),sort=$('#sortSelect').value;
 let visible=briefs.filter(b=>(activeCategory==='All'||b.category===activeCategory)&&[b.id,b.title,b.subtitle,b.category,b.what,...b.bottlenecks,...b.opportunities].join(' ').toLowerCase().includes(term));
 visible.sort(sort==='title'?(a,z)=>a.title.localeCompare(z.title):sort==='date'?(a,z)=>new Date(z.date)-new Date(a.date):(a,z)=>z.score-a.score);
 $('#briefGrid').innerHTML=visible.map(b=>`<article class="brief-card" tabindex="0" data-id="${b.id}" style="--card-accent:${b.accent}"><div class="brief-meta"><span class="brief-id">${b.id}</span><span>${b.date}</span></div><h3>${b.title}</h3><p>${b.subtitle}</p><div class="score-row"><span class="score">${b.score.toFixed(1)} <small>/10</small></span><span class="signal">${b.signal}</span></div></article>`).join('');
 $('#emptyState').hidden=visible.length>0;bindOpen($('#briefGrid'));
}
function bindOpen(root){root.querySelectorAll('[data-id]').forEach(el=>{el.onclick=()=>openDossier(el.dataset.id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')openDossier(el.dataset.id)}})}
function list(items){return `<ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`}
function openDossier(id){
 const b=briefs.find(x=>x.id===id),scores=scoring(b),extra=enhancements[id]||{related:[],companies:[]};activeBrief=b;
 $('#dossierDialog').style.setProperty('--dossier-accent',b.accent);
 $('#dossierContent').innerHTML=`<article class="dossier"><p class="dossier-kicker">${b.id} · ${b.category} · TECHNOLOGY INTELLIGENCE DOSSIER</p><h1>${b.title}</h1><p class="dossier-sub">${b.subtitle}</p><div class="dossier-pills"><span>${b.date}</span><span>${b.signal}</span><span>${b.horizon}</span><span>Overall impact ${b.score.toFixed(1)}/10</span></div><div class="score-grid">${Object.entries(scores).map(([k,v])=>`<article class="score-card"><small>${k.toUpperCase()}</small><strong>${v.toFixed(1)}</strong></article>`).join('')}</div><div class="dossier-grid"><section class="dossier-section full"><h3>WHAT HAPPENED</h3><p>${b.what}</p></section><section class="dossier-section"><h3>WHY IT MATTERS</h3>${list(b.why)}</section><section class="dossier-section"><h3>RANKED BOTTLENECKS</h3>${list(b.bottlenecks)}</section><section class="dossier-section"><h3>OPPORTUNITY LAYERS</h3>${list(b.opportunities)}</section><section class="dossier-section"><h3>WATCH CLOSELY</h3>${list(b.watch)}</section><section class="dossier-section"><h3>RELATED TECHNOLOGIES</h3>${list(extra.related)}</section><section class="dossier-section"><h3>ECOSYSTEM / PLAYERS</h3>${list(extra.companies)}</section><section class="dossier-section full"><h3>UNLOCK SEQUENCE</h3><p class="chain">${b.chain}</p></section><section class="dossier-section full"><h3>STRATEGIC TAKEAWAY</h3><p>${b.takeaway}</p></section></div></article>`;
 $('#dossierDialog').showModal();
}
$('#closeDialog').onclick=()=>$('#dossierDialog').close();
$('#dossierDialog').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();if(!(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom))e.currentTarget.close()};
$('#searchInput').oninput=renderBriefs;$('#sortSelect').onchange=renderBriefs;

function renderGraph(selected='SP-001'){
 const b=briefs.find(x=>x.id===selected),extra=enhancements[selected]||{related:[]};activeBrief=b;
 const svg=$('#techGraph'),cx=500,cy=325;
 const nodes=[{id:b.id,label:b.title,x:cx,y:cy,type:'core',accent:b.accent},
  {id:'field',label:b.category,x:230,y:145,type:'field',accent:colors[b.category]},
  {id:'b1',label:b.bottlenecks[0],x:760,y:140,type:'support',accent:'#e97791'},
  {id:'o1',label:b.opportunities[0],x:800,y:410,type:'support',accent:'#54d59b'},
  {id:'r1',label:extra.related[0]||'Related tech',x:220,y:480,type:'support',accent:'#66c0ff'},
  {id:'watch',label:b.watch[0],x:510,y:80,type:'support',accent:'#f2a03a'}];
 const lines=nodes.slice(1).map(n=>`<line class="graph-line active" x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}"></line>`).join('');
 svg.innerHTML=lines+nodes.map(n=>`<g class="graph-node ${n.type} ${n.id===b.id?'active':''}" data-node="${n.id}" style="--node-accent:${n.accent}"><circle cx="${n.x}" cy="${n.y}" r="${n.type==='core'?78:58}"></circle><text x="${n.x}" y="${n.y}" dy="4">${wrapSvg(n.label,n.type==='core'?18:14)}</text></g>`).join('');
 $('#graphTitle').textContent=b.title;$('#graphSummary').textContent=b.takeaway;$('#graphTags').innerHTML=[b.category,...b.bottlenecks.slice(0,2),...b.opportunities.slice(0,2)].map(x=>`<span>${x}</span>`).join('');
 $('#graphOpen').onclick=()=>openDossier(b.id);
 $$('#techGraph .graph-node').forEach(n=>n.onclick=()=>{if(n.dataset.node===b.id)openDossier(b.id)});
}
function wrapSvg(text,max){const words=text.split(' '),lines=[];let line='';words.forEach(w=>{if((line+' '+w).trim().length>max){lines.push(line);line=w}else line=(line+' '+w).trim()});if(line)lines.push(line);return lines.slice(0,3).map((l,i)=>`<tspan x="0" dy="${i?16:0}">${l}</tspan>`).join('').replaceAll('x="0"', '')}
function renderBottlenecks(){
 const defs=[
  ['01','Manufacturing consistency','Critical','Defects, interfaces, repeatability, and yield limit batteries, organs, quantum devices, and biological products.',['Energy','Biotech','Quantum']],
  ['02','Infrastructure before scale','High','Launch networks, storage pipelines, secure cryptography, clinical systems, and supply chains must exist before adoption accelerates.',['Space','Energy','Quantum']],
  ['03','Real-world validation','High','Human trials, field trials, long-duration tests, and production qualification separate promising science from usable technology.',['Biotech','Space','Energy']],
  ['04','Cost of precision','Medium-high','The most advanced systems require expensive materials, clean rooms, cryogenics, metrology, or specialist manufacturing.',['Quantum','Materials','Biotech']],
  ['05','Regulatory and trust layer','Medium','Approval pathways, verification, standards, and public confidence can become the final barrier after engineering succeeds.',['Biotech','Energy','Quantum']],
  ['06','Energy intensity','Medium-high','Capture, computation, cryogenics, and advanced manufacturing can shift constraints from science to power availability.',['Energy','Quantum','Materials']]
 ];
 $('#bottleneckGrid').innerHTML=defs.map(d=>`<article class="bottleneck-card"><header><span class="bottleneck-rank">${d[0]}</span><span class="severity">${d[2]}</span></header><h2>${d[1]}</h2><p>${d[3]}</p><div class="affected">${d[4].map(x=>`<span>${x}</span>`).join('')}</div></article>`).join('');
}
function renderTimeline(){
 const dated=briefs.filter(b=>/March|April/.test(b.date)).sort((a,z)=>new Date(a.date)-new Date(z.date));
 $('#timelineTrack').innerHTML=dated.map(b=>`<article class="timeline-event"><time>${b.date.replace(', 2026','')}</time><span class="timeline-dot" style="--event-color:${b.accent}"></span><div class="timeline-content" data-id="${b.id}"><h3>${b.title}</h3><p>${b.subtitle}</p></div></article>`).join('');bindOpen($('#timelineTrack'));
}
function renderOpportunities(){
 const ops=[
  ['Manufacturing metrology',9.4,'Measures defects and yield across batteries, chips, quantum devices, and bioprocessing.'],
  ['Advanced materials',9.2,'Enables better interfaces, shielding, catalysts, electrolytes, and structural systems.'],
  ['Robotics and automation',9.0,'Reduces labor constraints and extends operations into hazardous or remote environments.'],
  ['Bioprocess equipment',8.8,'Scales cell manufacturing, fermentation, engineered tissue, and precision biology.'],
  ['Power infrastructure',8.7,'Supports data centers, lunar systems, electrification, capture, and advanced factories.'],
  ['Security migration services',8.6,'Converts post-quantum urgency into a multi-year enterprise infrastructure cycle.'],
  ['Cryogenics and precision control',8.2,'Serves quantum computing, antimatter research, sensors, and scientific instrumentation.'],
  ['Verification and standards',8.1,'Creates trust in carbon removal, biotech manufacturing, cybersecurity, and scientific claims.'],
  ['Scientific AI tooling',8.0,'Accelerates target selection, simulation, interpretation, and experiment design.']
 ];
 $('#opportunityGrid').innerHTML=ops.map(o=>`<article class="opportunity-card"><p class="eyebrow">CROSS-FIELD OPPORTUNITY</p><h2>${o[0]}</h2><p>${o[2]}</p><div class="opportunity-meter"><i style="width:${o[1]*10}%"></i></div><strong>${o[1].toFixed(1)} / 10</strong></article>`).join('');
}
function commandResults(term=''){
 const t=term.toLowerCase();
 return briefs.filter(b=>[b.id,b.title,b.category,b.subtitle,...b.bottlenecks,...b.opportunities].join(' ').toLowerCase().includes(t)).slice(0,8);
}
function renderCommand(){
 const arr=commandResults($('#commandInput').value);
 $('#commandResults').innerHTML=arr.map((b,i)=>`<button type="button" class="command-result ${i===commandIndex?'active':''}" data-id="${b.id}"><span><b>${b.title}</b><small>${b.id} · ${b.category}</small></span><strong>${b.score.toFixed(1)}</strong></button>`).join('');
 $$('#commandResults button').forEach(b=>b.onclick=()=>{$('#commandDialog').close();openDossier(b.dataset.id)});
}
function openCommand(){commandIndex=0;$('#commandInput').value='';renderCommand();$('#commandDialog').showModal();setTimeout(()=>$('#commandInput').focus(),50)}
$('#commandButton').onclick=openCommand;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}});
$('#commandInput').oninput=()=>{commandIndex=0;renderCommand()};
$('#commandInput').onkeydown=e=>{const arr=commandResults(e.currentTarget.value);if(e.key==='ArrowDown'){commandIndex=Math.min(commandIndex+1,arr.length-1);renderCommand();e.preventDefault()}if(e.key==='ArrowUp'){commandIndex=Math.max(commandIndex-1,0);renderCommand();e.preventDefault()}if(e.key==='Enter'&&arr[commandIndex]){$('#commandDialog').close();openDossier(arr[commandIndex].id);e.preventDefault()}};
$('#mobileMenu').onclick=()=>{const next=prompt('Go to: dashboard, briefs, map, bottlenecks, timeline, or investment','dashboard');if(next&&$(`[data-view="${next.toLowerCase()}"]`))route(next.toLowerCase())};

renderMatrix();renderDashboard();renderFilters();renderBriefs();renderGraph();renderBottlenecks();renderTimeline();renderOpportunities();
