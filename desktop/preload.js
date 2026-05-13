const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (key, value) => ipcRenderer.invoke('save-config', key, value),
  resetDemoData: () => ipcRenderer.invoke('reset-demo-data'),
})