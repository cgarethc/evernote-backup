const fs = require('fs');

const Evernote = require('evernote');
const config = require('./config');
const sanitise = require("./sanitise").sanitise;
const sanitize = require("sanitize-filename");

const client = new Evernote.Client({
  sandbox: config.SANDBOX,
  china: false,
  token: config.DEVELOPER_TOKEN
});

(async () => {

  if (!fs.existsSync('./files')) {
    // create the output directory
    fs.mkdirSync('./files');
  }

  const noteStore = client.getNoteStore();  
  const notebooks = await noteStore.listNotebooks();

  for (let notebook of notebooks) {

    let lastProcessedDate;

    const sanitizedNotebookDirName = `./files/${sanitise(sanitize(notebook.name))}`;
    const infoFileName = `${sanitizedNotebookDirName}/info.json`;
    console.debug('Checking if notebook exists on disk already', sanitizedNotebookDirName);
    if (!fs.existsSync(sanitizedNotebookDirName)) {
      // never seen this notebook before, create the directory for it
      console.debug(`Directory doesn't exist, creating it`);
      processThisNotebook = true;
      fs.mkdirSync(sanitizedNotebookDirName);
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

          if (lastProcessedDate) {
            console.debug(`Note updated since last processed: ${new Date(noteMeta.updated)} > ${lastProcessedDate}`);
          }

          const note = await noteStore.getNote(noteMeta.guid, true, false, false, false);
          const sanitisedNoteDirName = `${sanitizedNotebookDirName}/${sanitise(sanitize(note.title))}`;
          if (note.resources) {            
            if (!fs.existsSync(sanitisedNoteDirName)) {
              // create a directory with same name as the note to hold the resources
              fs.mkdirSync(sanitisedNoteDirName);
            }
            console.debug('Note resources', note.resources.map(resource => resource.guid));
            // download the resources
            for (let resource of note.resources) {
              const resourceDownload = await noteStore.getResource(resource.guid, true, false, true, false);
              const fileContent = resourceDownload.data.body;
              const fileType = resourceDownload.mime;
              const fileName = resourceDownload.attributes.fileName;
              console.log(`Writing ${fileName} of type ${fileType} (${fileContent.length}B)`);
              const sanitisedResourceFilename = `${sanitisedNoteDirName}/${sanitise(sanitize(fileName))}`;
              fs.writeFileSync(sanitisedResourceFilename, fileContent);
            }
          }
          console.debug('Writing note');
          // write the note content
          fs.writeFileSync(`${sanitisedNoteDirName}.xml`, note.content);
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



