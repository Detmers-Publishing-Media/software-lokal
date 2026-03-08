// DB-Abstraktionsschicht: delegiert an Electron Preload-Bridge (window.electronAPI.db)

export async function query(sql, params = []) {
  return window.electronAPI.db.query(sql, params);
}

export async function execute(sql, params = []) {
  return window.electronAPI.db.execute(sql, params);
}
