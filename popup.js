async function restore() {
  applySettingsToForm(await loadSettings());
}

async function save() {
  await saveSettings(readSettingsFromForm());
  showTemporaryStatus(document.getElementById("status"), "Saved.");
}

async function openOptions(event) {
  event.preventDefault();

  if (typeof ext.runtime.openOptionsPage === "function") {
    await ext.runtime.openOptionsPage();
    window.close();
  }
}

document.getElementById("save").addEventListener("click", save);
document.getElementById("open-options").addEventListener("click", openOptions);

restore().catch(console.error);
