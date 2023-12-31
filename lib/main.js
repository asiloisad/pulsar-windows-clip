'use babel'

import { CompositeDisposable, Disposable } from 'atom'
import { execFile } from 'child_process'
import path from 'path'
import fs from "fs"

export default {

  config: {
    notifications: {
      order: 1,
      title: 'Show notifications',
      description: 'Toggle a notifications of succesful operations. An error will show up in any case',
      type: 'boolean',
      default: true,
    },
  },

  activate () {
    this.treeView = null
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.config.observe('windows-files.notifications', (value) => {
        this.notifications = value
      }),
      atom.commands.add('.platform-win32 .tree-view', {
        'windows-files:copy' : () => this.copy (),
        'windows-files:paste': () => this.paste(false),
        'windows-files:force': () => this.paste(true),
      }),
    );
  },

  deactivate () {
    this.disposables.dispose()
  },

  consumeTreeView(treeView) {
    this.treeView = treeView
    return new Disposable(() => { this.treeView = null })
  },

  copy() {
    let selectedPaths = this.treeView.selectedPaths()
    execFile(path.join(__dirname, '../build/clipcopy.exe'), selectedPaths, (error, stdout, stderr) => {
      if (error) {
        atom.notifications.addError('windows-files:copy', { detail:stderr })
      } else if (this.notifications) {
        atom.notifications.addSuccess('windows-files:copy', { detail:stdout })
      }
    })
  },

  paste(overwrite) {
    let ow = overwrite ? '-overwrite:yes' : '-overwrite:no'
    let selectedPaths = this.treeView.selectedPaths()
    for (let selectedPath of selectedPaths) {
      if (fs.lstatSync(selectedPath).isFile()) {
        selectedPath = path.dirname(selectedPath)
      }
      execFile(path.join(__dirname, '../build/clippaste.exe'), [ow], { cwd:selectedPath }, (error, stdout, stderr) => {
        if (error) {
          atom.notifications.addError('windows-files:paste', { detail:stderr })
        } else if (this.notifications) {
          atom.notifications.addSuccess('windows-files:paste', { detail:stdout })
        }
      })
    }
  },
}
