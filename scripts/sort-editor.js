// Pointer-based handles work with mouse, pen and touch without dragging fields.
let sortSession = null;
let sortSaving = false;
const sortStatus = kind => document.getElementById(kind === 'projects' ? 'projectSortStatus' : 'studySortStatus');

async function persistSort(kind, sourceId, targetId, after) {
  if (sortSaving || sourceId === targetId) return;
  const list = kind === 'projects' ? projects : studies;
  const key = kind === 'projects' ? 'slug' : 'id';
  const from = list.findIndex(item => item[key] === sourceId);
  const target = list.find(item => item[key] === targetId);
  if (from < 0 || !target) return;
  const ordered = list.slice();
  const [item] = ordered.splice(from, 1);
  ordered.splice(ordered.indexOf(target) + (after ? 1 : 0), 0, item);
  if (ordered.every((item,i) => item === list[i])) return;
  sortSaving = true;
  sortStatus(kind).textContent = '正在保存新顺序…';
  try {
    await api(kind === 'projects' ? '/api/project/order' : '/api/studies/order', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({order:ordered.map(item => item[key])})
    });
    if (kind === 'projects') { projects = ordered; renderList(); }
    else { studies = ordered; renderStudies(); }
    sortStatus(kind).textContent = `顺序已保存：第 ${from+1} 项 → 第 ${ordered.indexOf(item)+1} 项。重新生成后更新前台。`;
    document.querySelector(`[data-sort-id="${CSS.escape(sourceId)}"] .sort-handle`)?.focus({preventScroll:true});
  } catch (error) {
    sortStatus(kind).textContent = '排序未保存：' + error.message + ' 原顺序保持不变。';
  } finally { sortSaving = false; }
}

function sortHit() {
  const s = sortSession;
  if (!s) return;
  const hit = document.elementFromPoint(s.x,s.y)?.closest('[data-sort-id]');
  document.querySelectorAll('.sort-target').forEach(el => el.classList.remove('sort-target'));
  if (hit && hit.dataset.sortKind === s.kind && hit !== s.row) {
    hit.classList.add('sort-target');
    const r = hit.getBoundingClientRect();
    s.target = hit.dataset.sortId;
    s.after = s.kind === 'projects' ? s.y > r.top+r.height/2 : s.y > r.top+r.height*.7 || (s.y > r.top+r.height*.3 && s.x > r.left+r.width/2);
  } else s.target = null;
}

document.addEventListener('pointerdown', event => {
  const handle = event.target.closest('.sort-handle');
  if (!handle || sortSaving || event.button !== 0) return;
  event.preventDefault();
  if (document.activeElement?.matches('input,textarea,select')) document.activeElement.blur();
  if (current) Object.assign(current,collectProject());
  const row = handle.closest('[data-sort-id]');
  const ghost = document.createElement('div');
  ghost.className = 'sort-ghost'; ghost.textContent = handle.getAttribute('aria-label').replace('拖拽排序：','');
  document.body.append(ghost);
  row.classList.add('is-sorting');
  const previousSelect = document.body.style.userSelect;
  document.body.style.userSelect = 'none';
  sortSession = {row,handle,ghost,kind:row.dataset.sortKind,id:row.dataset.sortId,x:event.clientX,y:event.clientY,target:null,after:false,raf:0,previousSelect};
  handle.setPointerCapture(event.pointerId);
  const frame = () => {
    if (!sortSession) return;
    const s=sortSession;
    s.ghost.style.left = `${s.x+16}px`; s.ghost.style.top = `${s.y+12}px`;
    const scroller = s.kind === 'projects' ? s.row.closest('.sidebar') : null;
    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
      const r=scroller.getBoundingClientRect();
      if (s.y < r.top+55) scroller.scrollTop-=15;
      if (s.y > r.bottom-55) scroller.scrollTop+=15;
    } else {
      if (s.y < 75) window.scrollBy(0,-18);
      if (s.y > window.innerHeight-75) window.scrollBy(0,18);
    }
    sortHit();
    s.raf=requestAnimationFrame(frame);
  };
  frame();
});
document.addEventListener('pointermove', event => {if(sortSession){sortSession.x=event.clientX;sortSession.y=event.clientY;}});
function finishSort(cancel=false) {
  const s=sortSession; if(!s) return;
  sortSession=null; cancelAnimationFrame(s.raf); s.ghost.remove(); s.row.classList.remove('is-sorting');
  document.body.style.userSelect=s.previousSelect;
  document.querySelectorAll('.sort-target').forEach(el=>el.classList.remove('sort-target'));
  if(!cancel && s.target) persistSort(s.kind,s.id,s.target,s.after);
}
document.addEventListener('pointerup',()=>finishSort());
document.addEventListener('pointercancel',()=>finishSort(true));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){finishSort(true);return;}
  const handle=event.target.closest('.sort-handle');
  if(!handle || !['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();
  if(current)Object.assign(current,collectProject());
  const row=handle.closest('[data-sort-id]'),kind=row.dataset.sortKind;
  const list=kind==='projects'?projects:studies,key=kind==='projects'?'slug':'id';
  const index=list.findIndex(item=>item[key]===row.dataset.sortId);
  const direction=event.key==='ArrowUp'||event.key==='ArrowLeft'?-1:1;
  if(list[index+direction])persistSort(kind,row.dataset.sortId,list[index+direction][key],direction>0);
});
