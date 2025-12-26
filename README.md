# windows-clip

Native Windows clipboard Cut/Copy/Paste operations for tree-view. Uses the Windows clipboard API directly, so files copied in Pulsar can be pasted in Windows Explorer and vice versa. Duplicate files use the Windows naming format `<name> - Copy (n)<ext>`.

![context-menu](https://github.com/asiloisad/pulsar-windows-clip/blob/master/assets/context-menu.png?raw=true)

## Installation

To install `windows-clip` search for [windows-clip](https://web.pulsar-edit.dev/packages/windows-clip) in the Install pane of the Pulsar settings or run `ppm install windows-clip`. Alternatively, you can run `ppm install asiloisad/pulsar-windows-clip` to install a package directly from the GitHub repository.

## Commands

In `.platform-win32 .tree-view` there are available commands:

| Command | Description |
| --- | --- |
| `windows-clip:cut` | Cut selected files/folders to clipboard |
| `windows-clip:copy` | Copy selected files/folders to clipboard |
| `windows-clip:paste` | Paste from clipboard (auto-rename if exists) |
| `windows-clip:force` | Paste from clipboard (overwrite if exists) |

Commands are available in context-menu.

## Service API

The package provides a `windows-clip` service for other packages:

```javascript
// In your package.json:
// "consumedServices": { "windows-clip": { "versions": { "1.0.0": "consumeWindowsClip" } } }

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
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub — any feedback's welcome!
