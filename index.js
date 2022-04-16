const Evernote = require('evernote');
const config = require('./config');


const client = new Evernote.Client({
  sandbox: true, // change to false when you are ready to switch to production
  china: false, // change to true if you wish to connect to YXBJ - most of you won't
  token: config.DEVELOPER_TOKEN
});

(async () => {

  var noteStore = client.getNoteStore();

  const notebooks = await noteStore.listNotebooks();
  for (let notebook of notebooks) {
    const count = await noteStore.findNoteCounts({ notebookGuid: notebook.guid }, false);
    const totalNotes = count.notebookCounts[notebook.guid];
    console.log(notebook.name, totalNotes);
    const spec = { includeTitle: true, includeUpdated: true, includeContentLength: true };
    const metadata = await noteStore.findNotesMetadata({ notebookGuid: notebook.guid }, 0, 250, spec);
    console.log(metadata.notes.map(notemeta => `${notemeta.title} - ${notemeta.contentLength}B - ${new Date(notemeta.updated)}`));
  }
})();



