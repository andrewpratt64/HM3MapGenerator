// Andrew Pratt 2021
// extract_depends.js: Extracts needed files to test.entity/portedhashes
//                       and updates dat/extracted_depends.json, and recursive_extracted_depends.json

const fs = require("fs");
const os = require("os");
const process = require("process");
const child_process = require("child_process");
const common = require("./common.js");

// Declare a variable to hold a temporary path
var tmpDir = os.tmpdir() + "/.HM3MapGenerator_ExtractDepends_" + os.uptime();
fs.mkdirSync(tmpDir, {recursive: true});


// Extracts all of the depends in a .meta file
//	config (object): Generator configuration
//	metaJson (object): Serialized .meta.JSON
//	bRecurse (bool): If true, all of this depends of the depends will be extracted too
function extractDepends(config, metaJson, bRecurse)
{
	// Don't extract if this file has already been handled
	if (bRecurse)
	{
		if (config.recursiveExtractedDepends.includes(metaJson.hash_value))
		{
			console.log("**Skipping already recursivly extracted " + metaJson.hash_value + "**");
			return;
		}
		console.log("==Extracting depends of " + metaJson.hash_value + "==");
	}
	else
		console.log("~~Extracting depends of extracted " + metaJson.hash_value + "~~");
	
	console.log("   Getting depends info from rpkg files");
	// Get a string with info about all of the depends
	var dependsInfoStr = child_process.execFileSync(
		config.path_rpkg_cli,
		[
			// List of hashes to get info from
			"-filter",
			common.getHashDependsAsSingleString(metaJson.hash_reference_data),
			// Path to directory containing rpkg files
			"-hash_probe",
			config.path_Runtime
		],
		{
			encoding: "utf8",
			windowsHide: true
		}
	);
	
	console.log("   Organizing info");
	
	// Declare a variable to hold organized depends info
	var dependsInfo = {};
	// Populate that var using regex matches on the depends info string
	var dependsMatches = dependsInfoStr.matchAll(/(^[\da-f]{16}) is in RPKG file: chunk(\d+)(?:patch(\d+))?.rpkg$(?:\s|.)+?^  - Resource type: (....)/gmi);
	for (var dependsMatch of dependsMatches)
	{
		// Skip this match if it dosen't need to be extracted
		//if (dependsMatch[2] == "0" || dependsMatch[2] == "1" || (config.extractedDepends != undefined && dependsMatch[2] in config.extractedDepends))
		if (dependsMatch[2] === "0" || dependsMatch[2] === "1")
		{
			console.log("   >>Skipping " + dependsMatch[1] + " from chunk" + dependsMatch[2] + (dependsMatch[3] != undefined ? "patch" + dependsMatch[3] : ''));
			continue;
		}
		else if (config.extractedDepends.includes(dependsMatch[1]))
		{
			console.log("   >>Skipping duplicate " + dependsMatch[1] + " from chunk" + dependsMatch[2] + (dependsMatch[3] != undefined ? "patch" + dependsMatch[3] : ''));
			continue;
		}
		
		console.log("   >>Found " + dependsMatch[1] + " from chunk" + dependsMatch[2] + (dependsMatch[3] != undefined ? "patch" + dependsMatch[3] : ''));
		// Get this hash entry, adding it if it dosen't already exist
		var hashInfo = emplace(dependsInfo, dependsMatch[1], {chunk: "-", patch: "-", type: dependsMatch[4]});
		
		// Update this hash entry, if it has a higher patch, or a higher chunk (in that order)
		if (hashInfo.chunk < dependsMatch[2])
			hashInfo.chunk = dependsMatch[2];
		if (hashInfo.patch < dependsMatch[3])
			hashInfo.patch = dependsMatch[3];
	}
	
	console.log("   Extracting files");
	// Extract every depend
	for (const [hash, info] of Object.entries(dependsInfo))
	{
		console.log("   >>Extracting " + hash);
		
		// Get chunk name
		var chunkName = "chunk" + info.chunk + (info.patch == "-" ? '' : "patch" + info.patch);
		// Get file name
		var fileName = hash + '.' + info.type;
		
		// Extract file
		child_process.execFileSync(
			config.path_rpkg_cli,
			[
				// Hash to extract
				"-filter",
				hash,
				// Path to rpkg file containing hash
				"-extract_from_rpkg",
				`${config.path_Runtime}/${chunkName}.rpkg`,
				// Path to extract file to
				"-output_path",
				tmpDir
			]
		);
		
		// Get the folder to copy to, and make sure it exists
		var outPath = __dirname + "/../test.entity-main/test.entity/portedhashes/" + info.type;
		if (!fs.existsSync(outPath))
			fs.mkdirSync(outPath, {recursive: true});
		
		// Copy extracted file to portedhashes dir 
		fs.copyFileSync(
			tmpDir + '/' + chunkName + '/' + info.type + '/' + fileName,
			outPath + '/' + fileName
		);
		
		// Copy extracted meta file to portedhashes dir 
		fs.copyFileSync(
			tmpDir + '/' + chunkName + '/' + info.type + '/' + fileName + ".meta",
			outPath + '/' + fileName + ".meta"
		);
		
		// Delete temporary files from this single extraction
		fs.rmdirSync(tmpDir + '/' + chunkName, {recursive: true});
		
		// If this is a recursive extraction...
		if (bRecurse)
		{
			// Skip if this has already been recursively extracted
			if (config.recursiveExtractedDepends.includes(dependsMatch[1]))
			{
				console.log("   >>Skipping already recursed " + dependsMatch[1] + " from chunk" + dependsMatch[2] + (dependsMatch[3] != undefined ? "patch" + dependsMatch[3] : ''));
			}
			else
			{
				console.log("   Creating meta json from depends file " + fileName);
				
				// ...convert the meta file to json
				child_process.execFileSync(
					config.path_rpkg_cli,
					[
						"-hash_meta_to_json",
						outPath + '/' + fileName + ".meta"
					]
				);
				
				console.log("   Loading meta json");
				// Load the new .meta.json
				var newMetaJson = loadMetaJsonIfExists(
					config.path_rpkg_cli,
					outPath + '/' + fileName + ".meta.JSON",
					"Failed to load meta for extracted file " + fileName
				);
				
				// Extract the new file's depends
				extractDepends(config, newMetaJson, true);
				
				// Delete the meta json
				fs.unlinkSync(outPath + '/' + fileName + ".meta.JSON", {recursive: true});
				
				// Register this file as recursively extracted
				config.recursiveExtractedDepends.push(hash);
			}
		}
		
		// Register this file as extracted
		config.extractedDepends.push(hash);
	}
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
	const PATH_OG_JSON = __dirname + "/../og_json/";
	const PATH_DAT_EXTRACTED_DEPENDS = __dirname + "/../dat/extracted_depends.json";
	const PATH_DAT_RECURSE_EXTRACTED_DEPENDS = __dirname + "/../dat/recursive_extracted_depends.json";
	
	// Load the config file
	console.log("Loading config file");
	var config = common.loadJsonIfExists(PATH_JSON_CONFIG, "Failed to load config file at " + PATH_JSON_CONFIG);
	
	// Load the extracted depends list
	console.log("Loading extracted_depends.json");
	if (!fs.existsSync(PATH_DAT_EXTRACTED_DEPENDS))
	{
		console.log("extracted_depends.js does not exist, creating new file");
		fs.writeFileSync(PATH_DAT_EXTRACTED_DEPENDS, "[]", {encoding: "utf8"});
	}
	config.extractedDepends = common.loadJsonIfExists(PATH_DAT_EXTRACTED_DEPENDS, "Failed to load dat/extracted_depends.json");
	console.log(config.extractedDepends.length + " depends hashes loaded");
	
	// Load the recursive extracted depends list
	console.log("Loading recursive_extracted_depends.json");
	if (!fs.existsSync(PATH_DAT_RECURSE_EXTRACTED_DEPENDS))
	{
		console.log("recursive_extracted_depends.js does not exist, creating new file");
		fs.writeFileSync(PATH_DAT_RECURSE_EXTRACTED_DEPENDS, "[]", {encoding: "utf8"});
	}
	config.recursiveExtractedDepends = common.loadJsonIfExists(PATH_DAT_RECURSE_EXTRACTED_DEPENDS, "Failed to load dat/recursive_extracted_depends.json");
	console.log(config.recursiveExtractedDepends.length + " recursed hashes loaded");
	
	// Make sure data isn't undefined in places it shouldn't be
	if (config.extractedDepends == undefined)
		config.extractedDepends = [];
	if (config.recursiveExtractedDepends == undefined)
		config.recursiveExtractedDepends = [];
	
	// Load .meta.JSON files
	console.log("Loading original temp meta");
	var tempMeta = common.loadMetaJsonIfExists(config.path_rpkg_cli, __dirname + "/../test.entity-main/test.entity/TEMP/" + config.hashTemp + ".TEMP.meta.JSON", "Failed to load TEMP depends; " + config.hashTemp + ".TEMP.meta.JSON does not exist");
	console.log("Loading original tblu meta"); 
	var tbluMeta = common.loadMetaJsonIfExists(config.path_rpkg_cli, __dirname + "/../test.entity-main/test.entity/TBLU/" + config.hashTblu + ".TBLU.meta.JSON", "Failed to load TBLU depends; " + config.hashTblu + ".TBLU.meta.JSON does not exist");
	
	// Extract depends
	console.log("Extracting depends for TEMP");
	extractDepends(config, tempMeta, true);
	console.log("Extracting depends for TBLU");
	extractDepends(config, tbluMeta, true);
	
	// Save changes to dat files
	console.log("Saving changes to extracted_depends.json");
	fs.writeFileSync(PATH_DAT_EXTRACTED_DEPENDS, JSON.stringify(config.extractedDepends), {encoding: "utf8"});
	console.log("Saving changes to recursive_extracted_depends.json");
	fs.writeFileSync(PATH_DAT_RECURSE_EXTRACTED_DEPENDS, JSON.stringify(config.recursiveExtractedDepends), {encoding: "utf8"});
	
	console.log("Done");
}


try
{
	main(process.argv);
}
catch (e)
{
	console.log("ERROR: " + e);
	
	if (e)
	{
		if ("stack" in e)
			console.log("\nSTACK:\n" + e.stack);
		else
			console.log("\nNo stack available for printing");
	}
	else
		console.log("<unknown error>");
}


// Delete temporary directory
fs.rmdirSync(tmpDir, {recursive: true});