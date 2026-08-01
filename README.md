# Standard Group Website

A premium, milky-white showcase site for Standard Group, built so you can add
products by editing one file — no coding required for day-to-day updates.

## Files, at a glance

```
index.html                  → Homepage
products.html                → Full catalog with filters
product.html                  → Product page template (used for every product)
assets/css/style.css          → All the design/styling
assets/js/main.js             → Makes the filters and product pages work
assets/data/products.json     → EVERY PRODUCT LIVES HERE — edit this to add/remove products
assets/images/logo/logo.svg   → Your logo (replace this file with your real logo)
```

## 1. See it on your own computer (before publishing)

You can't just double-click `index.html` — the product data won't load,
because browsers block that for security. Instead:

1. Open the `standard-group` folder in VS Code.
2. Install the free VS Code extension called **"Live Server"** (Extensions
   icon on the left sidebar → search "Live Server" → Install).
3. Right-click `index.html` in the file list → **"Open with Live Server"**.
4. Your browser opens the site automatically, and it updates every time you save a file.

## 2. Add your real logo

Replace the file at `assets/images/logo/logo.svg` with your actual logo file.

- If your logo is a `.png` or `.jpg`, that's fine — just:
  1. Put the file in `assets/images/logo/` (e.g. `assets/images/logo/logo.png`)
  2. In `index.html`, `products.html`, and `product.html`, find every place
     that says `assets/images/logo/logo.svg` (there are 2 per file — one for
     the icon in the browser tab, one for the logo in the header) and change
     it to `assets/images/logo/logo.png`.
  3. Easiest way: in VS Code, press `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac),
     search for `logo.svg`, and replace all with `logo.png`.

## 3. Add or edit a product (the main thing you'll do)

Open `assets/data/products.json`. It's a list of products — each one looks like this:

```json
{
  "id": "md-01",
  "name": "Heavyweight Straight Denim",
  "department": "Men",
  "category": "Men's Denim",
  "images": [
    "assets/images/products/md-01-a.jpg",
    "assets/images/products/md-01-b.jpg",
    "assets/images/products/md-01-c.jpg"
  ],
  "video": "",
  "buyer": "Own Development",
  "fit": "Regular",
  "fabric": "99% Cotton, 1% Elastane, 12.5oz",
  "colors": [
    { "name": "Indigo Rinse", "hex": "#3A4A7A" },
    { "name": "Raw Black", "hex": "#1C1C1E" }
  ],
  "wash": "Enzyme Wash + PP Spray",
  "season": "Autumn 27",
  "sizeRange": "28 – 40",
  "details": "A couple of sentences about the product.",
  "designer": "Waliullah Shipon"
}
```

**To add a new product:** copy one whole block (from `{` to `}`), paste it
right after another block, add a comma between them, and change the values.

**Rules that matter:**
- `id` must be unique for every product (e.g. `md-02`, `md-03`...) — this is
  what makes the product's individual page link work.
- `department` must be exactly `Men`, `Women`, or `Kids` for the main
  lines — or `Development` for buyer-specific presentation pieces (see
  below). These four drive the homepage sections.
- `category` is the sub-line, e.g. `Men's Denim`, `Men's Shorts`,
  `Women's Outerwear`. Add a brand-new category any time just by typing a new
  name here — it will automatically appear on the homepage and in the filters.

### Adding a "Development for [Brand]" section

To pitch a buyer-specific collection (e.g. for Zara, Walmart, GANNI), add a
product with:

```json
"department": "Development",
"category": "Development for Walmart",
```

That's it. The homepage will automatically show a new section titled
**"Development for the Presentation"**, with a card for
**"Development for Walmart"**. Add another product with
`"category": "Development for Zara"` and a second card appears next to it.

Remove all products under a given category and its card disappears on its
own — no HTML/JS editing needed either way.
- `images` is a list — add as many as you want, first one is the main photo.
- `video` — paste a link to an `.mp4` file, or leave it as `""` (empty) if there's no video.
- `colors` — leave this as `"colors": []` if the product has no color options.

**Image zoom:** on the product page, hovering over the main photo shows a
magnifying lens (desktop), and clicking it opens a full-screen view where you
can zoom in further (scroll wheel, +/− buttons, or pinch on mobile) and drag
to pan around — no setup needed, this works automatically for every product.

**Product video:** it always shows next to the images, in its own
"Product video" section under the photo thumbnails. You can use either:
- A **YouTube link** — just paste the normal link, e.g.
  `"video": "https://www.youtube.com/watch?v=cENEzJKmUvc"`
  (do **not** paste the `<iframe>` embed code — just the plain link)
- A **direct `.mp4` file link** — e.g.
  `"video": "https://yoursite.com/videos/product-01.mp4"`

Leave it as `"video": ""` for products with no video.

**Uploading real photos:** drop your image files into
`assets/images/products/`, then reference them in the JSON like
`"assets/images/products/your-filename.jpg"`.

Right now the sample products use placeholder stock photos from
picsum.photos just so the site isn't empty — swap every image path for your
real product photography before you launch.

## 4. Publish it (with GitHub Desktop, which you already have)

1. Copy this whole `standard-group` folder into your GitHub repository folder
   on your computer (the one GitHub Desktop is tracking).
2. Open GitHub Desktop — it will show all the new files.
3. Write a summary like "Add website files" and click **Commit to main**.
4. Click **Push origin** (top right).
5. On GitHub.com, open your repository → **Settings** → **Pages** (left
   sidebar) → under "Build and deployment", set **Source** to
   **Deploy from a branch**, branch **main**, folder **/ (root)** → **Save**.
6. GitHub gives you a live web address (something like
   `https://yourusername.github.io/your-repo-name/`) — that's your live site,
   usually ready in 1–2 minutes.

Every time you push new changes with GitHub Desktop, the live site updates
automatically within a minute or two.

## 5. Things you'll likely want to personalize

- `hello@standardgroup.example` — replace with your real email, in
  `index.html`, `products.html`, and `product.html` (search for it).
- "Dhaka, Bangladesh" in the footer — replace with your real address if you want one listed.
- The homepage headline and About section copy in `index.html` — written to
  be a strong starting point, but make it sound like you.

## If something looks broken

- Blank product grid → check `assets/data/products.json` for a typo (a
  missing comma or bracket is the usual cause). Paste the file into
  [jsonlint.com](https://jsonlint.com) to find the exact error.
- Logo not showing → double check the filename in the `src="..."` matches
  the actual file name exactly, including capital letters.
