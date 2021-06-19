// Andrew Pratt 2021
// build.js: Builds files into rpkg

const fs = require("fs");
const process = require("process");
const child_process = require("child_process");
const common = require("./common.js");


// Print the cmd syntax for this script
function printSyntax()
{
	console.log("HM3MapGenerator syntax: node build.js <path to config json> <list of folders inside test.entity-main to build>");
	console.log("  Example: node C:/Users/JohnDoe/Documents/HM3MapGenerator/src/build.js C:/Users/JohnDoe/Documents/HM3MapGenerator/config.json \"test.entity\" \"test.entity/base\"");
}



function main(argv)
{
	// Make sure the right amount of cmd line args were given
	if (argv.length <= 3)
	{
		printSyntax();
		return;
	}
	
	console.log("Setting up");
	
	// Declare constants
	const PATH_JSON_CONFIG = argv[2];
	const PATH_BUILD_PARENT = __dirname + "/../test.entity-main/";
	
	// Declare var to hold how many files failed to build
	var failedBuilds = 0;
	
	// Load the config file
	console.log("Loading config file");
	var config = common.loadJsonIfExists(PATH_JSON_CONFIG, "Failed to load config file at " + PATH_JSON_CONFIG);
	
	// Figure out how many folders should be built
	var folderAmt = argv.length - 3;
	console.log("Building " + folderAmt + " folders");
	
	// Iterate over every folder to build
	for (var i = 0; i < folderAmt; ++i)
	{
		// Get the path to the next folder to build
		var folderPath = PATH_BUILD_PARENT + argv[i+3];
		console.log("Attempting to build " + argv[i+3] + " at " + folderPath);
		
		// Skip if the path is invalid
		if (!fs.existsSync(folderPath))
		{
			console.log("INVALID PATH! folder will not be built");
			++failedBuilds;
			continue;
		}
		
		// Generate an rpkg file via rpkg-cli
		console.log("Packing data to rpkg");
		child_process.execFileSync(
			config.path_rpkg_cli,
			[
				// Path to directory to generate rpkg from
				"-generate_rpkg_from",
				folderPath,
				// Path to save rpkg file to
				"-output_path",
				PATH_BUILD_PARENT
			]
		);
	}
	
	console.log("Done, built " + (folderAmt - failedBuilds) + '/' + folderAmt + " folders");
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