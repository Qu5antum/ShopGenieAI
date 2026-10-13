# ShopGenie AI

ShopGenie AI is a demo storefront with a product catalog and an AI Studio for
creating advertising concepts, images, and videos. The interface is built with
React and TypeScript and bundled with Vite. The catalog is a static TypeScript
array.

## Features

- Homepage with product search, category filters, and a demo catalog.
- Product pages with descriptions, features, prices, favorites, and a demo cart.
- AI Studio modes: `Image → Video`, `Text → Video`, `Text → Image`, and
  `Image → Image`.
- Advertising style selection and product photo uploads for image-based modes.
- A Manus AI agent that uses the selected product and campaign goal to generate
  an advertising concept, target audience, ad copy, three image prompts, and one
  video prompt.
- Send prompts from the Manus results to the corresponding fal.ai generator.
- Generation status display and a preview of the generated result.

## Technology

- React 19, TypeScript 6, Vite 8.
- fal.ai Queue API for image and video generation.
- Manus API v2 for advertising concepts and prompts.
- Firebase Hosting for static site deployment only.

The project does not use the Firebase SDK, Firestore, Firebase Storage,
authentication, a database, or Firebase Functions. The cart, favorites,
campaign goal, and results are held only in React state and reset when the page
is reloaded. The catalog contains demo products and illustrative prices.

## Requirements

- Node.js compatible with the installed Vite version (the current Node.js LTS
  release is recommended).
- npm.
- Manus and fal.ai API keys for local generation.
- Firebase CLI and access to the Firebase project for deployment.

## Run locally

Open a terminal in the project root and install dependencies:

```powershell
npm install
```

Create a `.env` file in the project root and add the server-side API keys:

```dotenv
MANUS_API_KEY=your-manus-api-key
FAL_AI_API_KEY=your-fal-api-key
```

Do not put these keys in `VITE_*` variables, source files, or Git. `.env` is
listed in `.gitignore`. Restart Vite after creating or changing the file:

```powershell
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`). The local API
routes intentionally accept requests only from localhost.

To preview the interface without a running development server, build the
project and start Vite preview:

```powershell
npm run build
npm run preview
```

`npm run preview` serves the static build; the local Manus and fal.ai API routes
are not available through it.

## Using AI Studio

1. Open **AI Studio** and select a demo product.
2. Enter a campaign goal and click **Create campaign**.
3. Click **Regenerate campaign** to create another version.
4. Click **Generate Image** or **Generate Video** next to the prompt you want.
5. For standard generation, select a format, enter a prompt and style, then
   click **Create image** or **Create video**.
6. In `Image → Video` and `Image → Image` modes, use the catalog product photo
   or upload another image.

Uploaded images must be JPG, PNG, or WebP, no larger than 10 MB and at least
256 × 256 pixels. For image and video generation, an uploaded file is sent to
fal.ai through the local API. The app does not upload project files to Firebase
or another storage service.

The Manus agent uses the product image from its existing public URL. The server
allows only `images.unsplash.com` for this purpose; user-uploaded images are not
sent to the Manus agent.

Third-party providers may charge for generations according to their pricing and
the selected model. Do not start live generations if you do not agree to the
potential charges. The app does not save campaign results; fal.ai provides the
generated media URLs.

## Routes

The app uses hash-based navigation:

- `#/` — homepage and catalog.
- `#/product/1` — product page (the ID depends on the demo catalog).
- `#/studio` — AI Studio.
- `#/studio?product=1` — AI Studio with a product preselected.

## Local APIs and security

The Vite development plugin in `server/localAiApi.ts` provides these routes
only while running the local development server:

- `POST /api/local/manus/concept` — creates a private Manus task and waits for
  its structured result.
- `POST /api/local/fal/generations` — submits a task to the fal.ai queue.
- `POST /api/local/fal/generations/poll` — checks the task status and retrieves
  its result.

Keys are read from `.env` by the Vite configuration and must not be passed to
client-side code. However, this is **not a production backend**: the routes are
restricted to localhost, are not intended for public access, and are not
included in the built site. Do not expose the development server to the public
internet or try to enable these routes by publishing `.env`.

If a key has ever appeared in source code, Git, a screenshot, a log, or a
message, treat it as compromised: revoke it in the provider's dashboard and
create a replacement.

## Build, checks, and Firebase Hosting deployment

Type-check and build the production frontend:

```powershell
npm run build
```

Run ESLint:

```powershell
npm run lint
```

Firebase Hosting is configured in `firebase.json` to publish the `dist`
directory. Build the site and sign in to Firebase:

```powershell
npm run build
npm install -g firebase-tools
firebase login
```

The `.firebaserc` file configures the `manus` alias for the
`manus-hackathon` project. If Firebase CLI recognizes this alias, deploy with:

```powershell
firebase deploy --only hosting --project manus-hackathon
```

Alternatively, link the Firebase CLI to an existing project first:

```powershell
firebase use --add
```

Then deploy Hosting only:

```powershell
firebase deploy --only hosting
```

Deployment publishes the contents of `dist`. It does **not** deploy
`server/localAiApi.ts`, configure Manus/fal.ai environment variables, or enable
generation on the hosted site. Static Firebase Hosting can generally be used
without Firebase Functions, but check the Firebase Console for your project's
billing requirements and feature availability. To enable generation for users
of the deployed site, you will need a separate backend with server-side secret
storage, abuse protection, and spending limits.

## Project structure

```text
.
├── server/
│   └── localAiApi.ts        # Local Vite API routes for Manus and fal.ai
├── src/
│   ├── components/          # Navigation, product cards, and video player
│   ├── data/products.ts     # Demo catalog and categories
│   ├── pages/               # Home, product, and AI Studio pages
│   ├── services/            # Client calls to the local API
│   ├── types/product.ts     # Product type
│   ├── App.tsx              # Hash routing and interface state
│   └── main.tsx             # React entry point
├── public/                  # Static public assets
├── firebase.json            # Firebase Hosting: publish dist
├── vite.config.ts           # Vite and local server plugin
└── package.json             # Scripts and dependencies
```

## npm scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Vite server with Manus/fal.ai API routes |
| `npm run build` | Type-check and build the site into `dist` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the static production build locally |
