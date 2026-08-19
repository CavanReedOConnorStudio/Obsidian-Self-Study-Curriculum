module.exports = async function (tp) {

    // =====================================================
    // ASK FOR ARTIST
    // =====================================================

    const searchTerm =
        await tp.system.prompt(
            "Artwork Search",
            "Artist name"
        );


    // =====================================================
    // VALIDATE
    // =====================================================

    if (
        !searchTerm ||
        !searchTerm.trim()
    ) {

        return "Search cancelled.";

    }


    // =====================================================
    // RIJKSMUSEUM SEARCH
    // =====================================================

    const data =
        await tp.user.RijksmuseumSearch(
            searchTerm.trim()
        );


    // =====================================================
    // SEARCH ERROR
    // =====================================================

    if (
        !data ||
        !data.success
    ) {

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
    // NORMALISED ARTIST
    // =====================================================

    const artistName =
        data.results[0]?.artist ||
        data.searchTerm;


    // =====================================================
    // HEADER
    // =====================================================

    let output =
        `# Rijksmuseum Results\n\n`;


    output +=
        `Search: **${data.searchTerm}**\n\n`;


    output +=
        `Artist: [[${artistName}]]\n\n`;


    output +=
        `Found **${data.results.length}** artworks.\n\n`;


    // =====================================================
    // ARTWORK RESULTS
    // =====================================================

    data.results.forEach(
        (work, index) => {

            output +=
                `## ${index + 1}. ${work.title}\n\n`;


            // =============================================
            // IMAGE
            // =============================================

            if (
                work.imageURL
            ) {

                output +=
                    `![${escapeMarkdown(work.title)}](${work.imageURL})\n\n`;

            }


            // =============================================
            // ARTIST
            // =============================================

            if (
                work.artist
            ) {

                output +=
                    `**Artist:** [[${work.artist}]]\n\n`;

            }


            // =============================================
            // DATE
            // =============================================

            if (
                work.dateDisplay
            ) {

                output +=
                    `**Date:** ${work.dateDisplay}\n\n`;

            }


            // =============================================
            // PERIOD
            // =============================================

            if (
                work.period
            ) {

                output +=
                    `**Period:** ${work.period}\n\n`;

            }


            // =============================================
            // MEDIUM
            // =============================================

            if (
                work.medium
            ) {

                output +=
                    `**Medium:** ${work.medium}\n\n`;

            }


            // =============================================
            // OBJECT NUMBER
            // =============================================

            if (
                work.objectNumber
            ) {

                output +=
                    `**Object number:** ${work.objectNumber}\n\n`;

            }


            // =============================================
            // INSTITUTION
            // =============================================

            if (
                work.institution
            ) {

                output +=
                    `**Institution:** ${work.institution}\n\n`;

            }


            // =============================================
            // RIJKSMUSEUM LINK
            // =============================================

            if (
                work.museumURL
            ) {

                output +=
                    `**Rijksmuseum:** [View artwork](${work.museumURL})\n\n`;

            }


            // =============================================
            // ARTWORK DATA
            // =============================================

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


            // =============================================
            // ENCODE ARTWORK
            // =============================================

            const encodedArtwork =
                encodeURIComponent(
                    JSON.stringify(
                        artwork
                    )
                );


            // =============================================
            // SAVE BUTTON
            // =============================================

            output +=
` \`\`\`meta-bind-button
label: SAVE TO ARTWORK BANK
style: primary
actions:
  - type: js
    file: "8 - Scripts/Buttons/ArtworkButton.js"
    args:
      artwork: "${encodedArtwork}"
\`\`\`

`;


            output +=
                "---\n\n";

        }
    );


    // =====================================================
    // RETURN
    // =====================================================

    return output;

};


// =====================================================
// MARKDOWN ESCAPE
// =====================================================

function escapeMarkdown(value) {

    return String(
        value || ""
    )
        .replace(
            /[\[\]]/g,
            "\\$&"
        );

}