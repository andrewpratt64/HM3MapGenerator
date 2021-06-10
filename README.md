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
3. Run compile.bat
	(You can also run .../map_generator/js/gen.js with nodejs if you need to)
	
	
### What the Blender Addon Does:
- Adds an "Export Hitman Map Data" under the edit tab to export your map data
- Adds a "Glacier2" section under the Object Properties tab
	
	
### Notes for Blender:
- The properties in the Glacier2 section all have tooltips to give extra help
- If you use an entity type that is not in either chunk0 or chunk1 you need to add all of it's direct depends to the rpkg yourself
- If you have a single entity with a visual for the editor that requires several objects, you can make all of the visual
	parts children of an empty object, making sure each child object has the, "Export this entity" property unchecked. This is how both building_background_d
	and inflatable_crocodile_a001 work. Other objects, such as the gas canisters and the seaplane, had their mesh edited manually to fit a single object in Blender.
	Any mesh can be used to represent the entity however. For example, the "facility_arena_ground_a_00" is just a primitive cylinder scaled to roughly fit
	the size of the object it represents. This process will hopefully be automated in the future.
- Don't change the pivot point on any objects that are being exported (...unless you know what you're doing)
- When setting the TEMP type or the TBLU type on an object, it must be a filehash (ex. 00B4A45F11887CE0)
	
	
### Config settings:
- "path_Runtime" (string): Path to the Hitman 3 Runtime folder</br>
EXAMPLE: "D:/EpicGames/HITMAN3/Runtime"
	
- "path_rpkg_cli": Path to rpkg-cli.exe</br>
EXAMPLE (string): "D:/Dev/hitman3/rpkg/rpkg-cli.exe"

- "path_ResourceTool": Path to the folder containing the ResourceTool executable and ResourceLib</br>
EXAMPLE (string): "D:/Dev/hitman3/rpkg/ResourceTool"

- "rpkgName": Name of the rpkg file to generate</br>
EXAMPLE (string): "chunk1patch2.rpkg"

- "hashTemp": Hash for the map's .TEMP file</br>
EXAMPLE (string): "00E63B961C72ADFF"

- "hashTblu": Hash for the map's .TBLU file</br>
EXAMPLE (string): "002358C35FE1FD13"
	
- "defaultLogicalParentIndex" (int): Default value for each entity's logical parent entity index</br>

- "defaultPhysicalParentIndex" (int): Default value for each entity's physical parent entity index</br>
	
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
