// =====================================================
// RIJKSMUSEUM ARTIST INDEX BUTTON
// =====================================================
//
// Runs RijksmuseumArtists.js
// =====================================================


// =====================================================
// SCRIPT LOCATION
// =====================================================

const scriptPath =
    "8 - Scripts/Templater/RijksmuseumArtists.js";


// =====================================================
// FIND SCRIPT
// =====================================================

const scriptFile =
    app.vault.getAbstractFileByPath(
        scriptPath
    );


if (!scriptFile) {

    new Notice(
        "RijksmuseumArtists.js could not be found."
    );

    return;

}


// =====================================================
// LOAD SCRIPT
// =====================================================

try {

    const code =
        await app.vault.read(
            scriptFile
        );


    // =================================================
    // CREATE MODULE
    // =================================================

    const module = {
        exports: {}
    };


    const exports =
        module.exports;


    // =================================================
    // EXECUTE SCRIPT
    // =================================================

    const execute =
        new Function(
            "module",
            "exports",
            code
        );


    execute(
        module,
        exports
    );


    // =================================================
    // CHECK EXPORT
    // =================================================

    if (
        typeof module.exports !==
        "function"
    ) {

        new Notice(
            "RijksmuseumArtists.js does not export a function."
        );

        return;

    }


    // =================================================
    // RUN
    // =================================================

    await module.exports();


    // =================================================
    // SUCCESS
    // =================================================

    new Notice(
        "Rijksmuseum Artist Index updated."
    );

}


catch (error) {

    console.error(
        "Rijksmuseum Artist Button failed:",
        error
    );


    new Notice(
        "Could not run Rijksmuseum Artist Index. Check the console."
    );

}