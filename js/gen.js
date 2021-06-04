// Andrew Pratt 2021

const fs = require("fs");
const process = require("process");
const child_process = require("child_process");


// Generate a random unsigned integer
// Should technically be a uint64 but JSON.stringify dosen't like them
function getArbitraryEntId()
{
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}


// Load a file into memory, if it exists
//	pathFile (string): Path to file to load
//	errMsg (string): Contents of error message that is thrown if file dosen't exist
//	fileEncoding (optional; string): File encoding to use. Defaults to "utf8"
// returns: Loaded file contents as a string
function loadIfExists(pathFile, errMsg, fileEncoding = "utf8")
{
	// Throw error if file doesn't exist
	if (!fs.existsSync(pathFile))
		throw errMsg;
	
	// Otherwise, load and return the file
	return fs.readFileSync(pathFile, {encoding: fileEncoding});
}

// Same as loadIfExists, but parses a json file into an object
function loadJsonIfExists(pathFile, errMsg)
{
	return JSON.parse(loadIfExists(pathFile, errMsg));
}

// Same as loadIfExists, but parses a meta json file into an object and converts all strings to hashes
//	pathRpkgCli (string): Path to rpkg-cli.exe
function loadMetaJsonIfExists(pathRpkgCli, pathFile, errMsg)
{
	// Load and parse the .meta.JSON
	var metaJson = loadJsonIfExists(pathFile, errMsg);
	
	// Convert all filenames to hashes
	const REGEX_IS_IOI_HASH = new RegExp("^[\\da-f]{16}$", "mi");
	for (var entry of metaJson.hash_reference_data)
	{
		if (!REGEX_IS_IOI_HASH.test(entry.hash))
			entry.hash = getFileHash(pathRpkgCli, entry.hash);
	}
	
	// Return json object
	return metaJson;
}


// Inserts the new generated data string into an existing json file and saves it
//	hash (string): Hash code of file
//	type (string): Type of file (ex. "TEMP", "TBLU", etc.)
//	str (string): String to insert into json file
function insertNewDataIntoJson(hash, type, str)
{
	// Save the new file
	fs.writeFileSync(
		// Filepath to save to
		__dirname + "/../test.entity-main/test.entity/" + type + '/' + hash + '.' + type + ".JSON",
		
		// File contents
		// (The original file data that preceeds the insertion point...)
		loadIfExists(
			__dirname + "/../og_json/pre_" + hash + '.' + type + ".JSON.txt",
			"Missing original json file part: pre_" + hash + '.' + type + ".JSON.txt"
		)
		// (...plus the new string data...)
		+ str
		// (...plus the original file data that proceeds the insertion point)
		+ loadIfExists(
			__dirname + "/../og_json/post_" + hash + '.' + type + ".JSON.txt",
			"Missing original json file part: post_" + hash + '.' + type + ".JSON.txt"
		),
		
		// File options
		{encoding: "utf8"}
	);
}


// Saves a new .meta.JSON file
//	hash (string): Hash code of file
//	type (string): Type of file (ex. "TEMP", "TBLU", etc.)
//	meta (object): Contents of json file
function saveNewMetaJson(hash, type, meta)
{
	// Save the new file
	fs.writeFileSync(
		// Filepath to save to
		__dirname + "/../test.entity-main/test.entity/" + type + '/' + hash + '.' + type + ".meta.JSON",
		
		// File contents
		JSON.stringify(meta),
		
		// File options
		{encoding: "utf8"}
	);
}


// Get the path to a file inside of assembly:/_pro/scenes/notex/test.entity
//	hash (string): Hash code of file
//	type (string): Type of file (ex. "TEMP", "TBLU", etc.)
//	bIsMeta (bool): True if this is a .meta file
// returns: Filepath as a string
function getFilepathInEntity(hash, type, bIsMeta)
{
	// Return the path
	return __dirname + "/../test.entity-main/test.entity/" + type + '/' + hash + '.' + type + (bIsMeta ? ".meta" : "");
}


// Synchronously generate a file from json via ResourceTool
//	pathResTool (string): Path to ResourceTool.exe
//	hash (string): Hash code of file
//	type (string): Type of file (ex. "TEMP", "TBLU", etc.)
function jsonToBIN1(pathResTool, hash, type)
{
	// Get and store path to file
	const filePath = getFilepathInEntity(hash, type, false);
	
	// Run ResourceTool
	child_process.execFileSync(
		pathResTool,
		[
			// Game version
			"HM3",
			// Specify we want to generate a file from json
			"generate",
			// Type of file to generate
			type,
			// Json filepath
			filePath + ".JSON",
			// Output filePath
			filePath,
			// Use simple mode
			"--simple"
		]
	);
}


// Synchronously generate a .meta file from json via rpkg-cli
//	pathRpkgCli (string): Path to rpkg-cli.exe
//	hash (string): Hash code of file
//	type (string): Type of file (ex. "TEMP", "TBLU", etc.)
function jsonToMeta(pathRpkgCli, hash, type)
{
	// Run rpkg-cli
	child_process.execFileSync(pathRpkgCli, ["-json_to_hash_meta", getFilepathInEntity(hash, type, true) + ".JSON"]);
}


// Synchronously generate the files for a brick from json via ResourceTool
//	pathResTool (string): Path to ResourceTool.exe
//	pathRpkgCli (string): Path to rpkg-cli.exe
//	hashTemp (string): Hash code of temp file
//	hashTblu (string): Hash code of tblu file
function brickToBIN1(pathResTool, pathRpkgCli, hashTemp, hashTblu)
{
	// Generate TEMP/TBLU files and their respective .meta files
	jsonToBIN1(	pathResTool,	hashTemp,	"TEMP",		);
	jsonToMeta(	pathRpkgCli,	hashTemp,	"TEMP",		);
	jsonToBIN1(	pathResTool,	hashTblu,	"TBLU",		);
	jsonToMeta(	pathRpkgCli,	hashTblu,	"TBLU",		);
}


// Get the entityTypeResourceIndex from a string, updating the file's depends if needed
//	metaJson(object): Loaded .meta.JSON file. May be modified
//	hash (string): Hash code of depends filename to get index from
//	flag (string): Flags of depends entry to get index from
function getEntityTypeIndex(metaJson, hash, flag)
{
	// Try to find the hash in the existing depends
	var foundIndex = metaJson.hash_reference_data.findIndex((entry) => entry.hash == hash);
	
	// If the hash was found, return it's index
	if (foundIndex >= 0) return foundIndex;
	
	// Otherwise, add the hash to the depends and return the newly added index
	metaJson.hash_reference_data.push(
	{
		"hash": hash,
		"flag": flag
	});
	return metaJson.hash_reference_data.length - 1;
}


// Returns the hash of a given filename
//	pathRpkgCli (string): Path to rpkg-cli.exe
//	name (string): Filename to get hash from
function getFileHash(pathRpkgCli, name)
{
	// Return the hash by using rpkg-cli
	return child_process.execFileSync(
		pathRpkgCli,
		[
			"-compute_ioi_hash",
			name
		]
	).toString().substr(61, 16);
}


// Create the string for a single Glacier2 entity property
//	property (object): Property from the blender json file
// Returns: Property as a string
function getPropStr(property)
{	
	// TODO: Probably shouldn't need to force quotes for strings like this
	return '{'
		+ (
			(typeof property.i) == "string"
			? `"nPropertyID":"${property.i}",`
			: `"nPropertyID":${property.i},`
		)
		+ `"value":`
		+ '{'
			+ `"\$type":"${property.t}",`
			+ (
				(typeof property.v) == "string"
				? `"\$val":"${property.v}"`
				: `"\$val":${JSON.stringify(property.v)}`
			)
		+ '}'
	+ '}';
}

// Create the string for an array of Glacier2 entity properties
//	properties (object[]): Array of properties from the blender json file
//	bBrackets (bool): When true, will add opening and closing square brackets to output string. Ignored if bCommaPrefix is true.
//	bCommaPrefix (bool): When true, will add a comma to the beginning of the string
// Returns: Properties as a string
function getPropArrStr(properties, bBrackets, bCommaPrefix)
{
	// Declare a variable to hold the output string
	var outStr = "";
	
	// Stringify and concatenate each property
	for (const [i, property] of Object.entries(properties))
	{
		if (bCommaPrefix || i > 0) outStr += ',';
		outStr += getPropStr(property);
	}
	
	// Return the string, adding brackets if needed
	if (!bCommaPrefix && bBrackets)
		return '[' + outStr + ']';
	return outStr;
}


// Create the string for a subentity to be added to a .TEMP.json file
//	obj (object): An entry from the blender json file
//	tempMeta (object): The temp json's corresponding .meta.JSON as an object
// Returns: Subentity as a string
function getTempEntStr(obj, tempMeta)
{
	return ",{"
		// Logical parent
		+ `"logicalParent":{"entityID":18446744073709551615,"externalSceneIndex":-1,"entityIndex":1,"exposedEntity":""},`
		// Entity type
		+ `"entityTypeResourceIndex":${getEntityTypeIndex(tempMeta, obj.tempType, obj.tempFlag)},`
		// Properties
		+ `"propertyValues":`
		+ '['
			// Transform
			+ '{'
				+ `"nPropertyID":"m_mTransform",`
				+ `"value":`
				+ '{'
					+ `"\$type":"SMatrix43",`
					+ `"\$val":`
					+ '{'
						+ `"XAxis":${JSON.stringify(obj.x)},`
						+ `"YAxis":${JSON.stringify(obj.y)},`
						+ `"ZAxis":${JSON.stringify(obj.z)},`
						+ `"Trans":${JSON.stringify(obj.t)}`
					+ '}'
				+ '}'
			+ '}'
			// Scale (if applicable)
			+ (
				// (This is a ternary operator, if it's hard to tell)
				obj.s != "none" // <- Condition
				? ",{"	// <- If true
					+ `"nPropertyID":"m_PrimitiveScale",`
					+ `"value":`
					+ '{'
						+ `"\$type":"SVector3",`
						+ `"\$val":${JSON.stringify(obj.s)}`
					+ '}'
				+ '}'
				
				: '' // <- Else
			)
			// Other properties from Blender
			+ getPropArrStr(obj.props, false, true)
		+ "],"
		// Post-init properties
		+ `"postInitPropertyValues":`
		+ '['
			// Parent
			+ '{'
				+ `"nPropertyID":"m_eidParent",`
				+ `"value":`
				+ '{'
					+ `"\$type":"SEntityTemplateReference",`
					+ `"\$val":`
					+ '{'
						+ `"entityID":18446744073709551615,"externalSceneIndex":-1,"entityIndex":1,"exposedEntity":""`
					+ '}'
				+ '}'
			+ '}'
			// Other post-init properties from Blender
			+ getPropArrStr(obj.piprops, false, true)
		+ "],"
		// Platform-specific properties
		+ `"platformSpecificPropertyValues":[]`
	+ '}';
}


// Create the string for a subentity to be added to a .TBLU.json file
//	obj (object): An entry from the blender json file
// tbluMeta (object): The tblu json's corresponding .meta.JSON as an object
// Returns: Subentity as a string
function getTbluEntStr(obj, tbluMeta)
{
	return ",{"
		// Logical parent
		+ `"logicalParent":{"entityID":18446744073709551615,"externalSceneIndex":-1,"entityIndex":1,"exposedEntity":""},`
		// Entity type
		+ `"entityTypeResourceIndex":${getEntityTypeIndex(tbluMeta, obj.tbluType, obj.tbluFlag)},`
		// Entity Id
		+ `"entityId":${getArbitraryEntId()},`
		// Editor only
		+ `"editorOnly":false,`
		// Entity name
		+ `"entityName":"${obj.name.replace(/[\W\s]/gmi, '_')}",`
		// Misc. currently unused properties
		+ `"propertyAliases":[],"exposedEntities":[],"exposedInterfaces":[],"entitySubsets":[]`
	+ '}';
}


// Print the cmd syntax for this script
function printSyntax()
{
	console.log("HM3MapGenerator syntax: node gen.js <path to config json>");
	console.log("  Example: node C:/Users/JohnDoe/Documents/HM3MapGenerator/js/gen.js C:/Users/JohnDoe/Documents/HM3MapGenerator/config.json");
}



function main(argv)
{
	// Make sure the right amount of cmd line args were given
	if (argv.length != 3)
	{
		printSyntax();
		return;
	}
	
	// Declare constants
	const PATH_JSON_CONFIG = argv[2];
	const PATH_BLEND_DATA = __dirname + "/../blend/map.json";
	
	// Load the config file
	var configJson = loadJsonIfExists(PATH_JSON_CONFIG, "Failed to load config file at " + PATH_JSON_CONFIG);
	
	// Declare vars to hold output
	var tempOut = "";
	var tbluOut = "";
	
	// Load .meta.JSON files
	var tempMeta = loadMetaJsonIfExists(configJson.path_rpkg_cli, __dirname + "/../og_json/" + configJson.hashTemp + ".TEMP.meta.JSON", "Failed to load TEMP depends; " + configJson.hashTemp + ".TEMP.meta.JSON does not exist");
	var tbluMeta = loadMetaJsonIfExists(configJson.path_rpkg_cli, __dirname + "/../og_json/" + configJson.hashTblu + ".TBLU.meta.JSON", "Failed to load TBLU depends; " + configJson.hashTblu + ".TBLU.meta.JSON does not exist");

	
	// Open blender json file
	var inputJson = loadJsonIfExists(PATH_BLEND_DATA, PATH_BLEND_DATA + " does not exist. Be sure you run the script in Blender first to generate it");
	
	// Iterate over every addition
	for (var [i, obj] of Object.entries(inputJson))
	{
		// Append output
		tempOut += getTempEntStr(obj, tempMeta);
		tbluOut += getTbluEntStr(obj, tbluMeta);
	}
	
	// Insert the output into the map's original json files and save as new json files
	insertNewDataIntoJson(configJson.hashTemp, "TEMP", tempOut);
	insertNewDataIntoJson(configJson.hashTblu, "TBLU", tbluOut);
	
	// Save the new .meta.JSON files
	saveNewMetaJson(configJson.hashTemp, "TEMP", tempMeta);
	saveNewMetaJson(configJson.hashTblu, "TBLU", tbluMeta);
	
	// Serialize the json we just made into the files for a brick
	brickToBIN1(configJson.path_ResourceTool + "/ResourceTool.exe", configJson.path_rpkg_cli, configJson.hashTemp, configJson.hashTblu);
	
	// Generate an rpkg file via rpkg-cli
	child_process.execFileSync(
		configJson.path_rpkg_cli,
		[
			// Path to directory to generate rpkg from
			"-generate_rpkg_from",
			__dirname + "/../test.entity-main/test.entity",
			// Path to save rpkg file to
			"-output_path",
			__dirname
		]
	);
	
	// Copy and rename the rpkg to HITMAN3/Runtime
	fs.copyFileSync(
		// Path to file to copy; the rpkg file
		__dirname + "/test.entity.rpkg",
		// Path to copy file to
		configJson.path_Runtime + '/' + configJson.rpkgName
	);
	
	// Delete the first copy of the rpkg file, it's not needed anymore
	fs.unlinkSync(__dirname + "/test.entity.rpkg");
	
	console.log("Done");
}


try
{
	main(process.argv);
}
catch (e)
{
	console.log("ERROR: " + e);
	
	if ("stack" in e)
		console.log("\nSTACK:\n" + e.stack);
	else
		console.log("\nNo stack available for printing");
}