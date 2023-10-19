# Lucence For Halo

![banner](https://github.com/DioxideCN/plugin-lucence-for-halo/blob/main/images/banner-english.png?raw=true)

## Abstract

The "Lucence For Halo" plugin integrates the Lucence Markdown Editor into Halo versions 2.8.0 and above. This is a robust Markdown syntax editor that supports all Markdown conventions, offers multi-theme switching, memory-based settings, docking features, and more.

## Installation and Usage

Wouldn’t it be great to use the "Lucence For Halo" editor and Markdown syntax for content creation? Now follow the steps below to install the plug-in into your Halo plug-in library:

1. Download the latest official version of "Lucence for Halo" from the [Release](https://github.com/DioxideCN/plugin-lucence-for-halo/releases) page.
2. Install it into your Halo plugin library and activate it.
3. In the top-right corner of an article page or a newly created blank page, switch the editor to "Lucence for Halo".
4. At this point, you're all set to compose articles using the "Lucence for Halo" editor.

![Select Editor](https://github.com/DioxideCN/plugin-lucence-for-halo/blob/main/images/select-editor.png?raw=true)

## Building the Project

If you wish to further develop and extend the "Lucence for Halo" plugin, you should first fork the repository. After a successful fork, open the project using IntelliJ IDEA. To build the frontend dependencies, navigate to the `console` directory and execute the following commands:

```shell
cd ./console/

pnpm i
```

Once the build is complete, execute the project's 'build' Gradle Task to construct the plugin project or you can use the commands below to build it:

```shell
gradle build
```

## Configuring the Local Environment

If you are running and debugging the "Lucence for Halo" plugin in Halo's compilation environment, you'll need to add the following YAML configuration within Halo's source code:

```yaml
halo:
  plugin:
    runtime-mode: development
    fixed-plugin-path:
      - \Your Project Directory\plugin-lucence-for-halo
```

## Contributing

If you have innovative ideas or discover any issues, we encourage you to contribute by forking the repository and submitting a Pull Request. Once your code passes the tests, it will be merged into the main branch, becoming a permanent part of "Lucence for Halo".

## License

[GPL-3.0 license](https://github.com/DioxideCN/plugin-lucence-for-halo/blob/main/LICENSE)
