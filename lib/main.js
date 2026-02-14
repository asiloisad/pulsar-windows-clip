const { CompositeDisposable, Disposable } = require("atom");
const fs = require("fs-extra");
const path = require("path");
const clipboard = require("node-gyp-build")(path.join(__dirname, ".."));

/**
 * Drop effect constants from Windows clipboard API.
 * These match the DROPEFFECT values used by Windows Explorer.
 */
const DROP_EFFECT_NONE = clipboard.DROP_EFFECT_NONE; // 0
const DROP_EFFECT_COPY = clipboard.DROP_EFFECT_COPY; // 1
const DROP_EFFECT_MOVE = clipboard.DROP_EFFECT_MOVE; // 2
const DROP_EFFECT_LINK = clipboard.DROP_EFFECT_LINK; // 4

/**
 * Windows Clip Package
 * Provides native Windows clipboard integration for file operations in tree-view.
 * Enables copy/cut/paste of files using the Windows clipboard format.
 */
module.exports = {
  /**
   * Activates the package and registers tree-view commands.
   */
  activate() {
    this.disposables = new CompositeDisposable();
    this.disposables.add(
      atom.commands.add(".platform-win32 .tree-view", {
        "windows-clip:cut": () => this.treeCut(),
        "windows-clip:copy": () => this.treeCopy(),
        "windows-clip:paste": () => this.treePaste(false),
        "windows-clip:force": () => this.treePaste(true),
      }),
    );
  },

  /**
   * Deactivates the package and disposes all subscriptions.
   */
  deactivate() {
    this.disposables.dispose();
  },

  // ===== Provided Service ===== //

  /**
   * Provides the Windows clipboard service API for other packages.
   * @returns {Object} Service object with clipboard methods and constants
   */
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
        clipboard.writeFilePaths(filePaths, dropEffect);
      },

      // Clear the clipboard
      clear: () => clipboard.clear(),
    };
  },

  // ===== Native Clipboard API ===== //

  /**
   * Reads file paths from the Windows clipboard.
   * @returns {string[]} Array of file paths
   */
  getFilepaths() {
    return clipboard.readFilePaths();
  },

  /**
   * Reads the drop effect from the Windows clipboard.
   * @returns {number} Drop effect constant (NONE=0, COPY=1, MOVE=2, LINK=4)
   */
  getDropEffect() {
    return clipboard.readDropEffect();
  },

  /**
   * Writes file paths to the Windows clipboard with a drop effect.
   * @param {string[]} filePaths - Array of file paths to write
   * @param {number} dropEffect - Drop effect constant (default: COPY)
   */
  setFilepaths(filePaths, dropEffect = DROP_EFFECT_COPY) {
    clipboard.writeFilePaths(filePaths, dropEffect);
  },

  // ===== tree-view ===== //

  /**
   * Consumes the tree-view service.
   * @param {Object} treeView - The tree-view service object
   * @returns {Disposable} Disposable to unregister the service
   */
  consumeTreeView(treeView) {
    this.treeView = treeView;
    return new Disposable(() => {
      this.treeView = null;
    });
  },

  /**
   * Cuts selected files in tree-view to the clipboard.
   */
  treeCut() {
    if (!this.treeView) {
      return;
    }
    const paths = this.treeView.selectedPaths();
    if (paths.length > 0) {
      this.setFilepaths(paths, DROP_EFFECT_MOVE);
    }
  },

  /**
   * Copies selected files in tree-view to the clipboard.
   */
  treeCopy() {
    if (!this.treeView) {
      return;
    }
    const paths = this.treeView.selectedPaths();
    if (paths.length > 0) {
      this.setFilepaths(paths, DROP_EFFECT_COPY);
    }
  },

  /**
   * Pastes files from the clipboard to selected directories in tree-view.
   * @param {boolean} overwrite - Whether to overwrite existing files
   */
  async treePaste(overwrite = false) {
    if (!this.treeView) {
      return;
    }

    // Get destination directories from selection
    const dstDirs = [];
    for (let sel of this.treeView.selectedPaths()) {
      try {
        if (!(await fs.lstat(sel)).isDirectory()) {
          sel = path.dirname(sel);
        }
        if (!dstDirs.includes(sel)) {
          dstDirs.push(sel);
        }
      } catch (err) {
        console.error(`windows-clip: Failed to stat ${sel}:`, err);
      }
    }

    if (dstDirs.length === 0) {
      return;
    }

    // Get source files and drop effect from clipboard
    const srcs = this.getFilepaths();
    if (srcs.length === 0) {
      return;
    }

    const dropEffect = this.getDropEffect();
    const isMove = dropEffect === DROP_EFFECT_MOVE;

    // Process each destination directory
    for (let dstDir of dstDirs) {
      for (const src of srcs) {
        // If destination is the source itself or a subdirectory of it,
        // paste into the parent directory instead (matches Windows Explorer behavior)
        let effectiveDstDir = dstDir;
        const srcNorm = path.normalize(src);
        const dstNorm = path.normalize(dstDir);
        if (dstNorm === srcNorm || dstNorm.startsWith(srcNorm + path.sep)) {
          effectiveDstDir = path.dirname(srcNorm);
        }
        let dst = path.join(effectiveDstDir, path.basename(src));

        // For copy operation (not overwrite), find unique name
        if (!overwrite) {
          dst = await this.findName(dst);
        }

        try {
          if (isMove && dstDirs.length === 1) {
            // Move operation: only move to a single destination
            await fs.move(src, dst, { overwrite: overwrite });
          } else {
            // Copy operation (or move to multiple destinations)
            await fs.copy(src, dst, {
              overwrite: overwrite,
              errorOnExist: true,
            });
          }
        } catch (err) {
          console.error(
            `windows-clip: Failed to ${isMove ? "move" : "copy"} ${src} to ${dst}:`,
            err,
          );
        }
      }
    }

    // Clear clipboard after move operation to prevent re-moving
    if (isMove && dstDirs.length === 1) {
      clipboard.clear();
    }
  },

  // ===== Tools ===== //

  /**
   * Finds a unique filename for the destination, avoiding collisions.
   * Uses Windows-style naming: "file - Copy.ext", "file - Copy (2).ext", etc.
   * @param {string} dst - The desired destination path
   * @returns {Promise<string>} A unique path that doesn't exist
   */
  async findName(dst) {
    for (let i = 0; ; i++) {
      const pth = this.getWinCopyName(dst, i);
      if (!(await fs.pathExists(pth))) {
        return pth;
      }
    }
  },

  /**
   * Generates a Windows-style copy name for a file.
   * @param {string} dst - The original destination path
   * @param {number} i - The copy index (0 = original, 1 = "- Copy", 2+ = "- Copy (n)")
   * @returns {string} The formatted path with copy suffix
   */
  getWinCopyName(dst, i) {
    if (i > 0) {
      const pth = path.parse(dst);
      const num = i === 1 ? "" : ` (${i})`;
      return `${pth.dir}${path.sep}${pth.name} - Copy${num}${pth.ext}`;
    } else {
      return dst;
    }
  },
};
