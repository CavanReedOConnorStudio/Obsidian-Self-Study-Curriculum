```javascript
module.exports = async function (searchTerm) {

    // =====================================================
    // VALIDATE SEARCH
    // =====================================================

    if (!searchTerm || !searchTerm.trim()) {

        return {
            success: false,
            error: "No search term provided.",
            results: []
        };

    }

    searchTerm = searchTerm.trim();


    // =====================================================
    // SEARCH URL
    // =====================================================

    let nextURL =
        "https://data.rijksmuseum.nl/search/collection?" +
        "type=painting" +
        "&imageAvailable=true" +
        "&creator=" +
        encodeURIComponent(searchTerm);


    try {

        // =================================================
        // COLLECT ALL RESULTS
        // =================================================

        const items = [];

        let page = 1;


        while (nextURL) {

            console.log(
                `Rijksmuseum: loading search page ${page}`
            );


            const response =
                await requestUrl({

                    url: nextURL,
                    method: "GET"

                });


            const data =
                response.json;


            // ---------------------------------------------
            // ADD RESULTS
            // ---------------------------------------------

            if (
                Array.isArray(
                    data.orderedItems
                )
            ) {

                items.push(
                    ...data.orderedItems
                );

            }


            // ---------------------------------------------
            // NEXT PAGE
            // ---------------------------------------------

            nextURL =
                data.next?.id || null;

            page++;

        }


        console.log(
            `Rijksmuseum: ${items.length} results found`
        );


        // =================================================
        // NO RESULTS
        // =================================================

        if (items.length === 0) {

            return {

                success: true,
                searchTerm,
                total: 0,
                results: []

            };

        }


        // =================================================
        // RESULTS
        // =================================================

        const results = [];


        // =================================================
        // PROCESS EVERY RESULT
        // =================================================

        for (
            let index = 0;
            index < items.length;
            index++
        ) {

            const item =
                items[index];


            try {

                console.log(
                    `Rijksmuseum: processing ${index + 1}/${items.length}`
                );


                // =========================================
                // OBJECT RECORD
                // =========================================

                const objectURL =
                    item.id +
                    "?_profile=la-framed";


                const objectResponse =
                    await requestUrl({

                        url: objectURL,
                        method: "GET"

                    });


                const object =
                    objectResponse.json;


                // =========================================
                // TITLE
                // =========================================

                let title =
                    "Untitled";

                let originalTitle =
                    "Untitled";


                const identifiedBy =
                    Array.isArray(
                        object.identified_by
                    )
                        ? object.identified_by
                        : [];


                const titleObject =
                    identifiedBy.find(
                        x =>
                            x.type === "Name"
                    );


                if (
                    titleObject?.content
                ) {

                    title =
                        titleObject.content;

                    originalTitle =
                        titleObject.content;

                }


                // =========================================
                // ARTIST
                // =========================================

                let artist =
                    searchTerm;


                const production =
                    object.produced_by;


                const artistObjects = [];


                // Linked Art can store creators directly
                // or inside production parts.

                if (
                    Array.isArray(
                        production?.carried_out_by
                    )
                ) {

                    artistObjects.push(
                        ...production.carried_out_by
                    );

                }


                if (
                    Array.isArray(
                        production?.part
                    )
                ) {

                    for (
                        const part
                        of production.part
                    ) {

                        if (
                            Array.isArray(
                                part.carried_out_by
                            )
                        ) {

                            artistObjects.push(
                                ...part.carried_out_by
                            );

                        }

                    }

                }


                const artistObject =
                    artistObjects[0];


                if (
                    artistObject
                ) {

                    if (
                        artistObject.name
                    ) {

                        artist =
                            artistObject.name;

                    }

                    else if (
                        Array.isArray(
                            artistObject.identified_by
                        )
                    ) {

                        const artistName =
                            artistObject.identified_by.find(
                                x =>
                                    x.type === "Name"
                            );


                        if (
                            artistName?.content
                        ) {

                            artist =
                                artistName.content;

                        }

                    }

                    else if (
                        Array.isArray(
                            artistObject.notation
                        )
                    ) {

                        const notation =
                            artistObject.notation.find(
                                x =>
                                    x["@value"]
                            );


                        if (
                            notation?.["@value"]
                        ) {

                            artist =
                                notation["@value"];

                        }

                    }

                }


                // =========================================
                // ARTIST NORMALISATION
                // =========================================

                const artistNames = {

                    "Vermeer":
                        "Johannes Vermeer",

                    "Jan Vermeer":
                        "Johannes Vermeer",

                    "Johannes Vermeer":
                        "Johannes Vermeer"

                };


                if (
                    artistNames[artist]
                ) {

                    artist =
                        artistNames[artist];

                }


                // =========================================
                // DATE
                // =========================================

                let dateStart =
                    null;

                let dateEnd =
                    null;

                let dateDisplay =
                    "";


                const timespan =
                    production?.timespan;


                if (
                    Array.isArray(
                        timespan?.identified_by
                    )
                ) {

                    const dateName =
                        timespan.identified_by.find(
                            x =>
                                x.type === "Name"
                        );


                    if (
                        dateName?.content
                    ) {

                        dateDisplay =
                            dateName.content;

                    }

                }


                // -----------------------------------------
                // EXTRACT YEARS
                // -----------------------------------------

                if (
                    dateDisplay
                ) {

                    const years =
                        dateDisplay.match(
                            /\b\d{4}\b/g
                        );


                    if (
                        years &&
                        years.length
                    ) {

                        dateStart =
                            parseInt(
                                years[0]
                            );


                        dateEnd =
                            years.length > 1
                                ? parseInt(
                                    years[1]
                                )
                                : dateStart;

                    }

                }


                // -----------------------------------------
                // MACHINE DATE FALLBACK
                // -----------------------------------------

                if (
                    dateStart === null &&
                    timespan?.begin_of_the_begin
                ) {

                    const year =
                        parseInt(
                            String(
                                timespan.begin_of_the_begin
                            ).substring(0, 4)
                        );


                    if (
                        !isNaN(year)
                    ) {

                        dateStart =
                            year;

                        dateEnd =
                            year;

                        dateDisplay =
                            String(year);

                    }

                }


                // =========================================
                // PERIOD
                // =========================================

                let period =
                    "";


                const periodSources = [

                    object.classified_as,

                    object.about

                ];


                for (
                    const source
                    of periodSources
                ) {

                    if (
                        !Array.isArray(source)
                    ) {

                        continue;

                    }


                    for (
                        const value
                        of source
                    ) {

                        const text =
                            value?.name ||
                            value?.content ||
                            value?.label ||
                            "";


                        if (
                            typeof text === "string" &&
                            /golden age|baroque|renaissance|rococo|romantic|impression|realism|modern/i
                                .test(text)
                        ) {

                            period =
                                text;

                            break;

                        }

                    }


                    if (
                        period
                    ) {

                        break;

                    }

                }


                // -----------------------------------------
                // VERMEER FALLBACK
                // -----------------------------------------

                if (
                    !period &&
                    artist === "Johannes Vermeer"
                ) {

                    period =
                        "Dutch Golden Age";

                }


                // =========================================
                // MEDIUM
                // =========================================

                let medium =
                    "";


                function extractName(value) {

                    if (
                        !value
                    ) {

                        return "";

                    }


                    if (
                        typeof value === "string"
                    ) {

                        return value;

                    }


                    return (
                        value.name ||
                        value.content ||
                        value.label ||
                        ""
                    );

                }


                function collectMedium(source) {

                    if (
                        !source
                    ) {

                        return [];

                    }


                    if (
                        Array.isArray(source)
                    ) {

                        return source
                            .map(
                                extractName
                            )
                            .filter(Boolean);

                    }


                    const value =
                        extractName(source);


                    return value
                        ? [value]
                        : [];

                }


                // Linked Art's production can contain
                // material information in several places.

                const mediumValues = [];


                const mediumSources = [

                    production?.technique,

                    production?.used_specific_object,

                    production?.carried_out_by,

                    object.made_of,

                    object.material,

                    object.materials,

                    object.medium

                ];


                for (
                    const source
                    of mediumSources
                ) {

                    const values =
                        collectMedium(
                            source
                        );


                    for (
                        const value
                        of values
                    ) {

                        if (
                            !mediumValues.includes(value)
                        ) {

                            mediumValues.push(
                                value
                            );

                        }

                    }

                }


                medium =
                    mediumValues.join(
                        ", "
                    );


                // -----------------------------------------
                // COMMON FALLBACK
                // -----------------------------------------

                if (
                    !medium
                ) {

                    medium =
                        "";

                }


                // =========================================
                // OBJECT NUMBER
                // =========================================

                let objectNumber =
                    "";


                for (
                    const identifier
                    of identifiedBy
                ) {

                    if (
                        identifier.type ===
                            "Identifier" &&
                        identifier.content
                    ) {

                        objectNumber =
                            identifier.content;

                        break;

                    }

                }


                // =========================================
                // INSTITUTION
                // =========================================

                const institution =
                    "Rijksmuseum";


                // =========================================
                // IMAGE
                // =========================================

                let imageURL =
                    "";


                const visualItem =
                    object.shows?.[0];


                if (
                    visualItem?.id
                ) {

                    const visualURL =
                        visualItem.id.replace(
                            "id.rijksmuseum.nl",
                            "data.rijksmuseum.nl"
                        );


                    const visualResponse =
                        await requestUrl({

                            url:
                                visualURL +
                                "?_profile=la-framed",

                            method: "GET"

                        });


                    const visual =
                        visualResponse.json;


                    const digitalObject =
                        visual.digitally_shown_by?.[0];


                    if (
                        digitalObject?.id
                    ) {

                        const digitalURL =
                            digitalObject.id.replace(
                                "id.rijksmuseum.nl",
                                "data.rijksmuseum.nl"
                            );


                        const digitalResponse =
                            await requestUrl({

                                url:
                                    digitalURL +
                                    "?_profile=la-framed",

                                method: "GET"

                            });


                        const digital =
                            digitalResponse.json;


                        const accessPoint =
                            digital.access_point?.find(
                                x =>
                                    x.id &&
                                    x.id.includes(
                                        "iiif.micr.io"
                                    )
                            );


                        if (
                            accessPoint?.id
                        ) {

                            const iiifBase =
                                accessPoint.id.replace(
                                    /\/full\/.*$/,
                                    ""
                                );


                            imageURL =
                                iiifBase +
                                "/full/800,/0/default.jpg";

                        }

                    }

                }


                // =========================================
                // SAVE RESULT
                // =========================================

                results.push({

                    title,

                    originalTitle,

                    artist,

                    dateStart,

                    dateEnd,

                    dateDisplay,

                    period,

                    medium,

                    institution,

                    objectNumber,

                    museumURL:
                        item.id,

                    imageURL

                });

            }


            catch (error) {

                console.error(
                    "Could not retrieve artwork:",
                    item.id,
                    error
                );

            }

        }


        // =================================================
        // RETURN
        // =================================================

        return {

            success: true,

            searchTerm,

            total:
                results.length,

            results

        };

    }


    catch (error) {

        console.error(
            "Rijksmuseum search failed:",
            error
        );


        return {

            success: false,

            error:
                error.message,

            results: []

        };

    }

};
```

## 2. `ArtworkButton.js`

Now replace the **entire** contents of your working `ArtworkButton.js` with this version.

```javascript
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

async function ensureFolder(
    path
) {

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

function safeFileName(
    value
) {

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

function yamlString(
    value
) {

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

    if (
        !name
    ) {

        return;

    }


    const cleanName =
        safeFileName(
            name
        );


    if (
        !cleanName
    ) {

        return;

    }


    const filePath =
        `${folder}/${cleanName}.md`;


    const existing =
        app.vault.getAbstractFileByPath(
            filePath
        );


    // Never overwrite existing notes.

    if (
        existing
    ) {

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

    else if (
        type === "institution"
    ) {

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

    else if (
        type === "period"
    ) {

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


    if (
        content
    ) {

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


if (
    !fileName
) {

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


if (
    existingArtwork
) {

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

# ${artwork.title}

${image}

## Looking

### Function

### Patron

### Materials

### Composition

### Light

### Precedent

## My Observations

## Relation to My Practice

## Further Research
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
```

