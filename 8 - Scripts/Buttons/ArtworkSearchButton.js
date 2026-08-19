// =====================================================
// RIJKSMUSEUM ARTWORK SEARCH BUTTON
// =====================================================


// =====================================================
// TEMPLATE
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
// SEARCH FOLDER
// =====================================================

const searchFolder =
    "4 - Appendix/Institutions/Rijksmuseum/Artwork Searches";


// =====================================================
// ENSURE FOLDERS
// =====================================================

async function ensureFolder(path) {

    const existing =
        app.vault.getAbstractFileByPath(
            path
        );

    if (!existing) {

        await app.vault.createFolder(
            path
        );

    }

}


await ensureFolder(
    "4 - Appendix"
);

await ensureFolder(
    "4 - Appendix/Institutions"
);

await ensureFolder(
    "4 - Appendix/Institutions/Rijksmuseum"
);

await ensureFolder(
    searchFolder
);


// =====================================================
// CREATE TEMPLATE NOTE
// =====================================================

try {

    const createdFile =
        await templater.templater.create_new_note_from_template(
            template,
            searchFolder
        );


    // =================================================
    // CHECK CREATED FILE
    // =================================================

    if (!createdFile) {

        new Notice(
            "Search note was not created."
        );

        return;

    }


    // =================================================
    // READ CREATED NOTE
    // =================================================

    const content =
        await app.vault.read(
            createdFile
        );


    // =================================================
    // FIND SEARCH TERM
    // =================================================

    const match =
        content.match(
            /Search:\s*\*\*(.*?)\*\*/
        );


    if (!match) {

        new Notice(
            "Search created, but artist name could not be detected."
        );

        return;

    }


    const artist =
        match[1].trim();


    // =================================================
    // SAFE FILE NAME
    // =================================================

    const fileName =
        artist
            .replace(
                /[\\/:*?"<>|]/g,
                ""
            )
            .trim();


    if (!fileName) {

        new Notice(
            "Could not create a filename from artist name."
        );

        return;

    }


    // =================================================
    // TARGET PATH
    // =================================================

    const targetPath =
        `${searchFolder}/${fileName}.md`;


    // =================================================
    // CHECK DUPLICATE
    // =================================================

    const existing =
        app.vault.getAbstractFileByPath(
            targetPath
        );


    if (
        existing &&
        existing.path !== createdFile.path
    ) {

        new Notice(
            `"${artist}" search already exists.`
        );


        // Delete the temporary note

        await app.vault.delete(
            createdFile
        );


        await app.workspace
            .getLeaf(true)
            .openFile(existing);

        return;

    }


    // =================================================
    // RENAME
    // =================================================

    await app.vault.rename(
        createdFile,
        targetPath
    );


    // =================================================
    // OPEN
    // =================================================

    const renamedFile =
        app.vault.getAbstractFileByPath(
            targetPath
        );


    if (renamedFile) {

        await app.workspace
            .getLeaf(true)
            .openFile(
                renamedFile
            );

    }


    // =================================================
    // SUCCESS
    // =================================================

    new Notice(
        `Rijksmuseum search saved as "${fileName}.md".`
    );

}


catch (error) {

    console.error(
        "Rijksmuseum Artwork Search failed:",
        error
    );


    new Notice(
        "Artwork Search failed. Check the console."
    );

}