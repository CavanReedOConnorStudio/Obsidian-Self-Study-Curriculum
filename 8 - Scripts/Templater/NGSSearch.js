module.exports = async function (searchTerm) {

    // =====================================================
    // VALIDATE
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
    // SETTINGS
    // =====================================================

    const MAX_RESULTS = 30;

    const searchURL =
        "https://www.nationalgalleries.org/search-all/" +
        encodeURIComponent(searchTerm);


    // =====================================================
    // HELPERS
    // =====================================================

    function cleanText(value) {

        if (!value) {
            return "";
        }

        return String(value)
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/&amp;/gi, "&")
            .replace(/&#39;/gi, "'")
            .replace(/&quot;/gi, '"')
            .replace(/&#x27;/gi, "'")
            .replace(/&#x2F;/gi, "/")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/\s+/g, " ")
            .trim();

    }


    function decodeHTML(value) {

        if (!value) {
            return "";
        }

        return String(value)
            .replace(/&amp;/gi, "&")
            .replace(/&#39;/gi, "'")
            .replace(/&quot;/gi, '"')
            .replace(/&nbsp;/gi, " ")
            .replace(/&#x27;/gi, "'")
            .replace(/&#x2F;/gi, "/")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">");

    }


    function absoluteURL(value) {

        if (!value) {
            return "";
        }

        if (value.startsWith("http")) {
            return value;
        }

        return (
            "https://www.nationalgalleries.org" +
            value
        );

    }


    function extractMeta(html, property) {

        const escaped =
            property.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        const patterns = [

            new RegExp(
                `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
                "i"
            ),

            new RegExp(
                `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
                "i"
            ),

            new RegExp(
                `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
                "i"
            ),

            new RegExp(
                `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`,
                "i"
            )

        ];

        for (const pattern of patterns) {

            const match =
                html.match(pattern);

            if (match?.[1]) {

                return decodeHTML(
                    match[1]
                );

            }

        }

        return "";

    }


    // =====================================================
    // EXTRACT NGS ARTWORK METADATA
    // =====================================================

    function extractArtworkMetadata(html) {

        const metadata = {

            artist: "",
            title: "",
            dateDisplay: "",
            medium: "",
            objectType: "",
            objectNumber: "",
            gallery: "",
            description: ""

        };


        // -------------------------------------------------
        // ARTIST
        // -------------------------------------------------

        const artistMatch =
            html.match(
                /Artist:\s*([^<]+?)(?:\s*\([^)]+\))?\s*(?=Scottish|English|British|French|Dutch|Italian|American|German|Irish|Danish|Welsh|Title:)/i
            );


        if (artistMatch?.[1]) {

            metadata.artist =
                cleanText(
                    artistMatch[1]
                );

        }


        // -------------------------------------------------
        // TITLE
        // -------------------------------------------------

        const titleMatch =
            html.match(
                /Title:\s*([^<]+?)\s*(?=Date:)/i
            );


        if (titleMatch?.[1]) {

            metadata.title =
                cleanText(
                    titleMatch[1]
                );

        }


        // -------------------------------------------------
        // DATE
        // -------------------------------------------------

        const dateMatch =
            html.match(
                /Date:\s*([^<]+?)\s*(?=Materials:)/i
            );


        if (dateMatch?.[1]) {

            metadata.dateDisplay =
                cleanText(
                    dateMatch[1]
                );

        }


        // -------------------------------------------------
        // MATERIALS
        // -------------------------------------------------

        const materialsMatch =
            html.match(
                /Materials:\s*([^<]+?)\s*(?=Measurements:)/i
            );


        if (materialsMatch?.[1]) {

            metadata.medium =
                cleanText(
                    materialsMatch[1]
                );

        }


        // -------------------------------------------------
        // OBJECT TYPE
        // -------------------------------------------------

        const objectTypeMatch =
            html.match(
                /Object type:\s*([^<]+?)\s*(?=Credit line:)/i
            );


        if (objectTypeMatch?.[1]) {

            metadata.objectType =
                cleanText(
                    objectTypeMatch[1]
                );

        }


        // -------------------------------------------------
        // ACCESSION NUMBER
        // -------------------------------------------------

        const accessionMatch =
            html.match(
                /Accession number:\s*([^<]+?)\s*(?=Gallery:)/i
            );


        if (accessionMatch?.[1]) {

            metadata.objectNumber =
                cleanText(
                    accessionMatch[1]
                );

        }


        // -------------------------------------------------
        // GALLERY
        // -------------------------------------------------

        const galleryMatch =
            html.match(
                /Gallery:\s*([^<]+?)\s*(?=Depicted:|Subjects:|Artwork photographed by:|Does this text)/i
            );


        if (galleryMatch?.[1]) {

            metadata.gallery =
                cleanText(
                    galleryMatch[1]
                );

        }


        // -------------------------------------------------
        // DESCRIPTION
        // -------------------------------------------------

        const aboutMatch =
            html.match(
                /About this artwork([\s\S]*?)Updated before 2020/i
            );


        if (aboutMatch?.[1]) {

            metadata.description =
                cleanText(
                    aboutMatch[1]
                );

        }


        return metadata;

    }


    // =====================================================
    // SEARCH NGS
    // =====================================================

    try {

        new Notice(
            `NGS: searching for ${searchTerm}...`,
            4000
        );


        const response =
            await requestUrl({

                url:
                    searchURL,

                method:
                    "GET"

            });


        const html =
            response.text;


        // =================================================
        // FIND ARTWORK LINKS
        // =================================================

        const artworkRegex =
            /href=["'](\/art-and-artists\/(\d+))["'][^>]*>/gi;


        const found =
            new Map();


        let match;


        while (
            (match =
                artworkRegex.exec(html)) !== null
        ) {

            const path =
                match[1];

            const id =
                match[2];


            if (
                !found.has(id)
            ) {

                found.set(
                    id,
                    path
                );

            }


            if (
                found.size >= MAX_RESULTS
            ) {

                break;

            }

        }


        // =================================================
        // NO RESULTS
        // =================================================

        if (
            found.size === 0
        ) {

            return {

                success: true,

                searchTerm,

                total: 0,

                results: []

            };

        }


        // =================================================
        // GET ARTWORK RECORDS
        // =================================================

        const results = [];


        let index = 0;


        for (
            const [
                id,
                path
            ]
            of found
        ) {

            index++;


            try {

                new Notice(
                    `NGS: reading artwork ${index}/${found.size}...`,
                    2500
                );


                const artworkURL =
                    absoluteURL(
                        path
                    );


                const artworkResponse =
                    await requestUrl({

                        url:
                            artworkURL,

                        method:
                            "GET"

                    });


                const artworkHTML =
                    artworkResponse.text;


                // =========================================
                // METADATA
                // =========================================

                const metadata =
                    extractArtworkMetadata(
                        artworkHTML
                    );


                // =========================================
                // TITLE FALLBACK
                // =========================================

                let title =
                    metadata.title ||
                    extractMeta(
                        artworkHTML,
                        "og:title"
                    );


                title =
                    title
                        .replace(
                            /\s*\|\s*National Galleries.*$/i,
                            ""
                        )
                        .trim();


                title =
                    title
                        .replace(
                            /\s+by\s+[^|]+$/i,
                            ""
                        )
                        .trim();


                // =========================================
                // IMAGE
                // =========================================

                const imageURL =
                    extractMeta(
                        artworkHTML,
                        "og:image"
                    );


                // =========================================
                // SAVE RESULT
                // =========================================

                results.push({

                    title,

                    artist:
                        metadata.artist,

                    dateStart:
                        null,

                    dateEnd:
                        null,

                    dateDisplay:
                        metadata.dateDisplay,

                    period:
                        "",

                    medium:
                        metadata.medium,

                    institution:
                        "National Galleries Scotland",

                    source:
                        "National Galleries Scotland",

                    objectNumber:
                        metadata.objectNumber,

                    museumURL:
                        artworkURL,

                    imageURL,

                    objectType:
                        metadata.objectType,

                    gallery:
                        metadata.gallery,

                    description:
                        metadata.description

                });

            }


            catch (error) {

                console.warn(
                    "NGS artwork could not be read:",
                    path,
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
            "NGS search failed:",
            error
        );


        new Notice(
            "NGS search failed. Check the console."
        );


        return {

            success: false,

            error:
                error.message ||
                "Unknown NGS search error.",

            results: []

        };

    }

};