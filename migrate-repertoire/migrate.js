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

  function normalizeNameVariants(name) {
    const variants = new Set();
    const base = (name || '').trim();
    variants.add(base);
    // Убираем хвосты вида " + ..."
    variants.add(base.replace(/\s*\+.+$/, '').trim());
    // Убираем хвосты в скобках в конце
    variants.add(base.replace(/\s*\([^)]*\)\s*$/, '').trim());
    // Убираем '!' в конце
    variants.add(base.replace(/[!！]+$/g, '').trim());
    // Сжать двойные пробелы
    variants.add(base.replace(/\s{2,}/g, ' ').trim());
    // Комбинированные варианты
    const noPlus = base.replace(/\s*\+.+$/, '').trim();
    variants.add(noPlus.replace(/\s*\([^)]*\)\s*$/, '').trim());
    variants.add(noPlus.replace(/[!！]+$/g, '').trim());
    return Array.from(variants).filter(v => v);
  }

  async function findSongByName(name) {
    const db = firebase.firestore();
    const variants = normalizeNameVariants(name);
    // 1) Поиск по полю name
    for (const v of variants) {
      const q = await db.collection('songs').where('name', '==', v).limit(1).get();
      if (!q.empty) {
        const doc = q.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    }
    // 2) Поиск по ID документа (часто songId = name)
    for (const v of variants) {
      const ds = await db.collection('songs').doc(v).get();
      if (ds.exists) {
        return { id: ds.id, ...ds.data() };
      }
    }
    return null;
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
    const flatSongDocs = flatSnap.docs.filter(d => {
      const data = d.data() || {};
      return !!(data.name || data.preferredKey);
    });
    const flatIds = new Set(flatSongDocs.map(d => d.id));
    const categoryDocs = flatSnap.docs.filter(d => !flatIds.has(d.id));
    log(`Опознано песен напрямую: ${flatSongDocs.length}, категорий: ${categoryDocs.length}`);

    async function processSongRecord(name, preferredKey, fallbackCategory) {
      total++;
      if (!name || !preferredKey) { skipped++; log(`⚠️ Пропуск: нет name/key у записи`); return; }
      const songDoc = await findSongByName(name);
      if (!songDoc) { skipped++; log(`⚠️ Не найдена в Songs по name: ${name}`); return; }
      try {
        await userRep.doc(songDoc.id).set({
          name,
          preferredKey,
          bpm: songDoc.bpm || songDoc.BPM || null,
          category: songDoc.category || songDoc.sheet || fallbackCategory || null,
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
    function baseCategoryFromId(id) {
      return (id || '').replace(/_[0-9]+$/, '').trim();
    }

    for (const catDoc of categoryDocs) {
      const catId = catDoc.id; // например: "Быстрые (вертикаль)_16"
      const catBase = baseCategoryFromId(catId);
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
          await processSongRecord(name, preferredKey, catBase);
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
          await processSongRecord(name, preferredKey, catBase);
        }
      } else {
        // Доп. фоллбек: песни как массив внутри doc (songs|list|items) или объект
        const cdata = catDoc.data() || {};
        let arr = null;
        if (Array.isArray(cdata.songs)) arr = cdata.songs;
        else if (Array.isArray(cdata.list)) arr = cdata.list;
        else if (Array.isArray(cdata.items)) arr = cdata.items;
        else if (cdata.songs && typeof cdata.songs === 'object') arr = Object.values(cdata.songs);
        if (Array.isArray(arr) && arr.length) {
          log(`Категория ${catId}: найден массив песен: ${arr.length}`);
          for (const s of arr) {
            const name = s?.name || s?.title || '';
            const preferredKey = s?.preferredKey || s?.key || null;
            await processSongRecord(name, preferredKey, catBase);
          }
        } else {
          log(`⚠️ Категория ${catId}: не найдены подколлекции 'songs'/'repertoire' и массивов песен`);
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

