# NextT-Blogs

Research posts from [NextTransformer](https://github.com/Interactive-Active-AI/NextTransformer), published with GitHub
Pages at <https://interactive-active-ai.github.io/NextT-Blogs/>.

| Post | English | Chinese |
| --- | --- | --- |
| How Opus Found AttnRes-Canon: The Discovery Trace of an Architecture Search (Arena v1, November 2026) | [`attnres-canon/`](attnres-canon/) | [`attnres-canon/zh/`](attnres-canon/zh/) |

## Layout

- `index.html` is the list of posts. It wears the same look as the posts and borrows the stylesheet and brand
  assets of `attnres-canon/`.
- Each post is a self-contained static folder (`<post>/index.html`, `<post>/zh/index.html`, its own CSS, scripts and
  data) that uses relative links only, so it works under any URL prefix and when opened from disk.
- There is no build step: Pages serves the `main` branch as is (`.nojekyll` turns Jekyll off).

## Preview locally

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080/>.

## Adding a post

1. Put the post in a new folder named after it, with the English page (the default) at `index.html` and the Chinese
   page at `zh/index.html`.
2. Add a card to `index.html` and a row to the table above.
