---
title: "Rijksmuseum Artists"
type: "Institution Artist Index"
institution: "[[Rijksmuseum]]"
tags:
  - institution
---

# Rijksmuseum Artists

Artists represented in the Rijksmuseum artwork collection.

## Artists

```dataviewjs
const artists = dv.pages('"4 - Appendix/Artists"')
    .where(p => p.type === "Artist")
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