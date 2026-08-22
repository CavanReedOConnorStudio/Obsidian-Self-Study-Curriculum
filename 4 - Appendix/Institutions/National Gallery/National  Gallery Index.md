---
title: "National Gallery Index"
type: "Institution Index"
institution: "[[National Gallery]]"
tags:
  - institution
  - national-gallery
---

# National Gallery

The National Gallery in London, housing a collection of Western European paintings from the 13th to the 20th century.

## Search

```meta-bind-button
label: SEARCH NATIONAL GALLERY
style: primary
actions:
  - type: js
    file: "8 - Scripts/Buttons/NationalGallerySearchButton.js"
````

## Saved Artworks

```dataview
TABLE WITHOUT ID
    image_url AS "Image",
    file.link AS "Artwork",
    artist AS "Artist",
    date_display AS "Year",
    period AS "Period",
    medium AS "Medium"
FROM "4 - Appendix/Artworks"
WHERE type = "Artwork"
AND contains(institution, "National Gallery")
SORT artist ASC, date_start ASC
```

## Artist Index

```dataviewjs
const artists = dv.pages('"4 - Appendix/Artists"')
    .where(p => p.type === "Artist")
    .sort(p => p.file.name);

const artworks = dv.pages('"4 - Appendix/Artworks"')
    .where(p =>
        String(p.institution).includes(
            "National Gallery"
        )
    );

const nationalGalleryArtists = artists.filter(artist =>
    artworks.some(artwork =>
        String(artwork.artist).includes(
            artist.file.name
        )
    )
);

dv.table(
    ["Artist", "Saved Works"],
    nationalGalleryArtists.map(artist => {

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

## Period Index

```dataviewjs
const periods = dv.pages('"4 - Appendix/Periods"')
    .sort(p => p.file.name);

const artworks = dv.pages('"4 - Appendix/Artworks"')
    .where(p =>
        String(p.institution).includes(
            "National Gallery"
        )
    );

const nationalGalleryPeriods = periods.filter(period =>
    artworks.some(artwork =>
        String(artwork.period).includes(
            period.file.name
        )
    )
);

dv.table(
    ["Period", "Saved Works"],
    nationalGalleryPeriods.map(period => {

        const count = artworks.filter(
            artwork =>
                String(artwork.period).includes(
                    period.file.name
                )
        ).length;

        return [
            period.file.link,
            count
        ];

    })
);
```