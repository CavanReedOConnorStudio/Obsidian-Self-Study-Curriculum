// const API_URL = "https://data.ng.ac.uk/es/public/_search";

// --------------------------------------------------
// National Gallery API
// --------------------------------------------------

async function searchNationalGallery(searchTerm) {
    console.log(`Searching National Gallery for: "${searchTerm}"`);

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            query: {
                multi_match: {
                    query: searchTerm,
                    fields: [
                        "name.value^5",
                        "summary.title^5",
                        "title.value^5"
                    ]
                }
            },
            size: 50
        })
    });

    if (!response.ok) {
        const text = await response.text();

        throw new Error(
            `HTTP ${response.status}\n${text.slice(0, 1000)}`
        );
    }

    const data = await response.json();

    return data;
}


// --------------------------------------------------
// Find primary name
// --------------------------------------------------

function getPrimaryName(source) {
    return (
        source.name?.find(
            name => name.type === "primary name"
        )?.value || null
    );
}


// --------------------------------------------------
// Find identifier
// --------------------------------------------------

function getIdentifier(source, type) {
    return (
        source.identifier?.find(
            identifier => identifier.type === type
        )?.value || null
    );
}


// --------------------------------------------------
// Simplify API result
// --------------------------------------------------

function simplifyResult(hit) {
    const source = hit._source || {};

    return {
        id: hit._id,

        score: hit._score,

        name: getPrimaryName(source),

        title: source.summary?.title || null,

        pid: getIdentifier(source, "PID"),

        ngAlternative: getIdentifier(
            source,
            "PID (NG alternative)"
        ),

        role:
            source.role?.find(
                role => role.type === "NG"
            )?.value || null,

        date:
            source.date?.[0]?.value || null,

        datatype:
            source["@datatype"]?.actual || null,

        stream:
            source["@admin"]?.stream || null
    };
}


// --------------------------------------------------
// Find exact artist record
// --------------------------------------------------

function findArtist(results, searchTerm) {
    const search = searchTerm.trim().toLowerCase();

    return results.find(hit => {
        const source = hit._source || {};

        const role =
            source.role?.find(
                role => role.type === "NG"
            )?.value;

        const name = getPrimaryName(source);

        return (
            role === "artist" &&
            name?.trim().toLowerCase() === search
        );
    });
}


// --------------------------------------------------
// Extract catalogue references
// --------------------------------------------------

function getCatalogueReferences(artist) {
    const catalogue = artist?._source?.catalogue || [];

    return catalogue.map(entry => {
        const admin = entry["@admin"] || {};
        const processed = entry["@processed"] || {};

        return {
            uid: admin.uid || null,
            id: admin.id || null,
            source: admin.source || null,
            location: processed.location || null,
            type: processed["@type"] || null
        };
    });
}


// --------------------------------------------------
// Main
// --------------------------------------------------

async function main() {

    const searchTerm = "Rembrandt";

    try {

        const data =
            await searchNationalGallery(searchTerm);

        const hits =
            data?.hits?.hits || [];

        const total =
            data?.hits?.total?.value || 0;

        // --------------------------------------------------
        // Search summary
        // --------------------------------------------------

        console.log("\n========================================");
        console.log("NATIONAL GALLERY TEST");
        console.log("========================================");

        console.log(`Search: ${searchTerm}`);
        console.log(`Total results: ${total}`);
        console.log(`Returned results: ${hits.length}`);


        // --------------------------------------------------
        // Search results
        // --------------------------------------------------

        console.log("\nSEARCH RESULTS");

        console.table(
            hits.map(simplifyResult)
        );


        // --------------------------------------------------
        // Find artist
        // --------------------------------------------------

        const artist =
            findArtist(hits, searchTerm);

        if (!artist) {

            console.log(
                "\nNo exact artist record found."
            );

            return;
        }


        // --------------------------------------------------
        // Artist information
        // --------------------------------------------------

        const artistData =
            simplifyResult(artist);

        console.log("\n========================================");
        console.log("ARTIST FOUND");
        console.log("========================================");

        console.log(artistData);


        // --------------------------------------------------
        // Catalogue references
        // --------------------------------------------------

        const catalogue =
            getCatalogueReferences(artist);

        console.log("\n========================================");
        console.log("CATALOGUE REFERENCES");
        console.log("========================================");

        console.log(
            `References found: ${catalogue.length}`
        );

        console.table(catalogue);


        // --------------------------------------------------
        // Final summary
        // --------------------------------------------------

        console.log("\n========================================");
        console.log("SUMMARY");
        console.log("========================================");

        console.log({
            artist: artistData.name,
            artistPID: artistData.pid,
            catalogueReferences: catalogue.length
        });


        // --------------------------------------------------
        // Next step
        // --------------------------------------------------

        console.log("\nNEXT STEP");
        console.log(
            "Resolve the catalogue references into individual artwork records."
        );

    } catch (error) {

        console.error("\n========================================");
        console.error("NATIONAL GALLERY TEST FAILED");
        console.error("========================================");

        console.error(error);
    }
}


// --------------------------------------------------
// Run
// --------------------------------------------------

main();