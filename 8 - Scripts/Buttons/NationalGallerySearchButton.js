new Notice("National Gallery button loaded");

// =====================================================
// NATIONAL GALLERY SEARCH BUTTON
// =====================================================

const template =
    app.vault.getAbstractFileByPath(
        "7 - Templates/NationalGallerySearch.md"
    );


// =====================================================
// CHECK TEMPLATE
// =====================================================

if (!template) {

    new Notice(
        "NationalGallerySearch template not found."
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
        "National Gallery Search failed:",
        error
    );

    new Notice(
        "National Gallery Search failed. Check the console."
    );

}