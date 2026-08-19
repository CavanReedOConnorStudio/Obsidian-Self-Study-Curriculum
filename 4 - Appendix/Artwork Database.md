

```dataviewjs
const pages = dv.pages('"4 - Appendix/Artworks"')
    .where(p => p.type === "Artwork")
    .sort(p => [p.artist, p.date_start]);

dv.table(
    ["Image", "Artwork", "Artist", "Year", "Period", "Medium", "Institution"],
    pages.map(p => [
        p.image_url
            ? dv.el("img", "", {
                attr: {
                    src: p.image_url,
                    width: "100",
                    style: "object-fit: contain;"
                }
            })
            : "",
        p.file.link,
        p.artist,
        p.date_display,
        p.period,
        p.medium,
        p.institution
    ])
);
```
