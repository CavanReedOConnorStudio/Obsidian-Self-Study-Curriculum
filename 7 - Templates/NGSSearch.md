<%*
const searchTerm =
    await tp.system.prompt(
        "NGS Artwork Search",
        "Artist name"
    );

if (
    !searchTerm ||
    !searchTerm.trim()
) {

    tR += "# NGS Search\n\nSearch cancelled.";

    return;

}

const data =
    await tp.user.NGSSearch(
        searchTerm.trim()
    );

if (
    !data ||
    !data.success
) {

    tR +=
        "# NGS Search Failed\n\n" +
        `${data?.error || "Unknown error."}`;

    return;

}

if (
    !data.results ||
    data.results.length === 0
) {

    tR +=
        "# NGS Search\n\n" +
        `Search: **${data.searchTerm}**\n\n` +
        "No artworks found.";

    return;

}

let output =
    "# National Galleries Scotland Results\n\n";

output +=
    `Search: **${data.searchTerm}**\n\n`;

output +=
    `Found **${data.results.length}** artworks.\n\n`;

output += "---\n\n";


data.results.forEach(
    (work, index) => {

        output +=
            `## ${index + 1}. ${work.title}\n\n`;

        if (
            work.imageURL
        ) {

            output +=
                `![${work.title}](${work.imageURL})\n\n`;

        }

        if (
            work.artist
        ) {

            output +=
                `**Artist:** [[${work.artist}]]\n\n`;

        }

        if (
            work.dateDisplay
        ) {

            output +=
                `**Date:** ${work.dateDisplay}\n\n`;

        }

        if (
            work.medium
        ) {

            output +=
                `**Medium:** ${work.medium}\n\n`;

        }

        if (
            work.objectType
        ) {

            output +=
                `**Object type:** ${work.objectType}\n\n`;

        }

        if (
            work.objectNumber
        ) {

            output +=
                `**Accession number:** ${work.objectNumber}\n\n`;

        }

        if (
            work.gallery
        ) {

            output +=
                `**Gallery:** ${work.gallery}\n\n`;

        }

        if (
            work.museumURL
        ) {

            output +=
                `**National Galleries Scotland:** [View artwork](${work.museumURL})\n\n`;

        }

        if (
            work.description
        ) {

            output +=
                `**Description:** ${work.description}\n\n`;

        }


        const artwork = {

            title:
                work.title || "",

            originalTitle:
                work.title || "",

            artist:
                work.artist || "",

            dateStart:
                work.dateStart ?? "",

            dateEnd:
                work.dateEnd ?? "",

            dateDisplay:
                work.dateDisplay || "",

            period:
                work.period || "",

            medium:
                work.medium || "",

            institution:
                "National Galleries Scotland",

            source:
                "National Galleries Scotland",

            objectNumber:
                work.objectNumber || "",

            museumURL:
                work.museumURL || "",

            imageURL:
                work.imageURL || "",

            objectType:
                work.objectType || "",

            gallery:
                work.gallery || "",

            description:
                work.description || ""

        };


        const encodedArtwork =
            encodeURIComponent(
                JSON.stringify(
                    artwork
                )
            );


        output +=
` \`\`\`meta-bind-button
label: SAVE TO ARTWORK BANK
style: primary
action:
  type: js
  file: "8 - Scripts/Buttons/ArtworkButton.js"
  args:
    artwork: "${encodedArtwork}"
\`\`\`

`;


        output +=
            "---\n\n";

    }
);


tR += output;
%>