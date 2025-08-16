# Astro with Tailwind

```sh
npm create astro@latest -- --template with-tailwindcss
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/with-tailwindcss)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/with-tailwindcss)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/with-tailwindcss/devcontainer.json)

Astro comes with [Tailwind](https://tailwindcss.com) support out of the box. This example showcases how to style your Astro project with Tailwind.

For complete setup instructions, please see our [Tailwind Integration Guide](https://docs.astro.build/en/guides/integrations-guide/tailwind).

## Deploy to Cloudflare Workers

This project is configured for Cloudflare Workers using `@astrojs/cloudflare`.

- **Local dev:** `npm run dev` (uses Astro dev with Cloudflare platform proxy)
- **Build:** `npm run build` (emits `dist/_worker.js`)
- **Deploy (Workers):** `npm run cf:deploy`
- **Deploy (Pages static):** `npm run cf:pages:deploy`

Config files:

- `astro.config.mjs` uses `adapter: cloudflare()` and `output: 'server'`.
- `wrangler.toml` sets `main = "./dist/_worker.js"`.

Bindings (examples) in `wrangler.toml`:

```toml
# [vars]
# MY_VAR = "value"

# [[kv_namespaces]]
# binding = "SESSION"
# id = "<KV_NAMESPACE_ID>"

# [[d1_databases]]
# binding = "DB"
# database_name = "cygnus-db"
# database_id = "<uuid>"
```

First-time deploy notes:

- Install tooling: `npm i -D @astrojs/cloudflare wrangler`
- Auth: `npx wrangler login`
- Then: `npm run cf:deploy`
