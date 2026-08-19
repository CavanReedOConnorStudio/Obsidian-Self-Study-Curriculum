
#institutions

## Artist Index

```dataviewjs
const artists = dv.pages('"4 - Appendix/Artists"')
    .sort(p => p.file.name);

const artworks = dv.pages('"4 - Appendix/Artworks"')
    .where(p => String(p.institution).includes("Rijksmuseum"));

const rijksArtists = artists.filter(artist =>
    artworks.some(artwork =>
        String(artwork.artist).includes(artist.file.name)
    )
);

dv.table(
    ["Artist", "Saved Works"],
    rijksArtists.map(artist => {
        const count = artworks.filter(
            artwork =>
                String(artwork.artist).includes(artist.file.name)
        ).length;

        return [
            artist.file.link,
            count
        ];
    })
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

## Collection

```dataviewjs
const pages = dv.pages('"4 - Appendix/Artworks"')
    .where(p => p.institution && p.institution.toString().includes("Rijksmuseum"))
    .sort(p => [p.artist, p.date_start]);

dv.table(
    ["Artwork", "Artist", "Year", "Period", "Medium"],
    pages.map(p => [
        p.file.link,
        p.artist,
        p.date_display,
        p.period,
        p.medium
    ])
);
```