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
        // COLLECT SEARCH RESULTS
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
                Array.isArray(
                    data.orderedItems
                )
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
        // HELPER: EXTRACT TEXT
        // =================================================

        function extractText(value) {

            if (!value) {
                return "";
            }


            if (typeof value === "string") {
                return value;
            }


            return (
                value.content ||
                value.name ||
                value.label ||
                value._label ||
                ""
            );

        }


        // =================================================
        // HELPER: GET LANGUAGE
        // =================================================

        function getLanguages(value) {

            if (!Array.isArray(value?.language)) {
                return [];
            }


            return value.language
                .map(language => {

                    return (
                        language?.id ||
                        language?.content ||
                        language?.label ||
                        ""
                    );

                })
                .filter(Boolean)
                .map(value =>
                    String(value).toLowerCase()
                );

        }


        // =================================================
        // HELPER: ENGLISH
        // =================================================

        function isEnglish(value) {

            const languages =
                getLanguages(value);


            return languages.some(
                language =>
                    language.includes("eng") ||
                    language.includes("en/")
            );

        }


        // =================================================
        // HELPER: DUTCH
        // =================================================

        function isDutch(value) {

            const languages =
                getLanguages(value);


            return languages.some(
                language =>
                    language.includes("dut") ||
                    language.includes("nld") ||
                    language.includes("nl/")
            );

        }


        // =================================================
        // HELPER: NORMALISE MEDIUM
        // =================================================

        function normaliseMedium(value) {

            if (!value) {
                return "";
            }


            let text =
                extractText(value);


            if (!text) {
                return "";
            }


            // ---------------------------------------------
            // DUTCH → ENGLISH
            // ---------------------------------------------

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


                // =================================================
                // OBJECT RECORD
                // =================================================

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


                // =================================================
                // IDENTIFIERS
                // =================================================

                const identifiedBy =
                    Array.isArray(
                        object.identified_by
                    )
                        ? object.identified_by
                        : [];


                // =================================================
                // TITLES
                // =================================================

                const names =
                    identifiedBy.filter(
                        value =>
                            value?.type === "Name" &&
                            extractText(value)
                    );


                let englishTitle =
                    "";


                let originalTitle =
                    "";


                // -------------------------------------------------
                // FIND ENGLISH TITLE
                // -------------------------------------------------

                const englishName =
                    names.find(
                        value =>
                            isEnglish(value)
                    );


                if (englishName) {

                    englishTitle =
                        extractText(
                            englishName
                        );

                }


                // -------------------------------------------------
                // FIND DUTCH / ORIGINAL TITLE
                // -------------------------------------------------

                const dutchName =
                    names.find(
                        value =>
                            isDutch(value)
                    );


                if (dutchName) {

                    originalTitle =
                        extractText(
                            dutchName
                        );

                }


                // -------------------------------------------------
                // FALLBACK TITLE
                // -------------------------------------------------

                if (!originalTitle && names.length) {

                    originalTitle =
                        extractText(
                            names[0]
                        );

                }


                if (!englishTitle && names.length) {

                    englishTitle =
                        extractText(
                            names[0]
                        );

                }


                // -------------------------------------------------
                // MAIN TITLE
                // -------------------------------------------------

                const title =
                    englishTitle ||
                    originalTitle ||
                    "Untitled";


                // =================================================
                // ARTIST
                // =================================================

                let artist =
                    searchTerm;


                const production =
                    object.produced_by;


                const artistObjects = [];


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


                if (artistObject) {

                    artist =
                        extractText(
                            artistObject
                        ) ||
                        artist;

                }


                // =================================================
                // ARTIST NORMALISATION
                // =================================================

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


                // =================================================
                // DATE
                // =================================================

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


                // =================================================
                // EXTRACT YEARS
                // =================================================

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
                                ? parseInt(
                                    years[1]
                                )
                                : dateStart;

                    }

                }


                // =================================================
                // DATE FALLBACK
                // =================================================

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

                        dateStart =
                            year;

                        dateEnd =
                            year;

                        dateDisplay =
                            String(year);

                    }

                }


                // =================================================
                // PHYSICAL DESCRIPTION
                // =================================================

                let physicalDescription =
                    "";


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
                        extractText(
                            statement
                        );


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

                let medium =
                    "";


                // -------------------------------------------------
                // FIRST: PHYSICAL DESCRIPTION
                // -------------------------------------------------

                if (physicalDescription) {

                    medium =
                        normaliseMedium(
                            physicalDescription
                        );

                }


                // -------------------------------------------------
                // FALLBACK: MATERIAL DATA
                // -------------------------------------------------

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
                                    !mediumValues.includes(
                                        text
                                    )
                                ) {

                                    mediumValues.push(
                                        text
                                    );

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
                                !mediumValues.includes(
                                    text
                                )
                            ) {

                                mediumValues.push(
                                    text
                                );

                            }

                        }

                    }


                    medium =
                        mediumValues.join(
                            ", "
                        );

                }


                // =================================================
                // PERIOD
                // =================================================

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
                            extractText(
                                value
                            );


                        if (
                            typeof text === "string" &&
                            /golden age|baroque|renaissance|rococo|romantic|impression|realism|modern|gouden eeuw|barok|renaissance|romantiek|impressionisme|realisme/i
                                .test(text)
                        ) {

                            period =
                                text;

                            break;

                        }

                    }


                    if (period) {
                        break;
                    }

                }


                // -------------------------------------------------
                // VERMEER FALLBACK
                // -------------------------------------------------

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


                // =================================================
                // INSTITUTION
                // =================================================

                const institution =
                    "Rijksmuseum";


                // =================================================
                // IMAGE
                // =================================================

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
                                value =>
                                    value.id &&
                                    value.id.includes(
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