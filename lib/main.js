'use babel'

import { CompositeDisposable, Disposable } from 'atom'
import { execFile } from 'child_process'
import path from 'path'
import fs from "fs"

export default {

  config: {
    showNotifications: {
      order: 1,
      title: 'Show sucessful notifications',
      description: 'Toggle a notification of successful operation. An error will be displayed in any case',
      type: 'boolean',
      default: true,
    },
  },

  activate () {
    this.treeView = null
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.config.observe('windows-clip.showNotifications', (value) => {
        this.showNotifications = value
      }),
      atom.commands.add('.platform-win32 .tree-view', {
        'windows-clip:copy' : () => this.treeCopy (),
        'windows-clip:paste': () => this.treePaste(0),
        'windows-clip:force': () => this.treePaste(1),
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

  treeCopy() {
    let selectedPaths = this.treeView.selectedPaths()
    execFile(path.join(__dirname, '../build/clipcopy.exe'), selectedPaths, (error, stdout, stderr) => {
      if (error) {
        atom.notifications.addError('windows-clip:copy', { detail:stderr })
      } else if (this.showNotifications) {
        atom.notifications.addSuccess('windows-clip:copy', { detail:stdout })
      }
    })
  },

  treePaste(overwrite) {
    let ow = overwrite ? '-overwrite:yes' : '-overwrite:no'
    let selectedPaths = this.treeView.selectedPaths()
    for (let selectedPath of selectedPaths) {
      if (fs.lstatSync(selectedPath).isFile()) {
        selectedPath = path.dirname(selectedPath)
      }
      execFile(path.join(__dirname, '../build/clippaste.exe'), [ow], { cwd:selectedPath }, (error, stdout, stderr) => {
        if (error) {
          atom.notifications.addError('windows-clip:paste', { detail:stderr })
        } else if (this.showNotifications) {
          atom.notifications.addSuccess('windows-clip:paste', { detail:stdout })
        }
      })
    }
  },
}
