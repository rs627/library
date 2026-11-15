# Book Smart: Finding books at Duke Libraries

An interactive first-year information literacy module for Canvas (Writing 120,
theme: AI and writing). Four lessons plus an overview:

1. Why use the library catalog? (Google and the catalog at each research step, building a search strategy)
2. Anatomy of a book record (highlighted parts of a real record and its Locate map)
3. Call numbers & browsing the stacks (decode a call number, browse a shelf, subject neighborhoods)
4. Find an ebook (build a search, choose a result, open an ebook through Duke)

Lesson 5, Check & next steps, is listed as coming later.

## Files

```
book-smart/
  index.html   the module: one self-contained page (upload this to Canvas)
  src/         lesson designs (*.dc.html), the same files as the design canvas
  assets/      photos and the Blue Devil image, embedded into index.html
  build.py     rebuilds index.html from src/ and assets/
```

## Rebuilding

After changing a lesson in `src/`:

```
python3 book-smart/build.py
```

## Notes

- In Canvas, embed with an iframe about 800px tall (the module scrolls inside
  itself with the lesson bar pinned), or add it as an External URL item that
  opens in a new tab.
- Progress is not saved between visits and nothing is reported to the Canvas
  gradebook (no SCORM yet).
- The Blue Devil image is a Duke trademark; confirm usage with Duke's brand office.
- Lesson 4 result counts are simulated; only the final 70 comes from the real catalog.
