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

        const items = [];
        let page = 1;


        // =================================================
        // COLLECT ALL RESULTS
        // =================================================

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


            if (
                Array.isArray(data.orderedItems)
            ) {

                items.push(
                    ...data.orderedItems
                );

            }


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
        // HELPER — EXTRACT TEXT
        // =================================================

        function extractText(value) {

            if (!value) {
                return "";
            }


            if (
                typeof value === "string"
            ) {

                return value;

            }


            return (
                value.content ||
                value.name ||
                value.label ||
                value._label ||
                value.value ||
                value["@value"] ||
                ""
            );

        }


        // =================================================
        // HELPER — ENGLISH VALUE
        // =================================================

        function englishValue(value) {

            if (!value) {
                return "";
            }


            if (Array.isArray(value)) {

                for (
                    const item
                    of value
                ) {

                    const result =
                        englishValue(item);

                    if (result) {
                        return result;
                    }

                }

                return "";

            }


            if (
                typeof value !== "object"
            ) {

                return "";

            }


            let language = "";


            if (
                Array.isArray(value.language)
            ) {

                for (
                    const languageObject
                    of value.language
                ) {

                    const languageLabel =
                        String(
                            languageObject?._label ||
                            languageObject?.label ||
                            ""
                        )
                        .toLowerCase()
                        .trim();


                    if (
                        languageLabel === "english"
                    ) {

                        language = "en";
                        break;

                    }

                }

            }


            language =
                language ||
                String(
                    value["@language"] ||
                    value.language ||
                    value.lang ||
                    value["xml:lang"] ||
                    ""
                )
                .toLowerCase()
                .trim();


            const content =
                value["@value"] ||
                value.content ||
                value.value ||
                value.name ||
                value.label ||
                "";


            if (
                (
                    language === "en" ||
                    language === "eng" ||
                    language.includes("english")
                ) &&
                content
            ) {

                return String(
                    content
                ).trim();

            }


            return "";

        }


        // =================================================
        // HELPER — PREFERRED NAME
        // =================================================

        function isPreferredName(identifier) {

            if (
                !identifier ||
                identifier.type !== "Name"
            ) {

                return false;

            }


            const classifications =
                Array.isArray(
                    identifier.classified_as
                )
                    ? identifier.classified_as
                    : [];


            return classifications.some(
                classification => {

                    const id =
                        String(
                            classification?.id ||
                            ""
                        );


                    const label =
                        String(
                            classification?._label ||
                            classification?.label ||
                            ""
                        )
                        .toLowerCase();


                    return (
                        id.includes("300404670") ||
                        label.includes("primary name") ||
                        label.includes("preferred") ||
                        label.includes("title")
                    );

                }
            );

        }


        // =================================================
        // HELPER — ARTIST NAME
        // =================================================

        async function getArtistName(actor) {

            if (!actor) {
                return "";
            }


            // ---------------------------------------------
            // Preferred name directly available
            // ---------------------------------------------

            if (
                Array.isArray(
                    actor.identified_by
                )
            ) {

                for (
                    const identifier
                    of actor.identified_by
                ) {

                    if (
                        isPreferredName(identifier) &&
                        identifier.content
                    ) {

                        return String(
                            identifier.content
                        ).trim();

                    }

                }

            }


            // ---------------------------------------------
            // English name
            // ---------------------------------------------

            if (
                Array.isArray(
                    actor.identified_by
                )
            ) {

                for (
                    const identifier
                    of actor.identified_by
                ) {

                    if (
                        identifier?.type !== "Name"
                    ) {

                        continue;

                    }


                    const english =
                        englishValue(
                            identifier
                        );


                    if (english) {

                        return english;

                    }

                }

            }


            // ---------------------------------------------
            // Resolve artist entity
            // ---------------------------------------------

            if (actor.id) {

                try {

                    const artistResponse =
                        await requestUrl({
                            url:
                                actor.id +
                                "?_profile=la-framed",
                            method: "GET"
                        });


                    const artistObject =
                        artistResponse.json;


                    if (
                        Array.isArray(
                            artistObject.identified_by
                        )
                    ) {

                        // Preferred name

                        for (
                            const identifier
                            of artistObject.identified_by
                        ) {

                            if (
                                isPreferredName(identifier) &&
                                identifier.content
                            ) {

                                return String(
                                    identifier.content
                                ).trim();

                            }

                        }


                        // English name

                        for (
                            const identifier
                            of artistObject.identified_by
                        ) {

                            if (
                                identifier?.type !== "Name"
                            ) {

                                continue;

                            }


                            const english =
                                englishValue(
                                    identifier
                                );


                            if (english) {

                                return english;

                            }

                        }

                    }

                }

                catch (error) {

                    console.warn(
                        "Could not resolve artist entity:",
                        actor.id,
                        error
                    );

                }

            }


            // ---------------------------------------------
            // Final fallback
            // ---------------------------------------------

            return String(
                actor._label ||
                actor.label ||
                actor.name ||
                ""
            ).trim();

        }


        // =================================================
        // HELPER — NORMALISE ARTIST
        // =================================================

        function normaliseArtistName(name) {

            if (!name) {
                return "";
            }


            let cleaned =
                String(name)
                    .trim()
                    .replace(/\s+/g, " ");


            const artistNames = {

                "Goya":
                    "Francisco de Goya",

                "Francisco Goya":
                    "Francisco de Goya",

                "Goya, Francisco de":
                    "Francisco de Goya",

                "Francisco de Goya":
                    "Francisco de Goya",

                "Vermeer":
                    "Johannes Vermeer",

                "Jan Vermeer":
                    "Johannes Vermeer",

                "Johannes Vermeer":
                    "Johannes Vermeer",

                "Rembrandt":
                    "Rembrandt van Rijn",

                "Rembrandt van Rijn":
                    "Rembrandt van Rijn",

                "El Greco":
                    "El Greco"

            };


            return (
                artistNames[cleaned] ||
                cleaned
            );

        }


        // =================================================
        // HELPER — EXTRACT ARTISTS
        // =================================================

        async function extractArtists(production) {

            const artistObjects = [];


            if (!production) {
                return [];
            }


            if (
                Array.isArray(
                    production.carried_out_by
                )
            ) {

                artistObjects.push(
                    ...production.carried_out_by
                );

            }


            if (
                Array.isArray(
                    production.part
                )
            ) {

                for (
                    const part
                    of production.part
                ) {

                    if (
                        Array.isArray(
                            part?.carried_out_by
                        )
                    ) {

                        artistObjects.push(
                            ...part.carried_out_by
                        );

                    }

                }

            }


            const names = [];


            for (
                const artistObject
                of artistObjects
            ) {

                const rawName =
                    await getArtistName(
                        artistObject
                    );


                const name =
                    normaliseArtistName(
                        rawName
                    );


                if (
                    name &&
                    !names.includes(name)
                ) {

                    names.push(name);

                }

            }


            return names;

        }


        // =================================================
        // HELPER — NORMALISE MEDIUM
        // =================================================

        function normaliseMedium(value) {

            let text =
                extractText(value);


            if (!text) {
                return "";
            }


            const replacements = [

                [
                    /\bolieverf op doek\b/gi,
                    "Oil on canvas"
                ],

                [
                    /\bolieverf op paneel\b/gi,
                    "Oil on panel"
                ],

                [
                    /\bolieverf op hout\b/gi,
                    "Oil on wood"
                ],

                [
                    /\bolieverf op papier\b/gi,
                    "Oil on paper"
                ],

                [
                    /\bolieverf\b/gi,
                    "Oil paint"
                ],

                [
                    /\baquarel op papier\b/gi,
                    "Watercolour on paper"
                ],

                [
                    /\baquarel\b/gi,
                    "Watercolour"
                ],

                [
                    /\btempera op paneel\b/gi,
                    "Tempera on panel"
                ],

                [
                    /\btempera\b/gi,
                    "Tempera"
                ],

                [
                    /\binkt op papier\b/gi,
                    "Ink on paper"
                ],

                [
                    /\bpotlood op papier\b/gi,
                    "Pencil on paper"
                ],

                [
                    /\bkrijt op papier\b/gi,
                    "Chalk on paper"
                ],

                [
                    /\bhoutskool op papier\b/gi,
                    "Charcoal on paper"
                ],

                [
                    /\bets\b/gi,
                    "Etching"
                ],

                [
                    /\bgravure\b/gi,
                    "Engraving"
                ]

            ];


            for (
                const [
                    pattern,
                    replacement
                ]
                of replacements
            ) {

                text =
                    text.replace(
                        pattern,
                        replacement
                    );

            }


            return text.trim();

        }


        // =================================================
        // PROCESS EVERY ARTWORK
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


                // -----------------------------------------
                // OBJECT
                // -----------------------------------------

                const objectResponse =
                    await requestUrl({
                        url:
                            item.id +
                            "?_profile=la-framed",
                        method: "GET"
                    });


                const object =
                    objectResponse.json;


                const identifiedBy =
                    Array.isArray(
                        object.identified_by
                    )
                        ? object.identified_by
                        : [];


                // =================================================
                // TITLE
                // =================================================

                let originalTitle = "";
                let englishTitle = "";


                // Preferred/current title

                const preferredTitle =
                    identifiedBy.find(
                        identifier =>
                            isPreferredName(
                                identifier
                            ) &&
                            identifier.content
                    );


                if (
                    preferredTitle?.content
                ) {

                    originalTitle =
                        String(
                            preferredTitle.content
                        ).trim();

                }


                // Fallback to a Name that isn't explicitly
                // marked as a former/alternative title.

                if (!originalTitle) {

                    const fallbackTitle =
                        identifiedBy.find(
                            identifier => {

                                if (
                                    identifier?.type !== "Name" ||
                                    !identifier?.content
                                ) {

                                    return false;

                                }


                                const label =
                                    String(
                                        identifier?._label ||
                                        identifier?.label ||
                                        ""
                                    )
                                    .toLowerCase();


                                return (
                                    !label.includes("former") &&
                                    !label.includes("alternative") &&
                                    !label.includes("former title")
                                );

                            }
                        );


                    if (
                        fallbackTitle?.content
                    ) {

                        originalTitle =
                            String(
                                fallbackTitle.content
                            ).trim();

                    }

                }


                // English title from Name records only

                for (
                    const identifier
                    of identifiedBy
                ) {

                    if (
                        identifier?.type !== "Name"
                    ) {

                        continue;

                    }


                    const english =
                        englishValue(
                            identifier
                        );


                    if (english) {

                        englishTitle =
                            english;

                        break;

                    }

                }


                const title =
                    englishTitle ||
                    originalTitle ||
                    "Untitled";


                console.log(
                    `Title: ${title}`
                );


                // =================================================
                // ARTIST
                // =================================================

                let artist =
                    searchTerm;


                const artistNames =
                    await extractArtists(
                        object.produced_by
                    );


                if (
                    artistNames.length > 0
                ) {

                    artist =
                        artistNames[0];

                }


                artist =
                    normaliseArtistName(
                        artist
                    );


                console.log(
                    `Artist: ${artist}`
                );


                // =================================================
                // DATE
                // =================================================

                let dateStart = null;
                let dateEnd = null;
                let dateDisplay = "";


                const production =
                    object.produced_by;


                const timespan =
                    production?.timespan;


                if (
                    Array.isArray(
                        timespan?.identified_by
                    )
                ) {

                    const dateName =
                        timespan.identified_by.find(
                            value =>
                                value?.type === "Name"
                        );


                    if (dateName) {

                        dateDisplay =
                            extractText(
                                dateName
                            );

                    }

                }


                if (dateDisplay) {

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
                                ? parseInt(years[1])
                                : dateStart;

                    }

                }


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


                    if (!isNaN(year)) {

                        dateStart = year;
                        dateEnd = year;
                        dateDisplay = String(year);

                    }

                }


                // =================================================
                // PHYSICAL DESCRIPTION
                // =================================================

                let physicalDescription = "";


                const statements =
                    Array.isArray(
                        object.referred_to_by
                    )
                        ? object.referred_to_by
                        : [];


                for (
                    const statement
                    of statements
                ) {

                    const text =
                        extractText(statement);


                    if (!text) {
                        continue;
                    }


                    const lower =
                        text.toLowerCase();


                    if (
                        lower.includes("fysieke kenmerken") ||
                        lower.includes("physical characteristics") ||
                        lower.includes("olieverf") ||
                        lower.includes("oil on") ||
                        lower.includes("oil paint")
                    ) {

                        physicalDescription =
                            text;

                        break;

                    }

                }


                // =================================================
                // MEDIUM
                // =================================================

                let medium = "";


                if (physicalDescription) {

                    medium =
                        normaliseMedium(
                            physicalDescription
                        );

                }


                if (!medium) {

                    const mediumSources = [

                        object.made_of,
                        object.material,
                        object.materials,
                        production?.technique

                    ];


                    const mediumValues = [];


                    for (
                        const source
                        of mediumSources
                    ) {

                        if (
                            Array.isArray(source)
                        ) {

                            for (
                                const value
                                of source
                            ) {

                                const text =
                                    normaliseMedium(
                                        value
                                    );


                                if (
                                    text &&
                                    !mediumValues.includes(text)
                                ) {

                                    mediumValues.push(text);

                                }

                            }

                        }

                        else {

                            const text =
                                normaliseMedium(
                                    source
                                );


                            if (
                                text &&
                                !mediumValues.includes(text)
                            ) {

                                mediumValues.push(text);

                            }

                        }

                    }


                    medium =
                        mediumValues.join(", ");

                }


                // =================================================
                // PERIOD
                // =================================================

                let period = "";


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
                            extractText(value);


                        if (
                            typeof text === "string" &&
                            (
                                /golden age/i.test(text) ||
                                /baroque/i.test(text) ||
                                /renaissance/i.test(text) ||
                                /rococo/i.test(text) ||
                                /romantic/i.test(text) ||
                                /impression/i.test(text) ||
                                /realism/i.test(text) ||
                                /modern/i.test(text) ||
                                /gouden eeuw/i.test(text) ||
                                /barok/i.test(text) ||
                                /romantiek/i.test(text) ||
                                /impressionisme/i.test(text) ||
                                /realisme/i.test(text)
                            )
                        ) {

                            period = text;
                            break;

                        }

                    }


                    if (period) {
                        break;
                    }

                }


                // =================================================
                // ARTIST PERIOD FALLBACKS
                // =================================================

                if (
                    !period &&
                    artist === "Johannes Vermeer"
                ) {

                    period =
                        "Dutch Golden Age";

                }


                // =================================================
                // OBJECT NUMBER
                // =================================================

                let objectNumber = "";


                for (
                    const identifier
                    of identifiedBy
                ) {

                    if (
                        identifier?.type === "Identifier" &&
                        identifier.content
                    ) {

                        objectNumber =
                            identifier.content;

                        break;

                    }

                }


                // =================================================
                // INSTITUTION
                // =================================================

                const institution =
                    "Rijksmuseum";


                // =================================================
                // IMAGE
                // =================================================

                let imageURL = "";


                const visualItem =
                    object.shows?.[0];


                if (visualItem?.id) {

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


                    if (digitalObject?.id) {

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
                                value =>
                                    value?.id &&
                                    value.id.includes(
                                        "iiif.micr.io"
                                    )
                            );


                        if (accessPoint?.id) {

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


                // =================================================
                // SAVE RESULT
                // =================================================

                results.push({

                    title,

                    englishTitle,

                    originalTitle,

                    artist,

                    dateStart,

                    dateEnd,

                    dateDisplay,

                    period,

                    medium,

                    physicalDescription,

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