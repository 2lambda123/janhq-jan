import { FileStat } from './types'

/**
 * Writes data to a file at the specified path.
 * @returns {Promise<any>} A Promise that resolves when the file is written successfully.
 */
const writeFileSync = (...args: any[]) => globalThis.core.api?.writeFileSync(...args)

/**
 * Writes blob data to a file at the specified path.
 * @param path - The path to file.
 * @param data - The blob data.
 * @returns
 */
const writeBlob: (path: string, data: string) => Promise<any> = (path, data) =>
  globalThis.core.api?.writeBlob(path, data)

/**
 * Reads the contents of a file at the specified path.
 * @returns {Promise<any>} A Promise that resolves with the contents of the file.
 */
const readFileSync = (...args: any[]) => globalThis.core.api?.readFileSync(...args)
/**
 * Check whether the file exists
 * @param {string} path
 * @returns {boolean} A boolean indicating whether the path is a file.
 */
const existsSync = (...args: any[]) => globalThis.core.api?.existsSync(...args)
/**
 * List the directory files
 * @returns {Promise<any>} A Promise that resolves with the contents of the directory.
 */
const readdirSync = (...args: any[]) => globalThis.core.api?.readdirSync(...args)
/**
 * Creates a directory at the specified path.
 * @returns {Promise<any>} A Promise that resolves when the directory is created successfully.
 */
const mkdirSync = (...args: any[]) => globalThis.core.api?.mkdirSync(...args)

const mkdir = (...args: any[]) => globalThis.core.api?.mkdir(...args)

/**
 * Removes a directory at the specified path.
 * @returns {Promise<any>} A Promise that resolves when the directory is removed successfully.
 */
const rm = (...args: any[]) => globalThis.core.api?.rm(...args, { recursive: true, force: true })

/**
 * Deletes a file from the local file system.
 * @param {string} path - The path of the file to delete.
 * @returns {Promise<any>} A Promise that resolves when the file is deleted.
 */
const unlinkSync = (...args: any[]) => globalThis.core.api?.unlinkSync(...args)

/**
 * Appends data to a file at the specified path.
 */
const appendFileSync = (...args: any[]) => globalThis.core.api?.appendFileSync(...args)

/**
 * Synchronizes a file from a source path to a destination path.
 * @param {string} src - The source path of the file to be synchronized.
 * @param {string} dest - The destination path where the file will be synchronized to.
 * @returns {Promise<any>} - A promise that resolves when the file has been successfully synchronized.
 */
const syncFile: (src: string, dest: string) => Promise<any> = (src, dest) =>
  globalThis.core.api?.syncFile(src, dest)

/**
 * Copy file sync.
 */
const copyFileSync = (...args: any[]) => globalThis.core.api?.copyFileSync(...args)

const copyFile: (src: string, dest: string) => Promise<void> = (src, dest) =>
  globalThis.core.api?.copyFile(src, dest)

/**
 * Gets the file's stats.
 *
 * @param path - The path to the file.
 * @param outsideJanDataFolder - Whether the file is outside the Jan data folder.
 * @returns {Promise<FileStat>} - A promise that resolves with the file's stats.
 */
const fileStat: (path: string, outsideJanDataFolder?: boolean) => Promise<FileStat | undefined> = (
  path,
  outsideJanDataFolder
) => globalThis.core.api?.fileStat(path, outsideJanDataFolder)

// TODO: Export `dummy` fs functions automatically
// Currently adding these manually
export const fs = {
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  mkdir,
  rm,
  unlinkSync,
  appendFileSync,
  copyFileSync,
  copyFile,
  syncFile,
  fileStat,
  writeBlob,
}
