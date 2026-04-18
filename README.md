# LUH SSO Auto Login

Firefox extension for Leibniz University Hannover that:

- opens the LUH WebSSO flow from the Stud.IP login page
- autofills LUH-ID and WebSSO password on the SSO page
- optionally submits the SSO form automatically

## Features

- toolbar popup for quick setup
- full settings page
- starts from `https://studip.uni-hannover.de/dispatch.php/login#/`
- extension and page branding assets included
- reset button for clearing saved settings

## Security Note

This extension stores the LUH-ID and WebSSO password in Firefox extension local storage on your machine.

- It is not encrypted by this extension.
- Only install and use it on a machine and Firefox profile you trust.

## Installation In Firefox

This project is currently intended for local loading in Firefox.

1. Download or clone this repository.
2. Open Firefox.
3. Go to `about:debugging#/runtime/this-firefox`.
4. Click `Load Temporary Add-on...`.
5. Select the `manifest.json` file from this project.
6. Click the extension icon in the Firefox toolbar.
7. Enter your LUH-ID and WebSSO password, then click `Save`.

## Usage

1. Open `https://studip.uni-hannover.de/dispatch.php/login#/`
2. The extension redirects to the LUH Shibboleth login flow.
3. It fills your credentials on the SSO page.
4. If `Auto-submit login form` is enabled, it submits the SSO form once automatically.

## Settings

- `Enable auto-fill`: turns the extension logic on or off
- `Auto-submit login form`: submits the SSO form automatically after filling credentials
- `Reset`: clears saved credentials and restores default settings

Default settings:

- `Enable auto-fill`: enabled
- `Auto-submit login form`: enabled

## Files

- `manifest.json`: Firefox extension manifest
- `content.js`: Stud.IP redirect and SSO autofill logic
- `popup.html` / `popup.js`: toolbar popup UI
- `options.html` / `options.js`: full settings page
- `settings.js`: shared settings helpers

## Limitations

- Currently targeted to LUH Stud.IP and LUH WebSSO only
- Depends on the current Stud.IP / Shibboleth page structure and URL flow
- Best tested in Firefox
