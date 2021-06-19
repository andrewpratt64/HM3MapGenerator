// Andrew Pratt 2021
// deploy.js: Copy built rpkg files into Hitman's Runtime directory

const fs = require("fs");
const process = require("process");
const child_process = require("child_process");
const common = require("./common.js");


// Print the cmd syntax for this script
function printSyntax()
{
	console.log("HM3MapGenerator syntax: node deploy.js <path to config json> <name of rpkg file inside test.entity-main to deploy> <optional key inside config to use for rpkg name; defaults to \"rpkgName\">");
	console.log("  Example: node C:/Users/JohnDoe/Documents/HM3MapGenerator/src/deploy.js C:/Users/JohnDoe/Documents/HM3MapGenerator/config.json test.entity.rpkg rpkgName");
}



function main(argv)
{
	// Make sure the right amount of cmd line args were given
	if (argv.length < 4 || argv.length > 5)
	{
		printSyntax();
		return;
	}
	
	console.log("Setting up");
	
	// Declare constants
	const PATH_JSON_CONFIG = argv[2];
	const RPKG_FROM_NAME = argv[3];
	
	// Load the config file
	console.log("Loading config file");
	var config = common.loadJsonIfExists(PATH_JSON_CONFIG, "Failed to load config file at " + PATH_JSON_CONFIG);
	console.log("Loaded");
	
	// Get the name of the output rpkg file
	var outRpkgName;
	if (argv.length == 5)
		outRpkgName = config[argv[4]];
	else
		outRpkgName = config.rpkgName;
	
	// Bail if the filename is already used by vanilla hm3
	if (common.isVanillaRpkg(config, outRpkgName))
	{
		console.log("Refusing to deploy mod rpkg with vanilla name \"" + outRpkgName + "\"");
		return;
	}
	
	// Get input rpkg filepath
	var inRpkgPath = __dirname + "/../test.entity-main/" + RPKG_FROM_NAME;
	
	// Bail if input rpkg dosen't exist
	if (!fs.existsSync(inRpkgPath))
	{
		console.log("Failed to get input rpkg " + inRpkgPath);
		console.log("Make sure you have built an rpkg before trying to deploy");
		return;
	}
	
	// Copy and rename the rpkg to HITMAN3/Runtime
	console.log("Copying files into Hitman 3 runtime directory");
	fs.copyFileSync(
		// Path to file to copy; the rpkg file
		inRpkgPath,
		// Path to copy file to
		config.path_Runtime + '/' + outRpkgName
	);
	
	console.log("Deployed " + RPKG_FROM_NAME + " to " + outRpkgName);
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