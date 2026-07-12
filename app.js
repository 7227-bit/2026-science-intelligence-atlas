
const briefs = window.ATLAS_BRIEFS;
const grid = document.querySelector('#briefGrid');
const filtersNode = document.querySelector('#filters');
const searchInput = document.querySelector('#searchInput');
const emptyState = document.querySelector('#emptyState');
const dialog = document.querySelector('#briefDialog');
const dialogContent = document.querySelector('#dialogContent');
let activeCategory = 'All';

const categories = ['All', ...new Set(briefs.map(b => b.category))];

document.querySelector('#briefCount').textContent = briefs.length;
document.querySelector('#fieldCount').textContent = categories.length - 1;
document.querySelector('#topScore').textContent = Math.max(...briefs.map(b => b.score)).toFixed(1);

function renderFilters() {
  filtersNode.innerHTML = categories.map(category =>
    `<button class="filter ${category === activeCategory ? 'active' : ''}" data-category="${category}">${category}</button>`
  ).join('');
  filtersNode.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderBriefs();
    });
  });
}

function renderBriefs() {
  const term = searchInput.value.trim().toLowerCase();
  const visible = briefs.filter(brief => {
    const categoryMatch = activeCategory === 'All' || brief.category === activeCategory;
    const haystack = [brief.id, brief.title, brief.subtitle, brief.category, brief.what, ...brief.bottlenecks, ...brief.opportunities].join(' ').toLowerCase();
    return categoryMatch && haystack.includes(term);
  });

  grid.innerHTML = visible.map(brief => `
    <article class="brief-card" tabindex="0" role="button" data-id="${brief.id}" style="--card-accent:${brief.accent}">
      <div class="brief-meta"><span class="brief-id">${brief.id}</span><span>${brief.date}</span></div>
      <h3>${brief.title}</h3>
      <p>${brief.subtitle}</p>
      <div class="score-row">
        <span class="score">${brief.score.toFixed(1)} <small>/ 10</small></span>
        <span class="signal">${brief.signal}</span>
      </div>
    </article>
  `).join('');

  emptyState.hidden = visible.length > 0;

  grid.querySelectorAll('.brief-card').forEach(card => {
    const open = () => openBrief(card.dataset.id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') open();
    });
  });
}

function list(items) {
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

function openBrief(id) {
  const brief = briefs.find(item => item.id === id);
  dialog.style.setProperty('--dialog-accent', brief.accent);
  dialogContent.innerHTML = `
    <article class="dialog-inner">
      <p class="dialog-kicker">${brief.id} · ${brief.category}</p>
      <h2>${brief.title}</h2>
      <p class="dialog-subtitle">${brief.subtitle}</p>
      <div class="dialog-pills">
        <span>${brief.date}</span><span>${brief.signal}</span><span>Impact ${brief.score.toFixed(1)}/10</span><span>${brief.horizon}</span>
      </div>
      <div class="dialog-grid">
        <section class="dialog-section full"><h3>WHAT HAPPENED</h3><p>${brief.what}</p></section>
        <section class="dialog-section"><h3>WHY IT MATTERS</h3>${list(brief.why)}</section>
        <section class="dialog-section"><h3>RANKED BOTTLENECKS</h3>${list(brief.bottlenecks)}</section>
        <section class="dialog-section"><h3>OPPORTUNITY MAP</h3>${list(brief.opportunities)}</section>
        <section class="dialog-section"><h3>WATCH CLOSELY</h3>${list(brief.watch)}</section>
        <section class="dialog-section full"><h3>UNLOCK SEQUENCE</h3><p class="chain">${brief.chain}</p></section>
        <section class="dialog-section full"><h3>STRATEGIC TAKEAWAY</h3><p>${brief.takeaway}</p></section>
      </div>
    </article>`;
  dialog.showModal();
}

document.querySelector('#closeDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) dialog.close();
});
searchInput.addEventListener('input', renderBriefs);

renderFilters();
renderBriefs();
