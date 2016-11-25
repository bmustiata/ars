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

args.forEach(function(it) {
    projectParameters[it] = true;
})

// ==========================================================================
// Generate the actual project.
// ==========================================================================
console.log(`Generating ${projectName} with ${JSON.stringify(projectParameters)}.`)

/**
 * Recursively process the handlebars templates for the given project.
 * @param {string} currentPath
 * @param {string} fullFolderPath
 */
function processFolder(currentPath, fullFolderPath) {
    fs.readdirSync(fullFolderPath).forEach(function(fileName) {
        let fullLocalPath = path.join(currentPath, fileName);
        let fullFilePath = path.join(fullFolderPath, fileName);

        if (fs.statSync(fullFilePath).isDirectory()) {
            console.log(colors.cyan("Creating folder      : " + fullLocalPath))
            fs.mkdirSync(fullLocalPath);
            processFolder(fullLocalPath, fullFilePath);
            return;
        }

        if (!/\.hbs$/.test(fileName)) {
            console.log(colors.cyan("Copying regular file : " + fullLocalPath))
            fsExtra.copySync(
                path.join(fullFolderPath, fileName),
                path.join(currentPath, fileName)
            )
            return;
        }


        console.log(colors.cyan("Parsing HBS template : " + fullLocalPath))
        let nonTemplateName = /^(.*)\.hbs$/.exec(fileName)[1]
        fullLocalPath = path.join(currentPath, nonTemplateName);

        let templateContent = fs.readFileSync(fullFilePath, "utf-8")
        let template = handlebars.compile(templateContent)
        let content = template(projectParameters)

        fs.writeFileSync(fullLocalPath, content, "utf-8")
    });
}

processFolder(".", path.join(ARS_PROJECTS_FOLDER, projectName))
