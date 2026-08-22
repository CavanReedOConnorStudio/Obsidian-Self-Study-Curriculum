
module.exports = async function (tp) {

    // =====================================================
    // NATIONAL GALLERY SEARCH
    // =====================================================

    const searchTerm = await tp.system.prompt(
        "National Gallery Search",
        "Artist name"
    );

    if (!searchTerm || !searchTerm.trim()) {
        return "# National Gallery Search\n\nSearch cancelled.";
    }

    const query = searchTerm.trim();


    // =====================================================
    // NATIONAL GALLERY ELASTICSEARCH ENDPOINT
    // =====================================================

    const url =
        "https://data.ng.ac.uk/es/public/_search";


    // =====================================================
    // SEARCH
    // =====================================================

    try {

        const response = await requestUrl({

            url: url,

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({

                query: {
                    multi_match: {
                        query: query,
                        fields: ["*"]
                    }
                },

                size: 5

            })

        });


        // =================================================
        // PARSE RESPONSE
        // =================================================

        const data = response.json;


        console.log(
            "National Gallery API response:",
            data
        );


        // =================================================
        // TEST OUTPUT
        // =================================================

        return (
            "# National Gallery TEST\n\n" +
            `Search: **${query}**\n\n` +
            "API connection successful.\n\n" +
            "Results returned: **" +
            `${data.hits?.total?.value ?? data.hits?.total ?? 0}` +
            "**\n\n" +
            "```json\n" +
            JSON.stringify(data, null, 2) +
            "\n```"
        );


    }

    catch (error) {

        console.error(
            "National Gallery API error:",
            error
        );

        return (
            "# National Gallery Search Error\n\n" +
            `Request failed: ${error.message || error}`
        );

    }

};
