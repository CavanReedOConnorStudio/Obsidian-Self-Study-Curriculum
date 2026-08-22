module.exports = async function (searchTerm) {

    if (!searchTerm || !searchTerm.trim()) {

        return {
            success: false,
            error: "No search term provided.",
            results: []
        };

    }

    searchTerm = searchTerm.trim();

    const MAX_RESULTS = 30;

    const searchURL =
        "https://www.nationalgalleries.org/search-all/" +
        encodeURIComponent(searchTerm);

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

        return "https://www.nationalgalleries.org" + value;

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

            if (match && match[1]) {

                return decodeHTML(
                    match[1]
                );

            }

        }

        return "";

    }

    function extractField(
        text,
        label,
        nextLabels
    ) {

        const escapedLabel =
            label.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        const escapedNext =
            nextLabels
                .map(
                    value =>
                        value.replace(
                            /[.*+?^${}()|[\]\\]/g,
                            "\\$&"
                        )
                )
                .join("|");

        const pattern =
            new RegExp(
                escapedLabel +
                "\\s*:?\\s*(.*?)" +
                "(?=" +
                escapedNext +
                "|$)",
                "i"
            );

        const match =
            text.match(pattern);

        if (!match || !match[1]) {
            return "";
        }

        return cleanText(
            match[1]
        );

    }

    try {

        new Notice(
            `NGS: searching for ${searchTerm}...`,
            4000
        );

        const response =
            await requestUrl({

                url: searchURL,
                method: "GET"

            });

        const html =
            response.text;

        const artworkRegex =
            /href=["'](\/art-and-artists\/(\d+))["'][^>]*>/gi;

        const found =
            new Map();

        let match;

        while (
            (match = artworkRegex.exec(html)) !== null
        ) {

            const path =
                match[1];

            const id =
                match[2];

            if (!found.has(id)) {

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

        const results = [];

        let index = 0;

        for (
            const [id, path]
            of found
        ) {

            index++;

            try {

                new Notice(
                    `NGS: reading artwork ${index}/${found.size}...`,
                    2500
                );

                const artworkURL =
                    absoluteURL(path);

                const artworkResponse =
                    await requestUrl({

                        url: artworkURL,
                        method: "GET"

                    });

                const artworkHTML =
                    artworkResponse.text;

                const pageText =
                    cleanText(
                        artworkHTML
                    );

                let title =
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

                const imageURL =
                    extractMeta(
                        artworkHTML,
                        "og:image"
                    );

                const artist =
                    extractField(
                        pageText,
                        "Artist",
                        [
                            "Title",
                            "Date",
                            "Materials",
                            "Measurements",
                            "Object type",
                            "Credit line",
                            "Accession number",
                            "Gallery",
                            "Subjects"
                        ]
                    );

                const dateDisplay =
                    extractField(
                        pageText,
                        "Date",
                        [
                            "Materials",
                            "Measurements",
                            "Object type",
                            "Credit line",
                            "Accession number",
                            "Gallery",
                            "Subjects"
                        ]
                    );

                const medium =
                    extractField(
                        pageText,
                        "Materials",
                        [
                            "Measurements",
                            "Object type",
                            "Credit line",
                            "Accession number",
                            "Gallery",
                            "Subjects"
                        ]
                    );

                const objectType =
                    extractField(
                        pageText,
                        "Object type",
                        [
                            "Credit line",
                            "Accession number",
                            "Gallery",
                            "Subjects"
                        ]
                    );

                const accessionNumber =
                    extractField(
                        pageText,
                        "Accession number",
                        [
                            "Gallery",
                            "Subjects"
                        ]
                    );

                const gallery =
                    extractField(
                        pageText,
                        "Gallery",
                        [
                            "Subjects",
                            "Does this text"
                        ]
                    );

                let description = "";

                const aboutMatch =
                    artworkHTML.match(
                        /<h[1-6][^>]*>\s*About this artwork\s*<\/h[1-6]>([\s\S]*?)(?:<h[1-6]|<\/main>|<\/article>)/i
                    );

                if (
                    aboutMatch &&
                    aboutMatch[1]
                ) {

                    description =
                        cleanText(
                            aboutMatch[1]
                        );

                }

                results.push({

                    title,

                    artist,

                    dateStart: null,

                    dateEnd: null,

                    dateDisplay,

                    period: "",

                    medium,

                    institution:
                        "National Galleries Scotland",

                    objectNumber:
                        accessionNumber,

                    museumURL:
                        artworkURL,

                    imageURL,

                    objectType,

                    gallery,

                    description

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