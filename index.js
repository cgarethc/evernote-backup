const fs = require('fs');

const Evernote = require('evernote');
const config = require('./config');
const sanitise = require("./sanitise").sanitise;
const sanitize = require("sanitize-filename");

const client = new Evernote.Client({
  sandbox: true, // change to false when you are ready to switch to production
  china: false, // change to true if you wish to connect to YXBJ - most of you won't
  token: config.DEVELOPER_TOKEN
});

(async () => {

  if (!fs.existsSync('./files')) {
    fs.mkdirSync('./files');
  }

  var noteStore = client.getNoteStore();

  const notebooks = await noteStore.listNotebooks();
  let lastProcessedDate;

  for (let notebook of notebooks) {

    const sanitizedFileName = `./files/${sanitise(sanitize(notebook.name))}`;
    const infoFileName = `${sanitizedFileName}/info.json`;
    console.debug('Checking if notebook exists on disk already', sanitizedFileName);
    if (!fs.existsSync(sanitizedFileName)) {
      // never seen this notebook before, create the directory for it
      console.debug(`Directory doesn't exist, creating it`);
      processThisNotebook = true;
      fs.mkdirSync(sanitizedFileName);
    }
    else if (fs.existsSync(infoFileName)) {
      const info = JSON.parse(fs.readFileSync(infoFileName, 'utf8'));
      console.debug('last processed', info.processed);
      lastProcessedDate = new Date(info.processed);
    }

    const count = await noteStore.findNoteCounts({ notebookGuid: notebook.guid }, false);
    const totalNotes = count.notebookCounts[notebook.guid];
    console.debug(`\n*** ${notebook.name} ${totalNotes} ***`);

    // page through using the maximum fetch of 250

    for (let counter = 0; counter < totalNotes; counter += 250) {

      console.debug('calling with offset', counter);

      const spec = { includeTitle: true, includeUpdated: true, includeContentLength: true };
      const metadata = await noteStore.findNotesMetadata({ notebookGuid: notebook.guid, order: 2, ascending: false }, counter, 250, spec);

      // get the metadata
      for (let noteMeta of metadata.notes) {
        console.debug(`\n "${noteMeta.title}" (${noteMeta.contentLength}B) updated ${new Date(noteMeta.updated)} ${noteMeta.guid}`);

        // if this is the first run for the notebook 
        // or the note has been updated since the last time we processed the notebook, process it
        if (!lastProcessedDate || noteMeta.updated > lastProcessedDate) {
          const note = await noteStore.getNote(noteMeta.guid, true, false, false, false);
          if (note.resources) {
            console.debug(`Note has ${note.resources.length} resources`);
          }
          console.debug(note.content);
        }

        // if this is not the first run for the notebook and the note we have reached was updated 
        // earlier than the last time we processed the notebook, we can stop processing the notebook
        if (lastProcessedDate && noteMeta.updated <= lastProcessedDate) {
          console.debug('Note updated earlier than last processed date, stopping');
          break;
        }

      }
    }

    // update the last processed time for the notebook
    console.debug('writing info.json');
    fs.writeFileSync(infoFileName, JSON.stringify({ processed: new Date().toISOString() }));


  }

})();



