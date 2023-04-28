# Next.js Template

This is a semi-opinionated template for Next.js applications using the [new app
router](https://beta.nextjs.org/docs/routing/fundamentals#the-app-directory).
The goal of this template is to have an opionated setup with common tools, but
with as little cruft to remove as possible when starting a new project.

## Features:

- TypeScript
- TailwindCSS
- ESLint
- Prettier
- Linting via GitHub Actions

## Development:

```shell
$ gh repo create -p jclem/template-nextjs my-next-app
$ cd my-next-app
$ npm i
$ code .
$ npm run dev
```

To get started, just start hacking on [src/app/page.tsx](/src/app/page.tsx).

This template is MIT-licensed, but you may want to remove or modify the license
field from [package.json](/package.json) and the [LICENSE.md](/LICENSE.md) file.
