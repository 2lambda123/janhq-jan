/**
 * @file This file exports a class that implements the InferenceExtension interface from the @janhq/core package.
 * The class provides methods for initializing and stopping a model, and for making inference requests.
 * It also subscribes to events emitted by the @janhq/core package and handles new message requests.
 * @version 1.0.0
 * @module inference-mistral-extension/src/index
 */

import { RemoteOAIEngine } from '@janhq/core'

declare const SETTINGS: Array<any>
declare const MODELS: Array<any>

enum Settings {
  apiKey = 'nvidia-api-key',
  chatCompletionsEndPoint = 'chat-completions-endpoint',
}
/**
 * A class that implements the InferenceExtension interface from the @janhq/core package.
 * The class provides methods for initializing and stopping a model, and for making inference requests.
 * It also subscribes to events emitted by the @janhq/core package and handles new message requests.
 */
export default class JanInferenceNVIDIAExtension extends RemoteOAIEngine {
  inferenceUrl: string = ''
  provider: string = 'nvidia'

  // How to add these
  // --header 'accept: application/json' \
  // --header 'authorization: Bearer api_key' \
  // --header 'content-type: application/json' \
  // assume paramter is data

  override async onLoad(): Promise<void> {
    super.onLoad()

    // Register Settings
    this.registerSettings(SETTINGS)
    this.registerModels(MODELS)

    // Asks for API key
    this.apiKey = await this.getSetting<string>(Settings.apiKey, '')
    // adds bearer before api key
    let authorization = `Bearer ${this.apiKey}`
    this.inferenceUrl = await this.getSetting<string>(
      Settings.chatCompletionsEndPoint,
      ''
    )

    if (this.inferenceUrl.length === 0) {
      SETTINGS.forEach((setting) => {
        if (setting.key === Settings.chatCompletionsEndPoint) {
          this.inferenceUrl = setting.controllerProps.value as string
        }
      })
    }
  }

  onSettingUpdate<T>(key: string, value: T): void {
    if (key === Settings.apiKey) {
      this.apiKey = value as string
    } else if (key === Settings.chatCompletionsEndPoint) {
      if (typeof value !== 'string') return

      if (value.trim().length === 0) {
        SETTINGS.forEach((setting) => {
          if (setting.key === Settings.chatCompletionsEndPoint) {
            this.inferenceUrl = setting.controllerProps.value as string
          }
        })
      } else {
        this.inferenceUrl = value
      }
    }
  }
}
