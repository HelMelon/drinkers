<template>
  <section class="import-panel">
    <p class="hint">
      Поддерживаются <b>CSV</b> (разделитель <code>,</code> <code>;</code> или таб), <b>TSV</b> и <b>JSON</b>.
      Колонки: <code>id, name, composition, volume, price, iba_category</code>.
      <code>id</code> можно не заполнять — тогда совпадение ищется по названию.
      Цена — одно или два числа: <code>14</code> или <code>14 20</code> (домашняя / импортная).
    </p>

    <div class="export">
      <h3>Экспорт</h3>
      <p class="hint">Скачать весь каталог тем же форматом, который принимает импорт — это и есть бэкап.</p>
      <div class="row buttons">
        <button class="btn ghost" :disabled="isExporting" @click="exportAs('csv')">Скачать CSV</button>
        <button class="btn ghost" :disabled="isExporting" @click="exportAs('json')">Скачать JSON</button>
        <span v-if="exportNotice" class="hint">{{ exportNotice }}</span>
      </div>
    </div>

    <div
      class="drop"
      :class="{over: isOver}"
      @dragover.prevent="isOver = true"
      @dragleave.prevent="isOver = false"
      @drop.prevent="onDrop"
      @click="$refs.fileInput.click()"
    >
      <input ref="fileInput" type="file" accept=".csv,.tsv,.txt,.json" hidden @change="onPick" />
      <template v-if="!file">
        <b>Перетащи файл сюда</b> или нажми, чтобы выбрать
      </template>
      <template v-else>
        <b>{{ file.name }}</b> · {{ formatLabel }} · {{ sizeLabel }}
      </template>
    </div>

    <div class="row">
      <label><input v-model="mode" type="radio" value="merge" /> обновить совпадающие, добавить новые</label>
      <label><input v-model="mode" type="radio" value="replace" /> заменить весь каталог</label>
    </div>

    <p v-if="mode === 'replace'" class="warn">
      Режим «заменить» удалит все текущие коктейли и зальёт только содержимое файла.
    </p>

    <div class="row buttons">
      <button class="btn" :disabled="!file || isBusy" @click="run">
        {{ isBusy ? 'Импортирую…' : 'Импортировать' }}
      </button>
      <button class="btn ghost" @click="downloadTemplate">Скачать шаблон CSV</button>
      <button v-if="file" class="btn ghost" @click="clearFile">Сбросить файл</button>
    </div>

    <div v-if="preview.length" class="preview">
      <h3>Первые строки ({{ preview.length }} из {{ rowCount }})</h3>
      <table>
        <thead>
          <tr><th v-for="key in previewKeys" :key="key">{{ key }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in preview" :key="index">
            <td v-for="key in previewKeys" :key="key">{{ formatCell(row[key]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="report" class="report">
      <h3>Готово</h3>
      <p>
        всего строк: <b>{{ report.total }}</b> ·
        добавлено: <b>{{ report.added }}</b> ·
        обновлено: <b>{{ report.updated }}</b> ·
        пропущено: <b>{{ report.skipped }}</b>
      </p>
      <details v-if="report.errors?.length">
        <summary>Ошибки ({{ report.errors.length }})</summary>
        <ul>
          <li v-for="err in report.errors" :key="err.line">
            строка {{ err.line }}: {{ err.message }} <span class="muted">{{ err.name }}</span>
          </li>
        </ul>
      </details>
    </div>

    <p v-if="error" class="hint">{{ error }}</p>
  </section>
</template>

<script setup>
import {computed, ref} from 'vue';
import {api, downloadExport} from '../../api/admin.js';

const emit = defineEmits(['imported']);

const file = ref(null);
const content = ref('');
const mode = ref('merge');
const isBusy = ref(false);
const isOver = ref(false);
const error = ref('');
const report = ref(null);
const isExporting = ref(false);
const exportNotice = ref('');

const format = computed(() => {
  const name = file.value?.name?.toLowerCase() ?? '';
  return name.endsWith('.json') ? 'json' : 'csv';
});
const formatLabel = computed(() => (format.value === 'json' ? 'JSON' : 'CSV/TSV'));
const sizeLabel = computed(() => {
  const bytes = file.value?.size ?? 0;
  return bytes > 1024 ? `${(bytes / 1024).toFixed(1)} КБ` : `${bytes} Б`;
});

const previewKeys = ['name', 'composition', 'volume', 'price', 'iba_category'];
const rowCount = ref(0);
const preview = ref([]);

const buildPreview = (text, kind) => {
  error.value = '';
  preview.value = [];
  rowCount.value = 0;
  try {
    if (kind === 'json') {
      const rows = JSON.parse(text);
      if (!Array.isArray(rows)) throw new Error('JSON должен быть массивом объектов');
      rowCount.value = rows.length;
      preview.value = rows.slice(0, 3);
      return;
    }
    const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((line) => line.trim() !== '');
    const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
    const cells = lines.map((line) => line.split(delimiter));
    const head = cells[0].map((cell) => cell.trim().toLowerCase());
    const hasHeader = head.includes('name');
    const keys = hasHeader ? head : ['id', 'name', 'composition', 'volume', 'price', 'iba_category'];
    const body = hasHeader ? cells.slice(1) : cells;
    rowCount.value = body.length;
    preview.value = body.slice(0, 3).map((row) => Object.fromEntries(keys.map((key, index) => [key, row[index] ?? ''])));
  } catch (e) {
    error.value = `не удалось прочитать файл: ${e.message}`;
  }
};

// File.text() есть не везде (jsdom, старые движки) — падаем на FileReader.
const readText = (blob) => new Promise((resolve, reject) => {
  if (typeof blob.text === 'function') {
    blob.text().then(resolve, reject);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(reader.error ?? new Error('не удалось прочитать файл'));
  reader.readAsText(blob);
});

const readFile = async (picked) => {
  if (!picked) return;
  file.value = picked;
  report.value = null;
  try {
    content.value = await readText(picked);
    buildPreview(content.value, format.value);
  } catch (e) {
    content.value = '';
    file.value = null;
    error.value = `не удалось прочитать файл: ${e.message}`;
  }
};

const onPick = (event) => readFile(event.target.files?.[0]);
const onDrop = (event) => {
  isOver.value = false;
  readFile(event.dataTransfer?.files?.[0]);
};

const clearFile = () => {
  file.value = null;
  content.value = '';
  preview.value = [];
  report.value = null;
};

const run = async () => {
  isBusy.value = true;
  error.value = '';
  try {
    report.value = await api('/import', {
      method: 'POST',
      body: {format: format.value, mode: mode.value, content: content.value}
    });
    emit('imported', report.value);
  } catch (e) {
    error.value = e.message;
  } finally {
    isBusy.value = false;
  }
};

const exportAs = async (format) => {
  isExporting.value = true;
  error.value = '';
  exportNotice.value = '';
  try {
    const name = await downloadExport(format);
    exportNotice.value = `Скачано: ${name}`;
  } catch (e) {
    error.value = e.message;
  } finally {
    isExporting.value = false;
  }
};

const downloadTemplate = () => {
  const csv = [
    'name,composition,volume,price,iba_category',
    '"Negroni","gin, sweet vermouth, bitter",90,14 20,Unforgettables',
    '"Mojito","white rum, lime juice, mint, soda",200,12,Classics'
  ].join('\n');
  const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cocktails-template.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const formatCell = (value) => (Array.isArray(value) ? value.join(' / ') : String(value ?? ''));
</script>

<style scoped>
.drop {
  border: 2px dashed rgba(128, 128, 128, .5);
  border-radius: 10px;
  padding: 26px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.drop.over { border-color: currentColor; background: rgba(128, 128, 128, .08); }
.row { display: flex; gap: 18px; flex-wrap: wrap; margin: 12px 0; align-items: center; }
.row label { display: flex; gap: 6px; align-items: center; font-size: 14px; }
.buttons { gap: 10px; }
.warn { color: #b3423a; font-size: 14px; }
.hint { font-size: 14px; opacity: .8; }
.export h3 { font-size: 15px; margin: 4px 0 6px; }
.export { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid rgba(128, 128, 128, .25); }
.preview h3, .report h3 { font-size: 15px; margin: 14px 0 6px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid rgba(128, 128, 128, .25); }
th { opacity: .7; font-weight: 600; }
.muted { opacity: .6; }
.btn.ghost { background: transparent; border: 1px solid currentColor; }
</style>
