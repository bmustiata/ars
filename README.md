# ars

Poor man's yo for quick project generation.

## Installation

```sh
npm install -g ars
```

## Creating a new project

```
ars project-name
```

This will copy all the resources from the `~/.projects/project-name`
into the current folder. Files that have the `.hbs` extension will 
be used as templates, and copied with the extension removed.

The project name is sent as `NAME` into the handlebars templates.

Thus if you have a structure such as:

```
.projects/project-name
├── package.json.hbs
└── static
    └── index.html  
```

After the `ars project-name` command you will have in your current
folder:

```
.
├── package.json
└── static
    └── index.html
```

The package.json file will be parsed as expected.

## Configuration

If you store your project files into a different folder, you can use
the `ARS_PROJECTS_FOLDER` environment variable to point to the
absolute path of it.