'use babel'

import { CompositeDisposable, Disposable } from 'atom'
import { execFile } from 'child_process'
import path from 'path'
import fs from "fs"

export default {

  config: {
    treeHack: {
      order: 1,
      title: 'Hack copy & paste tree-view methods',
      description: '`tree-view:copy` & `tree-view:paste` will be replaced',
      type: 'boolean',
      default: true,
    },
    hideNotifications: {
      order: 2,
      title: 'Hide sucessful notifications',
      description: 'Toggle a notification of successful operation. An error will be displayed in any case',
      type: 'boolean',
      default: true,
    },
  },

  activate () {
    this.treeView = null
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.config.observe('system-clip.treeHack', (value) => {
        this.treeHack = value
      }),
      atom.config.observe('system-clip.hideNotifications', (value) => {
        this.hideNotifications = value
      }),
      atom.commands.add('.platform-win32 .tree-view', {
        'system-clip:copy' : () => this.treeCopy (),
        'system-clip:paste': () => this.treePaste(0),
        'system-clip:force': () => this.treePaste(1),
      }),
      atom.commands.onWillDispatch(
        (e) => {
          if (!this.treeHack) {
            return
          } else if (e.type==='tree-view:copy') {
            if (!this.treeView) { return }
            e.stopImmediatePropagation()
            this.treeCopy()
          } else if (e.type==='tree-view:paste') {
            if (!this.treeView) { return }
            e.stopImmediatePropagation()
            this.treePaste(0)
          }
        }
      ),
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
        atom.notifications.addError('system-clip:copy', { detail:stderr })
      } else if (!this.hideNotifications) {
        atom.notifications.addSuccess('system-clip:copy', { detail:stdout })
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
          atom.notifications.addError('system-clip:paste', { detail:stderr })
        } else if (!this.hideNotifications) {
          atom.notifications.addSuccess('system-clip:paste', { detail:stdout })
        }
      })
    }
  },
}
