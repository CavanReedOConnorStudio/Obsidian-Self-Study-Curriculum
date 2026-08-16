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


        const searchData =
            searchResponse.json;


        const items =
            searchData.orderedItems || [];


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
        // RESULTS ARRAY
        // =================================================

        const results = [];


        // =================================================
        // PROCESS RESULTS
        // =================================================

        for (
            const item
            of items.slice(0, 10)
        ) {

            try {

                // =========================================
                // ARTWORK RECORD
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

                const names =
                    Array.isArray(
                        object.identified_by
                    )
                        ? object.identified_by.filter(
                            x => x.type === "Name"
                        )
                        : [];


                const originalTitle =
                    names[0]?.content ||
                    "Untitled";


                /*
                 * At this stage we use the museum's
                 * supplied title.
                 *
                 * We'll add proper English-title
                 * handling later.
                 */

                const title =
                    originalTitle;


                // =========================================
                // ARTIST
                // =========================================

                let artist =
                    searchTerm;


                const production =
                    object.produced_by;


                const artistObject =
                    production?.carried_out_by?.[0];


                if (
                    artistObject?.name
                ) {

                    artist =
                        artistObject.name;

                }


                else if (
                    Array.isArray(
                        artistObject?.identified_by
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


                // =========================================
                // DATE
                // =========================================

                let dateStart = null;

                let dateEnd = null;

                let dateDisplay = "";


                const timespan =
                    production?.timespan;


                // Human-readable date

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


                // Extract years

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
                                ? parseInt(
                                    years[1]
                                )
                                : dateStart;

                    }

                }


                // Machine-readable fallback

                if (
                    dateStart === null &&
                    timespan?.begin_of_the_begin
                ) {

                    const year =
                        parseInt(
                            String(
                                timespan
                                    .begin_of_the_begin
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


                // =========================================
                // OBJECT NUMBER
                // =========================================

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


                // =========================================
                // IMAGE
                // =========================================

                let imageURL = "";


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
                        visual
                            .digitally_shown_by?.[0];


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
                // SAVE ARTWORK OBJECT
                // =========================================

                results.push({

                    title,

                    originalTitle,

                    artist,

                    dateStart,

                    dateEnd,

                    dateDisplay,

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
        // RETURN DATA
        // =================================================

        return {

            success: true,

            searchTerm,

            total:
                searchData.partOf?.totalItems ??
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