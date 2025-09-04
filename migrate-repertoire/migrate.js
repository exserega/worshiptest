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
    const db = firebase.firestore();
    const userRep = db.collection('users').doc(userId).collection('repertoire');

    let total = 0, ok = 0, skipped = 0;

    // 1) Попытка: песни как ПЛОСКИЕ документы в vocalists/{id}/repertoire
    const repCol = db.collection('vocalists').doc(vocalistId).collection('repertoire');
    const flatSnap = await repCol.get();
    log(`Найдено документов в repertoire: ${flatSnap.size}`);

    // Определим, являются ли документы песнями (есть name) или категориями (нет name)
    const flatSongDocs = flatSnap.docs.filter(d => !!(d.data() && (d.data().name || d.data().preferredKey)));
    const categoryDocs = flatSnap.docs.filter(d => !flatSongDocs.includes(d));
    log(`Опознано песен напрямую: ${flatSongDocs.length}, категорий: ${categoryDocs.length}`);

    async function processSongRecord(name, preferredKey) {
      total++;
      if (!name || !preferredKey) { skipped++; log(`⚠️ Пропуск: нет name/key у записи`); return; }
      const songDoc = await findSongByName(name);
      if (!songDoc) { skipped++; log(`⚠️ Не найдена в Songs по name: ${name}`); return; }
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

    // Обработка плоских песен
    for (const d of flatSongDocs) {
      const data = d.data();
      const name = data.name || d.id;
      const preferredKey = data.preferredKey || data.key || null;
      await processSongRecord(name, preferredKey);
    }

    // 2) Попытка: песни как ПОДКОЛЛЕКЦИИ внутри категорий vocalists/{id}/repertoire/{category}/songs
    for (const catDoc of categoryDocs) {
      const catId = catDoc.id; // например: "Быстрые (вертикаль)_16"
      // Основной вариант: подколлекция 'songs'
      const subCol = repCol.doc(catId).collection('songs');
      let subSnap;
      try {
        subSnap = await subCol.get();
      } catch (e) {
        subSnap = null;
      }
      if (subSnap && !subSnap.empty) {
        log(`Категория ${catId}: найдено песен: ${subSnap.size}`);
        for (const sd of subSnap.docs) {
          const sdata = sd.data();
          const name = sdata.name || sd.id;
          const preferredKey = sdata.preferredKey || sdata.key || null;
          await processSongRecord(name, preferredKey);
        }
        continue;
      }

      // Фоллбек: внутри категории песни лежат ПРЯМО (если структура отличается)
      const possibleDirect = repCol.doc(catId).collection('repertoire');
      let directSnap;
      try {
        directSnap = await possibleDirect.get();
      } catch (e) {
        directSnap = null;
      }
      if (directSnap && !directSnap.empty) {
        log(`Категория ${catId}: найден прямой список песен: ${directSnap.size}`);
        for (const sd of directSnap.docs) {
          const sdata = sd.data();
          const name = sdata.name || sd.id;
          const preferredKey = sdata.preferredKey || sdata.key || null;
          await processSongRecord(name, preferredKey);
        }
      } else {
        log(`⚠️ Категория ${catId}: не найдены подколлекции 'songs' или 'repertoire'`);
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

