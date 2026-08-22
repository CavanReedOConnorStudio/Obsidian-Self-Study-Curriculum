
Artists represented in the National Galleries of Scotland collection.

## Artists

```dataviewjs
const artists = dv.pages('"4 - Appendix/Artists"')
    .where(p => p.type === "Artist")
    .sort(p => p.file.name);

const artworks = dv.pages('"4 - Appendix/Artworks"')
    .where(p =>
        String(p.institution).includes(
            "National Galleries Scotland"
        )
    );

const ngsArtists = artists.filter(artist =>
    artworks.some(artwork =>
        String(artwork.artist).includes(
            artist.file.name
        )
    )
);

dv.table(
    ["Artist", "Saved Works"],
    ngsArtists.map(artist => {

        const works = artworks.filter(
            artwork =>
                String(artwork.artist).includes(
                    artist.file.name
                )
        );

        return [
            artist.file.link,
            works.length
        ];

    })
);
```