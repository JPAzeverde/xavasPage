/**
 * xavasPage — API Connector
 * Codename: DATALINK
 * Handles all communication with Google Apps Script backend.
 */

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzmPbCXSp7M8bZpO1e49aLhaoLP-UgC-8yrOWL13dn1JPtkJ-KY1kpG9gJtzM3rYC-1LA/exec';
const API_TOKEN = 'XAVAS_SECRET_TOKEN_2026'; // Deve ser igual ao do Apps Script

const api = {
  /**
   * Generic request to Apps Script.
   * @param {string} sheet - Nome da aba
   * @param {string} action - 'list' | 'add' | 'update' | 'delete'
   * @param {object} [data] - Dados para a ação
   * @returns {Promise<object>}
   */
  async _request(sheet, action, data = {}) {
    const payload = {
      token: API_TOKEN,
      sheet,
      action,
      data
    };
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error || 'API request failed');
    return json.data;
  },

  // ---------- Games ----------
  async getGames() {
    return this._request('Games', 'list');
  },
  async addGame(game) {
    return this._request('Games', 'add', game);
  },
  async updateGame(game) {
    return this._request('Games', 'update', game);
  },
  async deleteGame(id) {
    return this._request('Games', 'delete', { id });
  },

  // ---------- Shows ----------
  async getShows() {
    return this._request('Shows', 'list');
  },
  async addShow(show) {
    return this._request('Shows', 'add', show);
  },
  async updateShow(show) {
    return this._request('Shows', 'update', show);
  },
  async deleteShow(id) {
    return this._request('Shows', 'delete', { id });
  },

  // ---------- Tasks ----------
  async getTasks() {
    return this._request('Tasks', 'list');
  },
  async addTask(task) {
    return this._request('Tasks', 'add', task);
  },
  async updateTask(task) {
    return this._request('Tasks', 'update', task);
  },
  async deleteTask(id) {
    return this._request('Tasks', 'delete', { id });
  },

  // ---------- Protocols ----------
  async getProtocols() {
    return this._request('Protocols', 'list');
  },
  async addProtocol(proto) {
    return this._request('Protocols', 'add', proto);
  },
  async updateProtocol(proto) {
    return this._request('Protocols', 'update', proto);
  },
  async deleteProtocol(id) {
    return this._request('Protocols', 'delete', { id });
  },

  // ---------- Consumables ----------
  async getConsumables() {
    return this._request('Consumables', 'list');
  },
  async addConsumable(item) {
    return this._request('Consumables', 'add', item);
  },
  async updateConsumable(item) {
    return this._request('Consumables', 'update', item);
  },
  async deleteConsumable(id) {
    return this._request('Consumables', 'delete', { id });
  },
  async getConsumableHistory(key) {
    // Usa o endpoint 'listHistory' passando o key como parte do data
    const payload = {
      token: API_TOKEN,
      sheet: 'ConsumableHistory',
      action: 'listHistory',
      data: { key }
    };
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error || 'Failed to get history');
    return json.data; // array of durations
  },
  async addConsumableHistory(key, durationDays) {
    // Usaremos o próprio update? Vamos implementar um 'addHistory' via add na aba ConsumableHistory
    const payload = {
      token: API_TOKEN,
      sheet: 'ConsumableHistory',
      action: 'add',
      data: { Key: key, DurationDays: durationDays }
    };
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error || 'Failed to add history');
    return json.data;
  }
};