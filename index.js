#!/usr/bin/env node

'use strict';

// ==========================================================================
// Requires
// ==========================================================================
const handlebars = require("handlebars"),
      colors = require("colors/safe"),
      fs = require("fs"),
      fsExtra = require("fs-extra"),
      path = require("path");

const ARS_PROJECTS_FOLDER = process.env.ARS_PROJECTS_FOLDER ?
                process.env.ARS_PROJECTS_FOLDER :
                path.join(process.env.HOME, ".projects")

// ==========================================================================
// Parse the projectName, and projectParameters from the program arguments
// ==========================================================================
const args = [];

for (var i = 2; i < process.argv.length; i++) {
    args.push(process.argv[i]);
}

if (!args.length) {
    console.log(colors.red("You need to pass a project name to generate."));
    process.exit(1);
}

const projectName = args[0]
args.splice(0, 1)

const projectParameters = {
    'NAME': projectName
}

const PARAM_RE = /^(.*?)(=(.*))?$/
args.forEach(function(it) {
    const m = PARAM_RE.exec(it)
    const paramName = m[1]
    const paramValue = m[3] ? m[3] : true

    projectParameters[paramName] = paramValue
})

// ==========================================================================
// Generate the actual project.
// ==========================================================================
console.log(`Generating ${projectName} with ${JSON.stringify(projectParameters)}.`)

/**
 * parseFileName - Parse the file name
 * @param {string} fileName
 * @return {Object}
 */
function parseFileName(fileName) {
    const result = {
        name: null,
        originalName: fileName,
        keepExisting: false,
        hbsTemplate: false
    };

    let name = fileName;

    if (/\.KEEP$/.test(name)) {
        result.keepExisting = true
        name = name.substring(0, name.length - ".KEEP".length)
    }

    if (/\.hbs/.test(name)) {
        result.hbsTemplate = true
        name = name.substring(0, name.length - ".hbs".length)
    }

    result.name = name;

    return result;
}

/**
 * Recursively process the handlebars templates for the given project.
 * @param {string} currentPath
 * @param {string} fullFolderPath
 */
function processFolder(currentPath, fullFolderPath) {
    fs.readdirSync(fullFolderPath).forEach(function(fileName) {
        let f = parseFileName(fileName)

        let fullLocalPath = path.join(currentPath, f.name);
        let fullFilePath = path.join(fullFolderPath, f.originalName);

        if (isDirectory(fullFilePath)) {
            if (isDirectory(fullLocalPath)) {
                console.log(colors.yellow("Already exists folder: " + fullLocalPath));
            } else {
                console.log(colors.cyan("Creating folder      : " + fullLocalPath))
                fs.mkdirSync(fullLocalPath);
            }

            processFolder(fullLocalPath, fullFilePath);
            return;
        }


        if (f.keepExisting && isFile(fullLocalPath)) {
            console.log(colors.yellow("Keeping regular file : " + fullLocalPath))
            return;
        }

        if (!f.hbsTemplate) {
            console.log(colors.cyan("Copying regular file : " + fullLocalPath))
            fsExtra.copySync(fullFilePath, fullLocalPath);
            return;
        }


        console.log(colors.cyan("Parsing HBS template : " + fullLocalPath))
        let templateContent = fs.readFileSync(fullFilePath, "utf-8")
        let template = handlebars.compile(templateContent)
        let content = template(projectParameters)

        fs.writeFileSync(fullLocalPath, content, "utf-8")
    });
}

/**
 * isDirectory - Checks if the given file path is a directory.
 * @param {string} name
 * @return {boolean}
 */
function isDirectory(name) {
    return fs.statSync(name).isDirectory();
}

/**
 * isFile - Checks if the given file path is an existing file
 * @param {string} name
 * @return {boolean}
 */
function isFile(name) {
    return fs.statSync(name).isFile();
}

processFolder(".", path.join(ARS_PROJECTS_FOLDER, projectName))
