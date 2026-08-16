const title = context.args?.title;

if (!title) {
    new Notice("No title received.");
    return;
}

new Notice("Received: " + title);