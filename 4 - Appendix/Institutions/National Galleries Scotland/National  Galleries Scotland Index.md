---
title: "National Galleries Scotland Index"
type: "Institution Index"
institution: "[[National Galleries Scotland]]"
tags:
  - institution
  - ngs
---

# National Galleries Scotland Index

National collection of Scottish and international art, spanning from the early Renaissance to the present day.

## Search

```meta-bind-button
label: SEARCH NGS
style: primary
action:
  type: js
  file: "8 - Scripts/Buttons/NGSSearchButton.js"
```

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
AND contains(institution, "National Galleries Scotland")
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

## Period Index

```dataviewjs
const periods = dv.pages('"4 - Appendix/Periods"')
    .sort(p => p.file.name);

const artworks = dv.pages('"4 - Appendix/Artworks"')
    .where(p =>
        String(p.institution).includes(
            "National Galleries Scotland"
        )
    );

const ngsPeriods = periods.filter(period =>
    artworks.some(artwork =>
        String(artwork.period).includes(
            period.file.name
        )
    )
);

dv.table(
    ["Period", "Saved Works"],
    ngsPeriods.map(period => {

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