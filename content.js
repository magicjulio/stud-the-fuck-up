const ext = globalThis.browser ?? globalThis.chrome;
const STUDIP_SHIB_LOGIN_URL =
  "https://studip.uni-hannover.de/Shibboleth.sso/Login?target=https%3A%2F%2Fstudip.uni-hannover.de%2Fdispatch.php%2Flogin%3Fsso%3Dshib%26again%3Dyes%26cancel_login%3D1&entityID=https%3A%2F%2Fsso.idm.uni-hannover.de%2Fidp%2Fshibboleth";
const STUDIP_LOGIN_BUTTON_SELECTOR =
  'a[href*="Shibboleth.sso/Login"][href*="entityID=https%3A%2F%2Fsso.idm.uni-hannover.de%2Fidp%2Fshibboleth"], a[href*="Shibboleth.sso/Login"][href*="entityID=https://sso.idm.uni-hannover.de/idp/shibboleth"]';
const SSO_INPUT_SELECTOR = 'input[name="j_username"], #username, input[name="j_password"], input[type="password"]';
const REDIRECT_FLAG = "luh-auto-login-studip-redirected";
const AUTO_SUBMIT_FLAG = "luh-auto-login-sso-auto-submitted";
const REDIRECT_TTL_MS = 15000;
const AUTO_SUBMIT_DELAY_MS = 250;
let hasRun = false;

function waitForElement(selector, timeout = 8000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function log(message) {
  console.log(`LUH extension: ${message}`);
}

function setInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function findLoginControls(root = document) {
  const userInput =
    root.querySelector('input[name="j_username"]') ||
    root.getElementById("username");
  const passInput =
    root.querySelector('input[name="j_password"]') ||
    root.querySelector('input[type="password"]');
  const form = userInput?.form || passInput?.form || root.querySelector("form");

  return {
    userInput,
    passInput,
    form,
    doNotCache:
      form?.querySelector('input[name="donotcache"]') ||
      root.getElementById("donotcache"),
    submitButton:
      form?.querySelector('button[name="_eventId_proceed"]') ||
      form?.querySelector('button[type="submit"]') ||
      form?.querySelector('input[type="submit"]')
  };
}

function getRecentRedirectFlag() {
  try {
    const raw = sessionStorage.getItem(REDIRECT_FLAG);
    if (!raw) return 0;

    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return 0;
    return timestamp;
  } catch {
    return 0;
  }
}

function markRedirectedNow() {
  try {
    sessionStorage.setItem(REDIRECT_FLAG, String(Date.now()));
  } catch {
    // Ignore sessionStorage access failures.
  }
}

function clearRedirectFlag() {
  try {
    sessionStorage.removeItem(REDIRECT_FLAG);
  } catch {
    // Ignore sessionStorage access failures.
  }
}

function hasAutoSubmitted() {
  try {
    return sessionStorage.getItem(AUTO_SUBMIT_FLAG) === "1";
  } catch {
    return false;
  }
}

function markAutoSubmitted() {
  try {
    sessionStorage.setItem(AUTO_SUBMIT_FLAG, "1");
  } catch {
    // Ignore sessionStorage access failures.
  }
}

function clearAutoSubmitFlag() {
  try {
    sessionStorage.removeItem(AUTO_SUBMIT_FLAG);
  } catch {
    // Ignore sessionStorage access failures.
  }
}

function shouldSkipRedirect() {
  const lastRedirect = getRecentRedirectFlag();
  return lastRedirect > 0 && Date.now() - lastRedirect < REDIRECT_TTL_MS;
}

function redirectFromStudipLogin() {
  const loginButton = document.querySelector(STUDIP_LOGIN_BUTTON_SELECTOR);
  const targetUrl = loginButton?.href || STUDIP_SHIB_LOGIN_URL;

  clearAutoSubmitFlag();
  markRedirectedNow();
  location.assign(targetUrl);
}

async function handleStudipLoginPage() {
  if (!location.pathname.startsWith("/dispatch.php/login")) {
    log("skipped unsupported Stud.IP path");
    return true;
  }

  if (location.search.includes("sso=shib")) {
    log("waiting for Stud.IP to continue its Shibboleth redirect");
    return true;
  }

  if (shouldSkipRedirect()) {
    log("skipped repeat Stud.IP redirect to avoid a loop");
    return true;
  }

  const loginButton =
    document.querySelector(STUDIP_LOGIN_BUTTON_SELECTOR) ||
    (await waitForElement(STUDIP_LOGIN_BUTTON_SELECTOR, 2500));

  if (!loginButton && document.readyState !== "complete") {
    log("Stud.IP Shibboleth button not found before timeout, using fallback URL");
  }

  log("redirecting from Stud.IP login to Shibboleth");
  redirectFromStudipLogin();
  return true;
}

async function handleSsoLoginPage(settings) {
  if (!location.pathname.startsWith("/idp/profile/SAML2/Redirect/SSO")) {
    log("skipped unsupported SSO path");
    return;
  }

  clearRedirectFlag();

  let controls = findLoginControls();
  if (!controls.userInput || !controls.passInput) {
    await waitForElement(SSO_INPUT_SELECTOR, 8000);
    controls = findLoginControls();
  }

  const { userInput, passInput, doNotCache, submitButton, form } = controls;

  if (!userInput || !passInput) {
    log("skipped because login inputs were not found");
    return;
  }

  if (!userInput.value) {
    setInputValue(userInput, settings.username);
  }

  if (!passInput.value) {
    setInputValue(passInput, settings.password);
  }

  if (doNotCache?.checked) {
    doNotCache.checked = false;
    doNotCache.dispatchEvent(new Event("input", { bubbles: true }));
    doNotCache.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (settings.autoSubmit) {
    if (hasAutoSubmitted()) {
      log("skipped auto-submit because this tab already tried once");
      return;
    }

    markAutoSubmitted();
    setTimeout(() => {
      if (submitButton instanceof HTMLElement) {
        submitButton.click();
        return;
      }

      if (typeof form?.requestSubmit === "function") {
        form.requestSubmit();
      }
    }, AUTO_SUBMIT_DELAY_MS);
  }

  log("finished autofill");
}

async function main() {
  if (hasRun) {
    return;
  }

  if (
    location.hostname !== "studip.uni-hannover.de" &&
    !location.hostname.endsWith("sso.idm.uni-hannover.de")
  ) {
    return;
  }

  const { username, password, enabled, autoSubmit } =
    await ext.storage.local.get([
      "username",
      "password",
      "enabled",
      "autoSubmit"
    ]);

  if (!enabled || !username || !password) {
    log("skipped because credentials or enable flag are missing");
    return;
  }

  hasRun = true;

  if (location.hostname === "studip.uni-hannover.de") {
    await handleStudipLoginPage();
    return;
  }

  await handleSsoLoginPage({ username, password, autoSubmit });
}

function handleStorageChange(changes, areaName) {
  if (areaName !== "local") {
    return;
  }

  if (
    !changes.username &&
    !changes.password &&
    !changes.enabled &&
    !changes.autoSubmit
  ) {
    return;
  }

  clearAutoSubmitFlag();
  hasRun = false;
  main().catch(console.error);
}

ext.storage.onChanged.addListener(handleStorageChange);
main().catch(console.error);
