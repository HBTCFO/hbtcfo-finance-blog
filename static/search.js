(async function () {
  const q = document.getElementById('q');
  const results = document.getElementById('results');
  if (!q || !results) return;

  function esc(s){
    return (s||'').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  }

  let data = [];
  try {
    const r = await fetch('/index.json', { cache: 'no-store' });
    data = await r.json();
  } catch (e) {
    results.innerHTML = '<div class="card">Не удалось загрузить индекс поиска (/index.json).</div>';
    return;
  }

  function render(items){
    if (!items.length) {
      results.innerHTML = '<div class="card">Ничего не найдено. Попробуй другое слово.</div>';
      return;
    }
    results.innerHTML = items.slice(0, 24).map(p => {
      const tags = (p.tags||[]).slice(0,5).map(t => `<span class="tag">#${esc(t)}</span>`).join('');
      return `
        <article class="card">
          <h3><a href="${esc(p.url)}">${esc(p.title)}</a></h3>
          <div class="meta"><span>${esc(p.date)}</span>${tags ? '<span>·</span><span class="tags">'+tags+'</span>' : ''}</div>
          ${p.description ? `<p>${esc(p.description)}</p>` : ''}
        </article>
      `;
    }).join('');
  }

  function search(term){
    term = (term||'').trim().toLowerCase();
    if (!term) return render(data);
    const parts = term.split(/\s+/).filter(Boolean);

    const scored = [];
    for (const p of data){
      const hayTitle = (p.title||'').toLowerCase();
      const hayDesc = (p.description||'').toLowerCase();
      const hayTags = (p.tags||[]).join(' ').toLowerCase();
      const hayBody = (p.content||'').toLowerCase();

      let score = 0;
      let ok = true;
      for (const t of parts){
        const inTitle = hayTitle.includes(t);
        const inTags = hayTags.includes(t);
        const inDesc = hayDesc.includes(t);
        const inBody = hayBody.includes(t);
        if (!inTitle && !inTags && !inDesc && !inBody) { ok = false; break; }
        if (inTitle) score += 8;
        if (inTags) score += 6;
        if (inDesc) score += 3;
        if (inBody) score += 1;
      }
      if (ok) scored.push([score, p]);
    }
    scored.sort((a,b)=>b[0]-a[0]);
    render(scored.map(x=>x[1]));
  }

  // initial render
  render(data);

  q.addEventListener('input', () => search(q.value));
})();
