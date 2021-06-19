// Andrew Pratt 2021
// clean.js: Delete rpkg files

const fs = require("fs");
const path = require("path");
const process = require("process");
const child_process = require("child_process");
const common = require("./common.js");


// Print the cmd syntax for this script
function printSyntax()
{
	console.log("HM3MapGenerator syntax: node clean.js <path to config json> <clean project files?> <clean HITMAN3/Runtime files?>");
	console.log("  Example: node C:/Users/JohnDoe/Documents/HM3MapGenerator/src/clean.js C:/Users/JohnDoe/Documents/HM3MapGenerator/config.json true false");
}


// Delete a list of files
//	config (object): Generator configuration
//	pathFiles (string): List of file paths to delete. Non-existing paths will be skipped.
function delAllSync(config, pathFiles)
{
	for (var pathFile of pathFiles)
	{
		if (fs.existsSync(pathFile))
		{
			if (common.isVanillaRpkg(config, path.basename(pathFile)))
				console.log("Skipping non-mod path " + pathFile);
			else
			{
				console.log("Deleting " + pathFile);
				fs.unlinkSync(pathFile);
			}
		}
		else
			console.log("Path does not exist, not deleting " + pathFile);
	}
}



function main(argv)
{
	// Make sure the right amount of cmd line args were given
	if (argv.length != 5)
	{
		printSyntax();
		return;
	}
	
	console.log("Setting up");
	
	// Declare constants
	const PATH_JSON_CONFIG = argv[2];
	const PATH_PROJECT_RPKGS = __dirname + "/../test.entity-main/";
	
	// Load the config file
	console.log("Loading config file");
	var config = common.loadJsonIfExists(PATH_JSON_CONFIG, "Failed to load config file at " + PATH_JSON_CONFIG);
	console.log("Loaded");
	
	// Clean all rpkg files in the project, if needed
	if (argv[3] == "true")
	{
		console.log("Deleting rpkg files from test.entity-main");
		delAllSync(config, [
			PATH_PROJECT_RPKGS + "test.entity.rpkg",
			PATH_PROJECT_RPKGS + "portedhashes.rpkg",
			PATH_PROJECT_RPKGS + "base.rpkg"
		] );
		
	}
	
	// Clean all rpkg files from Hitman 3, if needed
	if (argv[4] == "true")
	{
		console.log("Deleting rpkg files from Hitman 3");
		delAllSync(config, [
			config.path_Runtime + '/' + config.rpkgName,
			config.path_Runtime + '/' + config.rpkgPortedHashesName
		] );
		
	}
	
	console.log("Rpkg files cleaned");
}


try
{
	main(process.argv);
}
catch (e)
{
	console.log("ERROR: " + e);
	
	if (e.hasOwnProperty("stack"))
		console.log("\nSTACK:\n" + e.stack);
	else
		console.log("\nNo stack available for printing");
}