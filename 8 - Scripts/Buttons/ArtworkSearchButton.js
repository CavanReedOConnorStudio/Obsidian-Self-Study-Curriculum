new Notice("JS FILE LOADED");

// =====================================================
// ARTWORK SEARCH BUTTON
// =====================================================

const template =
    app.vault.getAbstractFileByPath(
        "7 - Templates/ArtworkSearch.md"
    );


// =====================================================
// CHECK TEMPLATE
// =====================================================

if (!template) {

    new Notice(
        "ArtworkSearch template not found."
    );

    return;

}


// =====================================================
// FIND TEMPLATER
// =====================================================

const templater =
    app.plugins.getPlugin(
        "templater-obsidian"
    );


if (!templater) {

    new Notice(
        "Templater plugin is not enabled."
    );

    return;

}


// =====================================================
// RUN TEMPLATE
// =====================================================

try {

    await templater.templater.create_new_note_from_template(
        template,
        app.workspace.getActiveFile()?.parent
    );

}

catch (error) {

    console.error(
        "Artwork Search failed:",
        error
    );

    new Notice(
        "Artwork Search failed. Check the console."
    );

}