// Andrew Pratt 2021
// gen.js: Generates files in test.entity/base

const fs = require("fs");
const process = require("process");
const child_process = require("child_process");
const common = require("./common.js");


// Print the cmd syntax for this script
function printSyntax()
{
	console.log("HM3MapGenerator syntax: node gen.js <path to config json>");
	console.log("  Example: node C:/Users/JohnDoe/Documents/HM3MapGenerator/src/gen.js C:/Users/JohnDoe/Documents/HM3MapGenerator/config.json");
}



function main(argv)
{
	// Make sure the right amount of cmd line args were given
	if (argv.length != 3)
	{
		printSyntax();
		return;
	}
	
	console.log("Setting up");
	
	// Declare constants
	const PATH_JSON_CONFIG = argv[2];
	const PATH_BLEND_DATA = __dirname + "/../blend/map.json";
	const PATH_OG_JSON = __dirname + "/../og_json/";
	
	// Load the config file
	console.log("Loading config file");
	var config = common.loadJsonIfExists(PATH_JSON_CONFIG, "Failed to load config file at " + PATH_JSON_CONFIG);
	
	// Load the original json files
	console.log("Loading original temp");
	var ogTemp = common.loadIfExists(PATH_OG_JSON + config.hashTemp + ".TEMP.JSON", "Failed to load original temp json at " + PATH_OG_JSON + config.hashTemp + ".TEMP.JSON");
	console.log("Loading original tblu");
	var ogTblu = common.loadIfExists(PATH_OG_JSON + config.hashTblu + ".TBLU.JSON", "Failed to load original tblu json at " + PATH_OG_JSON + config.hashTblu + ".TBLU.JSON");
	
	// Get the number of entities in the original brick
	// TODO: Maybe don't serialize the entire TEMP file just to get the entity count and nothing else
	console.log("Getting additional data from original files");
	config.subentCount = common.getSubentCount(ogTemp);
	
	// Declare vars to hold output
	console.log("Declaring variables for output");
	var tempOut = "";
	var tbluOut = "";
	
	// Load .meta.JSON files
	console.log("Loading original temp meta");
	var tempMeta = common.loadMetaJsonIfExists(config.path_rpkg_cli, __dirname + "/../og_json/" + config.hashTemp + ".TEMP.meta.JSON", "Failed to load TEMP depends; " + config.hashTemp + ".TEMP.meta.JSON does not exist");
	console.log("Loading original tblu meta");
	var tbluMeta = common.loadMetaJsonIfExists(config.path_rpkg_cli, __dirname + "/../og_json/" + config.hashTblu + ".TBLU.meta.JSON", "Failed to load TBLU depends; " + config.hashTblu + ".TBLU.meta.JSON does not exist");

	
	// Open blender json file
	console.log("Loading Blender input");
	var inputJson = common.loadJsonIfExists(PATH_BLEND_DATA, PATH_BLEND_DATA + " does not exist. Be sure you generate it in Blender first");
	
	// Iterate over every addition
	console.log("Appending objects");
	for (var [i, obj] of Object.entries(inputJson))
	{
		// Append output
		tempOut += common.getTempEntStr(config.path_rpkg_cli, inputJson, obj, config, tempMeta);
		tbluOut += common.getTbluEntStr(config.path_rpkg_cli, inputJson, obj, config, tbluMeta);
	}
	
	// Insert the output into the map's original json files and save as new json files
	console.log("Saving new temp json file");
	common.insertNewDataIntoJson(config.hashTemp, "TEMP", ogTemp, tempOut, common.getTempInsertionIndex(ogTemp));
	console.log("Saving new tblu json file");
	common.insertNewDataIntoJson(config.hashTblu, "TBLU", ogTblu, tbluOut, common.getTbluInsertionIndex(ogTblu));
	
	// Save the new .meta.JSON files
	console.log("Saving new temp meta json file");
	common.saveNewMetaJson(config.hashTemp, "TEMP", tempMeta);
	console.log("Saving new tblu meta json file");
	common.saveNewMetaJson(config.hashTblu, "TBLU", tbluMeta);
	
	// Serialize the json we just made into the files for a brick
	console.log("Serializing files");
	common.brickToBIN1(config.path_ResourceTool + "/ResourceTool.exe", config.path_rpkg_cli, config.hashTemp, config.hashTblu);
	
	
	console.log("Done");
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