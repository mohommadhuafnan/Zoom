const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('unimeetDesktop', {
  isDesktop: true,
  platform: process.platform,
});
