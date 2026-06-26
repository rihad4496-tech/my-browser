import { Menu, MenuItemConstructorOptions, shell, app } from 'electron'
import { WindowManager } from './WindowManager'

export function createApplicationMenu(wm: WindowManager): Menu {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ]
    }] : []),

    // File
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:new-tab')
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => wm.createWindow()
        },
        {
          label: 'New Incognito Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => wm.createWindow({ incognito: true })
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:close-tab')
        },
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => wm.getFocusedWindow()?.close()
        },
        { type: 'separator' },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => wm.getFocusedWindow()?.webContents.print()
        },
        ...(!isMac ? [{ role: 'quit' as const }] : []),
      ]
    },

    // Edit
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find in Page',
          accelerator: 'CmdOrCtrl+F',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:find')
        },
      ]
    },

    // View
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:reload')
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:force-reload')
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:zoom-in')
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:zoom-out')
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:zoom-reset')
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            const win = wm.getFocusedWindow()
            win?.setFullScreen(!win.isFullScreen())
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => wm.getFocusedWindow()?.webContents.toggleDevTools()
        },
        { type: 'separator' },
        {
          label: 'Reader Mode',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:reader-mode')
        },
      ]
    },

    // History
    {
      label: 'History',
      submenu: [
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:back')
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:forward')
        },
        { type: 'separator' },
        {
          label: 'Show History',
          accelerator: 'CmdOrCtrl+H',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:history')
        },
        {
          label: 'Clear Browsing Data',
          accelerator: 'CmdOrCtrl+Shift+Delete',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:clear-data')
        },
      ]
    },

    // Bookmarks
    {
      label: 'Bookmarks',
      submenu: [
        {
          label: 'Bookmark This Tab',
          accelerator: 'CmdOrCtrl+D',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:bookmark')
        },
        {
          label: 'Show Bookmarks',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:bookmarks')
        },
      ]
    },

    // Tools
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Downloads',
          accelerator: 'CmdOrCtrl+J',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:downloads')
        },
        {
          label: 'Extensions',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:extensions')
        },
        {
          label: 'Password Manager',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:passwords')
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:settings')
        },
      ]
    },

    // Help
    {
      label: 'Help',
      submenu: [
        {
          label: 'RihadX Browser Help',
          click: () => shell.openExternal('https://rihadx.com/help')
        },
        {
          label: 'Privacy Policy',
          click: () => shell.openExternal('https://rihadx.com/privacy')
        },
        { type: 'separator' },
        {
          label: `Version ${app.getVersion()}`,
          enabled: false,
        },
        {
          label: 'Check for Updates',
          click: () => wm.getFocusedWindow()?.webContents.send('menu:check-update')
        },
      ]
    },
  ]

  return Menu.buildFromTemplate(template)
}
