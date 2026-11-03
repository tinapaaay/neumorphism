# Neumorphic Sign Up

An interactive form presentation. Password visibility toggles work; submit and social buttons display toast feedback. There is no user database, real registration, OAuth, or saved account.

## Run locally

From this folder, run `python3 -m http.server 5500` and open [localhost:5500](http://localhost:5500). No build or package installation is required. Alternatively, serve the repository root and navigate to this folder.

## Edit

Markup, styles, and scripts are in `index.html`. Tailwind and Inter load from external services.

## Manual checks

Use dummy input, toggle password visibility, submit, and try social buttons. Confirm feedback appears without account creation.

These are suggested checks, not a record of completed browser QA. Use a separate origin/browser profile for destructive storage checks.

## Deploy

Serve this folder and its assets as static files, preserving relative paths. Check external resources and the controls on the actual deployed URL.
