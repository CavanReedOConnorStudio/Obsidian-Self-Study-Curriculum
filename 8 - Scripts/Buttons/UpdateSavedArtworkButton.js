// =====================================================
// UPDATE SAVED RIJKSMUSEUM ARTWORK
// =====================================================
//
// Reads the existing Artwork Bank and updates the
// "Saved" column in Rijksmuseum Artists.md.
//
// DOES NOT CONTACT THE RIJKSMUSEUM API.
// =====================================================


const CATALOGUE =
    "4 - Appendix/Institutions/Rijksmuseum/Rijksmuseum Artists.md";

const ARTWORK_FOLDER =
    "4 - Appendix/Artworks";


module.exports = async function () {

    try {

        new Notice(
            "Updating saved Rijksmuseum artwork..."
        );


        // =================================================
        // FIND CATALOGUE
        // =================================================

        const catalogue =
            app.vault.getAbstractFileByPath(
                CATALOGUE
            );


        if (!catalogue) {

            new Notice(
                "Rijksmuseum Artists catalogue not found."
            );

            return;

        }


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


        const savedArtists =
            new Set();


        // =================================================
        // READ ARTIST FROM EACH ARTWORK
        // =================================================

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


            let artistName =
                String(
                    artist
                );


            // Remove [[ ]] links

            artistName =
                artistName
                    .replace(
                        /^\[\[/,
                        ""
                    )
                    .replace(
                        /\]\]$/,
                        ""
                    )
                    .trim();


            // Remove quotes

            artistName =
                artistName
                    .replace(
                        /^["']|["']$/g,
                        ""
                    )
                    .trim();


            if (artistName) {

                savedArtists.add(
                    artistName
                );

            }

        }


        console.log(
            "Saved artists:",
            Array.from(
                savedArtists
            )
        );


        // =================================================
        // READ ARTIST CATALOGUE
        // =================================================

        let content =
            await app.vault.read(
                catalogue
            );


        const lines =
            content.split(
                "\n"
            );


        // =================================================
        // UPDATE SAVED COLUMN
        // =================================================

        for (
            let i = 0;
            i < lines.length;
            i++
        ) {

            const line =
                lines[i];


            // Only process artist table rows

            if (
                !line.startsWith(
                    "| [["
                )
            ) {

                continue;

            }


            const match =
                line.match(
                    /^\|\s*\[\[([^\]]+)\]\]\s*\|\s*(\d+)\s*\|\s*([^|]*)\s*\|/
                );


            if (!match) {

                continue;

            }


            const artistName =
                match[1]
                    .trim();


            const paintingCount =
                match[2];


            // =================================================
            // CHECK FOR SAVED WORK
            // =================================================

            let isSaved =
                false;


            for (
                const savedArtist
                of savedArtists
            ) {

                if (
                    savedArtist
                        .toLowerCase()
                        .trim() ===
                    artistName
                        .toLowerCase()
                        .trim()
                ) {

                    isSaved =
                        true;

                    break;

                }

            }


            // =================================================
            // CREATE SAVED MARK
            // =================================================

            const savedMark =
                isSaved
                    ? "✓"
                    : "";


            // =================================================
            // REBUILD ROW
            // =================================================

            lines[i] =
                `| [[${artistName}]] | ${paintingCount} | ${savedMark} |`;

        }


        // =================================================
        // SAVE CATALOGUE
        // =================================================

        content =
            lines.join(
                "\n"
            );


        await app.vault.modify(
            catalogue,
            content
        );


        // =================================================
        // COMPLETE
        // =================================================

        new Notice(
            `Rijksmuseum Artists updated — ${savedArtists.size} saved artists found.`,
            5000
        );


        console.log(
            "Rijksmuseum saved artwork update complete."
        );

    }


    catch (error) {

        console.error(
            "Rijksmuseum saved artwork update failed:",
            error
        );


        new Notice(
            "Update failed. Check the console."
        );

    }

};