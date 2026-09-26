/**
 * 学習記録の「保存」と「読み込み」だけを担当するファイル。
 *
 * 保存先（今は localStorage）を変えたくなったときに、
 * このファイルだけ直せば済むように分けている。
 */

const STORAGE_KEY = 'study-log-records';

const StudyStorage = {
  /**
   * 保存されている記録をすべて読み込む。
   * データが壊れていてもアプリが止まらないように、失敗時は空配列を返す。
   * @returns {Array<{id: string, date: string, topic: string, minutes: number}>}
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('記録の読み込みに失敗しました', error);
      return [];
    }
  },

  /**
   * 記録をまとめて保存する。
   * @param {Array} records
   * @returns {boolean} 保存できたら true
   */
  save(records) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (error) {
      console.error('記録の保存に失敗しました', error);
      return false;
    }
  },
};
