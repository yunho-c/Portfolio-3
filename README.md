# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Hero interactivity

The homepage's prolonged-hover image/video collage is disabled by default.
To enable it, add `interactive={true}` to the `<InteractiveHero>` component in
`src/routes/+page.svelte`. The existing activation and hover delays still apply.

When disabled, the hero skips collage image preloading, pointer tracking, and
the `V` grid shortcut. Changing `interactive` to `false` also clears active media
and pending transitions. The intro animation and the "distracted" text's hover
effect are independent of this option.

## Hero videos

YouTube and direct-video URLs stored in `static/collage/<CELL>.txt` can be
downloaded, optimized, and uploaded to Cloudflare R2 with the repo-local media
scripts. See [Hero video publishing](docs/hero-video-publishing.md) for setup and
usage.
