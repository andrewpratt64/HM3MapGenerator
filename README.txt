© 2021 Andrew Pratt

Map generator for HM3


THIS IS A VERY EARLY VERSION!

License info in LICENSE.txt and in external_licenses folder
test.entity by Notex link: https://github.com/Notexe/test.entity
Info on installing Blender addons: https://docs.blender.org/manual/en/latest/editors/preferences/addons.html

WARNING:
	I have noticed crashes in rare cases, most likely when the npc is alerted.
	Hopefully I will have a fix for this in the near future.



Installation:
	1. Extract the contents of the zip file
	2. Install nodejs if it isn't installed already: https://nodejs.org/en/download/
	3. Install RPKG Tool if it isn't already: https://notex.app/rpkg
	4. Install ResourceTool if it isn't already: https://github.com/OrfeasZ/ZHMTools/
	5. Edit .../HM3MapGenerator/config.json to change settings
	6. Install the blender addon from .../HM3MapGenerator/blender_addon/HM3MapGenerator.py
	7. Follow the "Launching the map" directions from the readme in test.entity
	
	
Usage:
	1. Save a Blender project (.blend) to .../map_generator/blend/
	2. Click Edit->Export Hitman Map Data
	3. Run compile.bat
		(You can also run .../map_generator/js/gen.js with nodejs if you need to)
	
	
What the Blender Addon Does:
	- Adds an "Export Hitman Map Data" under the edit tab to export your map data
	- Adds a "Glacier2" section under the Object Properties tab
	
	
Notes for Blender:
	- The properties in the Glacier2 section all have tooltips to give extra help
	- If you use an entity type that is not in either chunk0 or chunk1 you need to add all of it's depends to the rpkg yourself
	- If you have a single entity with a visual for the editor that requires several objects, you can make all of the visual
		parts children of an empty object, making sure each child object has the, "Export this entity" property unchecked. This is how both building_background_d
		and inflatable_crocodile_a001 work.
	- Don't change the pivot point on any objects that are being exported
	- All objects are moved up by 1.52 meters so that z=0 in blender aligns with the floor in the test.entity map
	
	
Config settings:
	-"path_Runtime": Path to the Hitman 3 Runtime folder
		EXAMPLE: "D:/EpicGames/HITMAN3/Runtime"
		
	-"path_rpkg_cli": Path to rpkg-cli.exe
		EXAMPLE: "D:/Dev/hitman3/rpkg/rpkg-cli.exe"
		
	-"path_ResourceTool": Path to the folder containing the ResourceTool executable and ResourceLib
		EXAMPLE: "D:/Dev/hitman3/rpkg/ResourceTool"
		
	-"rpkgName": Name of the rpkg file to generate
		EXAMPLE: "chunk1patch2.rpkg"
		
	-"hashTemp": Hash for the map's .TEMP file
		EXAMPLE: "00E63B961C72ADFF"
		
	-"hashTblu": Hash for the map's .TBLU file
		EXAMPLE: "002358C35FE1FD13"
	
	
CREDIT:
	- ZHMTools by NoFaTe
		link: https://github.com/OrfeasZ/ZHMTools/
	- RPKG Tool by [REDACTED]
		link: https://www.notex.app/rpkg
	- test.entity by Notex
		link: https://github.com/Notexe/test.entity
	- Notex.app by Notex
		link: https://www.notex.app