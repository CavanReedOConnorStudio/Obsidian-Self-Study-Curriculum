---
title: "Rijksmuseum Artists"
type: "Institution Artist Index"
institution: "[[Rijksmuseum]]"
tags:
  - institution
---

# Rijksmuseum Artists

Artists represented in the Rijksmuseum artwork collection.

```meta-bind-button
label: Rijksmuseum Full Catalogue
style: primary
action:
  type: js
  file: "8 - Scripts/Buttons/RijksmuseumArtistsButton.js"
```
  

## Artists

```dataviewjs
const artists = dv.pages('"4 - Appendix/Artists"')
    .where(p => p.type === "Artist")
    .sort(p => p.file.name);

const artworks = dv.pages('"4 - Appendix/Artworks"')
    .where(p =>
        String(p.institution)
            .replace(/\[\[|\]\]/g, "")
            .trim() === "Rijksmuseum"
    );

const rijksArtists = artists.filter(artist =>
    artworks.some(artwork =>
        String(artwork.artist).includes(
            artist.file.name
        )
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

# Saved Works

```meta-bind-button
label: Update Saved Artwork
style: primary
action:
  type: js
  file: "8 - Scripts/Buttons/UpdateSavedArtworkButton.js"
  
```


```dataviewjs
const artworks = dv.pages('"4 - Appendix/Artworks"')
    .where(p =>
        p.type === "Artwork" &&
        String(p.institution)
            .replace(/\[\[|\]\]/g, "")
            .trim() === "Rijksmuseum"
    )
    .sort(p => [
        String(p.artist),
        p.date_start ?? 9999
    ]);

dv.table(
    ["Image", "Artwork", "Artist", "Year", "Period", "Medium"],
    artworks.map(artwork => {

        const image = artwork.image_url
            ? `![Image](${artwork.image_url})`
            : "";

        return [
            image,
            artwork.file.link,
            artwork.artist,
            artwork.date_display,
            artwork.period,
            artwork.medium
        ];

    })
);
```