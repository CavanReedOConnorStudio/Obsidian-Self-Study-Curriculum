module.exports = async function (artwork) {

    // =====================================================
    // SETTINGS
    // =====================================================

    const templatePath =
        "7 - Templates/Artwork Template.md";

    const baseFolder =
        "4 - Appendix";

    const artworkFolder =
        `${baseFolder}/Artworks`;

    const artistFolder =
        `${baseFolder}/Artists`;

    const periodFolder =
        `${baseFolder}/Periods`;

    const mediumFolder =
        `${baseFolder}/Mediums`;

    const institutionFolder =
        `${baseFolder}/Institutions`;

    const subjectFolder =
        `${baseFolder}/Subjects`;

    const themeFolder =
        `${baseFolder}/Themes`;


    // =====================================================
    // CHECK ARTWORK DATA
    // =====================================================

    if (!artwork || !artwork.title) {

        new Notice(
            "No artwork data was supplied."
        );

        return;

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

        return;

    }


    // =====================================================
    // CREATE FOLDERS
    // =====================================================

    await ensureFolder(artworkFolder);
    await ensureFolder(artistFolder);
    await ensureFolder(periodFolder);
    await ensureFolder(mediumFolder);
    await ensureFolder(institutionFolder);
    await ensureFolder(subjectFolder);
    await ensureFolder(themeFolder);


    // =====================================================
    // CLEAN ARTWORK TITLE
    // =====================================================

    const safeTitle =
        cleanFilename(
            artwork.title
        );


    const artworkPath =
        `${artworkFolder}/${safeTitle}.md`;


    // =====================================================
    // CHECK DUPLICATE ARTWORK
    // =====================================================

    if (
        app.vault.getAbstractFileByPath(
            artworkPath
        )
    ) {

        new Notice(
            `"${safeTitle}" already exists in Artwork Bank.`
        );

        return;

    }


    // =====================================================
    // NORMALISE ARTIST
    // =====================================================

    const artistName =
        cleanName(
            artwork.artist
        );


    // =====================================================
    // DEFAULT / EMPTY VALUES
    // =====================================================

    const periodName =
        artwork.period || "";

    const mediumName =
        artwork.medium || "";

    const institutionName =
        artwork.institution ||
        "Rijksmuseum";


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


    if (mediumName) {

        await createReferenceNote(
            mediumName,
            mediumFolder,
            "Medium"
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
    // SUBJECTS
    // =====================================================

    const subjects =
        Array.isArray(
            artwork.subjects
        )
            ? artwork.subjects
            : [];


    for (
        const subject
        of subjects
    ) {

        if (subject) {

            await createReferenceNote(
                subject,
                subjectFolder,
                "Subject"
            );

        }

    }


    // =====================================================
    // THEMES
    // =====================================================

    const themes =
        Array.isArray(
            artwork.themes
        )
            ? artwork.themes
            : [];


    for (
        const theme
        of themes
    ) {

        if (theme) {

            await createReferenceNote(
                theme,
                themeFolder,
                "Theme"
            );

        }

    }


    // =====================================================
    // READ TEMPLATE
    // =====================================================

    let content =
        await app.vault.read(
            template
        );


    // =====================================================
    // YAML LINKS
    // =====================================================

    const artistLink =
        artistName
            ? `[[${artistName}]]`
            : "";


    const periodLink =
        periodName
            ? `[[${periodName}]]`
            : "";


    const mediumLink =
        mediumName
            ? `[[${mediumName}]]`
            : "";


    const institutionLink =
        institutionName
            ? `[[${institutionName}]]`
            : "";


    // =====================================================
    // SUBJECT LINKS
    // =====================================================

    const subjectYaml =
        subjects.length > 0

            ? subjects
                .map(
                    subject =>
                        `  - "[[${cleanName(subject)}]]"`
                )
                .join("\n")

            : "  -";


    // =====================================================
    // THEME LINKS
    // =====================================================

    const themeYaml =
        themes.length > 0

            ? themes
                .map(
                    theme =>
                        `  - "[[${cleanName(theme)}]]"`
                )
                .join("\n")

            : "  -";


    // =====================================================
    // BUILD FRONTMATTER
    // =====================================================

    const frontmatter =
`---
title: "${escapeYaml(artwork.title)}"
original_title: "${escapeYaml(artwork.originalTitle || "")}"

artist: "${escapeYaml(artistLink)}"

date_start: ${artwork.dateStart ?? ""}
date_end: ${artwork.dateEnd ?? ""}
date_display: "${escapeYaml(artwork.dateDisplay || "")}"

period: "${escapeYaml(periodLink)}"

medium: "${escapeYaml(mediumLink)}"

institution: "${escapeYaml(institutionLink)}"

source: "Rijksmuseum"
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
    // CREATE ARTWORK
    // =====================================================

    await app.vault.create(
        artworkPath,
        content
    );


    // =====================================================
    // SUCCESS
    // =====================================================

    new Notice(
        `Saved "${safeTitle}" to Artwork Bank.`
    );


    // =====================================================
    // OPEN ARTWORK
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

};


// =========================================================
// CREATE FOLDER
// =========================================================

async function ensureFolder(path) {

    if (
        !app.vault.getAbstractFileByPath(
            path
        )
    ) {

        await app.vault.createFolder(
            path
        );

    }

}


// =========================================================
// CREATE REFERENCE NOTE
// =========================================================

async function createReferenceNote(
    name,
    folder,
    type
) {

    const clean =
        cleanFilename(name);

    if (!clean) {
        return;
    }


    const path =
        `${folder}/${clean}.md`;


    // Already exists

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
// CLEAN FILENAME
// =========================================================

function cleanFilename(value) {

    return String(value || "")
        .replace(/[\\/:*?"<>|]/g, "")
        .trim();

}


// =========================================================
// CLEAN LINK NAME
// =========================================================

function cleanName(value) {

    return String(value || "")
        .replace(/\[\[/g, "")
        .replace(/\]\]/g, "")
        .trim();

}


// =========================================================
// YAML ESCAPING
// =========================================================

function escapeYaml(value) {

    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, " ");

}