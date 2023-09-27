// Provide an async method to manipulate the price provided by the extension point
const PLUGIN_NAME = "mon-plugin";

const getResourcesInfo = () => {
  new Promise((resolve) => {
    if (window && window.electronAPI) {
      window.electronAPI
      .invokePluginFunc(PLUGIN_NAME, "getResourcesInfo")
      .then((res) => resolve(res));
    } else {
      resolve({});
    }
  })
}

const getCurrentLoad = () => {
  new Promise((resolve) => {
    if (window && window.electronAPI) {
      window.electronAPI
      .invokePluginFunc(PLUGIN_NAME, "getCurrentLoad")
      .then((res) => resolve(res));
    } else {
      resolve({});
    }
  })
}

// Register all the above functions and objects with the relevant extension points
export function init({ register }) {
  register("getResourcesInfo", "getResourcesInfo", getResourcesInfo);
  register("getCurrentLoad", "getCurrentLoad", getCurrentLoad);
}