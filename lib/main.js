const { CompositeDisposable, Disposable } = require('atom')
const fs = require('fs-extra')
const path = require('path')
const clipboardEx = require('electron-clipboard-ex')

module.exports = {

  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.commands.add('.platform-win32 .tree-view', {
        'windows-clip:copy': () => this.treeCopy(),
        'windows-clip:paste': () => this.treePaste(false),
        'windows-clip:force': () => this.treePaste(true),
      }),
    );
  },

  deactivate () {
    this.disposables.dispose()
  },

  // ===== electron-clipboard-ex ===== /

  getFilepaths() {
    return clipboardEx.readFilePaths()
  },

  setFilepaths(filePaths) {
    clipboardEx.writeFilePaths(filePaths)
  },

  // ===== tree-view ===== /

  consumeTreeView(treeView) {
    this.treeView = treeView
    return new Disposable(() => { this.treeView = null })
  },

  treeCopy() {
    if (!this.treeView) { return }
    this.setFilepaths(this.treeView.selectedPaths())
  },

  treePaste(overwrite=false) {
    if (!this.treeView) { return }
    let sels = []
    for (let sel of this.treeView.selectedPaths()) {
      if (!fs.lstatSync(sel).isDirectory()) {
        sel = path.dirname(sel)
      }
      if (!sels.includes(sel)) {
        sels.push(sel)
      }
    }
    let srcs = this.getFilepaths()
    for (let sel of sels) {
      for (let src of srcs) {
        let dst = path.join(sel, path.basename(src))
        if (!overwrite) { dst = this.findName(dst) }
        fs.copy(src, dst, { overwrite:overwrite, errorOnExist:true }, (err) => {
          if (err) { console.error(err) }
        })
      }
    }
  },

  // ===== Tools ===== //

  findName(dst) {
    i = 0
    while (true) {
      pth = this.getWinCopyName(dst, i)
      if (fs.existsSync(pth)) {
        i = i+1
      } else {
        return pth
      }
    }
  },

  getWinCopyName(dst, i) {
    if (i>0) {
      let pth = path.parse(dst)
      let num = i==1 ? '' : ` (${i})`
      return `${pth.dir}${path.sep}${pth.name} - Copy${num}${pth.ext}`
    } else {
      return dst
    }
  },
}
