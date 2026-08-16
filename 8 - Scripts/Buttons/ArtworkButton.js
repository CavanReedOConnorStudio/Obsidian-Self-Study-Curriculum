// =====================================================
// RECEIVE ARTWORK
// =====================================================

const encoded =
    context.args?.artwork;


// =====================================================
// CHECK ARTWORK
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
            decodeURIComponent(encoded)
        );

}

catch (error) {

    new Notice(
        "Could not read artwork data."
    );

    console.error(
        "ArtworkButton decode error:",
        error
    );

    return;

}


// =====================================================
// DEBUG
// =====================================================

console.log(
    "Artwork received:",
    artwork
);


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
// ENSURE FOLDER EXISTS
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
// CREATE REQUIRED FOLDERS
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
        safeFileName(name);


    if (!cleanName) {

        return;

    }


    const filePath =
        `${folder}/${cleanName}.md`;


    const existing =
        app.vault.getAbstractFileByPath(
            filePath
        );


    // Never overwrite an existing note.

    if (existing) {

        return;

    }


    let content = "";


    // =================================================
    // ARTIST
    // =================================================

    if (type === "artist") {

        content =
`---
name: ${yamlString(name)}
type: "Artist"
---

# ${name}

## Biography

## Artistic Context

## Major Works

## Relation to My Practice

## Further Research
`;

    }


    // =================================================
    // INSTITUTION
    // =================================================

    if (type === "institution") {

        content =
`---
name: ${yamlString(name)}
type: "Institution"
---

# ${name}

## History

## Collection

## Significance

## Further Research
`;

    }


    // =================================================
    // PERIOD
    // =================================================

    if (type === "period") {

        content =
`---
name: ${yamlString(name)}
type: "Period"
---

# ${name}

## Historical Context

## Characteristics

## Major Artists

## Major Works

## Relation to My Practice

## Further Research
`;

    }


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

if (artwork.artist) {

    await createLinkedNote(
        artistFolder,
        artwork.artist,
        "artist"
    );

}


// =====================================================
// CREATE INSTITUTION NOTE
// =====================================================

if (artwork.institution) {

    await createLinkedNote(
        institutionFolder,
        artwork.institution,
        "institution"
    );

}


// =====================================================
// CREATE PERIOD NOTE
// =====================================================

if (artwork.period) {

    await createLinkedNote(
        periodFolder,
        artwork.period,
        "period"
    );

}


// =====================================================
// ARTWORK TITLE
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
// CHECK FOR DUPLICATE
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

artist: ${artistLink}

date_start: ${artwork.dateStart ?? ""}
date_end: ${artwork.dateEnd ?? ""}
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

source_id: ${yamlString(
    artwork.objectNumber
)}

source_url: ${yamlString(
    artwork.museumURL
)}

image_url: ${yamlString(
    artwork.imageURL
)}
---


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