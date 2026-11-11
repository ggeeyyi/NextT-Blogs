# NextT-Blogs

Research posts from [NextTransformer](https://github.com/Interactive-Active-AI/NextTransformer), published with GitHub
Pages at <https://interactive-active-ai.github.io/NextT-Blogs/>.

| Post | Chinese | English |
| --- | --- | --- |
| How Opus Found AttnRes-Canon: The Discovery Trace of an Architecture Search (Arena v1, November 2026) | [`attnres-canon/`](attnres-canon/) | [`attnres-canon/en/`](attnres-canon/en/) |

## Layout

- `index.html` is the list of posts.
- Each post is a self-contained static folder (`<post>/index.html`, `<post>/en/index.html`, its own CSS, scripts and
  data) that uses relative links only, so it works under any URL prefix and when opened from disk.
- There is no build step: Pages serves the `main` branch as is (`.nojekyll` turns Jekyll off).

## Preview locally

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080/>.

## Adding a post

1. Put the post in a new folder named after it, with the Chinese page at `index.html` and the English page at
   `en/index.html`.
2. Add a card to `index.html` and a row to the table above.
