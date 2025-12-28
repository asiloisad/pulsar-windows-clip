# windows-clip

Native Windows clipboard operations for tree-view files and folders.

![context-menu](https://github.com/asiloisad/pulsar-windows-clip/blob/master/assets/context-menu.png?raw=true)

## Features

- **Native clipboard**: Uses Windows clipboard API directly for cross-application compatibility.
- **Cut/Copy/Paste**: Full clipboard operations with Explorer interoperability.
- **Smart duplicates**: Uses Windows naming format `<name> - Copy (n)<ext>`.
- **Force paste**: Option to overwrite existing files.
- **Service**: Provides clipboard access for other packages.

## Installation

To install `windows-clip` search for [windows-clip](https://web.pulsar-edit.dev/packages/windows-clip) in the Install pane of the Pulsar settings or run `ppm install windows-clip`. Alternatively, you can run `ppm install asiloisad/pulsar-windows-clip` to install a package directly from the GitHub repository.

## Commands

Commands available in `.platform-win32 .tree-view`:

- `windows-clip:cut`: (`Shift+X`) cut selected files/folders to clipboard,
- `windows-clip:copy`: (`Shift+C`) copy selected files/folders to clipboard,
- `windows-clip:paste`: (`Shift+V`) paste from clipboard (auto-rename if exists),
- `windows-clip:force`: (`Shift+B`) paste from clipboard (overwrite if exists).

## Service

The package provides a `windows-clip` service for other packages.

In your `package.json`:

```json
{
  "consumedServices": {
    "windows-clip": {
      "versions": {
        "1.0.0": "consumeWindowsClip"
      }
    }
  }
}
```

In your main module:

```javascript
module.exports = {
  consumeWindowsClip(windowsClip) {
    // Constants for drop effect
    windowsClip.DROP_EFFECT_NONE  // 0
    windowsClip.DROP_EFFECT_COPY  // 1
    windowsClip.DROP_EFFECT_MOVE  // 2
    windowsClip.DROP_EFFECT_LINK  // 4

    // Read file paths from Windows clipboard
    const paths = windowsClip.readFilePaths()

    // Read the drop effect (copy/move/link)
    const effect = windowsClip.readDropEffect()

    // Write file paths to clipboard with drop effect
    windowsClip.writeFilePaths(['/path/to/file'], windowsClip.DROP_EFFECT_COPY)

    // Clear the clipboard
    windowsClip.clear()
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub — any feedback's welcome!
