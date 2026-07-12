const briefs=window.ATLAS_BRIEFS;
const colors={Space:'#62b8ff',Quantum:'#a682ff',Energy:'#f3a43b',Biotechnology:'#4ed09a',Materials:'#e26f86'};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let activeCategory='All',activeBrief=briefs[0],commandIndex=0;

const categories=['All',...new Set(briefs.map(b=>b.category))];
const signalLabel=b=>b.signalStatus||b.legacySignalLabel||'Not established';
const bottleneckNames=b=>b.bottlenecks.map(item=>item.name);
const opportunityNames=b=>b.opportunityLayers.map(item=>item.name);
const milestoneNames=b=>b.milestones.map(item=>item.milestone);
const unlockNames=b=>b.unlockSequence.map(item=>item.step);
const isValidEventDate=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const parsed=new Date(`${value}T00:00:00Z`);return !Number.isNaN(parsed.valueOf())&&parsed.toISOString().slice(0,10)===value};
const pendingVerification='Source verification pending editorial review.';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function sourceUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'?url.href:null}catch{return null}
}
function renderSource(source){
 const url=sourceUrl(source.url),meta=[source.publisher,source.publicationDate,source.sourceType].filter(Boolean).map(escapeHtml).join(' · ');
 const supports=Array.isArray(source.supports)&&source.supports.length?`<div class="source-supports"><strong>Supports</strong><div>${source.supports.map(section=>`<span>${escapeHtml(section)}</span>`).join('')}</div></div>`:'';
 const link=url?`<a class="source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open source: ${escapeHtml(source.title)} from ${escapeHtml(source.publisher)} (opens external site)"><span>Open original source</span><small>Opens external site ↗</small></a>`:'';
 return `<article class="source-card"><h4>${escapeHtml(source.title)}</h4>${meta?`<p class="source-meta">${meta}</p>`:''}${link}${supports}</article>`;
}
function renderClassification(entry){
 const type=entry.classification||'Unclassified',className=['Evidence','Inference','Forecast','Scenario'].includes(type)?type.toLowerCase():'unclassified';
 const basis=entry.basis?`<p class="classification-basis"><strong>Basis</strong> ${escapeHtml(entry.basis)}</p>`:'';
 const limitations=entry.limitations?`<p class="classification-basis"><strong>Limitations</strong> ${escapeHtml(entry.limitations)}</p>`:'';
 const sourceIds=Array.isArray(entry.sourceIds)&&entry.sourceIds.length?`<p class="classification-sources"><strong>Source IDs</strong> ${entry.sourceIds.map(escapeHtml).join(', ')}</p>`:'';
 return `<article class="classification-card"><div class="classification-head"><span class="classification-badge classification-${className}">${escapeHtml(type)}</span><strong>${escapeHtml(entry.section)}</strong></div><p>${escapeHtml(entry.statement)}</p>${basis}${limitations}${sourceIds}</article>`;
}
function renderSourcesAndEvidence(b){
 const sources=Array.isArray(b.sources)?b.sources:[],classifications=Array.isArray(b.evidenceClassification)?b.evidenceClassification:[];
 if(!sources.length&&!classifications.length)return `<section class="dossier-section full evidence-panel"><h3>SOURCES AND EVIDENCE</h3><p class="evidence-empty" role="status">${pendingVerification}</p></section>`;
 const sourceContent=sources.length?`<div class="source-grid">${sources.map(renderSource).join('')}</div>`:`<p class="evidence-empty" role="status">${pendingVerification}</p>`;
 const classificationContent=classifications.length?`<div class="classification-grid">${classifications.map(renderClassification).join('')}</div>`:`<p class="evidence-empty" role="status">${pendingVerification}</p>`;
 return `<section class="dossier-section full evidence-panel"><h3>SOURCES AND EVIDENCE</h3><div class="evidence-block"><h4>Sources</h4>${sourceContent}</div><div class="evidence-block"><h4>Evidence classification</h4>${classificationContent}</div></section>`;
}
const scoring=b=>({
  Scientific:Math.min(10,b.impactScore+.2),
  Commercial:Math.max(5.5,b.impactScore-(signalLabel(b).includes('Discovered')?2.2:.7)),
  Opportunity:Math.max(5.5,b.impactScore-.4),
  Confidence:signalLabel(b).includes('Evidence')||signalLabel(b).includes('Confirmed')?9.2:8.1,
  Momentum:b.category==='Biotechnology'?9.0:b.category==='Energy'?8.6:b.category==='Space'?8.4:7.8
});

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
 $('#metricBriefs').textContent=briefs.length;$('#metricImpact').textContent=Math.max(...briefs.map(b=>b.impactScore)).toFixed(1);
 const top=[...briefs].sort((a,z)=>z.impactScore-a.impactScore)[0];activeBrief=top;
 $('#featuredTitle').textContent=top.title;$('#featuredScore').textContent=top.impactScore.toFixed(1);$('#featuredTakeaway').textContent=top.strategicTakeaway;
 $('#featuredChain').innerHTML=unlockNames(top).map((x,i,a)=>`<span>${x}</span>${i<a.length-1?'<i>→</i>':''}`).join('');
 $('#featuredOpen').onclick=()=>openDossier(top.id);
 const momentum={Space:8.4,Quantum:7.9,Energy:8.7,Biotechnology:9.1,Materials:7.2};
 $('#momentumBars').innerHTML=Object.entries(momentum).map(([k,v])=>`<div class="momentum-row"><span>${k}</span><div class="bar-track"><div class="bar-fill" style="width:${v*10}%;--bar-color:${colors[k]}"></div></div><b>${v.toFixed(1)}</b></div>`).join('');
}
function renderFilters(){
 $('#filters').innerHTML=categories.map(c=>`<button class="filter ${c===activeCategory?'active':''}" data-cat="${c}">${c}</button>`).join('');
 $$('#filters .filter').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderFilters();renderBriefs()});
}
function renderBriefs(){
 const term=$('#searchInput').value.trim().toLowerCase(),sort=$('#sortSelect').value;
 let visible=briefs.filter(b=>(activeCategory==='All'||b.category===activeCategory)&&[b.id,b.title,b.subtitle,b.category,b.summary,...bottleneckNames(b),...opportunityNames(b)].join(' ').toLowerCase().includes(term));
 visible.sort(sort==='title'?(a,z)=>a.title.localeCompare(z.title):sort==='date'?(a,z)=>new Date(z.displayDate)-new Date(a.displayDate):(a,z)=>z.impactScore-a.impactScore);
 $('#briefGrid').innerHTML=visible.map(b=>`<article class="brief-card" tabindex="0" data-id="${b.id}" style="--card-accent:${b.accent}"><div class="brief-meta"><span class="brief-id">${b.id}</span><span>${b.displayDate}</span></div><h3>${b.title}</h3><p>${b.subtitle}</p><div class="score-row"><span class="score">${b.impactScore.toFixed(1)} <small>/10</small></span><span class="signal">${signalLabel(b)}</span></div></article>`).join('');
 $('#emptyState').hidden=visible.length>0;bindOpen($('#briefGrid'));
}
function bindOpen(root){root.querySelectorAll('[data-id]').forEach(el=>{el.onclick=()=>openDossier(el.dataset.id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')openDossier(el.dataset.id)}})}
function list(items){return `<ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`}
function openDossier(id){
 const b=briefs.find(x=>x.id===id),scores=scoring(b);activeBrief=b;
 $('#dossierDialog').style.setProperty('--dossier-accent',b.accent);
 $('#dossierContent').innerHTML=`<article class="dossier"><p class="dossier-kicker">${b.id} · ${b.category} · TECHNOLOGY INTELLIGENCE DOSSIER</p><h1>${b.title}</h1><p class="dossier-sub">${b.subtitle}</p><div class="dossier-pills"><span>${b.displayDate}</span><span>${signalLabel(b)}</span><span>${b.commercialHorizon}</span><span>Overall impact ${b.impactScore.toFixed(1)}/10</span></div><div class="score-grid">${Object.entries(scores).map(([k,v])=>`<article class="score-card"><small>${k.toUpperCase()}</small><strong>${v.toFixed(1)}</strong></article>`).join('')}</div><div class="dossier-grid"><section class="dossier-section full"><h3>WHAT HAPPENED</h3><p>${b.summary}</p></section><section class="dossier-section"><h3>WHY IT MATTERS</h3>${list(b.whyItMatters)}</section><section class="dossier-section"><h3>RANKED BOTTLENECKS</h3>${list(bottleneckNames(b))}</section><section class="dossier-section"><h3>OPPORTUNITY LAYERS</h3>${list(opportunityNames(b))}</section><section class="dossier-section"><h3>WATCH CLOSELY</h3>${list(milestoneNames(b))}</section><section class="dossier-section"><h3>RELATED TECHNOLOGIES</h3>${list(b.relatedTechnologies)}</section><section class="dossier-section"><h3>ECOSYSTEM / PLAYERS</h3>${list(b.ecosystemPlayers.map(player=>player.name))}</section><section class="dossier-section full"><h3>UNLOCK SEQUENCE</h3><p class="chain">${unlockNames(b).join(' → ')}</p></section><section class="dossier-section full"><h3>STRATEGIC TAKEAWAY</h3><p>${b.strategicTakeaway}</p></section>${renderSourcesAndEvidence(b)}</div></article>`;
 $('#dossierDialog').showModal();
}
$('#closeDialog').onclick=()=>$('#dossierDialog').close();
$('#dossierDialog').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();if(!(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom))e.currentTarget.close()};
$('#searchInput').oninput=renderBriefs;$('#sortSelect').onchange=renderBriefs;

function renderGraph(selected='SP-001'){
 const b=briefs.find(x=>x.id===selected);activeBrief=b;
 const svg=$('#techGraph'),cx=500,cy=325;
 const nodes=[{id:b.id,label:b.title,x:cx,y:cy,type:'core',accent:b.accent},
  {id:'field',label:b.category,x:230,y:145,type:'field',accent:colors[b.category]},
  {id:'b1',label:b.bottlenecks[0].name,x:760,y:140,type:'support',accent:'#e97791'},
  {id:'o1',label:b.opportunityLayers[0].name,x:800,y:410,type:'support',accent:'#54d59b'},
  {id:'r1',label:b.relatedTechnologies[0]||'Related tech',x:220,y:480,type:'support',accent:'#66c0ff'},
  {id:'watch',label:b.milestones[0].milestone,x:510,y:80,type:'support',accent:'#f2a03a'}];
 const lines=nodes.slice(1).map(n=>`<line class="graph-line active" x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}"></line>`).join('');
 svg.innerHTML=lines+nodes.map(n=>`<g class="graph-node ${n.type} ${n.id===b.id?'active':''}" data-node="${n.id}" style="--node-accent:${n.accent}"><circle cx="${n.x}" cy="${n.y}" r="${n.type==='core'?78:58}"></circle><text x="${n.x}" y="${n.y}" dy="4">${wrapSvg(n.label,n.type==='core'?18:14)}</text></g>`).join('');
 $('#graphTitle').textContent=b.title;$('#graphSummary').textContent=b.strategicTakeaway;$('#graphTags').innerHTML=[b.category,...bottleneckNames(b).slice(0,2),...opportunityNames(b).slice(0,2)].map(x=>`<span>${x}</span>`).join('');
 $('#graphOpen').onclick=()=>openDossier(b.id);
 $$('#techGraph .graph-node').forEach(n=>n.onclick=()=>{if(n.dataset.node===b.id)openDossier(b.id)});
}
function wrapSvg(text,max){const words=text.split(' '),lines=[];let line='';words.forEach(w=>{if((line+' '+w).trim().length>max){lines.push(line);line=w}else line=(line+' '+w).trim()});if(line)lines.push(line);return lines.slice(0,3).map((l,i)=>`<tspan x="0" dy="${i?16:0}">${l}</tspan>`).join('').replaceAll('x="0"', '')}
function renderBottlenecks(){
 const defs=[
  ['01','Manufacturing consistency','Critical','Defects, interfaces, repeatability, and yield limit batteries, organs, quantum devices, and biological products.',['Energy','Biotechnology','Quantum']],
  ['02','Infrastructure before scale','High','Launch networks, storage pipelines, secure cryptography, clinical systems, and supply chains must exist before adoption accelerates.',['Space','Energy','Quantum']],
  ['03','Real-world validation','High','Human trials, field trials, long-duration tests, and production qualification separate promising science from usable technology.',['Biotechnology','Space','Energy']],
  ['04','Cost of precision','Medium-high','The most advanced systems require expensive materials, clean rooms, cryogenics, metrology, or specialist manufacturing.',['Quantum','Materials','Biotechnology']],
  ['05','Regulatory and trust layer','Medium','Approval pathways, verification, standards, and public confidence can become the final barrier after engineering succeeds.',['Biotechnology','Energy','Quantum']],
  ['06','Energy intensity','Medium-high','Capture, computation, cryogenics, and advanced manufacturing can shift constraints from science to power availability.',['Energy','Quantum','Materials']]
 ];
 $('#bottleneckGrid').innerHTML=defs.map(d=>`<article class="bottleneck-card"><header><span class="bottleneck-rank">${d[0]}</span><span class="severity">${d[2]}</span></header><h2>${d[1]}</h2><p>${d[3]}</p><div class="affected">${d[4].map(x=>`<span>${x}</span>`).join('')}</div></article>`).join('');
}
function renderTimeline(){
 const dated=briefs.filter(b=>isValidEventDate(b.eventDate)).sort((a,z)=>z.eventDate.localeCompare(a.eventDate)||a.id.localeCompare(z.id));
 $('#timelineTrack').innerHTML=dated.map(b=>`<article class="timeline-event"><time>${b.displayDate.replace(', 2026','')}</time><span class="timeline-dot" style="--event-color:${b.accent}"></span><div class="timeline-content" data-id="${b.id}"><h3>${b.title}</h3><p>${b.subtitle}</p></div></article>`).join('');bindOpen($('#timelineTrack'));
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
 return briefs.filter(b=>[b.id,b.title,b.category,b.subtitle,...bottleneckNames(b),...opportunityNames(b)].join(' ').toLowerCase().includes(t)).slice(0,8);
}
function renderCommand(){
 const arr=commandResults($('#commandInput').value);
 $('#commandResults').innerHTML=arr.map((b,i)=>`<button type="button" class="command-result ${i===commandIndex?'active':''}" data-id="${b.id}"><span><b>${b.title}</b><small>${b.id} · ${b.category}</small></span><strong>${b.impactScore.toFixed(1)}</strong></button>`).join('');
 $$('#commandResults button').forEach(b=>b.onclick=()=>{$('#commandDialog').close();openDossier(b.dataset.id)});
}
function openCommand(){commandIndex=0;$('#commandInput').value='';renderCommand();$('#commandDialog').showModal();setTimeout(()=>$('#commandInput').focus(),50)}
$('#commandButton').onclick=openCommand;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}});
$('#commandInput').oninput=()=>{commandIndex=0;renderCommand()};
$('#commandInput').onkeydown=e=>{const arr=commandResults(e.currentTarget.value);if(e.key==='ArrowDown'){commandIndex=Math.min(commandIndex+1,arr.length-1);renderCommand();e.preventDefault()}if(e.key==='ArrowUp'){commandIndex=Math.max(commandIndex-1,0);renderCommand();e.preventDefault()}if(e.key==='Enter'&&arr[commandIndex]){$('#commandDialog').close();openDossier(arr[commandIndex].id);e.preventDefault()}};
$('#mobileMenu').onclick=()=>{const next=prompt('Go to: dashboard, briefs, map, bottlenecks, timeline, or investment','dashboard');if(next&&$(`[data-view="${next.toLowerCase()}"]`))route(next.toLowerCase())};

renderMatrix();renderDashboard();renderFilters();renderBriefs();renderGraph();renderBottlenecks();renderTimeline();renderOpportunities();
