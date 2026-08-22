// =====================================================
// NGS SEARCH BUTTON
// =====================================================

new Notice(
    "NGS Search button loaded.",
    3000
);


// =====================================================
// FIND TEMPLATE
// =====================================================

const template =
    app.vault.getAbstractFileByPath(
        "7 - Templates/NGSSearch.md"
    );


if (!template) {

    new Notice(
        "NGS Search template not found."
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
        "NGS Search failed:",
        error
    );

    new Notice(
        "NGS Search failed. Check the console."
    );

}