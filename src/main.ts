// ==========================================================================
// Requires
// ==========================================================================
import * as fs from "fs"
import * as handlebars from "handlebars"
import * as colors from "colors"
import * as fsExtra from "fs-extra"
import * as path from "path"
import * as childProcess from "child_process"

const ARS_PROJECTS_FOLDER = process.env.ARS_PROJECTS_FOLDER ?
                process.env.ARS_PROJECTS_FOLDER :
                path.join(process.env.HOME, ".projects")

const ARS_DIFF_TOOL = process.env.ARS_DIFF_TOOL ?
                process.env.ARS_DIFF_TOOL :
                'vimdiff'

// ==========================================================================
// Parse the projectName, and projectParameters from the program arguments
// ==========================================================================
const args = [];

for (var i = 2; i < process.argv.length; i++) {
    args.push(process.argv[i]);
}

// ==========================================================================
// Read previous settings if they are available
// ==========================================================================

let projectParameters = null

if (isFile(".ars")) {
    projectParameters = JSON.parse(fs.readFileSync(".ars", "utf-8"))
    console.log(colors.cyan(`Using already existing '.ars' file settings: ${JSON.stringify(projectParameters)}`))
}

// we don't have project parameters, nor default settins, bailing out
if (!args.length && !projectParameters) {
    console.log(colors.red("You need to pass a project name to generate."))

    console.log(`Available projects (${colors.cyan(ARS_PROJECTS_FOLDER)}):`)
    fs.readdirSync(ARS_PROJECTS_FOLDER)
      .sort()
      .forEach((it) => {
        console.log(` * ${it}`)
      })

    process.exit(1)
}

// if we have arguments, we need to either create, or augument the projectParameters
// with the new settings.
if (args.length) {
    projectParameters = projectParameters ? projectParameters : {}

    projectParameters['NAME'] = args[0]
    args.splice(0, 1)
}

// we iterate the rest of the parameters, and augument the projectParameters
const PARAM_RE = /^(.*?)(=(.*))?$/
args.forEach(function(it, index) {
    const m = PARAM_RE.exec(it)
    const paramName = m[1]
    const paramValue = m[3] ? m[3] : true

    projectParameters[paramName] = paramValue
    projectParameters[`arg${index}`] = paramName
})

const projectName = projectParameters.NAME

// ==========================================================================
// Generate the actual project.
// ==========================================================================
console.log(`Generating ${projectName} with ${JSON.stringify(projectParameters)}.`)

if (!isFile(path.join(ARS_PROJECTS_FOLDER, projectName, ".noars"))) {
    fs.writeFileSync(".ars", JSON.stringify(projectParameters), "utf-8")
}

processFolder(".", path.join(ARS_PROJECTS_FOLDER, projectName))

/**
 * Recursively process the handlebars templates for the given project.
 * @param {string} currentPath
 * @param {string} fullFolderPath
 */
function processFolder(currentPath, fullFolderPath) {
    fs.readdirSync(fullFolderPath).forEach(function(fileName) {
        let f = parseFileName(fileName, projectParameters)

        let fullLocalPath = path.join(currentPath, f.name);
        let fullFilePath = path.join(fullFolderPath, f.originalName);

        if (fileName == ".noars") {
            console.log(colors.yellow("Ignoring file        : " + ".noars"))
            return
        }

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
            if (!isFile(fullLocalPath)) {
                console.log(colors.cyan("Copying regular file : " + fullLocalPath))
                fsExtra.copySync(fullFilePath, fullLocalPath);

                return;
            }

            if (fs.readFileSync(fullFilePath, "utf-8") == fs.readFileSync(fullLocalPath, "utf-8")) {
                console.log(colors.cyan("No update needed     : " + fullLocalPath));
                return;
            }

            // we have a conflict.
            let fullLocalPathOrig = fullLocalPath + ".orig"

            fsExtra.copySync(fullLocalPath, fullLocalPathOrig);
            fsExtra.copySync(fullFilePath, fullLocalPath);
            executeDiff(ARS_DIFF_TOOL, fullLocalPath, fullLocalPathOrig);
            fs.unlinkSync(fullLocalPathOrig);

            console.log(colors.red("Conflict resolved    : " + fullLocalPath));

            return;
        }


        let templateContent = fs.readFileSync(fullFilePath, "utf-8")
        let template = handlebars.compile(templateContent)
        let content = template(projectParameters)

        if (!isFile(fullLocalPath)) {
            console.log(colors.cyan("Parsing HBS template : " + fullLocalPath))
            fs.writeFileSync(fullLocalPath, content, "utf-8")

            return;
        }

        if (content == fs.readFileSync(fullLocalPath, "utf-8")) {
            console.log(colors.cyan("No update needed     : " + fullLocalPath));
            return;
        }

        let fullLocalPathOrig = fullLocalPath + ".orig"

        fsExtra.copySync(fullLocalPath, fullLocalPathOrig);
        fs.writeFileSync(fullLocalPath, content, "utf-8")
        executeDiff(ARS_DIFF_TOOL, fullLocalPath, fullLocalPathOrig);
        fs.unlinkSync(fullLocalPathOrig);

        console.log(colors.red("Conflict resolved HBS: " + fullLocalPath));
    });
}

/**
 * parseFileName - Parse the file name
 * @param {string} fileName
 * @param {any} projectParameters
 * @return {Object}
 */
function parseFileName(fileName, projectParameters) {
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

    result.name = handlebars.compile(name)(projectParameters);

    return result;
}

/**
 * isDirectory - Checks if the given file path is a directory.
 * @param {string} name
 * @return {boolean}
 */
function isDirectory(name) {
    try {
        return fs.statSync(name).isDirectory();
    } catch (e) {
        return false;
    }
}

/**
 * isFile - Checks if the given file path is an existing file
 * @param {string} name
 * @return {boolean}
 */
function isFile(name) {
    try {
        return fs.statSync(name).isFile();
    } catch (e) {
        return false;
    }
}

/**
 * executeDiff - Execute the given diff process.
 * @param {string} diff program name
 * @param {string} file1 first file to diff
 * @param {string} file2 second file do diff
 * @return {void}
 */
function executeDiff(processName, file1, file2) {
    childProcess.execSync(
        `${processName} "${file1}" "${file2}"`,
        {stdio:[0,1,2]});
}

