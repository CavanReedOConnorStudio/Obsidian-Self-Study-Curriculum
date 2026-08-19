// =====================================================
// RIJKSMUSEUM ARTIST INDEX
// =====================================================
//
// Builds an index from artworks you have actually saved
// from the Rijksmuseum.
//
// It reads:
// 4 - Appendix/Artworks/
//
// and only includes artworks where:
// institution: "[[Rijksmuseum]]"
//
// =====================================================


// =====================================================
// SETTINGS
// =====================================================

const ARTWORK_FOLDER =
    "4 - Appendix/Artworks";

const OUTPUT =
    "4 - Appendix/Institutions/Rijksmuseum/Rijksmuseum Artists.md";


// =====================================================
// MAIN
// =====================================================

module.exports = async function () {

    try {

        new Notice(
            "Building Rijksmuseum Artist Index..."
        );


        // =================================================
        // FIND SAVED ARTWORKS
        // =================================================

        const artworkFiles =
            app.vault
                .getMarkdownFiles()
                .filter(
                    file =>
                        file.path.startsWith(
                            ARTWORK_FOLDER + "/"
                        )
                );


        // =================================================
        // ARTIST DATABASE
        // =================================================

        const artists =
            new Map();


        // =================================================
        // PROCESS ARTWORKS
        // =================================================

        for (
            const file
            of artworkFiles
        ) {

            const cache =
                app.metadataCache.getFileCache(
                    file
                );


            const frontmatter =
                cache?.frontmatter;


            if (!frontmatter) {
                continue;
            }


            // =================================================
            // CHECK INSTITUTION
            // =================================================

            let institution =
                String(
                    frontmatter.institution || ""
                );


            institution =
                institution
                    .replace(
                        /^\[\[/,
                        ""
                    )
                    .replace(
                        /\]\]$/,
                        ""
                    )
                    .trim();


            if (
                institution.toLowerCase() !==
                "rijksmuseum"
            ) {

                continue;

            }


            // =================================================
            // GET ARTIST
            // =================================================

            let artist =
                String(
                    frontmatter.artist || ""
                );


            artist =
                artist
                    .replace(
                        /^\[\[/,
                        ""
                    )
                    .replace(
                        /\]\]$/,
                        ""
                    )
                    .trim();


            if (!artist) {
                continue;
            }


            // =================================================
            // NORMALISE ARTIST
            // =================================================

            const artistNames = {

                "Vermeer":
                    "Johannes Vermeer",

                "Jan Vermeer":
                    "Johannes Vermeer",

                "Johannes Vermeer":
                    "Johannes Vermeer"

            };


            if (
                artistNames[artist]
            ) {

                artist =
                    artistNames[artist];

            }


            // =================================================
            // CREATE ARTIST
            // =================================================

            if (
                !artists.has(
                    artist
                )
            ) {

                artists.set(
                    artist,
                    []
                );

            }


            // =================================================
            // ADD ARTWORK
            // =================================================

            artists
                .get(artist)
                .push({

                    file:
                        file,

                    title:
                        frontmatter.title ||
                        file.basename

                });

        }


        // =================================================
        // SORT ARTISTS
        // =================================================

        const artistList =
            Array.from(
                artists.entries()
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a[0].localeCompare(
                        b[0]
                    )
            );


        // =================================================
        // COUNT ARTWORKS
        // =================================================

        let artworkCount =
            0;


        for (
            const [
                artist,
                works
            ]
            of artistList
        ) {

            artworkCount +=
                works.length;

        }


        // =================================================
        // BUILD MARKDOWN
        // =================================================

        let output =
`---
title: "Rijksmuseum Artists"
type: "Institution Artist Index"
institution: "[[Rijksmuseum]]"
tags:
  - institution
---

# Rijksmuseum Artists

Artists represented in my saved Rijksmuseum artwork collection.

**Artists:** ${artistList.length}

**Saved Rijksmuseum artworks:** ${artworkCount}

_Last updated: ${new Date()
    .toISOString()
    .split("T")[0]}_

---

## Artists

| Artist | Saved Works |
|---|---:|
`;


        // =================================================
        // ARTIST TABLE
        // =================================================

        for (
            const [
                artist,
                works
            ]
            of artistList
        ) {

            output +=
`| [[${artist}]] | ${works.length} |
`;

        }


        // =================================================
        // NO RESULTS
        // =================================================

        if (
            artistList.length === 0
        ) {

            output +=
`| No Rijksmuseum artists saved yet | 0 |
`;

        }


        // =================================================
        // WORKS BY ARTIST
        // =================================================

        output +=
`

---

## Saved Works by Artist

`;


        for (
            const [
                artist,
                works
            ]
            of artistList
        ) {

            output +=
`### [[${artist}]]

`;


            // Sort works alphabetically

            works.sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.title
                    ).localeCompare(
                        String(
                            b.title
                        )
                    )
            );


            for (
                const work
                of works
            ) {

                output +=
`- [[${work.file.path}|${work.title}]]
`;

            }


            output +=
`
`;

        }


        // =================================================
        // FIND OUTPUT FILE
        // =================================================

        const existing =
            app.vault.getAbstractFileByPath(
                OUTPUT
            );


        // =================================================
        // UPDATE EXISTING FILE
        // =================================================

        if (existing) {

            await app.vault.modify(
                existing,
                output
            );

        }


        // =================================================
        // CREATE NEW FILE
        // =================================================

        else {

            await app.vault.create(
                OUTPUT,
                output
            );

        }


        // =================================================
        // SUCCESS
        // =================================================

        new Notice(
            `Rijksmuseum Artist Index updated: ${artistList.length} artists, ${artworkCount} artworks.`,
            8000
        );


        console.log(
            "Rijksmuseum Artist Index complete."
        );


        return output;

    }


    // =================================================
    // ERROR
    // =================================================

    catch (error) {

        console.error(
            "Rijksmuseum Artist Index failed:",
            error
        );


        new Notice(
            "Rijksmuseum Artist Index failed. Check the console."
        );


        return "";

    }

};