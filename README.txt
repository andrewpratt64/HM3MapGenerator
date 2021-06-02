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
	5. Copy rpkg-cli.exe and ResourceTool.exe (along with all of it's dlls) into .../map_generator/test.entity-main/
	6. Change the contents of .../map_generator/output_path.txt to where the rpkg file should generate (ex. D:\EpicGames\HITMAN3\Runtime\chunk1patch2.rpkg)
	7. Install the blender addon from .../map_generator/blender_addon/HM3MapGenerator.py
	8. Follow the "Launching the map" directions from the readme in test.entity
	
	
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
	- If you have a single entity with a visual for the editor that requires several objects, you can make all of the visual
		parts children of an empty object that has the, "Export this entity" property unchecked. This is how both building_background_d
		and inflatable_crocodile_a001 work.
	- Don't change the pivot point on any objects that are being exported
	- All objects are moved up by 1.52 meters so that z=0 in blender aligns with the floor in the test.entity map
	
	
	
CREDIT:
	- ZHMTools by NoFaTe
		link: https://github.com/OrfeasZ/ZHMTools/
	- RPKG Tool by [REDACTED]
		link: https://www.notex.app/rpkg
	- test.entity by Notex
		link: https://github.com/Notexe/test.entity
	- Notex.app by Notex
		link: https://www.notex.app