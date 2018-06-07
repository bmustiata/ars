#!/usr/bin/env node
require("source-map-support/register");

module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	module.exports = __webpack_require__(2);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = require("babel-polyfill");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	Object.defineProperty(exports, "__esModule", { value: true });
	// ==========================================================================
	// Requires
	// ==========================================================================
	var fs = __webpack_require__(3);
	var handlebars = __webpack_require__(4);
	var colors = __webpack_require__(5);
	var fsExtra = __webpack_require__(6);
	var path = __webpack_require__(7);
	var childProcess = __webpack_require__(8);
	var ARS_PROJECTS_FOLDER = process.env.ARS_PROJECTS_FOLDER ? process.env.ARS_PROJECTS_FOLDER : path.join(process.env.HOME, ".projects");
	var ARS_DIFF_TOOL = process.env.ARS_DIFF_TOOL ? process.env.ARS_DIFF_TOOL : 'vimdiff';
	// ==========================================================================
	// Parse the projectName, and projectParameters from the program arguments
	// ==========================================================================
	var args = [];
	args.push.apply(args, _toConsumableArray(process.argv));
	args.splice(0, 2);
	var generateArs = true;
	var noArsParameterPosition = args.indexOf('-n');
	if (noArsParameterPosition >= 0) {
	    generateArs = false;
	    args.splice(noArsParameterPosition, 1);
	}
	// ==========================================================================
	// Read previous settings if they are available
	// ==========================================================================
	var projectParameters = null;
	if (isFile(".ars")) {
	    projectParameters = JSON.parse(fs.readFileSync(".ars", "utf-8"));
	    console.log(colors.cyan("Using already existing '.ars' file settings: " + JSON.stringify(projectParameters)));
	}
	// we don't have project parameters, nor default settins, bailing out
	if (!args.length && !projectParameters) {
	    console.log(colors.red("You need to pass a project name to generate."));
	    console.log("Available projects (" + colors.cyan(ARS_PROJECTS_FOLDER) + "):");
	    fs.readdirSync(ARS_PROJECTS_FOLDER).sort().forEach(function (it) {
	        console.log(" * " + it);
	    });
	    process.exit(1);
	}
	// if we have arguments, we need to either create, or augument the projectParameters
	// with the new settings.
	if (args.length) {
	    projectParameters = projectParameters ? projectParameters : {};
	    projectParameters['NAME'] = args[0];
	    args.splice(0, 1);
	}
	// we iterate the rest of the parameters, and augument the projectParameters
	var PARAM_RE = /^(.*?)(=(.*))?$/;
	args.forEach(function (it, index) {
	    var m = PARAM_RE.exec(it);
	    var paramName = m[1];
	    var paramValue = m[3] ? m[3] : true;
	    projectParameters[paramName] = paramValue;
	    projectParameters["arg" + index] = paramName;
	});
	var projectName = projectParameters.NAME;
	// ==========================================================================
	// Generate the actual project.
	// ==========================================================================
	console.log("Generating " + projectName + " with " + JSON.stringify(projectParameters) + ".");
	if (!isFile(path.join(ARS_PROJECTS_FOLDER, projectName, ".noars")) && generateArs) {
	    fs.writeFileSync(".ars", JSON.stringify(projectParameters), { encoding: "utf-8" });
	}
	processFolder(".", path.join(ARS_PROJECTS_FOLDER, projectName));
	/**
	 * Recursively process the handlebars templates for the given project.
	 * @param {string} currentPath
	 * @param {string} fullFolderPath
	 */
	function processFolder(currentPath, fullFolderPath) {
	    fs.readdirSync(fullFolderPath).forEach(function (fileName) {
	        var f = parseFileName(fileName, projectParameters);
	        var fullLocalPath = path.join(currentPath, f.name);
	        var fullFilePath = path.join(fullFolderPath, f.originalName);
	        if (fileName == ".noars") {
	            console.log(colors.yellow("Ignoring file        : " + ".noars"));
	            return;
	        }
	        if (isDirectory(fullFilePath)) {
	            if (isDirectory(fullLocalPath)) {
	                console.log(colors.yellow("Already exists folder: " + fullLocalPath));
	            } else {
	                console.log(colors.cyan("Creating folder      : " + fullLocalPath));
	                fs.mkdirSync(fullLocalPath);
	            }
	            processFolder(fullLocalPath, fullFilePath);
	            return;
	        }
	        if (f.keepExisting && isFile(fullLocalPath)) {
	            console.log(colors.yellow("Keeping regular file : " + fullLocalPath));
	            return;
	        }
	        if (!f.hbsTemplate) {
	            if (!isFile(fullLocalPath)) {
	                console.log(colors.cyan("Copying regular file : " + fullLocalPath));
	                fsExtra.copySync(fullFilePath, fullLocalPath);
	                return;
	            }
	            if (fs.readFileSync(fullFilePath, "utf-8") == fs.readFileSync(fullLocalPath, "utf-8")) {
	                console.log(colors.cyan("No update needed     : " + fullLocalPath));
	                return;
	            }
	            // we have a conflict.
	            var _fullLocalPathOrig = fullLocalPath + ".orig";
	            fsExtra.copySync(fullLocalPath, _fullLocalPathOrig);
	            fsExtra.copySync(fullFilePath, fullLocalPath);
	            executeDiff(ARS_DIFF_TOOL, fullLocalPath, _fullLocalPathOrig);
	            fs.unlinkSync(_fullLocalPathOrig);
	            console.log(colors.red("Conflict resolved    : " + fullLocalPath));
	            return;
	        }
	        var templateContent = fs.readFileSync(fullFilePath, "utf-8");
	        var template = handlebars.compile(templateContent);
	        var content = template(projectParameters);
	        if (!isFile(fullLocalPath)) {
	            console.log(colors.cyan("Parsing HBS template : " + fullLocalPath));
	            fs.writeFileSync(fullLocalPath, content, { encoding: "utf-8" });
	            return;
	        }
	        if (content == fs.readFileSync(fullLocalPath, "utf-8")) {
	            console.log(colors.cyan("No update needed     : " + fullLocalPath));
	            return;
	        }
	        var fullLocalPathOrig = fullLocalPath + ".orig";
	        fsExtra.copySync(fullLocalPath, fullLocalPathOrig);
	        fs.writeFileSync(fullLocalPath, content, { encoding: "utf-8" });
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
	    var result = {
	        name: null,
	        originalName: fileName,
	        keepExisting: false,
	        hbsTemplate: false
	    };
	    var name = fileName;
	    if (/\.KEEP$/.test(name)) {
	        result.keepExisting = true;
	        name = name.substring(0, name.length - ".KEEP".length);
	    }
	    if (/\.hbs/.test(name)) {
	        result.hbsTemplate = true;
	        name = name.substring(0, name.length - ".hbs".length);
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
	    childProcess.execSync(processName + " \"" + file1 + "\" \"" + file2 + "\"", { stdio: [0, 1, 2] });
	}

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	module.exports = require("fs");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	module.exports = require("handlebars");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	module.exports = require("colors");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

	module.exports = require("fs-extra");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	module.exports = require("path");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	module.exports = require("child_process");

/***/ })
/******/ ]);
//# sourceMappingURL=main.js.map