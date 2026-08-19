

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



## Period Index

```dataviewjs
const periods = dv.pages('"4 - Appendix/Periods"')
    .sort(p => p.file.name);

const artworks = dv.pages('"4 - Appendix/Artworks"');

dv.table(
    ["Period", "Saved Works"],
    periods.map(period => {
        const count = artworks.filter(
            artwork => String(artwork.period).includes(period.file.name)
        ).length;

        return [
            period.file.link,
            count
        ];
    })
);
```
