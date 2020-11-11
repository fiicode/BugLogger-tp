const path = require('path')
const url = require('url')
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
// const { autoUpdater } = require("electron-updater");
const { autoUpdater } = require('electron-updater')

const connectDB = require('./config/db')
const Log = require('./models/Logs')

connectDB()

// require('v8-compile-cache');
// // for nodemon
// process.env.IS_DEV ? require('electron-reload') : null;
// // disable security warning
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
// Application already running, so we close now
// if (!app.requestSingleInstanceLock()) {
// 	app.quit()
// }

let mainWindow

let isDev = false
const isMac = process.plateform === 'darwin' ? true : false

if (
	process.env.NODE_ENV !== undefined &&
	process.env.NODE_ENV === 'development'
) {
	isDev = true
}

function createMainWindow() {

	// check for uppdate
	// autoUpdater.checkForUpdatesAndNotify();
	// autoUpdater.on('update-downloaded', (e) => {
		console.log('================')
		console.log(autoUpdater.quitAndInstall())
		console.log('================')
	// })

	mainWindow = new BrowserWindow({
		width: isDev ? 1400 : 1100,
		height: 800,
		show: false,
		backgroundColor: 'white',
		icon: `${__dirname}/assets/icon.png`,
		webPreferences: {
			nodeIntegration: true,
		},
	})

	let indexPath

	if (isDev && process.argv.indexOf('--noDevServer') === -1) {
		indexPath = url.format({
			protocol: 'http:',
			host: 'localhost:8080',
			pathname: 'index.html',
			slashes: true,
		})
	} else {
		indexPath = url.format({
			protocol: 'file:',
			pathname: path.join(__dirname, 'dist', 'index.html'),
			slashes: true,
		})
	}

	mainWindow.loadURL(indexPath)

	// Don't show until we are ready and loaded
	mainWindow.once('ready-to-show', () => {
		mainWindow.show()

		// Open devtools if dev
		if (isDev) {
			const {
				default: installExtension,
				REACT_DEVELOPER_TOOLS,
			} = require('electron-devtools-installer')

			installExtension(REACT_DEVELOPER_TOOLS)
				.then((name) => console.log(`Added Extension: ${name}`))
				.catch((err) => console.log('Error loading React DevTools: ', err)
			)

			mainWindow.webContents.openDevTools()
		}
	})

	mainWindow.on('closed', () => (mainWindow = null))
}

app.on('ready', () => {
	createMainWindow()
	const mainMenu = Menu.buildFromTemplate(menu)
	Menu.setApplicationMenu(mainMenu)
})

const menu = [
	...(isMac ? [{ role: 'appMenu'}] : []),
	{
		role: 'fileMenu'
	},
	{
		role: 'editMenu'
	},
	{
		label: 'Logs',
		submenu: [
			{
				label: 'Clear Logs',
				click: () => clearLogs()
			}
		]
	},
	...(isDev ? [
		{
			label: 'Developer',
			submenu: [
				{ role: 'reload' },
				{ role: 'forcereload' },
				{ role: 'separator' },
				{ role: 'toggledevtools' }
			]
		}
	] : [])
]

ipcMain.on('logs:load', sendLogs)

// Create log
ipcMain.on('logs:add', async (e, item) => {
	try {
		await Log.create(item)
	} catch (err) {
		console.log(err)
	}
})
// Delete Log
ipcMain.on('logs:delete', async (e, id) => {
	try {
		await Log.findOneAndDelete({_id: id})
		sendLogs()
	} catch (err) {
		console.log(err)
	}
})

async function sendLogs () {
	try {
		const logs = await Log.find().sort({created: 1})
		mainWindow.webContents.send('logs:get', JSON.stringify(logs))
	} catch (err) {
		console.log(err)
	}
}

async function clearLogs() {
	try {
		await Log.deleteMany({})
		mainWindow.webContents.send('logs:clear')
	} catch (err) {
		console.log(err)
	}
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createMainWindow()
	}
})

// Stop error
app.allowRendererProcessReuse = true
