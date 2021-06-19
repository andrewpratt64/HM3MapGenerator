// Andrew Pratt 2021
// common.js: Contains shared code


const fs = require("fs");
const process = require("process");
const child_process = require("child_process");


// Generate a random unsigned integer
// Should technically be a uint64 but JSON.stringify dosen't like them
function getArbitraryEntId()
{
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

// Test if a given string is an IOI hash
//	str (string): String to test
// Returns: True if str is an IOI hash
function isIOIHash(str)
{
	return /^[\da-f]{16}$/mi.test(str);
}


// Test if a given rpkg filename is NOT from a mod
//	config (object): Generator configuration
//	fileName (string): Name of rpkg file to test
// Returns: False if rpkg file is from a mod
function isVanillaRpkg(config, fileName)
{
	var patchNumIndex = fileName.search(/(?<=^chunk\d+patch)(?=\d+(?:\.rpkg)?$)/);
	if (patchNumIndex == -1)
		return /(?<=^chunk\d+)(?=(?:\.rpkg)?$)/.test(fileName);
	else
		var patchNum = parseInt(fileName.substr(patchNumIndex), 10);
		return (patchNum == NaN || patchNum <= config.maxVanillaPatch);
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
	for (var entry of metaJson.hash_reference_data)
	{
		if (!isIOIHash(entry.hash))
			entry.hash = getFileHash(pathRpkgCli, entry.hash);
	}
	
	// Return json object
	return metaJson;
}


// Inserts the new generated data string into an existing json file and saves it
//	hash (string): Hash code of file
//	type (string): Type of file (ex. "TEMP", "TBLU", etc.)
//	oldStr (string): Contents of original json file
//	newStr (string): String to insert into json file
//	insertIndex (int): The index in oldStr to insert newStr
function insertNewDataIntoJson(hash, type, oldStr, newStr, insertIndex)
{
	// Save the new file
	fs.writeFileSync(
		// Filepath to save to
		ensureFilepathExists(__dirname + "/../test.entity-main/test.entity/base/" + type) + '/' + hash + '.' + type + ".JSON",
		
		// File contents
		// (The original file data that preceeds the insertion point...)
		oldStr.substring(0, insertIndex)
		// (...plus the new string data...)
		+ newStr
		// (...plus the original file data that proceeds the insertion point)
		+ oldStr.substring(insertIndex),
		
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
		ensureFilepathExists(__dirname + "/../test.entity-main/test.entity/base/" + type) + '/' + hash + '.' + type + ".meta.JSON",
		
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
	return __dirname + "/../test.entity-main/test.entity/base/" + type + '/' + hash + '.' + type + (bIsMeta ? ".meta" : "");
}


// Make sure that the given filepath exists
//	filepath (string): Filepath to test. Directory will be created if it dosen't exist
// Returns: filepath
function ensureFilepathExists(filepath)
{
	// Create the path if it dosen't exist
	if (!fs.existsSync(filepath))
		fs.mkdirSync(filepath, {recursive: true});
	
	// Return the given filepath
	return filepath;
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
//	pathRpkgCli (string): Path to rpkg-cli.exe
//	metaJson(object): Loaded .meta.JSON file. May be modified
//	entType (string): Hash code or depends filename to get index from
//	flag (string): Flags of depends entry to get index from
function getEntityTypeIndex(pathRpkgCli, metaJson, entType, flag)
{
	// Hash the type, if it isn't already
	var hash = entType;
	if (!isIOIHash(entType))
		hash = getFileHash(pathRpkgCli, entType);
	
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


// Gets the key of an object with a given name from blender json
//	blendJson (object): Blender json object to get object from
//	name (string): Name of object to get
// Returns: Key of object with matching name, or -1 if no object was found
function getKeyFromBlenderName(blendJson, name)
{
	//return blendJson.findIndex((obj) => obj.name == name);
	
	// Iterate over all objects
	for (var [i, obj] of Object.entries(blendJson))
	{
		// Return the key of the current object if it's name is what we're looking for
		if (obj.name == name)
			return i;
	}
	
	// If no object matched, return -1
	return -1;
}

// Same as above, but ensures the returned value is a number
function getNumericKeyFromBlenderName(blendJson, name)
{
	var key = getKeyFromBlenderName(blendJson, name);
	if (typeof key == "number")
		return key;
	return parseInt(key);
}

// Get the entity index of a Blender object by name
//	blendJson (object): Blender json object to get object from
//	name (string): Name of object to get
//	config (object): Generator configuration
// Returns: Entity index of object with matching name, or -1 if no object was found
function getEntityIndexFromBlenderName(blendJson, name, config)
{
	var blendKey = getNumericKeyFromBlenderName(blendJson, name);
	if (blendKey == -1) return -1;
	return blendKey + config.subentCount;
}


// Gets the entity index of an objects physical parent
//	blendJson (object): Blender json to get object from
//	obj (object): The child object from the blender json file
//	config (object): Generator configuration
// Returns: Index of object's parent as a number
function getPhysicalParentIndexFromBlenderName(blendJson, obj, config)
{	
	// If the object has no parent, return the default value
	if (obj.pparent == "")
		return config.defaultPhysicalParentIndex;
	
	// Otherwise, attempt to find the index of the object's parent
	var parentKey = getNumericKeyFromBlenderName(blendJson, obj.pparent);
	
	// If the parent wasn't found, print a warning and return the default value
	if (parentKey == -1)
	{
		console.log(`WARNING: In Blender object "${obj.name}", failed to find parent "${obj.pparent}"`);
		return config.defaultPhysicalParentIndex;
	}
	
	// If the parent was found, return it's index
	return parentKey + config.subentCount;
}


// Get the index in the contents of the temp json file where new entities should be inserted
//	tempStr (string): Contents of the original .TEMP.json as a string
// Returns: Index to insert new data as an integer, or -1 if the temp string is invalid
function getTempInsertionIndex(tempStr)
{
	return tempStr.search(/\],\s*"propertyOverrides(?:.|\s)+\}\s*$/g);
}

// Get the index in the contents of the tblu json file where new entities should be inserted
//	tbluStr (string): Contents of the original .TBLU.json as a string
// Returns: Index to insert new data as an integer, or -1 if the tblu string is invalid
function getTbluInsertionIndex(tbluStr)
{
	return tbluStr.search(/\],\s*"externalSceneTypeIndicesInResourceHeader(?:.|\s)+\}\s*$/g);
}


// Get the number of subentities in a temp json
//	jsonStr (string): Contents of either the original .TEMP.json or the original .TBLU.json as a string
// Returns: Number of entities as an integer
function getSubentCount(jsonStr)
{
	// Serialize the json string, and return how many entries are in the subentity array
	return JSON.parse(jsonStr).subEntities.length;
}


// Create the string for a single Glacier2 entity property
//	blendJson (object): Blender json containing property
//	property (object): Property from the blender json file
//	config (object): Generator configuration
// Returns: Property as a string
function getPropStr(blendJson, property, config)
{	
	// TODO: Probably shouldn't need to force quotes for strings like this
	var outStr = '{'
		+ (
			(typeof property.i) == "string"
			? `"nPropertyID":"${property.i}",`
			: `"nPropertyID":${property.i},`
		)
		+ `"value":`
		+ '{'
			+ `"\$type":"${property.t}",`
			+ `"\$val":`
		
	switch (property.h)
	{
		// Raw json
		case "raw":
			outStr += property.v;
			break;
		// String
		case "str":
			outStr += `"${property.v}"`;
			break;
		
		// Reference
		case "ref":
			outStr += `{"entityID":18446744073709551615,"externalSceneIndex":-1,"entityIndex":${getEntityIndexFromBlenderName(blendJson, property.v, config)},"exposedEntity":""}`;
			break;
		
		// Guid
		case "guid":
			var guidStr = property.v.replace(/-/g, '');
			outStr += '{'
				+ `"_a":${parseInt(guidStr.substr(0, 8),16)},`
				+ `"_b":${parseInt(guidStr.substr(8, 4),16)},`
				+ `"_c":${parseInt(guidStr.substr(12,4),16)},`
				+ `"_d":${parseInt(guidStr.substr(16,2),16)},`
				+ `"_e":${parseInt(guidStr.substr(18,2),16)},`
				+ `"_f":${parseInt(guidStr.substr(20,2),16)},`
				+ `"_g":${parseInt(guidStr.substr(22,2),16)},`
				+ `"_h":${parseInt(guidStr.substr(24,2),16)},`
				+ `"_i":${parseInt(guidStr.substr(26,2),16)},`
				+ `"_j":${parseInt(guidStr.substr(28,2),16)},`
				+ `"_k":${parseInt(guidStr.substr(30,2),16)}`
			+ '}';
			break;
		
		// Default; throws an error
		default:
			throw `Invalid property helper type "${property.h}"`;
	}
		
	return outStr += "}}";
}

// Create the string for an array of Glacier2 entity properties
//	blendJson (object): Full blender json
//	properties (object[]): Array of properties from the blender json file
//	config (object): Generator configuration
//	bBrackets (bool): When true, will add opening and closing square brackets to output string. Ignored if bCommaPrefix is true.
//	bCommaPrefix (bool): When true, will add a comma to the beginning of the string
// Returns: Properties as a string
function getPropArrStr(blendJson, properties, config, bBrackets, bCommaPrefix)
{
	// Declare a variable to hold the output string
	var outStr = "";
	
	// Stringify and concatenate each property
	for (const [i, property] of Object.entries(properties))
	{
		if (bCommaPrefix || i > 0) outStr += ',';
		outStr += getPropStr(blendJson, property, config);
	}
	
	// Return the string, adding brackets if needed
	if (!bCommaPrefix && bBrackets)
		return '[' + outStr + ']';
	return outStr;
}


// Create the string for a subentity to be added to a .TEMP.json file
//	pathRpkgCli (string): Path to rpkg-cli.exe
//	blendJson (object): Blender json
//	obj (object): An entry from the blender json file
//	config (object): Generator configuration
//	tempMeta (object): The temp json's corresponding .meta.JSON as an object
// Returns: Subentity as a string
// TODO: Allow caller to control logical parent
function getTempEntStr(pathRpkgCli, blendJson, obj, config, tempMeta)
{
	return ",{"
		// Logical parent
		+ `"logicalParent":{"entityID":18446744073709551615,"externalSceneIndex":-1,"entityIndex":${config.defaultLogicalParentIndex},"exposedEntity":""},`
		// Entity type
		+ `"entityTypeResourceIndex":${getEntityTypeIndex(pathRpkgCli, tempMeta, obj.tempType, obj.tempFlag)},`
		// Properties
		+ `"propertyValues":`
		+ '['
			// Transform (if applicable)
			+ (
				// (This is a ternary operator, if it's hard to tell)
				obj.t != "" // <- Condition
				? '{'
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
				
				: '' // <- Else
			)
			
			// Comma between transform and scale, if both exist
			+ (obj.t != "" && obj.s != "" ? ',' : '')
			
			// Scale (if applicable)
			+ (
				// (This is a ternary operator, if it's hard to tell)
				obj.s != "" // <- Condition
				? "{"	// <- If true
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
			+ getPropArrStr(blendJson, obj.props, config, false, (obj.t != "" || obj.s != ""))
		+ "],"
		// Post-init properties
		+ `"postInitPropertyValues":`
		+ '['
			// Physical parent
			+ '{'
				+ `"nPropertyID":"m_eidParent",`
				+ `"value":`
				+ '{'
					+ `"\$type":"SEntityTemplateReference",`
					+ `"\$val":`
					+ '{'
						+ `"entityID":18446744073709551615,"externalSceneIndex":-1,"entityIndex":${getPhysicalParentIndexFromBlenderName(blendJson, obj, config)},"exposedEntity":""`
					+ '}'
				+ '}'
			+ '}'
			// Other post-init properties from Blender
			+ getPropArrStr(blendJson, obj.piprops, config, false, (obj.s != ""))
		+ "],"
		// Platform-specific properties
		+ `"platformSpecificPropertyValues":[]`
	+ '}';
}


// Create the string for a subentity to be added to a .TBLU.json file
//	pathRpkgCli (string): Path to rpkg-cli.exe
//	blendJson (object): Blender json
//	obj (object): An entry from the blender json file
//	config (object): Generator configuration
// tbluMeta (object): The tblu json's corresponding .meta.JSON as an object
// Returns: Subentity as a string
function getTbluEntStr(pathRpkgCli, blendJson, obj, config, tbluMeta)
{
	return ",{"
		// Logical parent
		+ `"logicalParent":{"entityID":18446744073709551615,"externalSceneIndex":-1,"entityIndex":${config.defaultLogicalParentIndex},"exposedEntity":""},`
		// Entity type
		+ `"entityTypeResourceIndex":${getEntityTypeIndex(pathRpkgCli, tbluMeta, obj.tbluType, obj.tbluFlag)},`
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


// Stuff to export
exports.getArbitraryEntId = getArbitraryEntId;
exports.isIOIHash = isIOIHash;
exports.isVanillaRpkg = isVanillaRpkg;
exports.loadIfExists = loadIfExists;
exports.loadJsonIfExists = loadJsonIfExists;
exports.loadMetaJsonIfExists = loadMetaJsonIfExists;
exports.insertNewDataIntoJson = insertNewDataIntoJson;
exports.saveNewMetaJson = saveNewMetaJson;
exports.getFilepathInEntity = getFilepathInEntity;
exports.ensureFilepathExists = ensureFilepathExists;
exports.jsonToBIN1 = jsonToBIN1;
exports.jsonToMeta = jsonToMeta;
exports.brickToBIN1 = brickToBIN1;
exports.getEntityTypeIndex = getEntityTypeIndex;
exports.getFileHash = getFileHash;
exports.getKeyFromBlenderName = getKeyFromBlenderName;
exports.getNumericKeyFromBlenderName = getNumericKeyFromBlenderName;
exports.getEntityIndexFromBlenderName = getEntityIndexFromBlenderName;
exports.getPhysicalParentIndexFromBlenderName = getPhysicalParentIndexFromBlenderName;
exports.getTempInsertionIndex = getTempInsertionIndex;
exports.getTbluInsertionIndex = getTbluInsertionIndex;
exports.getSubentCount = getSubentCount;
exports.getPropStr = getPropStr;
exports.getPropArrStr = getPropArrStr;
exports.getTempEntStr = getTempEntStr;
exports.getTbluEntStr = getTbluEntStr;