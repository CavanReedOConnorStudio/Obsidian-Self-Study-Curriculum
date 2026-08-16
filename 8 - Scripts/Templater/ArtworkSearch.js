module.exports = async function (tp) {

    // =====================================================
    // SEARCH
    // =====================================================

    const searchTerm =
        await tp.system.prompt(
            "Artwork Search",
            "Artist name"
        );

    if (
        !searchTerm ||
        !searchTerm.trim()
    ) {

        return "Search cancelled.";

    }


    // =====================================================
    // RIJKSMUSEUM
    // =====================================================

    const data =
        await tp.user.RijksmuseumSearch(
            searchTerm.trim()
        );


    // =====================================================
    // ERROR
    // =====================================================

    if (!data || !data.success) {

        return (
            `# Search Failed\n\n` +
            `${data?.error || "Unknown error."}`
        );

    }


    // =====================================================
    // NO RESULTS
    // =====================================================

    if (
        !data.results ||
        data.results.length === 0
    ) {

        return (
            `# Rijksmuseum Search\n\n` +
            `Search: **${data.searchTerm}**\n\n` +
            `No artworks found.`
        );

    }


    // =====================================================
    // HEADER
    // =====================================================

    let output =
        `# Rijksmuseum Results\n\n`;

    output +=
        `Search: **${data.searchTerm}**\n\n`;

    output +=
        `Found **${data.results.length}** artworks.\n\n`;


    // =====================================================
    // RESULTS
    // =====================================================

    data.results.forEach(
        (work, index) => {

            output +=
                `## ${index + 1}. ${work.title}\n\n`;


            // IMAGE

            if (work.imageURL) {

                output +=
                    `![${escapeMarkdown(work.title)}](${work.imageURL})\n\n`;

            }


            // ARTIST

            if (work.artist) {

                output +=
                    `**Artist:** ${work.artist}\n\n`;

            }


            // DATE

            if (work.dateDisplay) {

                output +=
                    `**Date:** ${work.dateDisplay}\n\n`;

            }


            // OBJECT NUMBER

            if (work.objectNumber) {

                output +=
                    `**Object number:** ${work.objectNumber}\n\n`;

            }


            // RIJKSMUSEUM LINK

            if (work.museumURL) {

                output +=
                    `**Rijksmuseum:** [View artwork](${work.museumURL})\n\n`;

            }


            // =================================================
            // PREPARE ARTWORK DATA
            // =================================================

            const artwork = {

                title:
                    work.title || "",

                originalTitle:
                    work.originalTitle || "",

                artist:
                    work.artist || "",

                dateStart:
                    work.dateStart ?? "",

                dateEnd:
                    work.dateEnd ?? "",

                dateDisplay:
                    work.dateDisplay || "",

                period:
                    work.period || "",

                medium:
                    work.medium || "",

                institution:
                    work.institution || "Rijksmuseum",

                source:
                    work.source || "Rijksmuseum",

                objectNumber:
                    work.objectNumber || "",

                museumURL:
                    work.museumURL || "",

                imageURL:
                    work.imageURL || "",

                subjects:
                    work.subjects || [],

                themes:
                    work.themes || []

            };


            // =================================================
            // ENCODE ARTWORK
            // =================================================

            const artworkJSON =
                JSON.stringify(artwork);


            const encodedArtwork =
                encodeURIComponent(
                    artworkJSON
                );


            // =================================================
            // SAVE BUTTON
            // =================================================

            output +=
` \`\`\`meta-bind-button
label: SAVE TO ARTWORK BANK
style: primary
actions:
  - type: js
    file: "8 - Scripts/ArtworkButton.js"
    args:
      artwork: "${encodedArtwork}"
\`\`\`

`;


            // =================================================
            // SEPARATOR
            // =================================================

            output +=
                `---\n\n`;

        }
    );


    return output;

};


// =========================================================
// ESCAPE MARKDOWN
// =========================================================

function escapeMarkdown(value) {

    return String(value || "")
        .replace(
            /[\[\]]/g,
            "\\$&"
        );

}