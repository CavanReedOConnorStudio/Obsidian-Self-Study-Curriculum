module.exports = async function (tp) {

    const searchTerm =
        await tp.system.prompt(
            "Artwork Search",
            "Artist name"
        );

    if (!searchTerm || !searchTerm.trim()) {
        return "Search cancelled.";
    }


    const data =
        await tp.user.RijksmuseumSearch(
            searchTerm.trim()
        );


    if (!data || !data.success) {

        return (
            `# Search Failed\n\n` +
            `${data?.error || "Unknown error."}`
        );

    }


    if (!data.results || data.results.length === 0) {

        return (
            `# Rijksmuseum Search\n\n` +
            `Search: **${data.searchTerm}**\n\n` +
            `No artworks found.`
        );

    }


    let output =
        `# Rijksmuseum Results\n\n`;

    output +=
        `Search: **${data.searchTerm}**\n\n`;

    output +=
        `Found **${data.results.length}** artworks.\n\n`;


    data.results.forEach((work, index) => {

        output +=
            `## ${index + 1}. ${work.title}\n\n`;


        if (work.imageURL) {

            output +=
                `![${escapeMarkdown(work.title)}](${work.imageURL})\n\n`;

        }


        if (work.artist) {

            output +=
                `**Artist:** ${work.artist}\n\n`;

        }


        if (work.dateDisplay) {

            output +=
                `**Date:** ${work.dateDisplay}\n\n`;

        }


        if (work.objectNumber) {

            output +=
                `**Object number:** ${work.objectNumber}\n\n`;

        }


        if (work.museumURL) {

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
        // ENCODE DATA FOR META BIND
        // =============================================

        const encodedArtwork =
            encodeURIComponent(
                JSON.stringify(artwork)
            );


        // =============================================
        // BUTTON
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


        output += "---\n\n";

    });


    return output;
};


function escapeMarkdown(value) {

    return String(value || "")
        .replace(/[\[\]]/g, "\\$&");

}