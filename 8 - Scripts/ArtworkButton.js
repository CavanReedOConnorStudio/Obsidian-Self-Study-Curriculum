module.exports = async function (tp) {

    const selectionPath =
        "4 - Appendix/.artwork-selection.json";

    const selectionFile =
        app.vault.getAbstractFileByPath(
            selectionPath
        );

    if (!selectionFile) {

        new Notice(
            "No artwork selected."
        );

        return;

    }

    const selectionData =
        await app.vault.read(
            selectionFile
        );

    let artwork;

    try {

        artwork =
            JSON.parse(selectionData);

    } catch (error) {

        new Notice(
            "Could not read artwork selection."
        );

        return;

    }

    await tp.user.SaveArtwork(
        artwork
    );

    await app.vault.delete(
        selectionFile
    );

};