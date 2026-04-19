# Teresie.Photo

Web pro fotografku **Terezii Flaškovou** — svatební, párová a portrétní fotografie.

Postaveno na **Next.js 16 + Tailwind CSS 4** s plnou jazykovou podporou **CZ / EN**.

## Co web obsahuje

- **Hero** s velkou fotkou a CTA tlačítky
- **O mně** — příběh, statistiky, citace
- **Ceník** — 4 svatební balíčky (Bronze / Silver / Gold / Platinum) + portréty / páry / rodina
- **Portfolio** — galerie s filtrem podle kategorie (vše / svatby / páry / portréty / rodina)
- **Kontakt** — formulář (otevírá `mailto:` s předvyplněnými údaji) + Instagram + Facebook
- **Plně responzivní**, smooth scroll, mobilní hamburger menu
- **Jazykový přepínač CZ/EN** v navigaci (uloženo do `localStorage`)

## Spuštění lokálně

```bash
npm install
npm run dev
```

Otevři http://localhost:3000

## Build

```bash
npm run build   # production build (testuje TypeScript + generuje statické stránky)
npm start       # spustí production server
```

## Editace obsahu

Veškerý text (CZ + EN) je na jednom místě:

```
app/i18n/translations.ts
```

Stačí editovat řetězce — obě jazykové verze vedle sebe.

### Výměna obrázků

Aktuálně se používají **placeholdery z Unsplash** (svatební a portrétní fotografie zdarma k použití).
Pro nahrazení Tereziných fotek:

1. Hero: `app/components/Hero.tsx` — řádek se `<Image src=…>`
2. About fotka: `app/components/About.tsx`
3. Portfolio galerie: pole `items` v `app/components/Portfolio.tsx`

Doporučení: nahraj fotky do `public/photos/` a odkazuj se na ně přes `/photos/nazev.jpg`.

## Deploy na Vercel

```bash
# jednorázově
npm i -g vercel
vercel login
vercel              # preview deploy
vercel --prod       # production deploy
```

Nebo přes GitHub:

1. Push repo do `github.com/webzitra/teresie-photo`
2. V Vercel dashboardu **Add New → Project → Import** z GitHubu
3. Default Next.js nastavení → Deploy
4. (volitelně) připojit doménu `teresiephoto.cz` v `Settings → Domains`

## Tech stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS 4
- TypeScript 5
- Fonty: **Cormorant Garamond** (nadpisy) + **Inter** (text), oboje přes `next/font`

## Struktura

```
app/
├── components/        # Nav, Hero, About, Services, Portfolio, Contact, Footer
├── i18n/
│   ├── LanguageProvider.tsx   # React Context pro jazyk
│   └── translations.ts        # všechny texty CZ/EN
├── globals.css        # design tokeny + utility třídy
├── layout.tsx         # root layout, fonty, meta
└── page.tsx           # skládá sekce dohromady
```

---

Vytvořeno [WebZítra](https://webzitra.cz).
