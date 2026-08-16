// =====================================================
// ARTWORK SEARCH BUTTON
// =====================================================

// Ask for artist
const searchTerm =
    await app.plugins
        .getPlugin("templater-obsidian")
        ?.templater
        ?.system
        ?.prompt(
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

    new Notice(
        "Search cancelled."
    );

    return;

}


// =====================================================
// RUN RIJKSMUSEUM SEARCH
// =====================================================

const data =
    await tp.user.RijksmuseumSearch(
        searchTerm.trim()
    );


// =====================================================
// ERROR
// =====================================================

if (!data.success) {

    new Notice(
        data.error || "Search failed."
    );

    return;

}


// =====================================================
// NO RESULTS
// =====================================================

if (
    data.results.length === 0
) {

    new Notice(
        `No artworks found for "${searchTerm}".`
    );

    return;

}


// =====================================================
// SHOW SUCCESS
// =====================================================

new Notice(
    `Found ${data.results.length} artworks.`
);

return output;