module.exports = async function (tp) {

    // =====================================================
    // SEARCH
    // =====================================================

    const searchTerm = await tp.system.prompt(
        "Rijksmuseum Search",
        "Artist name"
    );

    if (!searchTerm) {
        return "Search cancelled.";
    }


    // =====================================================
    // RIJKSMUSEUM SEARCH URL
    // =====================================================

    const searchURL =
        "https://data.rijksmuseum.nl/search/collection?" +
        "type=painting&imageAvailable=true&creator=" +
        encodeURIComponent(searchTerm);


    try {

        // =================================================
        // SEARCH RIJKSMUSEUM
        // =================================================

        const searchResponse = await requestUrl({
            url: searchURL,
            method: "GET"
        });

        const searchData = searchResponse.json;

        const items =
            searchData.orderedItems || [];


        // =================================================
        // NO RESULTS
        // =================================================

        if (items.length === 0) {

            return `No artworks found for "${searchTerm}".`;

        }


        // =================================================
        // RESULTS
        // =================================================

        const results = [];


        // =================================================
        // GET INDIVIDUAL ARTWORK RECORDS
        // =================================================

        for (const item of items.slice(0, 10)) {

            try {

                const objectURL =
                    item.id + "?_profile=la-framed";


                const objectResponse = await requestUrl({
                    url: objectURL,
                    method: "GET"
                });


                const object =
                    objectResponse.json;


                // =============================================
                // TITLE
                // =============================================

                const names =
                    Array.isArray(object.identified_by)
                        ? object.identified_by.filter(
                            x => x.type === "Name"
                        )
                        : [];


                let originalTitle =
                    names[0]?.content || "Untitled";


                let englishTitle = "";


                /*
                 * Look through all names for an English
                 * title.
                 *
                 * Different records can encode language
                 * information differently, so we check
                 * several possible locations.
                 */

                for (const name of names) {

                    const text =
                        name.content || "";


                    const languageValues = [];


                    // language as an array
                    if (Array.isArray(name.language)) {

                        for (const language of name.language) {

                            if (typeof language === "string") {

                                languageValues.push(
                                    language.toLowerCase()
                                );

                            }

                            else if (language) {

                                if (language.id) {

                                    languageValues.push(
                                        String(
                                            language.id
                                        ).toLowerCase()
                                    );

                                }

                                if (language.label) {

                                    languageValues.push(
                                        String(
                                            language.label
                                        ).toLowerCase()
                                    );

                                }

                            }

                        }

                    }


                    // language as a string
                    if (typeof name.language === "string") {

                        languageValues.push(
                            name.language.toLowerCase()
                        );

                    }


                    const languageText =
                        languageValues.join(" ");


                    if (
                        languageText.includes("english") ||
                        languageText.includes("/en") ||
                        languageText.endsWith("en")
                    ) {

                        englishTitle = text;

                        break;

                    }

                }


                /*
                 * If no English title was found,
                 * use the original title.
                 */

                const title =
                    englishTitle ||
                    originalTitle;


                // =============================================
                // ARTIST
                // =============================================

                let artist =
                    searchTerm;


                const production =
                    object.produced_by;


                const artistObject =
                    production?.carried_out_by?.[0];


                if (artistObject) {

                    if (artistObject.name) {

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


                        if (artistName?.content) {

                            artist =
                                artistName.content;

                        }

                    }

                }


                // =============================================
                // DATE
                // =============================================

                let dateStart = null;
                let dateEnd = null;
                let dateDisplay = "";


                const timespan =
                    production?.timespan;


                /*
                 * Human-readable museum date.
                 */

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


                    if (dateName?.content) {

                        dateDisplay =
                            dateName.content;

                    }

                }


                /*
                 * Extract years from the human-readable
                 * date.
                 */

                if (dateDisplay) {

                    const years =
                        dateDisplay.match(
                            /\b\d{4}\b/g
                        );


                    if (
                        years &&
                        years.length > 0
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


                /*
                 * Fallback to machine-readable date.
                 */

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

                        dateDisplay =
                            String(year);

                    }

                }


                // =============================================
                // OBJECT NUMBER
                // =============================================

                let objectNumber = "";


                const identifiers =
                    Array.isArray(
                        object.identified_by
                    )
                        ? object.identified_by
                        : [];


                for (
                    const identifier
                    of identifiers
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


                // =============================================
                // MEDIUM
                // =============================================

                let medium = "";


                /*
                 * Look for common material / technique
                 * information.
                 */

                const techniques =
                    production?.technique;


                if (Array.isArray(techniques)) {

                    medium =
                        techniques
                            .map(
                                technique =>
                                    technique.label ||
                                    technique.name ||
                                    ""
                            )
                            .filter(Boolean)
                            .join(", ");

                }


                // =============================================
                // SAVE RESULT
                // =============================================

                results.push({

                    title,

                    originalTitle,

                    artist,

                    dateStart,

                    dateEnd,

                    dateDisplay,

                    medium,

                    objectNumber,

                    museumURL:
                        item.id

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


        // =====================================================
        // DISPLAY RESULTS
        // =====================================================

        let output =
            "# Rijksmuseum Results\n\n";


        output +=
            `Search: **${searchTerm}**\n\n`;


        output +=
            `Found **${
                searchData.partOf?.totalItems ??
                results.length
            }** artworks.\n\n`;


        // =====================================================
        // ARTWORK RESULTS
        // =====================================================

        results.forEach(
            (work, index) => {

                output +=
                    `## ${index + 1}. ${work.title}\n\n`;


                output +=
                    `**Artist:** ${work.artist}\n\n`;


                /*
                 * Show original title if different.
                 */

                if (
                    work.originalTitle &&
                    work.originalTitle !==
                        work.title
                ) {

                    output +=
                        `**Original title:** ${work.originalTitle}\n\n`;

                }


                if (work.dateDisplay) {

                    output +=
                        `**Date:** ${work.dateDisplay}\n\n`;

                }


                if (
                    work.dateStart !== null
                ) {

                    output +=
                        `**Timeline start:** ${work.dateStart}\n\n`;

                }


                if (
                    work.dateEnd !== null
                ) {

                    output +=
                        `**Timeline end:** ${work.dateEnd}\n\n`;

                }


                if (work.medium) {

                    output +=
                        `**Medium:** ${work.medium}\n\n`;

                }


                if (work.objectNumber) {

                    output +=
                        `**Object number:** ${work.objectNumber}\n\n`;

                }


                output +=
                    `**Rijksmuseum ID:** ${work.museumURL}\n\n`;


                output +=
                    "---\n\n";

            }
        );


        // =====================================================
        // RETURN TO OBSIDIAN
        // =====================================================

        return output;


    }

    catch (error) {

        console.error(
            "Rijksmuseum search failed:",
            error
        );


        return (
            "Rijksmuseum search failed: " +
            error.message
        );

    }

};