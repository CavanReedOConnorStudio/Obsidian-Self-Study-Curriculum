module.exports = async function (tp) {

    const artwork = {

        title: "The Milkmaid",

        originalTitle:
            "De melkmeid",

        artist:
            "Johannes Vermeer",

        dateStart:
            1660,

        dateEnd:
            1660,

        dateDisplay:
            "c. 1660",

        period:
            "Dutch Golden Age",

        medium:
            "Oil on canvas",

        institution:
            "Rijksmuseum",

        objectNumber:
            "SK-A-2344",

        museumURL:
            "https://id.rijksmuseum.nl/200108369",

        imageURL:
            "",

        subjects: [
            "domestic",
            "figure",
            "interior"
        ],

        themes: [
            "light",
            "labour",
            "stillness"
        ]

    };


    await tp.user.SaveArtwork(
        artwork
    );


    return "Artwork saved successfully.";

};