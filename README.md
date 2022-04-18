# evernote-backup

MIT License. See LICENSE.TXT.

Scripted Evernote backup: intended for offline backup running on a Raspberry Pi

This tool is designed to backup all the notes in an Evernote account to the local filesystem.
I use it on a Raspberry Pi with an external USB hard drive, run once a day with a cron job.

I use a FAT32 formatted drive for maximum interoperability between OSes. This does mean that
many common characters are not permitted in filenames. Because the names of photos are used
in the filenames to make them self-describing, the tool will sanitise the names.

* Rename `config.example.js` to `config.js` and edit to add your Evernote developer token
* Run `npm run build` to create a single file `build/server.js`
* Run the file with `node server.js`
* A new directory will be created called "files" with one directory per notebook and one file per note in each - if notes have resources, they will be put in a directory with the same name as the note

`server.js` can be executed on a Raspberry Pi model 3 or above running Raspberry Pi OS with Node.js installed