
/**
 * App Route APIs
 * @description Enum of all the routes exposed by the app
 */
export enum AppRoute {
  setNativeThemeLight = 'setNativeThemeLight',
  setNativeThemeDark = 'setNativeThemeDark',
  setNativeThemeSystem = 'setNativeThemeSystem',
  appDataPath = 'appDataPath',
  appVersion = 'appVersion',
  getResourcePath = 'getResourcePath',
  openExternalUrl = 'openExternalUrl',
  openAppDirectory = 'openAppDirectory',
  openFileExplore = 'openFileExplorer',
  relaunch = 'relaunch',
}

export enum AppEvent {
  onAppUpdateDownloadUpdate = 'onAppUpdateDownloadUpdate',
  onAppUpdateDownloadError = 'onAppUpdateDownloadError',
  onAppUpdateDownloadSuccess = 'onAppUpdateDownloadSuccess',
}

export enum DownloadRoute {
  abortDownload = 'abortDownload',
  downloadFile = 'downloadFile',
  pauseDownload = 'pauseDownload',
  resumeDownload = 'resumeDownload',
}

export enum DownloadEvent {
  onFileDownloadUpdate = 'onFileDownloadUpdate',
  onFileDownloadError = 'onFileDownloadError',
  onFileDownloadSuccess = 'onFileDownloadSuccess',
}

export enum ExtensionRoute {
  baseExtensions = 'baseExtensions',
  getActiveExtensions = 'getActiveExtensions',
  installExtension = 'installExtension',
  invokeExtensionFunc = 'invokeExtensionFunc',
  updateExtension = 'updateExtension',
  uninstallExtension = 'uninstallExtension',
}
export enum FileSystemRoute {
  appendFile = 'appendFile',
  copyFile = 'copyFile',
  deleteFile = 'deleteFile',
  exists = 'exists',
  getResourcePath = 'getResourcePath',
  getUserSpace = 'getUserSpace',
  isDirectory = 'isDirectory',
  listFiles = 'listFiles',
  mkdir = 'mkdir',
  readFile = 'readFile',
  readLineByLine = 'readLineByLine',
  rmdir = 'rmdir',
  writeFile = 'writeFile',
}

export enum ProcessRoute {
  spawn = 'spawn',
  sudoExec = 'sudoExec',
}

export type ApiFunction = (...args: any[]) => any

export type AppRouteFunctions = {
  [K in AppRoute]: ApiFunction
}

export type AppEventFunctions = {
  [K in AppEvent]: ApiFunction
}

export type DownloadRouteFunctions = {
  [K in DownloadRoute]: ApiFunction
}

export type DownloadEventFunctions = {
  [K in DownloadEvent]: ApiFunction
}

export type ExtensionRouteFunctions = {
  [K in ExtensionRoute]: ApiFunction
}

export type FileSystemRouteFunctions = {
  [K in FileSystemRoute]: ApiFunction
}

export type ProcessRouteFunctions = {
  [K in ProcessRoute]: ApiFunction
}

export type APIFunctions = AppRouteFunctions &
  AppEventFunctions &
  DownloadRouteFunctions &
  DownloadEventFunctions &
  ExtensionRouteFunctions &
  FileSystemRouteFunctions &
  ProcessRouteFunctions

export const APIRoutes = [
  ...Object.values(AppRoute),
  ...Object.values(DownloadRoute),
  ...Object.values(ExtensionRoute),
  ...Object.values(FileSystemRoute),
  ...Object.values(ProcessRoute),
]
export const APIEvents = [...Object.values(AppEvent), ...Object.values(DownloadEvent)]
