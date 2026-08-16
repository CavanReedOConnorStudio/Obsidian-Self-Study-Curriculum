module.exports = async function (tp) {

    // =====================================================
    // ASK FOR SEARCH
    // =====================================================

    const searchTerm =
        await tp.system.prompt(
            "Artwork Search",
            "Artist name"
        );


    if (
        !searchTerm ||
        !searchTerm.trim()
    ) {

        return "Search cancelled.";

    }


    // =====================================================
    // RUN RIJKSMUSEUM SEARCH
    // =====================================================

    const data =
        await tp.user.RijksmuseumSearch(
            searchTerm
        );


    // =====================================================
    // ERROR
    // =====================================================

    if (!data.success) {

        return (
            `# Search Failed\n\n` +
            `${data.error}`
        );

    }


    // =====================================================
    // NO RESULTS
    // =====================================================

    if (data.results.length === 0) {

        return (
            `# Rijksmuseum Search\n\n` +
            `Search: **${data.searchTerm}**\n\n` +
            `No artworks found.`
        );

    }


    // =====================================================
    // BUILD RESULTS
    // =====================================================

    let output =
        "# Rijksmuseum Search\n\n";


    output +=
        `Search: **${data.searchTerm}**\n\n`;


    output +=
        `Found **${data.total}** artworks.\n\n`;


    data.results.forEach(
        (work, index) => {

            output +=
                `## ${index + 1}. ${work.title}\n\n`;


            // IMAGE

            if (
                work.imageURL
            ) {

                output +=
                    `![${work.title}](${work.imageURL})\n\n`;

            }


            // ARTIST

            output +=
                `**Artist:** ${work.artist}\n\n`;


            // ORIGINAL TITLE

            if (
                work.originalTitle &&
                work.originalTitle !==
                    work.title
            ) {

                output +=
                    `**Original title:** ${work.originalTitle}\n\n`;

            }


            // DATE

            if (
                work.dateDisplay
            ) {

                output +=
                    `**Date:** ${work.dateDisplay}\n\n`;

            }


            // TIMELINE

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


            // OBJECT NUMBER

            if (
                work.objectNumber
            ) {

                output +=
                    `**Object number:** ${work.objectNumber}\n\n`;

            }


            // RIJKSMUSEUM ID

            output +=
                `**Rijksmuseum ID:** ${work.museumURL}\n\n`;


            // IMAGE URL

            if (
                work.imageURL
            ) {

                output +=
                    `**Image URL:** ${work.imageURL}\n\n`;

            }


            output +=
                "---\n\n";

        }
    );


    return output;

};