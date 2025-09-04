// Migrate Repertoire: Vocalists -> Users/{userId}/repertoire
// Firebase v8 API (non-modular)

(function() {
  const logEl = document.getElementById('log');
  const statusEl = document.getElementById('statusText');
  const vocalistSelect = document.getElementById('vocalistSelect');
  const userSelect = document.getElementById('userSelect');
  const refreshBtn = document.getElementById('refreshBtn');
  const migrateBtn = document.getElementById('migrateBtn');

  function log(msg) {
    const time = new Date().toLocaleTimeString();
    logEl.innerHTML += `[${time}] ${msg}<br/>`;
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  async function loadVocalists() {
    vocalistSelect.innerHTML = '';
    const snap = await firebase.firestore().collection('vocalists').get();
    const opts = snap.docs.map(d => ({ id: d.id, label: d.id }));
    for (const o of opts) {
      const opt = document.createElement('option');
      opt.value = o.id; opt.textContent = o.label;
      vocalistSelect.appendChild(opt);
    }
    log(`Загружено вокалистов: ${opts.length}`);
  }

  async function loadUsers() {
    userSelect.innerHTML = '';
    const snap = await firebase.firestore().collection('users').get();
    const opts = snap.docs.map(d => ({ id: d.id, email: d.data().email || d.id }));
    for (const o of opts) {
      const opt = document.createElement('option');
      opt.value = o.id; opt.textContent = `${o.email} (${o.id.slice(0,6)})`;
      userSelect.appendChild(opt);
    }
    log(`Загружено пользователей: ${opts.length}`);
  }

  async function findSongByName(name) {
    // Songs/{songId} has 'name', 'bpm', 'category'
    const q = await firebase.firestore().collection('songs').where('name', '==', name).limit(1).get();
    if (q.empty) return null;
    const doc = q.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async function migrateOnce(vocalistId, userId) {
    setStatus('Перенос...');
    log(`Начинаю перенос: Vocalist=${vocalistId} → User=${userId}`);

    // Список категорий в старой структуре: 4 категории
    const categories = ['Быстрые вертикаль', 'Быстрые горизонталь', 'Поклонение вертикаль', 'Поклонение горизонталь'];
    const db = firebase.firestore();
    const userRep = db.collection('users').doc(userId).collection('repertoire');

    let total = 0, ok = 0, skipped = 0;
    for (const cat of categories) {
      const col = db.collection('vocalists').doc(vocalistId).collection('repertoire').doc(cat).collection('songs');
      // Фоллбек на возможную плоскую структуру vocalists/{id}/repertoire/{doc}
      let snap;
      try {
        snap = await col.get();
      } catch (e) {
        // Пробуем плоскую коллекцию
        const flat = db.collection('vocalists').doc(vocalistId).collection('repertoire');
        snap = await flat.where('sheet', '==', cat).get();
      }
      for (const d of snap.docs) {
        total++;
        const data = d.data();
        const name = data.name || d.id;
        const preferredKey = data.preferredKey || data.key || null;
        if (!name || !preferredKey) { skipped++; log(`⚠️ Пропуск: нет name/key у ${d.id}`); continue; }

        const songDoc = await findSongByName(name);
        if (!songDoc) { skipped++; log(`⚠️ Не найдена в Songs по name: ${name}`); continue; }

        try {
          await userRep.doc(songDoc.id).set({
            name,
            preferredKey,
            bpm: songDoc.bpm || songDoc.BPM || null,
            category: songDoc.category || songDoc.sheet || null,
            added: new Date(),
            updated: new Date()
          }, { merge: true });
          ok++;
          log(`✅ ${name} → ${preferredKey} (songId=${songDoc.id})`);
        } catch (e) {
          skipped++;
          log(`❌ Ошибка записи для ${name}: ${e.message}`);
        }
      }
    }

    setStatus(`Готово: перенесено ${ok} из ${total}, пропущено ${skipped}`);
    log(`Итог: перенесено ${ok} из ${total}, пропущено ${skipped}`);
  }

  async function init() {
    try {
      await loadVocalists();
      await loadUsers();
      refreshBtn.addEventListener('click', async () => {
        setStatus('Обновление списков...');
        await loadVocalists();
        await loadUsers();
        setStatus('Готово к переносу');
      });
      migrateBtn.addEventListener('click', async () => {
        const vocalistId = vocalistSelect.value;
        const userId = userSelect.value;
        if (!vocalistId || !userId) { alert('Выберите вокалиста и пользователя'); return; }
        migrateBtn.disabled = true; refreshBtn.disabled = true;
        try {
          await migrateOnce(vocalistId, userId);
        } finally {
          migrateBtn.disabled = false; refreshBtn.disabled = false;
        }
      });
    } catch (e) {
      log(`❌ Ошибка инициализации: ${e.message}`);
      setStatus('Ошибка инициализации');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

