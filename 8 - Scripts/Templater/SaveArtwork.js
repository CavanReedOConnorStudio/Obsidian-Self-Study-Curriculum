module.exports = async function (artwork) {

    // =====================================================
    // SETTINGS
    // =====================================================

    const baseFolder =
        "4 - Appendix";

    const artworkFolder =
        `${baseFolder}/Artworks`;

    const artistFolder =
        `${baseFolder}/Artists`;

    const periodFolder =
        `${baseFolder}/Periods`;

    const institutionFolder =
        `${baseFolder}/Institutions`;

    const subjectFolder =
        `${baseFolder}/Subjects`;

    const themeFolder =
        `${baseFolder}/Themes`;

    const templatePath =
        "7 - Templates/Artwork Template.md";


    // =====================================================
    // CHECK ARTWORK DATA
    // =====================================================

    if (!artwork || !artwork.title) {

        new Notice(
            "No artwork data was supplied."
        );

        return null;
    }


    // =====================================================
    // CHECK TEMPLATE
    // =====================================================

    const template =
        app.vault.getAbstractFileByPath(
            templatePath
        );

    if (!template) {

        new Notice(
            `Artwork template not found:\n${templatePath}`
        );

        return null;
    }


    // =====================================================
    // CREATE REQUIRED FOLDERS
    // =====================================================

    await ensureFolder(artworkFolder);
    await ensureFolder(artistFolder);
    await ensureFolder(periodFolder);
    await ensureFolder(institutionFolder);
    await ensureFolder(subjectFolder);
    await ensureFolder(themeFolder);


    // =====================================================
    // ARTWORK TITLE
    // =====================================================

    const artworkTitle =
        cleanName(artwork.title);

    const artworkFilename =
        cleanFilename(artworkTitle);

    const artworkPath =
        `${artworkFolder}/${artworkFilename}.md`;


    // =====================================================
    // DUPLICATE CHECK
    // =====================================================

    if (
        app.vault.getAbstractFileByPath(
            artworkPath
        )
    ) {

        new Notice(
            `"${artworkTitle}" already exists.`
        );

        return null;
    }


    // =====================================================
    // NORMALISE DATA
    // =====================================================

    const artistName =
        cleanName(
            artwork.artist
        );

    const periodName =
        cleanName(
            artwork.period
        );

    const mediumName =
        cleanName(
            artwork.medium
        );

    const institutionName =
        cleanName(
            artwork.institution
        );

    const subjects =
        normaliseArray(
            artwork.subjects
        );

    const themes =
        normaliseArray(
            artwork.themes
        );


    // =====================================================
    // CREATE REFERENCE NOTES
    // =====================================================

    if (artistName) {

        await createReferenceNote(
            artistName,
            artistFolder,
            "Artist"
        );
    }


    if (periodName) {

        await createReferenceNote(
            periodName,
            periodFolder,
            "Period"
        );
    }


    if (institutionName) {

        await createReferenceNote(
            institutionName,
            institutionFolder,
            "Institution"
        );
    }


    // =====================================================
    // SUBJECT NOTES
    // =====================================================

    for (const subject of subjects) {

        await createReferenceNote(
            subject,
            subjectFolder,
            "Subject"
        );
    }


    // =====================================================
    // THEME NOTES
    // =====================================================

    for (const theme of themes) {

        await createReferenceNote(
            theme,
            themeFolder,
            "Theme"
        );
    }


    // =====================================================
    // READ ARTWORK TEMPLATE
    // =====================================================

    let content =
        await app.vault.read(
            template
        );


    // =====================================================
    // BUILD LINKS
    // =====================================================

    const artistLink =
        artistName
            ? `[[${artistName}]]`
            : "";

    const periodLink =
        periodName
            ? `[[${periodName}]]`
            : "";

    const institutionLink =
        institutionName
            ? `[[${institutionName}]]`
            : "";


    // =====================================================
    // SUBJECT YAML
    // =====================================================

    const subjectYaml =
        subjects.length

            ? subjects
                .map(
                    subject =>
                        `  - "[[${escapeYaml(subject)}]]"`
                )
                .join("\n")

            : "  -";


    // =====================================================
    // THEME YAML
    // =====================================================

    const themeYaml =
        themes.length

            ? themes
                .map(
                    theme =>
                        `  - "[[${escapeYaml(theme)}]]"`
                )
                .join("\n")

            : "  -";


    // =====================================================
    // BUILD FRONTMATTER
    // =====================================================

    const frontmatter =
`---
title: "${escapeYaml(artworkTitle)}"
original_title: "${escapeYaml(artwork.originalTitle || "")}"

artist: "${escapeYaml(artistLink)}"

date_start: ${artwork.dateStart ?? ""}
date_end: ${artwork.dateEnd ?? ""}
date_display: "${escapeYaml(artwork.dateDisplay || "")}"

period: "${escapeYaml(periodLink)}"

medium: "${escapeYaml(mediumName)}"

institution: "${escapeYaml(institutionLink)}"

source: "${escapeYaml(artwork.source || "Rijksmuseum")}"
source_id: "${escapeYaml(artwork.objectNumber || "")}"
source_url: "${escapeYaml(artwork.museumURL || "")}"

image_url: "${escapeYaml(artwork.imageURL || "")}"

subjects:
${subjectYaml}

themes:
${themeYaml}
---`;


    // =====================================================
    // REPLACE TEMPLATE FRONTMATTER
    // =====================================================

    content =
        content.replace(
            /^---[\s\S]*?---/,
            frontmatter
        );


    // =====================================================
    // CREATE ARTWORK NOTE
    // =====================================================

    await app.vault.create(
        artworkPath,
        content
    );


    // =====================================================
    // SUCCESS MESSAGE
    // =====================================================

    new Notice(
        `Saved "${artworkTitle}" to Artwork Bank.`
    );


    // =====================================================
    // OPEN NEW ARTWORK
    // =====================================================

    const newFile =
        app.vault.getAbstractFileByPath(
            artworkPath
        );

    if (newFile) {

        await app.workspace
            .getLeaf(false)
            .openFile(newFile);
    }


    // =====================================================
    // RETURN FILE
    // =====================================================

    return newFile;
};


// =========================================================
// ENSURE FOLDER EXISTS
// =========================================================

async function ensureFolder(path) {

    if (
        app.vault.getAbstractFileByPath(
            path
        )
    ) {

        return;
    }

    await app.vault.createFolder(
        path
    );
}


// =========================================================
// CREATE REFERENCE NOTE
// =========================================================

async function createReferenceNote(
    name,
    folder,
    type
) {

    if (!name) {
        return;
    }


    const filename =
        cleanFilename(name);

    const path =
        `${folder}/${filename}.md`;


    // Don't overwrite an existing note

    if (
        app.vault.getAbstractFileByPath(
            path
        )
    ) {

        return;
    }


    const content =
`---
name: "${escapeYaml(name)}"
type: "${type}"
---

# ${name}

## Artworks

`;


    await app.vault.create(
        path,
        content
    );
}


// =========================================================
// NORMALISE ARRAY
// =========================================================

function normaliseArray(value) {

    if (!Array.isArray(value)) {

        return [];
    }


    return value

        .map(
            item =>
                cleanName(item)
        )

        .filter(
            item =>
                item.length > 0
        );
}


// =========================================================
// CLEAN NAME
// =========================================================

function cleanName(value) {

    return String(value || "")

        .replace(/\[\[/g, "")

        .replace(/\]\]/g, "")

        .trim();
}


// =========================================================
// CLEAN FILENAME
// =========================================================

function cleanFilename(value) {

    return String(value || "")

        .replace(
            /[\\/:*?"<>|]/g,
            ""
        )

        .trim();
}


// =========================================================
// ESCAPE YAML
// =========================================================

function escapeYaml(value) {

    return String(value || "")

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /"/g,
            '\\"'
        )

        .replace(
            /\n/g,
            " "
        );
}