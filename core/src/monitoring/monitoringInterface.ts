import { BaseExtension } from '../common'

/**
 * Monitoring extension for system monitoring.
 * @extends BaseExtension
 */
export interface MonitoringExtension extends BaseExtension {
  /**
   * Returns information about the system resources.
   * @returns {Promise<any>} A promise that resolves with the system resources information.
   */
  getResourcesInfo(): Promise<any>

  /**
   * Returns the current system load.
   * @returns {Promise<any>} A promise that resolves with the current system load.
   */
  getCurrentLoad(): Promise<any>
}
