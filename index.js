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
  for(let notebook of notebooks){
    const count = await noteStore.findNoteCounts({ notebookGuid: notebook.guid }, false);
    console.log(notebook.name, count.notebookCounts[notebook.guid]);
  }
})();



