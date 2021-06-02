# Andrew Pratt 2021

import bpy;
import os;


bl_info = {
    "name": "HM3MapGenerator",
    "author": "Andrew Pratt",
    "version": (0, 0, 1),
    "blender": (2, 92, 0),
    "category": "Interface",
}


# Operator to export to map.json
class HM3MapGenerator_Export(bpy.types.Operator):
	# Tooltip
    """Export this map to a file to be used by HM3MapGenerator"""
    # Unique Name
    bl_idname = "wm.hm3mapgenerator_export";
    # Display Name
    bl_label = "Export Hitman Map Data";
    # Options
    #bl_options = {"REGISTER"};

    def execute(self, context):
        # Declare vec3 format string
        JSON_VEC3_FMT = "{{\"x\":{:f},\"y\":{:f},\"z\":{:f}}}";
        # Declare object format string
        JSON_OBJ_FMT = "{{\"name\":\"{}\",\"x\":{},\"y\":{},\"z\":{},\"t\":{},\"s\":{},\"tempType\":\"{}\",\"tempFlag\":\"{}\",\"tbluType\":\"{}\",\"tbluFlag\":\"{}\"}}";
        # Declare object (with key) format string
        JSON_FULL_OBJ_FMT = "\"{:n}\":" + JSON_OBJ_FMT;
        
        # export to blend file location
        basedir = os.path.dirname(bpy.data.filepath)
        if not basedir:
            self.report({"ERROR"}, "Couldn't export, make sure you saved the blend first!");
            return {"FINISHED"};

        # Declare output file
        oFile = open(basedir + "\\map.json", 'w');
        oFile.write("{");

        # Get scene objects
        objs = bpy.context.selectable_objects;
        # Iterate over scene objects
        i = -1;
        for obj in objs:
            i += 1;
            
            # Skip this object if it shouldn't be exported
            if (not obj.HM3MapGenerator_bExport):
                continue;
            
            # Add a comma after the previous json object, if there was one
            if (i > 0):
                oFile.write(',');
            
            # Store object scale
            objScale = obj.scale.copy();
            # Set object scale to unit (1x1x1) scaling
            obj.scale = (1.0, 1.0, 1.0);
            bpy.context.view_layer.update();
            # Get object transform (with unit scaling)
            objT = obj.matrix_world;
            # Calculate z position offset
            zOffset = 1.52;
            if (not obj.HM3MapGenerator_bIsPointEnt):
                zOffset -= objScale.z;
            # Get object scale to export
            objScaleOutStr = "\"none\"";
            if (obj.HM3MapGenerator_bExportScale):
                objScaleOutStr = JSON_VEC3_FMT.format(
                    objScale.x / obj.HM3MapGenerator_baseScale.x,
                    objScale.y / obj.HM3MapGenerator_baseScale.y,
                    objScale.z / obj.HM3MapGenerator_baseScale.z
                )
            
            #Append object
            oFile.write(
                JSON_FULL_OBJ_FMT.format(
                    # Object key
                    i,
                    
                    # Name
                    obj.name,
                    
                    # Transform
                    JSON_VEC3_FMT.format(objT[0][0], objT[1][0], objT[2][0]), # XAxis
                    JSON_VEC3_FMT.format(objT[0][1], objT[1][1], objT[2][1]), # YAxis
                    JSON_VEC3_FMT.format(objT[0][2], objT[1][2], objT[2][2]), # ZAxis
                    JSON_VEC3_FMT.format(objT[0][3], objT[1][3], objT[2][3] + zOffset), # Trans
                    
                    # Scale
                    objScaleOutStr,
                    
                    # Entity type & flags
                    obj.HM3MapGenerator_tempType,
                    obj.HM3MapGenerator_tempFlag,
                    obj.HM3MapGenerator_tbluType,
                    obj.HM3MapGenerator_tbluFlag
                )
            );
            
            # Restore object scale
            obj.scale = objScale;
            bpy.context.view_layer.update();
            
        # Closing bracket for file
        oFile.write('}');
        
        # Close file
        oFile.close();
        
        self.report({"INFO"}, "Exported Hitman 3 map");
        return {"FINISHED"};




# Glacier2 panel in the property editor
class OBJECT_PT_glacier2(bpy.types.Panel):
    bl_label = "Glacier 2";
    bl_space_type = "PROPERTIES";
    bl_region_type = "WINDOW";
    bl_context = "object";
    bl_options = {"DEFAULT_CLOSED"};
    
    def draw(self, context):
        layout = self.layout;
        layout.use_property_split = True;
        ob = context.object;        
        
        col = layout.column();
        
        col.prop(
            ob,
            "HM3MapGenerator_bExport",
            text="Export this entity",
            emboss=True
        );
        
        col.prop(
            ob,
            "HM3MapGenerator_bIsPointEnt",
            text="Treat as point entity",
            emboss=True
        );
        
        col.prop(
            ob,
            "HM3MapGenerator_bExportScale",
            text="Export scale",
            emboss=True
        );
        
        box = col.box();
        box.prop(
            ob,
            "HM3MapGenerator_tempType",
            text="TEMP type",
            emboss=True
        );
        box.prop(
            ob,
            "HM3MapGenerator_tempFlag",
            text="TEMP flag",
            emboss=True
        );
        
        box.prop(
            ob,
            "HM3MapGenerator_tbluType",
            text="TBLU type",
            emboss=True
        );
        box.prop(
            ob,
            "HM3MapGenerator_tbluFlag",
            text="TBLU flag",
            emboss=True
        );
        
        col.prop(
            ob,
            "HM3MapGenerator_baseScale",
            text="Base Scale",
            emboss=True
        );


# Event handler for clicking the "Export Hitman Map Data" button
def onClickExport(self, context):
    self.layout.operator(HM3MapGenerator_Export.bl_idname);


# Declare array of classes to be registered/unregistered
classes = [
    HM3MapGenerator_Export,
    OBJECT_PT_glacier2
];

# Register; called when addon is enabled
# TODO: Keymapping
def register():
    # Register classes
    for cls in classes:
        bpy.utils.register_class(cls);
    
    # Register menu items
    bpy.types.TOPBAR_MT_edit.append(onClickExport);
    
    # Register properties
    bpy.types.Object.HM3MapGenerator_bExport = bpy.props.BoolProperty(
        name="Export",
        description="If true, this entity will be exported to map.json",
        default=True
    );
    
    # (This property is more of a placeholder until I handle local origins better)
    bpy.types.Object.HM3MapGenerator_bIsPointEnt = bpy.props.BoolProperty(
        name="Point Entity",
        description="If true, this is treated as a point entity rather than an entity with volume",
        default=False
    );
    
    bpy.types.Object.HM3MapGenerator_bExportScale = bpy.props.BoolProperty(
        name="Export entity scale",
        description="If true, the m_PrimitiveScale property will be set",
        default=True
    );
    
    bpy.types.Object.HM3MapGenerator_baseScale = bpy.props.FloatVectorProperty(
        name="Base Scale",
        description="The scale of the object in Blender that will produce a m_PrimitiveScale of 1x1x1",
        default=(0.5, 0.5, 0.5),
        subtype="XYZ",
        unit="NONE"
    );
    
    bpy.types.Object.HM3MapGenerator_tempType = bpy.props.StringProperty(
        name="TEMP entity type",
        description="Entity type in the TEMP file as an md5 hash",
        default="0088E52C437BBCAA",
    );
    
    bpy.types.Object.HM3MapGenerator_tempFlag = bpy.props.StringProperty(
        name="TEMP entity type flag",
        description="Flags for the entity type in the TEMP meta file",
        default="1F",
    );
    
    bpy.types.Object.HM3MapGenerator_tbluType = bpy.props.StringProperty(
        name="TBLU entity type",
        description="Entity type in the TBLU file as an md5 hash",
        default="002E141E1B1C6EFE",
    );
    
    bpy.types.Object.HM3MapGenerator_tbluFlag = bpy.props.StringProperty(
        name="TBLU entity type flag",
        description="Flags for the entity type in the TBLU meta file",
        default="1F",
    );


# Unregister; called when addon is disabled
def unregister():
    # Unregister classes
    for cls in reversed(classes):
        bpy.utils.unregister_class(OBJECT_PT_glacier2);
    
    # Unregister properties
    del bpy.types.Object.HM3MapGenerator_bExport;
    del bpy.types.Object.HM3MapGenerator_bIsPointEnt;
    del bpy.types.Object.HM3MapGenerator_bExportScale;
    del bpy.types.Object.HM3MapGenerator_baseScale;
    del bpy.types.Object.HM3MapGenerator_tempType;
    del bpy.types.Object.HM3MapGenerator_tempFlag;
    del bpy.types.Object.HM3MapGenerator_tbluType;
    del bpy.types.Object.HM3MapGenerator_tbluFlag;
    
    
    
if __name__ == "__main__":
    register();