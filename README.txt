© 2021 Andrew Pratt

Map generator for HM3


THIS IS A VERY EARLY VERSION!


License info in LICENSE.txt and in external_licenses folder


test.entity by Notex link: https://github.com/Notexe/test.entity


Installation:
	1. Extract the contents of the zip file
	2. Install nodejs if it isn't installed already: https://nodejs.org/en/download/
	3. Install RPKG Tool if it isn't already: https://notex.app/rpkg
	4. Install ResourceTool if it isn't already: https://github.com/OrfeasZ/ZHMTools/
	5. Copy rpkg-cli.exe and ResourceTool.exe (along with all of it's dlls) into .../map_generator/test.entity-main/
	6. Change the contents of .../map_generator/output_path.txt to where the rpkg file should generate (ex. D:\EpicGames\HITMAN3\Runtime\chunk1patch2.rpkg)
	7. Follow the "Launching the map" directions from the readme in test.entity
	
	
Usage:
	1. Save a Blender project (.blend) to .../map_generator/blend/
	2. Run the "save_prim_data.py" script in Blender.
	3. Run compile.bat
		(You can also run .../map_generator/js/gen.js with nodejs if you need to)
	
	
Notes for Blender:
	- Don't change the pivot point on any objects
	- The only properties currently used are Location, Rotation, and Scale
	- A Scale value of 1 in Blender is actually 2 meters. For an unscaled object in Hitman, set Scale in blender to 0.5 x 0.5 x 0.5
	- It's not recommended to have any objects other than cubes in the scene
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