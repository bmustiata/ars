# ars

Poor man's yo for quick project generation.

## Installation

```sh
npm install -g ars
```

## Creating a new project

```
ars project-type
```

or if a project is already created, and we want to reaply the templates,
but with a tree diff for all the conflicting files. This will use the program
specified in the `ARS_DIFF_TOOL` or in case the variable is not defined
`vimdiff`:

```
arst project-type
```

This will copy all the resources from the `~/.projects/project-type`
into the current folder. Files that have the `.hbs` extension will
be used as templates, and copied with the extension removed.

The project type is sent as `NAME` into the handlebars templates.

Thus if you have a structure such as:

```
.projects/project-type
├── package.json.hbs
└── static
    └── index.html
```

After the `ars project-type` command you will have in your current
folder:

```
.
├── package.json
└── static
    └── index.html
```

The package.json file will be parsed as expected.

If the file name from the project ends with `.KEEP` on subsequent
calls from the same folder, it won't be overwritten.

## Parameters

Parameters can be also passed to the templates themselves. In case a parameter does not have a value, `true` will be set instead.

```
ars package-type name1=value name2 name3=3
```

This will generate a `package-type` project with the following parameters sent into the handlebars template:

```json
{
    "NAME" : "package-type",
    "name1" : "value",
    "name2" : true,
    "name3" : "3"
}
```

## Configuration

If you store your project files into a different folder, you can use
the `ARS_PROJECTS_FOLDER` environment variable to point to the
absolute path of it.
