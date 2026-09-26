/**
 * 画面の表示と操作を担当するファイル。
 * データの保存・読み込みは storage.js の StudyStorage に任せている。
 */

// ---------- 設定値（数字の意味がわかるように名前をつけておく） ----------
const DAYS_TO_SHOW = 14;
const MAX_MINUTES_PER_DAY = 1440; // 24時間 × 60分
// 何分以上でマスの色を1段階濃くするか
const LEVEL_THRESHOLDS = [1, 30, 60, 120];

// ---------- 画面の要素 ----------
const form = document.getElementById('record-form');
const formError = document.getElementById('form-error');
const recordList = document.getElementById('record-list');
const emptyMessage = document.getElementById('empty-message');
const dayGrid = document.getElementById('day-grid');
const totalMinutes = document.getElementById('total-minutes');

// ---------- アプリの状態 ----------
let records = StudyStorage.load();

// ---------- 日付の処理 ----------

/**
 * Date を "2026-09-27" 形式の文字列にする。
 * toISOString() は UTC 基準なので、日本時間の朝9時より前だと前日の日付になってしまう。
 * そのため、ここでは使わずに年・月・日を自分で組み立てている。
 */
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 今日から数えて直近 count 日分の日付キーを古い順に返す */
function getRecentDateKeys(count) {
  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    keys.push(toDateKey(date));
  }
  return keys;
}

// ---------- 入力チェック ----------

/**
 * フォームの入力をチェックする。
 * @returns {string} エラーメッセージ。問題なければ空文字。
 */
function validate({ date, topic, minutes }) {
  if (!date) return '日付を入力してください。';
  if (!topic) return '学習した内容を入力してください。';
  if (!Number.isInteger(minutes) || minutes < 1) {
    return '学習時間は1以上の整数で入力してください。';
  }
  if (minutes > MAX_MINUTES_PER_DAY) {
    return `学習時間は${MAX_MINUTES_PER_DAY}分以内で入力してください。`;
  }
  return '';
}

// ---------- 記録の追加・削除 ----------

/** @returns {boolean} 保存できたら true */
function addRecord({ date, topic, minutes }) {
  const record = {
    id: String(Date.now()),
    date,
    topic,
    minutes,
  };
  records = [...records, record];
  return StudyStorage.save(records);
}

function deleteRecord(id) {
  records = records.filter((record) => record.id !== id);
  StudyStorage.save(records);
}

// ---------- 表示 ----------

/** 分数から、マスの色の濃さ（0〜4）を決める */
function getLevel(minutes) {
  return LEVEL_THRESHOLDS.filter((threshold) => minutes >= threshold).length;
}

function renderDayGrid() {
  const todayKey = toDateKey(new Date());
  const dateKeys = getRecentDateKeys(DAYS_TO_SHOW);
  let total = 0;

  dayGrid.replaceChildren();

  dateKeys.forEach((dateKey) => {
    const minutes = records
      .filter((record) => record.date === dateKey)
      .reduce((sum, record) => sum + record.minutes, 0);
    total += minutes;

    const cell = document.createElement('li');
    cell.className = 'day';
    cell.dataset.level = getLevel(minutes);
    if (dateKey === todayKey) cell.classList.add('is-today');
    cell.setAttribute('aria-label', `${dateKey}：${minutes}分`);

    const dayLabel = document.createElement('span');
    dayLabel.textContent = Number(dateKey.slice(-2)); // "09" → 9

    const minutesLabel = document.createElement('span');
    minutesLabel.className = 'day-minutes';
    minutesLabel.textContent = minutes > 0 ? `${minutes}分` : '';

    cell.append(dayLabel, minutesLabel);
    dayGrid.append(cell);
  });

  totalMinutes.textContent = total;
}

function renderRecordList() {
  recordList.replaceChildren();
  emptyMessage.hidden = records.length > 0;

  // 新しい日付が上に来るように並べ替える（元の配列は変更しない）
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach((record) => {
    const item = document.createElement('li');
    item.className = 'record-item';

    const date = document.createElement('span');
    date.className = 'record-date';
    date.textContent = record.date;

    // 入力された文字は textContent で入れる
    // （innerHTML だと、入力にスクリプトを埋め込まれる危険がある）
    const topic = document.createElement('span');
    topic.className = 'record-topic';
    topic.textContent = record.topic;

    const minutes = document.createElement('span');
    minutes.className = 'record-minutes';
    minutes.textContent = `${record.minutes}分`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '削除';
    deleteButton.dataset.id = record.id;

    item.append(date, topic, minutes, deleteButton);
    recordList.append(item);
  });
}

function render() {
  renderDayGrid();
  renderRecordList();
}

// ---------- イベント ----------

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const input = {
    date: formData.get('date'),
    topic: formData.get('topic').trim(),
    minutes: Number(formData.get('minutes')),
  };

  const errorMessage = validate(input);
  if (errorMessage) {
    formError.textContent = errorMessage;
    return;
  }

  const saved = addRecord(input);
  formError.textContent = saved ? '' : '保存できませんでした。ブラウザの設定を確認してください。';

  form.reset();
  form.date.value = toDateKey(new Date());
  render();
});

// 削除ボタンはボタンごとではなく、一覧全体で1つのイベントを受け取る
recordList.addEventListener('click', (event) => {
  const button = event.target.closest('.delete-button');
  if (!button) return;
  if (!confirm('この記録を削除しますか？')) return;

  deleteRecord(button.dataset.id);
  render();
});

// ---------- 初期表示 ----------
form.date.value = toDateKey(new Date());
render();
