##### © 2021 Andrew Pratt

# Map generator for HM3


#### ***THIS IS A VERY EARLY VERSION!***

**License information is in LICENSE.txt and in external_licenses folder</br>
test.entity by Notex link: https://github.com/Notexe/test.entity</br>
Information on installing Blender addons: https://docs.blender.org/manual/en/latest/editors/preferences/addons.html**


### NOTE FOR MOST RECENT UPDATE:
   In the files in the "og_json" directory, many entities from the original test.entity have "DISABLED_" prepended to their name, their types set to
zentity, and their non-essential properties removed. This is just a placeholder for until property types that refer to other entities is supported.


### Installation:
1. Extract the contents of the zip file
2. Install nodejs if it isn't installed already: https://nodejs.org/en/download/
3. Install RPKG Tool if it isn't already: https://notex.app/rpkg
4. Install ResourceTool if it isn't already: https://github.com/OrfeasZ/ZHMTools/
5. Edit .../HM3MapGenerator/config.json to change settings
6. Install the blender addon from .../HM3MapGenerator/blender_addon/HM3MapGenerator.py
7. Follow the "Launching the map" directions from the readme in test.entity
	
	
### Usage:
1. Save a Blender project (.blend) to .../map_generator/blend/
2. Click Edit->Export Hitman Map Data
3. If you used any entities from chunks other than 0 or 1 for the first time, run extract_new_depends.bat
4. Run easy_build.bat
	(Other batch files are available in the "bat" folder if you need them, more on that below)
	
	
### What the Blender Addon Does:
- Adds an "Export Hitman Map Data" under the edit tab to export your map data
- Adds a "Glacier2" section under the Object Properties tab
	
	
### Notes for Blender:
- The properties in the Glacier2 section all have tooltips to give extra help
- If you use an entity type that is not in either chunk0 or chunk1 you need to run extract_new_depends.bat
- If you have a single entity with a visual for the editor that requires several objects, you can make all of the visual
	parts children of an empty object, making sure each child object has the, "Export this entity" property unchecked. This is how both building_background_d
	and inflatable_crocodile_a001 work. Other objects, such as the gas canisters and the seaplane, had their mesh edited manually to fit a single object in Blender.
	Any mesh can be used to represent the entity however. For example, the "facility_arena_ground_a_00" is just a primitive cylinder scaled to roughly fit
	the size of the object it represents. This process will hopefully be automated in the future.
- Don't change the pivot point on any objects that are being exported (...unless you know what you're doing)
	
	
### Config settings:
- "path_Runtime" (string): Path to the Hitman 3 Runtime folder</br>
EXAMPLE: "D:/EpicGames/HITMAN3/Runtime"
	
- "path_rpkg_cli" (string): Path to rpkg-cli.exe</br>
EXAMPLE: "D:/Dev/hitman3/rpkg/rpkg-cli.exe"

- "path_ResourceTool" (string): Path to the folder containing the ResourceTool executable and ResourceLib</br>
EXAMPLE: "D:/Dev/hitman3/rpkg/ResourceTool"

- "maxVanillaPatch" (int): The highest patch number in the game without mods (ex. "chunk0patch2" has a patch number of 2).</br>

- "rpkgName" (string): Name of the rpkg file to generate</br>
EXAMPLE: "chunk1patch47.rpkg"

- "rpkgPortedHashesName" (string): Name of the rpkg file to generate for ported hashes, in the case of ported hashes being built seperately</br>
EXAMPLE: "chunk1patch46.rpkg"

- "hashTemp" (string): Hash for the map's .TEMP file</br>
EXAMPLE: "00E63B961C72ADFF"

- "hashTblu" (string): Hash for the map's .TBLU file</br>
EXAMPLE: "002358C35FE1FD13"
	
- "defaultLogicalParentIndex" (int): Default value for each entity's logical parent entity index</br>

- "defaultPhysicalParentIndex" (int): Default value for each entity's physical parent entity index</br>

### Batch Files:
- easy_build: Using this is recommended unless you have a reason not to. Builds map files from saved data from blender, creates an rpkg file, and copies it to Hitman 3's Runtime directory
- extract_new_depends: Extracts any needed files to the "portedhashes" folder. Depending on your pc and how many files are exported, this can take a while (roughly 5-30 minutes typically)
- extract_all_depends: Resets both extracted_depends.json and recursive_extracted_depends.json from the "dat" directory, deletes all files in the portedhashes directory, then extracts all needed files. THIS CAN TAKE A VERY LONG TIME. Remove ".this_is_super_slow" from filename to be able to use
- gen: Generates files for the "base" folder
- clean_all: Deletes generated rpkg files in the test.entity-main folder and Hitman 3's Runtime folder
- clean_project: Deletes generated rpkg files in the test.entity-main folder
- clean_runtime: Deletes generated rpkg files in Hitman 3's Runtime folder
- build_all_single: Generates a single rpkg file for the entire map
- build_all_split: Generates two rpkg files, one for portedhashes and the other for base
- build_portedhashes: Generates an rpkg file from extracted files in the portedhashes folder
- build_base: Generates an rpkg file from the base folder
- deploy_all_single: Copies a single rpkg file for the entire map into Hitman 3's Runtime folder
- deploy_all_split: Copies two rpkg files, one for portedhashes and the other for base, into Hitman 3's Runtime folder
- deploy_portedhashes: Copies an rpkg file for the map's portedhashes into Hitman 3's Runtime folder
- deploy_base: Copies an rpkg file for the map's base entity into Hitman 3's Runtime folder

### Batch File Notes:
- Most batch files also call one of the clean scripts
- To go from Blender's exported data to an rpkg file in Hitman 3's Runtime folder, batch files (if you're not using easy_build) should be run in the following order:
  1. clean_* (if needed)
  2. gen
  3. extract_*_depends (if needed)
  4. build_*
  5. deploy_*

### Folder Structure:
```
📦HM3MapGenerator
┣📂bat: Batch files
┃ ┗📄*.bat
┣📂blend: Blender files
┃ ┣📄house.blend: Example Blender project
┃ ┣📄house.blend1: Autogenerated by Blender
┃ ┣📄map.json: File generated from Blender, represents map data
┃ ┗📄*.blend/blend1: Other Blender projects
┣📂blender_addon: Contains Blender addon
┃ ┗📄HM3MapGenerator.py: Addon file to be imported into Blender
┣📂dat: Contains miscellaneous data for HM3MapGenerator
┃ ┣📄extracted_depends.json: JSON array of the hashes of files that have already been extracted
┃ ┗📄recursive_extracted_depends.json: JSON array of the hashes of files that have already been extracted, along with all of their recursive dependencies
┣📂external_licenses: Contains licenses of other products used by HM3MapGenerator
┃ ┗📄*.txt: License of external product
┣📂og_json: Files for original map, that have already been converted to JSON via ResourceTool
┃ ┗📄*.json: Original json file
┣📂src: Source code
┃ ┣📄build.js: Builds rpkg file
┃ ┣📄clean.js: Deletes old rpkg files
┃ ┣📄common.js: Contains code shared across other .js scripts
┃ ┣📄deploy.js: Copies and renames rpkg files from the project to Hitman 3's Runtime folder
┃ ┣📄extract_depends.js: Extracts files needed by the map to HM3MapGenerator/test.entity-main/test.entity/portedhashes
┃ ┗📄gen.js: Generates files using HM3MapGenerator/blend/map to HM3MapGenerator/test.entity-main/test.entity/base
┣📂test.entity-main: Root folder of test.entity
┃ ┣📂test.entity: Root folder of map to be built into rpkg
┃ ┃ ┣📂base: Contains files for test.entity
┃ ┃ ┃ ┗📂*: Folder for a specific filetype
┃ ┃ ┃   ┗📄*.*: File generated by gen.js
┃ ┃ ┗📂portedhashes: Contains files extracted from other chunks
┃ ┃   ┗📂*: Folder for a specific filetype
┃ ┃     ┗📄*.*: File extracted by extract_*_depends.bat
┃ ┗📄README.md: Original readme for test.entity
┣📄config.json: Configuration for HM3MapGenerator
┣📄easy_build.bat - Shortcut: A shortcut to HM3MapGenerator/bat/easy_build.bat
┣📄extract_new_depends.bat - Shortcut: A shortcut to HM3MapGenerator/bat/extract_new_depends.bat
┣📄LICENSE.txt: License information for HM3MapGenerator
┗📄README.md: Information and directions for HM3MapGenerator
```

***
	
## CREDIT:
- ZHMTools by NoFaTe
	link: https://github.com/OrfeasZ/ZHMTools/
- RPKG Tool by [REDACTED]
	link: https://www.notex.app/rpkg
- test.entity by Notex
	link: https://github.com/Notexe/test.entity
- Notex.app by Notex
	link: https://www.notex.app
- Everyone's help on the Glacier2 Modding Discord server
	link: https://discord.com/invite/hxPT9rf
