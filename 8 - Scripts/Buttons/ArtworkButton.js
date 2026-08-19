// =====================================================
// ARTWORK BUTTON
// =====================================================

const encoded =
    context.args?.artwork;


// =====================================================
// VALIDATE ARTWORK
// =====================================================

if (!encoded) {

    new Notice(
        "No artwork received."
    );

    return;

}


// =====================================================
// DECODE ARTWORK
// =====================================================

let artwork;

try {

    artwork =
        JSON.parse(
            decodeURIComponent(
                encoded
            )
        );

}

catch (error) {

    new Notice(
        "Could not read artwork data."
    );

    console.error(
        error
    );

    return;

}


// =====================================================
// FOLDERS
// =====================================================

const artworkFolder =
    "4 - Appendix/Artworks";

const artistFolder =
    "4 - Appendix/Artists";

const institutionFolder =
    "4 - Appendix/Institutions";

const periodFolder =
    "4 - Appendix/Periods";


// =====================================================
// ENSURE FOLDER
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


// =====================================================
// CREATE FOLDERS
// =====================================================

await ensureFolder(
    "4 - Appendix"
);

await ensureFolder(
    artworkFolder
);

await ensureFolder(
    artistFolder
);

await ensureFolder(
    institutionFolder
);

await ensureFolder(
    periodFolder
);


// =====================================================
// SAFE FILE NAME
// =====================================================

function safeFileName(value) {

    return String(
        value || ""
    )
        .replace(
            /[\\/:*?"<>|]/g,
            ""
        )
        .trim();

}


// =====================================================
// YAML STRING
// =====================================================

function yamlString(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }

    return `"${String(value)
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
        )}"`;

}


// =====================================================
// CREATE LINKED NOTE
// =====================================================

async function createLinkedNote(
    folder,
    name,
    type
) {

    if (!name) {

        return;

    }


    const cleanName =
        safeFileName(
            name
        );


    if (!cleanName) {

        return;

    }


    const filePath =
        `${folder}/${cleanName}.md`;


    const existing =
        app.vault.getAbstractFileByPath(
            filePath
        );


    // Never overwrite existing notes.

    if (existing) {

        return;

    }


    let content =
        "";


    // =================================================
    // ARTIST
    // =================================================

    if (
        type === "artist"
    ) {

        content =
`---
name: ${yamlString(name)}
type: "Artist"
tags:
  - artist
---

# ${name}
`;

    }


    // =================================================
    // INSTITUTION
    // =================================================

    else if (
        type === "institution"
    ) {

        content =
`---
name: ${yamlString(name)}
type: "Institution"
tags:
  - institution
---

# ${name}
`;

    }


    // =================================================
    // PERIOD
    // =================================================

    else if (
        type === "period"
    ) {

        content =
`---
name: ${yamlString(name)}
type: "Period"
tags:
  - period
---

# ${name}
`;

    }


    // =================================================
    // CREATE NOTE
    // =================================================

    if (content) {

        await app.vault.create(
            filePath,
            content
        );

    }

}


// =====================================================
// CREATE ARTIST NOTE
// =====================================================

if (
    artwork.artist
) {

    await createLinkedNote(
        artistFolder,
        artwork.artist,
        "artist"
    );

}


// =====================================================
// CREATE INSTITUTION NOTE
// =====================================================

if (
    artwork.institution
) {

    await createLinkedNote(
        institutionFolder,
        artwork.institution,
        "institution"
    );

}


// =====================================================
// CREATE PERIOD NOTE
// =====================================================

if (
    artwork.period
) {

    await createLinkedNote(
        periodFolder,
        artwork.period,
        "period"
    );

}


// =====================================================
// ARTWORK FILE NAME
// =====================================================

const fileName =
    safeFileName(
        artwork.title
    );


if (!fileName) {

    new Notice(
        "Artwork has no title."
    );

    return;

}


const filePath =
    `${artworkFolder}/${fileName}.md`;


// =====================================================
// DUPLICATE CHECK
// =====================================================

const existingArtwork =
    app.vault.getAbstractFileByPath(
        filePath
    );


if (existingArtwork) {

    new Notice(
        `"${artwork.title}" already exists.`
    );

    return;

}


// =====================================================
// WIKI LINKS
// =====================================================

const artistLink =
    artwork.artist
        ? `"[[${artwork.artist}]]"`
        : "";

const periodLink =
    artwork.period
        ? `"[[${artwork.period}]]"`
        : "";

const institutionLink =
    artwork.institution
        ? `"[[${artwork.institution}]]"`
        : "";


// =====================================================
// IMAGE
// =====================================================

const image =
    artwork.imageURL
        ? `![${artwork.title}](${artwork.imageURL})`
        : "";


// =====================================================
// ARTWORK NOTE
// =====================================================

const content =
`---
title: ${yamlString(
    artwork.title
)}

original_title: ${yamlString(
    artwork.originalTitle
)}

type: "Artwork"

tags:
  - artwork

artist: ${artistLink}

date_start: ${artwork.dateStart}
date_end: ${artwork.dateEnd}
date_display: ${yamlString(
    artwork.dateDisplay
)}

period: ${periodLink}

medium: ${yamlString(
    artwork.medium
)}

institution: ${institutionLink}

source: ${yamlString(
    artwork.source || "Rijksmuseum"
)}

source_url: ${yamlString(
    artwork.museumURL
)}

image_url: ${yamlString(
    artwork.imageURL
)}
---

# ${artwork.title}

${image}
`;


// =====================================================
// CREATE ARTWORK
// =====================================================

await app.vault.create(
    filePath,
    content
);


// =====================================================
// SUCCESS
// =====================================================

new Notice(
    `Saved "${artwork.title}" to Artwork Bank.`
);