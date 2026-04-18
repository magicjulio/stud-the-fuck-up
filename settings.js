const ext = globalThis.browser ?? globalThis.chrome;

const STORAGE_KEYS = ["username", "password", "enabled", "autoSubmit"];
const DEFAULT_SETTINGS = {
  username: "",
  password: "",
  enabled: true,
  autoSubmit: true
};

async function loadSettings() {
  const stored = await ext.storage.local.get(STORAGE_KEYS);

  return {
    ...DEFAULT_SETTINGS,
    ...stored
  };
}

async function saveSettings(values) {
  await ext.storage.local.set({
    username: values.username.trim(),
    password: values.password,
    enabled: Boolean(values.enabled),
    autoSubmit: Boolean(values.autoSubmit)
  });
}

async function resetSettings() {
  await ext.storage.local.remove(STORAGE_KEYS);
  return loadSettings();
}

function applySettingsToForm(data, root = document) {
  root.getElementById("username").value = data.username || "";
  root.getElementById("password").value = data.password || "";
  root.getElementById("enabled").checked = Boolean(data.enabled);
  root.getElementById("autoSubmit").checked = Boolean(data.autoSubmit);
}

function readSettingsFromForm(root = document) {
  return {
    username: root.getElementById("username").value,
    password: root.getElementById("password").value,
    enabled: root.getElementById("enabled").checked,
    autoSubmit: root.getElementById("autoSubmit").checked
  };
}

function showTemporaryStatus(element, message, timeout = 1500) {
  element.textContent = message;

  setTimeout(() => {
    if (element.textContent === message) {
      element.textContent = "";
    }
  }, timeout);
}
