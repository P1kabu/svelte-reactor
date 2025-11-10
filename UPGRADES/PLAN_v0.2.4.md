# План оновлення v0.2.4

**Тип релізу:** Patch (швидкі покращення)
**Фокус:** Завершити відкладені функції з v0.2.3 + дрібні DX покращення
**ETA:** 1-2 тижні
**Bundle target:** +1-2 KB максимум

---

## 🎯 Основні задачі (Must-have)

### 1. ✅ IndexedDB Storage Support (відкладено з v0.2.3)
**Пріоритет:** ⭐⭐⭐⭐⭐
**Статус:** Код готовий, потрібна інтеграція в документацію
**Час:** 1-2 дні

**Що зробити:**
- [x] Код реалізовано (`src/storage/indexeddb.ts`)
- [x] Тести написані (+36 тестів)
- [ ] Оновити документацію (README.md, API.md)
- [ ] Додати приклади використання
- [ ] Оновити UPGRADE guide
- [ ] Оновити AI templates
- [ ] Перевірити bundle size

**Приклад API:**
```typescript
import { persistedStore } from 'svelte-reactor';

const store = persistedStore('photos', { items: [] }, {
  storage: 'indexedDB',  // Замість localStorage
  indexedDB: {
    database: 'my-app',
    storeName: 'photos',
    version: 1
  }
});
```

**Bundle impact:** +2.5 KB (+1.2 KB gzipped, tree-shakeable)

---

### 2. 🔧 persist Plugin: TTL Support
**Пріоритет:** ⭐⭐⭐⭐
**Статус:** Нова функція
**Час:** 2-3 дні

**Опис:** Автоматичне видалення застарілих даних з storage

**API:**
```typescript
persist({
  key: 'cache',
  ttl: 5 * 60 * 1000, // 5 хвилин
  onExpire: (key) => console.log(`Cache expired: ${key}`)
})
```

**Реалізація:**
- Зберігати timestamp при save
- Перевіряти при load
- Опціонально: background cleanup

**Тести:** +5 тестів
**Bundle impact:** +0.3 KB

---

### 3. 🎯 arrayActions: Pagination Helper
**Пріоритет:** ⭐⭐⭐
**Статус:** Нова функція
**Час:** 1-2 дні

**Опис:** Вбудована підтримка пагінації для великих масивів

**API:**
```typescript
const actions = arrayActions(todos, 'items', {
  idKey: 'id',
  pagination: {
    pageSize: 20,
    prefetch: true // Підгружати наступну сторінку
  }
});

// Використання
actions.setPage(2); // Перейти на сторінку 2
actions.nextPage();
actions.prevPage();

// Отримати дані
const { items, page, totalPages, hasNext, hasPrev } = actions.getPaginated();
```

**Тести:** +8 тестів
**Bundle impact:** +0.5 KB

---

## 💡 Додаткові покращення (Nice-to-have)

### 4. 📝 persist Plugin: Compression
**Пріоритет:** ⭐⭐⭐
**Статус:** Нова функція
**Час:** 2-3 дні

**Опис:** Опціональна компресія для localStorage

**API:**
```typescript
persist({
  key: 'large-data',
  compress: true, // Використовувати LZ-string або similar
  compressionLevel: 'fast' // 'fast' | 'best'
})
```

**Bundle impact:** +1.5 KB (tree-shakeable)
**Користь:** Економія storage space

---

### 5. 🔍 logger Plugin: Custom Formatters
**Пріоритет:** ⭐⭐
**Статус:** Покращення
**Час:** 1 день

**Опис:** Кастомні форматтери для виводу

**API:**
```typescript
logger({
  formatter: (action, prevState, nextState) => {
    return `🔄 ${action}: ${JSON.stringify(nextState, null, 2)}`;
  },
  colors: {
    action: '#00ff00',
    state: '#0000ff'
  }
})
```

**Тести:** +4 тести
**Bundle impact:** +0.2 KB

---

### 6. 📊 DevTools: Enhanced State Diff Viewer
**Пріоритет:** ⭐⭐⭐
**Статус:** Покращення
**Час:** 2 дні

**Опис:** Краща візуалізація змін між станами

**Що додати:**
- Highlight змінених полів
- JSON diff viewer
- Visual tree для nested objects
- Copy diff to clipboard

**Тести:** +6 тестів
**Bundle impact:** +1 KB

---

## 🐛 Bug Fixes

### Known Issues
- Немає відомих критичних багів

### Potential Improvements
1. Перевірити memory leaks в IndexedDB
2. Оптимізувати performance для великих arrays
3. Покращити error messages в persist plugin

---

## 📚 Документація

### Обов'язково оновити:
- [ ] README.md - додати IndexedDB приклади
- [ ] API.md - документувати нові опції
- [ ] CHANGELOG.md - записати всі зміни
- [ ] UPGRADE-0.2.4.md - створити гід
- [ ] AI templates - оновити (claude.md, cursor.md, copilot.md)
- [ ] PERFORMANCE.md - оновити bundle size

### Опціонально:
- [ ] EXAMPLES.md - додати нові приклади
- [ ] Demos - додати IndexedDB demo

---

## ✅ Критерії готовності

### Код
- [ ] Всі функції реалізовані
- [ ] TypeScript типи додані
- [ ] Build проходить без помилок
- [ ] Всі тести пройшли (очікується ~280 тестів)

### Документація
- [ ] README.md оновлено
- [ ] API.md оновлено
- [ ] CHANGELOG.md заповнено
- [ ] UPGRADE guide створено
- [ ] AI templates оновлені

### Якість
- [ ] Bundle size в межах (+1-2 KB)
- [ ] Performance benchmarks пройдені
- [ ] Manual testing виконано
- [ ] Code review пройдено

---

## 📦 Очікувані результати

**v0.2.4 Features:**
- ✅ IndexedDB Storage (50+ MB замість 5 MB)
- ✅ TTL для persist (auto-cleanup)
- ✅ Pagination для arrayActions
- ✅ Compression для localStorage
- ✅ Custom formatters для logger
- ✅ Enhanced DevTools diff viewer

**Metrics:**
- **Тести:** ~280 (+48 нових)
- **Bundle:** ~15-16 KB gzipped (+1.5-2 KB)
- **Features:** 6 (3 major + 3 enhancements)
- **Bug fixes:** 0-2 (якщо знайдуться)

**Backward compatibility:** 100% ✅

---

## 🗓️ Timeline (орієнтовний)

### Week 1
- День 1-2: IndexedDB інтеграція в документацію
- День 3-4: TTL для persist plugin
- День 5: Pagination для arrayActions

### Week 2
- День 1-2: Compression для persist
- День 3: Custom formatters для logger
- День 4-5: DevTools enhancements
- День 6-7: Documentation, testing, release

---

## 🎯 Альтернативний план (якщо мало часу)

**Мінімальний v0.2.4 (3-4 дні):**
1. ✅ IndexedDB документація (1 день)
2. ✅ TTL для persist (2 дні)
3. ✅ Bug fixes та documentation (1 день)

**Bundle:** +1 KB
**Тести:** ~250 (+18 нових)

---

## 📝 Нотатки

- IndexedDB код вже готовий (+36 тестів), потрібна тільки документація
- Фокус на швидких wins для v0.2.4
- Великі features (DevTools, Performance) залишити на v0.3.0
- Tree-shakeable підхід для всіх нових features

**Після v0.2.4 → планувати v0.3.0 (major enhancement release)**
