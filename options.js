async function restore() {
  applySettingsToForm(await loadSettings());
}

async function save() {
  await saveSettings(readSettingsFromForm());
  showTemporaryStatus(document.getElementById("status"), "Saved.");
}

async function reset() {
  applySettingsToForm(await resetSettings());
  showTemporaryStatus(document.getElementById("status"), "Reset to defaults.");
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("reset").addEventListener("click", reset);
restore().catch(console.error);
