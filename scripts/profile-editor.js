let personalProfile = null;
const experienceTypes = { award: '获奖荣誉', research: '科研与专利', campus: '校园经历' };

function profileBlock(id, title, hint, content, open = false) {
  return `<details id="${id}" class="profile-block" ${open ? 'open' : ''}><summary>${title}</summary><div>${hint ? `<p class="hint">${hint}</p>` : ''}${content}</div></details>`;
}

function profileControls(collection, index, length) {
  const rows = personalProfile[collection];
  const positions = rows.map((item, position) => ({item,position})).filter(({item}) => collection !== 'experiences' || item.type === rows[index].type).map(({position}) => position);
  const localIndex = positions.indexOf(index);
  return `<div class="toolbar">
    <label style="margin:0 auto 0 0"><input type="checkbox" style="width:auto" ${personalProfile[collection][index].hidden ? 'checked' : ''} onchange="personalProfile.${collection}[${index}].hidden=this.checked" /> 隐藏这条</label>
    <button onclick="moveProfileRow('${collection}', ${index}, -1)" ${localIndex === 0 ? 'disabled' : ''}>上移</button>
    <button onclick="moveProfileRow('${collection}', ${index}, 1)" ${localIndex === positions.length - 1 ? 'disabled' : ''}>下移</button>
  </div>`;
}

function renderPersonalProfile(forceOpen) {
  const host = $('personalEditor');
  if (!personalProfile) { host.innerHTML = '<p class="empty">正在读取个人资料...</p>'; return; }
  const hasRendered = host.children.length > 0;
  const expanded = new Set(Array.from(host.querySelectorAll('details[open]'), item => item.id));
  if (forceOpen) expanded.add(forceOpen);
  const p = personalProfile;
  host.innerHTML = profileBlock('profile-about', '自我介绍', '对应首页照片右侧的介绍。职业定位也会同步到封面、个人信息和联系区。', `
    <div class="grid">
      <div class="field">${field('personal-name', '姓名', p.name)}</div>
      <div class="field">${field('personal-englishName', '英文姓名', p.englishName)}</div>
      <div class="field">${field('personal-headline', '职业定位', p.headline)}</div>
      <div class="field">${field('personal-directions', '求职方向（逗号分隔）', p.directions.join('，'))}</div>
      <div class="field full">${field('personal-heading', '介绍主标题', p.about.heading, 'textarea')}</div>
      <div class="field full">${field('personal-introduction', '个人简介 / 核心能力', p.about.introduction, 'textarea')}</div>
      <div class="field">${field('personal-industries', '专业方向（选填）', p.about.industries)}</div>
      <div class="field">${field('personal-interests', '兴趣爱好（选填）', p.about.interests)}</div>
    </div>`, true)
    + profileBlock('profile-contact', '联系方式', '对应作品集底部的联系信息。', `<div class="grid">
      <div class="field">${field('personal-location', '所在地', p.location)}</div>
      <div class="field">${field('personal-phone', '电话', p.phone)}</div>
      <div class="field full">${field('personal-email', '邮箱', p.email)}</div>
    </div>`)
    + profileBlock('profile-education', '教育与语言', '', p.education.map((item, index) => `<article class="profile-row">
      ${profileControls('education', index, p.education.length)}
      <div class="grid">
        <div class="field"><label for="education-school-${index}">学校</label><input id="education-school-${index}" value="${escapeHtml(item.school)}" oninput="personalProfile.education[${index}].school=this.value" /></div>
        <div class="field"><label for="education-degree-${index}">专业 / 学位</label><input id="education-degree-${index}" value="${escapeHtml(item.degree)}" oninput="personalProfile.education[${index}].degree=this.value" /></div>
        <div class="field"><label for="education-time-${index}">时间</label><input id="education-time-${index}" value="${escapeHtml(item.time)}" oninput="personalProfile.education[${index}].time=this.value" /></div>
        <div class="field"><label for="education-detail-${index}">补充说明（选填）</label><input id="education-detail-${index}" value="${escapeHtml(item.detail)}" oninput="personalProfile.education[${index}].detail=this.value" /></div>
      </div></article>`).join('') + `<button style="margin-top:12px" onclick="addProfileRow('education')">＋ 添加教育经历</button><div class="grid">
      <div class="field">${field('personal-language-title', '外语能力', p.language.title)}</div>
      <div class="field">${field('personal-language-detail', '语言补充（选填）', p.language.detail)}</div>
    </div>`)
    + profileBlock('profile-metrics', '数据卡片与能力标签', '可自行修改数字和说明；这些卡片不会自动统计，按当前简历填写即可。', p.metrics.map((item, index) => `<article class="profile-row">
      ${profileControls('metrics', index, p.metrics.length)}
      <div class="grid"><div class="field"><label for="metric-value-${index}">数字</label><input id="metric-value-${index}" value="${escapeHtml(item.value)}" oninput="personalProfile.metrics[${index}].value=this.value" /></div><div class="field"><label for="metric-label-${index}">说明</label><input id="metric-label-${index}" value="${escapeHtml(item.label)}" oninput="personalProfile.metrics[${index}].label=this.value" /></div></div>
    </article>`).join('') + `<button style="margin-top:12px" onclick="addProfileRow('metrics')">＋ 添加数据卡片</button>${field('personal-tags', '能力标签（逗号分隔）', p.tags.join('，'))}`)
    + Object.entries(experienceTypes).map(([type, title]) => profileBlock(`profile-${type}`, title, type === 'award' ? '时间没有明确记录时可以留空。奖项名称和级别按实际情况填写。' : '时间、名称和简短说明即可。状态如“审核中”“筹备中”可直接写在时间里。', p.experiences.map((item, index) => ({item, index})).filter(({item}) => item.type === type).map(({item, index}) => `<article class="profile-row">
      ${profileControls('experiences', index, p.experiences.length)}
      <div class="grid">
        <div class="field third"><label for="experience-time-${index}">时间 / 状态（选填）</label><input id="experience-time-${index}" value="${escapeHtml(item.time)}" oninput="personalProfile.experiences[${index}].time=this.value" /></div>
        <div class="field wide"><label for="experience-title-${index}">名称</label><input id="experience-title-${index}" value="${escapeHtml(item.title)}" oninput="personalProfile.experiences[${index}].title=this.value" /></div>
        <div class="field full"><label for="experience-detail-${index}">简短说明</label><textarea id="experience-detail-${index}" oninput="personalProfile.experiences[${index}].detail=this.value">${escapeHtml(item.detail)}</textarea></div>
      </div></article>`).join('') + `<button style="margin-top:12px" onclick="addProfileRow('experiences', '${type}')">＋ 添加${title}</button>`, type === 'award')).join('')
    + profileBlock('profile-files', '照片与下载简历', '网页文案与下载文件分别保存。有新简历时，在这里替换 PDF 即可。', `
      <div class="split">${[['formal','职业证件照'],['practice','阅读形象照']].map(([target,title]) => `<div class="media-card"><h3>${title}</h3><img class="profile-photo" src="${escapeHtml(p.portraits[target])}" alt="${title}" /><input id="personal-file-${target}" type="file" accept="image/png,image/jpeg,image/webp,image/avif" /><button onclick="uploadPersonalFile('${target}')">替换${title}</button></div>`).join('')}</div>
      <div class="media-card" style="margin-top:16px"><h3>下载简历</h3><p class="hint"><a href="${escapeHtml(p.resume.src)}" target="_blank" rel="noreferrer">查看当前简历 ↗</a></p>${field('personal-resume-label', '按钮文字', p.resume.label)}<input id="personal-file-resume" type="file" accept="application/pdf" /><button onclick="uploadPersonalFile('resume')">替换下载简历 PDF</button></div>`);
  if (hasRendered) host.querySelectorAll('details').forEach(item => { item.open = expanded.has(item.id); });
}

function collectPersonalProfile() {
  if (!personalProfile || !$('personal-name')) return personalProfile;
  for (const key of ['name','englishName','headline','location','phone','email']) personalProfile[key] = $('personal-' + key).value;
  for (const key of ['heading','introduction','industries','interests']) personalProfile.about[key] = $('personal-' + key).value;
  personalProfile.directions = splitLines($('personal-directions').value);
  personalProfile.tags = splitLines($('personal-tags').value);
  personalProfile.language = {title:$('personal-language-title').value, detail:$('personal-language-detail').value};
  personalProfile.resume.label = $('personal-resume-label').value;
  return personalProfile;
}

function jumpToProfile(id) {
  const block = $(id);
  if (!block) return;
  block.open = true;
  block.scrollIntoView({behavior:'smooth', block:'start'});
}

function moveProfileRow(collection, index, direction) {
  collectPersonalProfile();
  const items = personalProfile[collection];
  const group = collection === 'experiences' ? items[index].type : null;
  const indices = items.map((item, position) => ({item, position})).filter(({item}) => !group || item.type === group).map(({position}) => position);
  const position = indices.indexOf(index);
  const target = indices[position + direction];
  if (target === undefined) return;
  [items[index], items[target]] = [items[target], items[index]];
  renderPersonalProfile();
}

function addProfileRow(collection, type) {
  collectPersonalProfile();
  const id = crypto.randomUUID();
  if (collection === 'experiences') personalProfile.experiences.push({id,type,time:'',title:'',detail:'',hidden:false});
  if (collection === 'education') personalProfile.education.push({id,school:'',degree:'',time:'',detail:'',hidden:false});
  if (collection === 'metrics') personalProfile.metrics.push({id,value:'',label:'',hidden:false});
  renderPersonalProfile('profile-' + (type || collection));
}

function personalMessage(message) {
  $('personalFeedback').textContent = message;
  $('status').textContent = message;
}

async function savePersonalProfile(quiet = false) {
  try {
    const data = await api('/api/profile', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({profile:collectPersonalProfile()})});
    personalProfile = data.profile;
    if (!quiet) { renderPersonalProfile(); personalMessage('个人资料已保存。点「重新生成」，即可在本地作品集查看；确认后再上传 GitHub。'); }
  } catch (error) { personalMessage(error.message); if (quiet) throw error; }
}

async function uploadPersonalFile(target) {
  const file = $('personal-file-' + target).files[0];
  if (!file) return personalMessage('请先选择要替换的文件。');
  try {
    if (file.size > 25 * 1024 * 1024) throw new Error('文件请控制在 25 MB 以内。');
    await savePersonalProfile(true);
    const data = await api('/api/profile-upload?target=' + target, {method:'POST', headers:{'x-file-name':encodeURIComponent(file.name)}, body:file});
    personalProfile = data.profile;
    renderPersonalProfile();
    personalMessage('文件已替换并保存。重新生成后，作品集将使用新文件。');
  } catch (error) { personalMessage(error.message); }
}
