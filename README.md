# windows-clip

A native-like copy/paste operations for tree-view in Windows OS. Windows Explorer copy name format is used `<name> - Copy (i)<ext>`. An NodeJS package called `clipboardEx` works in background.

![context-menu](https://github.com/bacadra/pulsar-windows-clip/blob/master/assets/context-menu.png?raw=true)

## Installation

To install `windows-clip` search for [windows-clip](https://web.pulsar-edit.dev/packages/windows-clip) in the Install pane of the Pulsar settings or run `ppm install windows-clip`. Alternatively, you can run `ppm install bacadra/pulsar-windows-clip` to install a package directly from the Github repository.

## Commands

In `.platform-win32 .tree-view` there are available commands:

- `windows-clip:copy`: (default `Ctrl-Shift-C`) use Windows file-copy function
- `windows-clip:paste`: (default `Ctrl-Shift-V`) use Windows file-paste function
- `windows-clip:force`: (default `Ctrl-Alt-V`) use Windows file-paste function even if name already exists

Commands are available in context-menu.

# Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub — any feedback’s welcome!
