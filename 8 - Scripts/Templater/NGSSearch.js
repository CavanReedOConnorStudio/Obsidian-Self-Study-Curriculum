module.exports = async function (tp) {

    const searchTerm = await tp.system.prompt(
        "National Galleries Scotland Search",
        "Artist name"
    );

    if (!searchTerm || !searchTerm.trim()) {
        return "Search cancelled.";
    }

    const query = searchTerm.trim();

    const url =
        "https://www.nationalgalleries.org/search?search=" +
        encodeURIComponent(query);

    let response;

    try {

        response = await requestUrl({
            url: url,
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

    } catch (error) {

        console.error("NGS request failed:", error);

        return (
            "# NGS Search Error\n\n" +
            `Request failed: ${error.message || error}`
        );

    }

    const html = response.text;

    if (!html) {
        return "# NGS Search Error\n\nNGS returned an empty response.";
    }

    const results = [];

    const linkRegex =
        /href="(\/art-and-artists\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

    let match;

    while ((match = linkRegex.exec(html)) !== null) {

        const artworkURL =
            "https://www.nationalgalleries.org" + match[1];

        const title = cleanText(match[2]);

        if (!title) {
            continue;
        }

        if (
            results.some(
                item => item.url === artworkURL
            )
        ) {
            continue;
        }

        results.push({
            title: title,
            url: artworkURL
        });

        if (results.length >= 10) {
            break;
        }
    }

    if (results.length === 0) {

        return (
            "# NGS Search\n\n" +
            `Search: **${query}**\n\n` +
            "No artwork results could be extracted."
        );

    }

    let output =
        "# National Galleries Scotland Results\n\n";

    output +=
        `Search: **${query}**\n\n`;

    output +=
        `Found **${results.length}** possible artworks.\n\n`;

    results.forEach((work, index) => {

        output +=
            `## ${index + 1}. ${work.title}\n\n`;

        output +=
            `**National Galleries Scotland:** ` +
            `[View artwork](${work.url})\n\n`;

        output += "---\n\n";

    });

    return output;
};


function cleanText(value) {

    return String(value || "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();

}