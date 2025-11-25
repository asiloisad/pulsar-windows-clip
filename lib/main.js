const { CompositeDisposable, Disposable } = require('atom')
const fs = require('fs-extra')
const path = require('path')
const clipboard = require('node-gyp-build')(path.join(__dirname, '..'))

// Drop effect constants from native module
const DROP_EFFECT_NONE = clipboard.DROP_EFFECT_NONE // 0
const DROP_EFFECT_COPY = clipboard.DROP_EFFECT_COPY // 1
const DROP_EFFECT_MOVE = clipboard.DROP_EFFECT_MOVE // 2
const DROP_EFFECT_LINK = clipboard.DROP_EFFECT_LINK // 4

module.exports = {

  activate () {
    this.disposables = new CompositeDisposable()
    this.disposables.add(
      atom.commands.add('.platform-win32 .tree-view', {
        'windows-clip:cut': () => this.treeCut(),
        'windows-clip:copy': () => this.treeCopy(),
        'windows-clip:paste': () => this.treePaste(false),
        'windows-clip:force': () => this.treePaste(true),
      }),
    );
  },

  deactivate () {
    this.disposables.dispose()
  },

  // ===== Provided Service ===== //

  provideWindowsClip() {
    return {
      // Constants
      DROP_EFFECT_NONE,
      DROP_EFFECT_COPY,
      DROP_EFFECT_MOVE,
      DROP_EFFECT_LINK,

      // Read file paths from Windows clipboard
      readFilePaths: () => clipboard.readFilePaths(),

      // Read the drop effect (NONE=0, COPY=1, MOVE=2, LINK=4)
      readDropEffect: () => clipboard.readDropEffect(),

      // Write file paths to Windows clipboard with drop effect
      writeFilePaths: (filePaths, dropEffect = DROP_EFFECT_COPY) => {
        clipboard.writeFilePaths(filePaths, dropEffect)
      },

      // Clear the clipboard
      clear: () => clipboard.clear(),
    }
  },

  // ===== Native Clipboard API ===== //

  getFilepaths() {
    return clipboard.readFilePaths()
  },

  getDropEffect() {
    return clipboard.readDropEffect()
  },

  setFilepaths(filePaths, dropEffect = DROP_EFFECT_COPY) {
    clipboard.writeFilePaths(filePaths, dropEffect)
  },

  // ===== tree-view ===== //

  consumeTreeView(treeView) {
    this.treeView = treeView
    return new Disposable(() => { this.treeView = null })
  },

  treeCut() {
    if (!this.treeView) { return }
    const paths = this.treeView.selectedPaths()
    if (paths.length > 0) {
      this.setFilepaths(paths, DROP_EFFECT_MOVE)
    }
  },

  treeCopy() {
    if (!this.treeView) { return }
    const paths = this.treeView.selectedPaths()
    if (paths.length > 0) {
      this.setFilepaths(paths, DROP_EFFECT_COPY)
    }
  },

  async treePaste(overwrite = false) {
    if (!this.treeView) { return }

    // Get destination directories from selection
    const dstDirs = []
    for (let sel of this.treeView.selectedPaths()) {
      try {
        if (!(await fs.lstat(sel)).isDirectory()) {
          sel = path.dirname(sel)
        }
        if (!dstDirs.includes(sel)) {
          dstDirs.push(sel)
        }
      } catch (err) {
        console.error(`windows-clip: Failed to stat ${sel}:`, err)
      }
    }

    if (dstDirs.length === 0) { return }

    // Get source files and drop effect from clipboard
    const srcs = this.getFilepaths()
    if (srcs.length === 0) { return }

    const dropEffect = this.getDropEffect()
    const isMove = dropEffect === DROP_EFFECT_MOVE

    // Process each destination directory
    for (const dstDir of dstDirs) {
      for (const src of srcs) {
        let dst = path.join(dstDir, path.basename(src))

        // For copy operation (not overwrite), find unique name
        if (!overwrite) {
          dst = await this.findName(dst)
        }

        try {
          if (isMove && dstDirs.length === 1) {
            // Move operation: only move to a single destination
            await fs.move(src, dst, { overwrite: overwrite })
          } else {
            // Copy operation (or move to multiple destinations)
            await fs.copy(src, dst, { overwrite: overwrite, errorOnExist: true })
          }
        } catch (err) {
          console.error(`windows-clip: Failed to ${isMove ? 'move' : 'copy'} ${src} to ${dst}:`, err)
        }
      }
    }

    // Clear clipboard after move operation to prevent re-moving
    if (isMove && dstDirs.length === 1) {
      clipboard.clear()
    }
  },

  // ===== Tools ===== //

  async findName(dst) {
    let i = 0
    while (true) {
      const pth = this.getWinCopyName(dst, i)
      if (await fs.pathExists(pth)) {
        i++
      } else {
        return pth
      }
    }
  },

  getWinCopyName(dst, i) {
    if (i > 0) {
      const pth = path.parse(dst)
      const num = i === 1 ? '' : ` (${i})`
      return `${pth.dir}${path.sep}${pth.name} - Copy${num}${pth.ext}`
    } else {
      return dst
    }
  },
}
