# План оновлення v0.2.4

**Тип релізу:** Patch (швидкі покращення + DX fixes)
**Фокус:** 🔥 Production-based DX improvements + завершити відкладені функції з v0.2.3
**ETA:** 1-2 тижні
**Bundle target:** +1-2 KB максимум
**Production tested:** ✅ (2000+ lines, 1000+ users, real PWA)

---

## 🎯 Основні задачі (Must-have)

### 1. 🔧 Виправлення `init-ai` команди (AI Setup Fix)
**Пріоритет:** ⭐⭐⭐⭐⭐
**Статус:** Критична проблема DX
**Час:** 1 день
**Джерело:** Production feedback, реальне тестування

**Проблема:** `npx svelte-reactor init-ai` створює файли, які AI не читає автоматично:
- `.claude/SVELTE_REACTOR_RULES.md` ❌ (Claude Code не читає)
- `.cursor/SVELTE_REACTOR_RULES.md` ❌ (Cursor не читає)

**Що зробити:**
- [ ] **Claude Code:** Змінити вихід на `.claude/README.md` (або merge з існуючим)
- [ ] **Cursor AI:** Змінити вихід на `.cursorrules` замість `.cursor/SVELTE_REACTOR_RULES.md`
- [ ] **GitHub Copilot:** Додати `.github/copilot-instructions.md`
- [ ] Додати `--force` flag для перезапису
- [ ] Додати `--merge` flag для об'єднання з існуючими файлами
- [ ] Покращити повідомлення після виконання команди

**Файли для зміни:**
- `cli/generators/claude.js` - змінити outputPath
- `cli/generators/cursor.js` - змінити outputPath
- `cli/generators/copilot.js` - додати генератор

**Приклад реалізації (Option 3 - найкращий):**
```javascript
// Detect existing README.md and merge
const readmePath = join(outputDir, 'README.md');
let existingContent = '';
try {
  existingContent = readFileSync(readmePath, 'utf-8');
} catch (err) {
  // File doesn't exist
}

if (existingContent && !options.force) {
  if (options.merge) {
    // Merge with existing
    const newContent = existingContent + '\n\n---\n\n# svelte-reactor Rules\n\n' + template;
    writeFileSync(readmePath, newContent);
  } else {
    console.error('README.md already exists. Use --force or --merge');
    process.exit(1);
  }
} else {
  writeFileSync(readmePath, template);
}
```

**Тести:** +10 тестів
**Bundle impact:** 0 KB (CLI only)

---

### 2. 📦 Додати експорт `derived` (Production Feedback)
**Пріоритет:** ⭐⭐⭐⭐⭐
**Статус:** Критична проблема DX
**Час:** 1-2 години
**Джерело:** Реальна міграція 2000+ рядків production коду

**Проблема:**
```typescript
import { derived } from 'svelte-reactor'; // ❌ ERROR
// SyntaxError: The requested module does not provide an export named 'derived'
```

**Workaround (поточний):**
```typescript
import { derived } from 'svelte/store'; // ✅ Works but requires extra import
import { simpleStore } from 'svelte-reactor';
```

**Рішення:**
- [ ] Додати re-export `derived` та `get` з `svelte/store`
- [ ] Оновити TypeScript типи
- [ ] Додати документацію з прикладами
- [ ] Додати тести

**Реалізація:**
```typescript
// src/index.ts
export { derived, get, readonly } from 'svelte/store';
```

**Документація:**
```markdown
## Derived Stores

svelte-reactor stores are 100% compatible with Svelte's `derived()`:

\`\`\`typescript
import { simpleStore, derived } from 'svelte-reactor'; // ✅ Single import!

const count = simpleStore(0);
const doubled = derived(count, $count => $count * 2);
\`\`\`
```

**Benefits:**
- Single import source
- Better DX
- Less confusion
- Production-tested (2000+ lines migrated)

**Тести:** +6 тестів
**Bundle impact:** 0 KB (re-export only)

---

### 3. 🎯 TypeScript: Storage Type Safety
**Пріоритет:** ⭐⭐⭐⭐
**Статус:** Нова функція
**Час:** 2-3 години
**Джерело:** Production feedback

**Проблема:** Storage option не має строгої типізації:
```typescript
const store = persistedStore('key', {}, {
  storage: 'sessionStorage' // ⚠️ No type checking - can be any string!
});
```

**Рішення:**
```typescript
// src/types.ts
type StorageType = 'localStorage' | 'sessionStorage' | 'indexedDB';

interface PersistedOptions {
  debounce?: number;
  storage?: StorageType; // ✅ Type-safe!
  indexedDB?: {
    database: string;
    storeName: string;
    version?: number;
  };
}
```

**Що зробити:**
- [ ] Додати union type `StorageType`
- [ ] Оновити інтерфейс `PersistedOptions`
- [ ] Додати JSDoc коментарі
- [ ] Оновити документацію

**Тести:** +4 тести
**Bundle impact:** 0 KB (types only)

---

### 4. ✅ IndexedDB Storage Support (відкладено з v0.2.3)
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

### 5. 🔧 persist Plugin: TTL Support
**Пріоритет:** ⭐⭐⭐⭐
**Статус:** ✅ Завершено
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
- ✅ Зберігати timestamp при save
- ✅ Перевіряти при load
- ✅ onExpire callback для реакції на експірацію

**Тести:** ✅ +19 тестів (все покриття)
**Bundle impact:** 0 KB (мінімальний вплив)

---

### 6. 🎯 arrayActions: Pagination Helper
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
- [ ] README.md - додати IndexedDB приклади та derived stores
- [ ] API.md - документувати нові опції (TTL, pagination, compression)
- [ ] CHANGELOG.md - записати всі зміни
- [ ] UPGRADE-0.2.4.md - створити гід міграції
- [ ] AI templates - виправити шляхи файлів (claude.md → README.md, cursor.md → .cursorrules)
- [ ] PERFORMANCE.md - оновити bundle size
- [ ] **НОВИЙ:** Додати розділ "Derived Stores" в документацію
- [ ] **НОВИЙ:** Додати розділ "Working with sessionStorage" в EXAMPLES.md

### Опціонально:
- [ ] EXAMPLES.md - додати нові приклади (pagination, TTL, compression)
- [ ] Demos - додати IndexedDB demo
- [ ] Створити troubleshooting guide для init-ai команди

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

**🔥 Priority (DX Improvements):**
- ✅ Виправлення `init-ai` команди (Claude, Cursor, Copilot)
- ✅ Експорт `derived` з svelte-reactor
- ✅ TypeScript type safety для storage

**💪 Core Features:**
- ✅ IndexedDB Storage (50+ MB замість 5 MB)
- ✅ TTL для persist (auto-cleanup)
- ✅ Pagination для arrayActions

**🎨 Enhancements:**
- ✅ Compression для localStorage
- ✅ Custom formatters для logger
- ✅ Enhanced DevTools diff viewer

**Metrics:**
- **Тести:** ~300 (+68 нових)
- **Bundle:** ~15-16 KB gzipped (+1.5-2 KB, tree-shakeable)
- **Features:** 9 (3 DX fixes + 3 major + 3 enhancements)
- **Bug fixes:** 0-2 (якщо знайдуться)
- **Production tested:** ✅ (2000+ lines migrated successfully)

**Backward compatibility:** 100% ✅

---

## 🗓️ Timeline (орієнтовний)

### Week 1 (DX Priority + Core Features)
- **День 1:** 🔥 Виправлення `init-ai` команди (всі AI assistants)
- **День 1:** 🔥 Додати експорт `derived` (швидко, 1-2 години)
- **День 1-2:** 🔥 TypeScript type safety для storage
- **День 2-3:** IndexedDB інтеграція в документацію
- **День 4-5:** TTL для persist plugin
- **День 6:** Pagination для arrayActions

### Week 2 (Enhancements + Polish)
- **День 1-2:** Compression для persist
- **День 3:** Custom formatters для logger
- **День 4-5:** DevTools enhancements
- **День 6-7:** Documentation, testing, release

**Пріоритет:** DX fixes (день 1) → Core features (тиждень 1) → Enhancements (тиждень 2)

---

## 🎯 Альтернативний план (якщо мало часу)

**Мінімальний v0.2.4 (2-3 дні):**
1. 🔥 **DX Fixes (КРИТИЧНО - день 1):**
   - init-ai команда (3-4 години)
   - derived export (1 година)
   - TypeScript types (2 години)
2. ✅ IndexedDB документація (1 день)
3. ✅ Bug fixes та documentation (1 день)

**Bundle:** +0.5 KB (тільки необхідне)
**Тести:** ~260 (+30 нових)

**Обґрунтування:** DX fixes мають найвищий ROI - вони покращують досвід для всіх користувачів негайно

---

## 🎉 Production Feedback & Validation

### Реальна міграція: PaintCalc PWA (2025-01-13)

**Масштаб:**
- 7+ stores мігровано на svelte-reactor
- ~2000 рядків production коду
- 1000+ активних користувачів
- localStorage + sessionStorage persistence
- Derived computations

**Результати:**
- ✅ Міграція зайняла 15 хвилин
- ✅ Zero runtime errors
- ✅ Hot reload працював ідеально
- ✅ Код став чистішим (-10% lines!)
- ✅ Auto-save працює чудово

**Виявлені проблеми:**
1. ❌ `init-ai` створює файли, які AI не читає → **FIX: v0.2.4**
2. ❌ Відсутній експорт `derived` → **FIX: v0.2.4**
3. ⚠️ Storage types не type-safe → **FIX: v0.2.4**

**Що працює відмінно:**
- ✅ persistedStore з sessionStorage
- ✅ 100% сумісність з Svelte's `derived()`
- ✅ Можна міксувати svelte-reactor stores з `derived()` зі svelte/store
- ✅ Production-ready!

### Висновок

**svelte-reactor v0.2.3 успішно працює в production**, але:
- DX можна значно покращити (init-ai, derived export)
- TypeScript types потребують доопрацювання
- Документація потребує розділу про derived stores

**v0.2.4 виправить всі виявлені проблеми DX** 🎯

---

## 📝 Нотатки

- IndexedDB код вже готовий (+36 тестів), потрібна тільки документація
- **DX fixes мають найвищий пріоритет** - вони виявлені в production
- Фокус на швидких wins для v0.2.4
- Великі features (DevTools, Performance) залишити на v0.3.0
- Tree-shakeable підхід для всіх нових features
- **Production feedback показує, що бібліотека готова для реальних проектів**

**Після v0.2.4 → планувати v0.3.0 (major enhancement release)**
