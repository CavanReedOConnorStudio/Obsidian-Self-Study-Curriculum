// =====================================================
// RIJKSMUSEUM ARTIST CATALOGUE
// =====================================================
//
// Builds a catalogue of artists represented in the
// Rijksmuseum painting collection.
//
// This is separate from the normal artwork search.
// =====================================================


// =====================================================
// SETTINGS
// =====================================================

const OUTPUT =
    "4 - Appendix/Institutions/Rijksmuseum/Rijksmuseum Artists.md";

const SEARCH_URL =
    "https://data.rijksmuseum.nl/search/collection?type=painting";


// =====================================================
// SAFE FILE / MARKDOWN HELPERS
// =====================================================

function escapeMarkdown(value) {

    return String(value || "")
        .replace(
            /[\[\]\|]/g,
            "\\$&"
        );

}


// =====================================================
// EXTRACT ARTIST NAME
// =====================================================

function extractArtistName(actor) {

    if (!actor) {
        return "";
    }


    // Direct name

    if (
        typeof actor.name === "string" &&
        actor.name.trim()
    ) {

        return actor.name.trim();

    }


    // Linked Art identified_by

    if (
        Array.isArray(
            actor.identified_by
        )
    ) {

        for (
            const identifier
            of actor.identified_by
        ) {

            if (
                identifier?.type === "Name" &&
                identifier.content
            ) {

                return String(
                    identifier.content
                ).trim();

            }

        }

    }


    // Notation

    if (
        Array.isArray(
            actor.notation
        )
    ) {

        for (
            const notation
            of actor.notation
        ) {

            const value =
                notation?.["@value"];


            if (value) {

                return String(
                    value
                ).trim();

            }

        }

    }


    return "";

}


// =====================================================
// EXTRACT CREATORS FROM OBJECT
// =====================================================

function extractCreators(object) {

    const creators = [];


    const production =
        object?.produced_by;


    if (!production) {

        return creators;

    }


    // -------------------------------------------------
    // Direct carried_out_by
    // -------------------------------------------------

    if (
        Array.isArray(
            production.carried_out_by
        )
    ) {

        for (
            const actor
            of production.carried_out_by
        ) {

            const name =
                extractArtistName(
                    actor
                );


            if (
                name &&
                !creators.includes(name)
            ) {

                creators.push(name);

            }

        }

    }


    // -------------------------------------------------
    // Production parts
    // -------------------------------------------------

    if (
        Array.isArray(
            production.part
        )
    ) {

        for (
            const part
            of production.part
        ) {

            if (
                !Array.isArray(
                    part?.carried_out_by
                )
            ) {

                continue;

            }


            for (
                const actor
                of part.carried_out_by
            ) {

                const name =
                    extractArtistName(
                        actor
                    );


                if (
                    name &&
                    !creators.includes(name)
                ) {

                    creators.push(name);

                }

            }

        }

    }


    return creators;

}


// =====================================================
// MAIN
// =====================================================

module.exports = async function () {

    try {

        new Notice(
            "Rijksmuseum artist catalogue: starting..."
        );


        // =================================================
        // COLLECT ALL PAINTING IDENTIFIERS
        // =================================================

        const items = [];


        let nextURL =
            SEARCH_URL;


        let page =
            1;


        while (nextURL) {

            new Notice(
                `Rijksmuseum: loading painting page ${page}...`,
                3000
            );


            console.log(
                `Rijksmuseum: loading page ${page}`
            );


            const response =
                await requestUrl({

                    url:
                        nextURL,

                    method:
                        "GET"

                });


            const data =
                response.json;


            if (
                Array.isArray(
                    data.orderedItems
                )
            ) {

                items.push(
                    ...data.orderedItems
                );

            }


            nextURL =
                data.next?.id ||
                null;


            page++;

        }


        console.log(
            `Rijksmuseum: ${items.length} paintings found`
        );


        new Notice(
            `Found ${items.length} Rijksmuseum paintings. Now identifying artists...`,
            5000
        );


        // =================================================
        // ARTIST DATABASE
        // =================================================

        const artists =
            new Map();


        // =================================================
        // PROCESS OBJECTS
        // =================================================

        for (
            let index = 0;
            index < items.length;
            index++
        ) {

            const item =
                items[index];


            try {

                console.log(
                    `Rijksmuseum artist catalogue: ${index + 1}/${items.length}`
                );


                // -----------------------------------------
                // Resolve object
                // -----------------------------------------

                const objectResponse =
                    await requestUrl({

                        url:
                            item.id +
                            "?_profile=la-framed",

                        method:
                            "GET"

                    });


                const object =
                    objectResponse.json;


                // -----------------------------------------
                // Extract creators
                // -----------------------------------------

                const creators =
                    extractCreators(
                        object
                    );


                // -----------------------------------------
                // Count works
                // -----------------------------------------

                for (
                    const artist
                    of creators
                ) {

                    if (
                        !artists.has(
                            artist
                        )
                    ) {

                        artists.set(
                            artist,
                            {
                                name:
                                    artist,

                                works:
                                    0
                            }
                        );

                    }


                    artists.get(
                        artist
                    ).works++;

                }

            }


            catch (error) {

                console.warn(
                    "Could not process Rijksmuseum object:",
                    item.id,
                    error
                );

            }

        }


        // =================================================
        // SORT ARTISTS
        // =================================================

        const artistList =
            Array.from(
                artists.values()
            )
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );


        console.log(
            `Rijksmuseum: ${artistList.length} artists found`
        );


        // =================================================
        // CHECK EXISTING ARTWORK BANK
        // =================================================

        const artworkFiles =
            app.vault.getMarkdownFiles()
            .filter(
                file =>
                    file.path.startsWith(
                        "4 - Appendix/Artworks/"
                    )
            );


        const savedArtists =
            new Set();


        for (
            const file
            of artworkFiles
        ) {

            const cache =
                app.metadataCache.getFileCache(
                    file
                );


            const artist =
                cache?.frontmatter?.artist;


            if (!artist) {

                continue;

            }


            // Remove Obsidian link formatting

            const cleaned =
                String(
                    artist
                )
                .replace(
                    /^\[\[/,
                    ""
                )
                .replace(
                    /\]\]$/,
                    ""
                );


            savedArtists.add(
                cleaned
            );

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

Complete catalogue of artists represented in the Rijksmuseum painting collection.

**Artists:** ${artistList.length}

**Painting records scanned:** ${items.length}

_Last updated: ${new Date().toISOString().split("T")[0]}_

---

## Artists

| Artist | Rijksmuseum Paintings | Saved |
|---|---:|:---:|
`;


        for (
            const artist
            of artistList
        ) {

            const escaped =
                escapeMarkdown(
                    artist.name
                );


            // ---------------------------------------------
            // Determine whether user has saved work
            // ---------------------------------------------

            let isSaved =
                false;


            for (
                const saved
                of savedArtists
            ) {

                if (
                    saved
                        .toLowerCase()
                        .includes(
                            artist.name.toLowerCase()
                        ) ||
                    artist.name
                        .toLowerCase()
                        .includes(
                            saved.toLowerCase()
                        )
                ) {

                    isSaved =
                        true;

                    break;

                }

            }


            const savedMark =
                isSaved
                    ? "✓"
                    : "";


            output +=
`| [[${escaped}]] | ${artist.works} | ${savedMark} |
`;

        }


        // =================================================
        // WRITE FILE
        // =================================================

        const existing =
            app.vault.getAbstractFileByPath(
                OUTPUT
            );


        if (existing) {

            await app.vault.modify(
                existing,
                output
            );

        }

        else {

            await app.vault.create(
                OUTPUT,
                output
            );

        }


        // =================================================
        // COMPLETE
        // =================================================

        new Notice(
            `Rijksmuseum Artist Catalogue complete: ${artistList.length} artists.`,
            8000
        );


        console.log(
            "Rijksmuseum artist catalogue complete."
        );


        return output;

    }


    catch (error) {

        console.error(
            "Rijksmuseum artist catalogue failed:",
            error
        );


        new Notice(
            "Rijksmuseum Artist Catalogue failed. Check the console."
        );


        return "";

    }

};