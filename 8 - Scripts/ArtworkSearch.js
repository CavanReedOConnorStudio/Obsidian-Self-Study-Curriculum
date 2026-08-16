module.exports = async function (tp) {

    // =====================================================
    // ASK FOR SEARCH
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
    // RUN RIJKSMUSEUM SEARCH
    // =====================================================

    const data =
        await tp.user.RijksmuseumSearch(
            searchTerm
        );

    // =====================================================
    // ERROR
    // =====================================================

    if (!data.success) {

        return (
            `# Search Failed\n\n` +
            `${data.error}`
        );

    }

    // =====================================================
    // NO RESULTS
    // =====================================================

    if (data.results.length === 0) {

        return (
            `# Rijksmuseum Search\n\n` +
            `Search: **${data.searchTerm}**\n\n` +
            `No artworks found.`
        );

    }

    // =====================================================
    // CREATE TEMPORARY SELECTION FOLDER
    // =====================================================

    const selectionPath =
        "4 - Appendix/.artwork-selection.json";

    // =====================================================
    // START OUTPUT
    // =====================================================

    let output =
        `# Rijksmuseum Results\n\n`;

    output +=
        `Search: **${data.searchTerm}**\n\n`;

    output +=
        `Found **${data.results.length}** artworks.\n\n`;

    // =====================================================
    // SHOW FIRST RESULT ONLY
    // =====================================================

    const work =
        data.results[0];

    output +=
        `## ${work.title}\n\n`;

    // =====================================================
    // IMAGE
    // =====================================================

    if (work.imageURL) {

        output +=
            `![${escapeMarkdown(work.title)}](${work.imageURL})\n\n`;

    }

    // =====================================================
    // INFORMATION
    // =====================================================

    output +=
        `**Artist:** ${work.artist}\n\n`;

    if (work.dateDisplay) {

        output +=
            `**Date:** ${work.dateDisplay}\n\n`;

    }

    if (work.objectNumber) {

        output +=
            `**Object number:** ${work.objectNumber}\n\n`;

    }

    // =====================================================
    // RIJKSMUSEUM LINK
    // =====================================================

    output +=
        `**Rijksmuseum:** ${work.museumURL}\n\n`;

    // =====================================================
    // SAVE BUTTON
    // =====================================================

    output +=
` \`\`\`meta-bind-button
label: SAVE TO ARTWORK BANK
style: primary
action:
  type: js
  file: Scripts/ArtworkButton.js
\`\`\`

`;

    output +=
        "---\n\n";

    // =====================================================
    // STORE ARTWORK DATA
    // =====================================================

    const existingSelection =
        app.vault.getAbstractFileByPath(
            selectionPath
        );

    if (existingSelection) {

        await app.vault.modify(
            existingSelection,
            JSON.stringify(
                work,
                null,
                2
            )
        );

    } else {

        await app.vault.create(
            selectionPath,
            JSON.stringify(
                work,
                null,
                2
            )
        );

    }

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