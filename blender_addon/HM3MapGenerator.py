# Andrew Pratt 2021

import bpy;
import os;
import abc;
from enum import Enum;


bl_info = {
    "name": "HM3MapGenerator",
    "author": "Andrew Pratt",
    "version": (0, 0, 4),
    # This addon was tested in version 2.93.0
    "blender": (2, 92, 0),
    "category": "Interface",
}


# Types of property helpers
class EG2PropertyHelperType(Enum):
    INVALID     = 0;
    NONE        = 1;
    STRING      = 2;
    REFERENCE   = 3;
    GUID        = 4;
    MAX_TYPES   = 5;
    

# Get the appropriate EG2PropertyHelperType for a given property type
def getPropertyHelperType(propertyType):
    if (propertyType == "ZString"):
        return EG2PropertyHelperType.STRING;
    elif (propertyType == "SEntityTemplateReference"):
        return EG2PropertyHelperType.REFERENCE;
    elif (propertyType == "ZGuid"):
        return EG2PropertyHelperType.GUID;
    else:
        return EG2PropertyHelperType.NONE;


# Wrap a string in double quotes, escaping any characters as needed so that it stays a valid string
def wrapStr(v):
    return '\"' + v.replace(r'\\', r'\\\\').replace(r'"', r'\"') + '\"';


# Operator to export to map.json
class HM3MapGenerator_Export(bpy.types.Operator):
	# Tooltip
    """Export this map to a file to be used by HM3MapGenerator"""
    # Unique Name
    bl_idname = "wm.hm3mapgenerator_export";
    # Display Name
    bl_label = "Export Hitman Map Data";
    
    # Returns a Glacier2 property formatted to json
    @staticmethod
    def fmtPropertyToJson(prop):
        # Declare var to hold output
        outStr = r'{"i":';
        
        # Add property id
        if (prop.m_nPropertyID.isdigit()):
            outStr += prop.m_nPropertyID;
        else:
            outStr += '\"' + prop.m_nPropertyID + '\"';
            
        # Add property type
        outStr += r',"t":"' + prop.m_type + r'","h":"';
        
        # Get helper type
        helperType = EG2PropertyHelperType.INVALID;
        if (prop.m_bUseHelper):
            helperType = getPropertyHelperType(prop.m_type);
        
        # Add helper type and property value
        if (helperType == EG2PropertyHelperType.STRING):
            outStr += r'str","v":' + wrapStr(prop.m_helperVal);
        elif (helperType == EG2PropertyHelperType.REFERENCE):
            outStr += r'ref","v":"' + prop.m_helperEntRef.name + '\"';
        elif (helperType == EG2PropertyHelperType.GUID):
            outStr += r'guid","v":"' + prop.m_helperVal + '\"';
        else:
            outStr += r'raw","v":' + wrapStr(prop.m_val);
        
        # Add closing tag and return
        return outStr + '}';
    
    # Returns an array formatted to json
    @staticmethod
    def fmtArrayToJson(arr, itemFmtFunc):
        # If the array is empty, return empty brackets
        if (not arr):
            return "[]";
        
        # Get the items in the array as key-value pairs
        items = arr.values();
        
        # Declare a string to hold the output value
        oStr = "";
        
        # Format and concatenate each item, inserting
        # commas before each one
        for item in items:
            oStr += ',' + itemFmtFunc(item);
        
        # Remove the extra comma at the beginning, add square brackets and return the result
        return '[' + oStr[1:] + ']';
    

    def execute(self, context):
        # Declare vec3 format string
        JSON_VEC3_FMT = "{{\"x\":{:f},\"y\":{:f},\"z\":{:f}}}";
        # Delcare property format string
        #JSON_PROP_FMT = r'{"i":"{}","t":"{}","v":{}}';
        # Declare object format string
        JSON_OBJ_FMT = ('{{'
            + r'"name":"{}",'
            + r'"t":{},'
            + r'"s":{},'
            + r'"pparent":"{}",'
            + r'"tempType":"{}",'
            + r'"tempFlag":"{}",'
            + r'"tbluType":"{}",'
            + r'"tbluFlag":"{}",'
            + r'"props":{},'
            + r'"piprops":{}'
        + '}}');
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
            # Skip this object if it shouldn't be exported
            if (not obj.HM3MapGenerator_bExport):
                continue;
            
            # Increment index var
            i += 1;
            
            # Add a comma after the previous json object, if there was one
            if (i > 0):
                oFile.write(',');
            
            # Store object scale
            objScale = obj.scale.copy();
            # Set object scale to unit (1x1x1) scaling
            obj.scale = (1.0, 1.0, 1.0);
            bpy.context.view_layer.update();
            # Get object transform (with unit scaling)
            objT = obj.matrix_basis;
            # Calculate z position offset
            # TODO: Don't assume object origin is centered
            #zOffset = 3.5;
            zOffset = 0.0;
            if (not obj.HM3MapGenerator_bIsPointEnt):
                zOffset -= objScale.z;
            # Get object transform to export
            objTransOutStr = r'""';
            if (obj.HM3MapGenerator_bExportTrans):
                objTransOutStr = (
                    # Trans is given first instead of last like in a SMatrix43 since the "t" key determines
                    # if the xyz properties exist
                                   JSON_VEC3_FMT.format(objT[0][3], objT[1][3], objT[2][3] + zOffset) #Trans
                    + r',"x":' +    JSON_VEC3_FMT.format(objT[0][0], objT[1][0], objT[2][0]) # XAxis
                    + r',"y":' +    JSON_VEC3_FMT.format(objT[0][1], objT[1][1], objT[2][1]) # YAxis
                    + r',"z":' +    JSON_VEC3_FMT.format(objT[0][2], objT[1][2], objT[2][2]) # ZAxis
                );
            # Get object scale to export
            objScaleOutStr = r'""';
            if (obj.HM3MapGenerator_bExportScale):
                objScaleOutStr = JSON_VEC3_FMT.format(
                    objScale.x / obj.HM3MapGenerator_baseScale.x,
                    objScale.y / obj.HM3MapGenerator_baseScale.y,
                    objScale.z / obj.HM3MapGenerator_baseScale.z
                )
            # Get parent name to export
            parentName = "";
            if (obj.HM3MapGenerator_bExportPhysicalParent and not (obj.parent is None)):
                parentName = obj.parent.name;
            
            #Append object
            oFile.write(
                JSON_FULL_OBJ_FMT.format(
                    # Object key
                    i,
                    
                    # Name
                    obj.name,
                    
                    # Transform
                    objTransOutStr,
                    
                    # Scale
                    objScaleOutStr,
                    
                    # Physical parent
                    parentName,
                    
                    # Entity type & flags
                    obj.HM3MapGenerator_tempType,
                    obj.HM3MapGenerator_tempFlag,
                    obj.HM3MapGenerator_tbluType,
                    obj.HM3MapGenerator_tbluFlag,
                    
                    # Properties
                    HM3MapGenerator_Export.fmtArrayToJson(obj.HM3MapGenerator_propertyValues, HM3MapGenerator_Export.fmtPropertyToJson),
                    HM3MapGenerator_Export.fmtArrayToJson(obj.HM3MapGenerator_postInitPropertyValues, HM3MapGenerator_Export.fmtPropertyToJson)
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


# Operator to add a new property to an entity
class HM3MapGenerator_Add_Property_To_Entity(bpy.types.Operator):
    # Tooltip
    """Add a new entry to propertyValues in a Glacier2 entity"""
    # Unique Name
    bl_idname = "wm.hm3mapgenerator_add_property_to_entity";
    # Display Name
    bl_label = "Add Property";

    def execute(self, context):
        bpy.context.object.HM3MapGenerator_propertyValues.add();
        return {'FINISHED'};
        
# Operator to delete a property from an entity
class HM3MapGenerator_Delete_Property_From_Entity(bpy.types.Operator):
    # Tooltip
    """Remove an entry from propertyValues in a Glacier2 entity"""
    # Unique Name
    bl_idname = "wm.hm3mapgenerator_delete_property_from_entity";
    # Display Name
    bl_label = "Delete Property";

    def execute(self, context):
        ob = bpy.context.object;
        ob.HM3MapGenerator_propertyValues.remove(ob.HM3MapGenerator_propertyValuesActiveIndex);
        ob.HM3MapGenerator_propertyValuesActiveIndex = max(0, ob.HM3MapGenerator_propertyValuesActiveIndex - 1);
        return {'FINISHED'};


# Operator to add a new post-init property to an entity
class HM3MapGenerator_Add_PostInit_Property_To_Entity(bpy.types.Operator):
    # Tooltip
    """Add a new entry to postInitPropertyValues in a Glacier2 entity"""
    # Unique Name
    bl_idname = "wm.hm3mapgenerator_add_postinit_property_to_entity";
    # Display Name
    bl_label = "Add Post-Initial Property";

    def execute(self, context):
        bpy.context.object.HM3MapGenerator_postInitPropertyValues.add();
        return {'FINISHED'};
        
# Operator to delete a post-init property from an entity
class HM3MapGenerator_Delete_PostInit_Property_From_Entity(bpy.types.Operator):
    # Tooltip
    """Remove an entry in postInitPropertyValues in a Glacier2 entity"""
    # Unique Name
    bl_idname = "wm.hm3mapgenerator_delete_postinit_property_from_entity";
    # Display Name
    bl_label = "Delete Post-Initial Property";

    def execute(self, context):
        ob = bpy.context.object;
        ob.HM3MapGenerator_postInitPropertyValues.remove(ob.HM3MapGenerator_postInitPropertyValuesActiveIndex);
        ob.HM3MapGenerator_postInitPropertyValuesActiveIndex = max(0, ob.HM3MapGenerator_postInitPropertyValuesActiveIndex - 1);
        return {'FINISHED'};
        
        
# Mixin for Glacier2 panels
class Glacier2Panel:
    bl_space_type = "PROPERTIES";
    bl_region_type = "WINDOW";
    bl_options = {"DEFAULT_CLOSED"};
    
    @classmethod
    def poll(cls, context):
        return (context.object is not None);

        

        

# Single property for a Glacier2 entity
class Glacier2Property(bpy.types.PropertyGroup):

    # Properties
    m_nPropertyID: bpy.props.StringProperty(
        name="Property ID",
        description="The identifier for this property",
        default="<unnamed>"
    );
    m_type: bpy.props.StringProperty(
        name="Type",
        description="The datatype of this property",
        default="void"
    );
    m_val: bpy.props.StringProperty(
        name="Value",
        description="The value of this property",
        default="null"
    );
    
    # Helper Properties
    m_bUseHelper: bpy.props.BoolProperty(
        name="Helper Enabled",
        description="When true, uses a property helper instead of raw json",
        default=True
    );
    m_helperVal: bpy.props.StringProperty(
        name="Helper Value",
        description="The helper-related value of this property",
        default="null"
    );
    m_helperEntRef: bpy.props.PointerProperty(
        type=bpy.types.Object,
        name="Reference Value",
        description="Reference value to another entity"
    );
    # TODO: ZRuntimeResourceID
    # 
    # TODO: array of references
    # TODO: Vector types
    # TODO: GUID types
    

# UI For a list of an entities properties
class GLACIER2_UL_properties(bpy.types.UIList):
    def draw_item(self, _context, layout, data, item, icon, _active_data, _active_propname, _index, _flt_flag):
        row = layout.row(align=True);
        row.prop(
            item,
            "m_nPropertyID",
            text="",
            emboss=False
        );
        


# Glacier2 panel in the property editor
class OBJECT_PT_glacier2(Glacier2Panel, bpy.types.Panel):
    bl_label = "Glacier 2";
    bl_context = "object";
    
    def draw(self, context):
        layout = self.layout;
        layout.use_property_split = True;
        ob = context.object;        
        
        col = layout.column();
        
        # General properties
        col.prop(
            ob,
            "HM3MapGenerator_bExport",
            text="Export this entity",
            emboss=True
        );
        
        col.prop(
            ob,
            "HM3MapGenerator_bExportTrans",
            text="Export transform",
            emboss=True
        );
        
        col.prop(
            ob,
            "HM3MapGenerator_bExportScale",
            text="Export scale",
            emboss=True
        );
        
        col.prop(
            ob,
            "HM3MapGenerator_bExportPhysicalParent",
            text="Set physical parent",
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
            "HM3MapGenerator_baseScale",
            text="Base Scale",
            emboss=True 
        );


# Entity type subpanel
class OBJECT_PT_glacier2EntityType(Glacier2Panel, bpy.types.Panel):
    bl_label = "Entity Type";
    bl_parent_id = "OBJECT_PT_glacier2";
    
    def draw(self, context):
        layout = self.layout;
        layout.use_property_split = True;
        ob = context.object;   
        
        col = layout.column(align=True);
        
        col.prop(
            ob,
            "HM3MapGenerator_tempType",
            text="TEMP type",
            emboss=True
        );
        col.prop(
            ob,
            "HM3MapGenerator_tempFlag",
            text="TEMP flag",
            emboss=True
        );
        
        col.prop(
            ob,
            "HM3MapGenerator_tbluType",
            text="TBLU type",
            emboss=True
        );
        col.prop(
            ob,
            "HM3MapGenerator_tbluFlag",
            text="TBLU flag",
            emboss=True
        );


# Entity properties base subpanel
class OBJECT_PT_glacier2PropertiesBaseSubpanel(Glacier2Panel, bpy.types.Panel):
    m_propertyValues: bpy.props.PointerProperty(type=bpy.props.CollectionProperty);
    m_propertyValuesKey: bpy.props.StringProperty();
    m_propertyValuesActiveIndex: bpy.props.PointerProperty(type=bpy.props.IntProperty);
    m_propertyValuesActiveIndexKey: bpy.props.StringProperty();
    
    # Name of operator that adds a new property to the object
    m_operAddName: bpy.props.StringProperty();
    # Name of operator that deletes a property from the object
    m_operDelName: bpy.props.StringProperty();
    
    
    # Draws the panel for the property collection
    def drawBase(self, context):
        layout = self.layout;
        layout.use_property_split = True;
        ob = context.object;
        
        row = layout.row(align=True);
        row.template_list(
            "GLACIER2_UL_properties",
            "",
            ob,
            self.m_propertyValuesKey,
            ob,
            self.m_propertyValuesActiveIndexKey,
            rows=3,
            type="DEFAULT"
        );
        col = row.column();
        col.operator(
            operator=self.m_operAddName,
            text="",
            icon="ADD",
            emboss=True
        );
        col.operator(
            operator=self.m_operDelName,
            text="",
            icon="REMOVE",
            emboss=True
        );
        
        if (self.m_propertyValues):
            col = layout.column(align=True);
            thisProp = self.m_propertyValues[self.m_propertyValuesActiveIndex];
            
            col.prop(
                thisProp,
                "m_nPropertyID",
                text="Property ID",
                emboss=True 
            );
            col.prop(
                thisProp,
                "m_type",
                text="Type",
                emboss=True 
            );
            
            row = col.row();
            row.enabled = not thisProp.m_bUseHelper;
            row.prop(
                thisProp,
                "m_val",
                text="JSON Value",
                emboss=True 
            );
            
            col.prop(
                thisProp,
                "m_bUseHelper",
                text="Use Helper",
                emboss=True
            );
            
            if (thisProp.m_bUseHelper):
                helperType = getPropertyHelperType(thisProp.m_type);
            
                if (helperType == EG2PropertyHelperType.STRING):
                    col.prop(
                        thisProp,
                        "m_helperVal",
                        text="String value",
                        emboss=True 
                    );
                    
                elif (helperType == EG2PropertyHelperType.REFERENCE):
                    col.prop(
                        thisProp,
                        "m_helperEntRef",
                        text="Reference",
                        emboss=True 
                    );
                    
                elif (helperType == EG2PropertyHelperType.GUID):
                    col.prop(
                        thisProp,
                        "m_helperVal",
                        text="GUID",
                        emboss=True 
                    );
                
                else:
                    row = col.row();
                    row.alignment = 'RIGHT';
                    row.label(text="No specialized helper available");
                    col.prop(
                        thisProp,
                        "m_val",
                        text="JSON Value",
                        emboss=True 
                    );
        
# Entity properties subpanel
class OBJECT_PT_glacier2Properties(OBJECT_PT_glacier2PropertiesBaseSubpanel, bpy.types.Panel):
    bl_label = "Properties";
    bl_parent_id = "OBJECT_PT_glacier2";
    
    m_propertyValuesKey = "HM3MapGenerator_propertyValues";
    m_propertyValuesActiveIndexKey = "HM3MapGenerator_propertyValuesActiveIndex";
    m_operAddName = "wm.hm3mapgenerator_add_property_to_entity";
    m_operDelName = "wm.hm3mapgenerator_delete_property_from_entity";
    
    def draw(self, context):
        ob = context.object;
        self.m_propertyValues = ob.HM3MapGenerator_propertyValues;
        self.m_propertyValuesActiveIndex = ob.HM3MapGenerator_propertyValuesActiveIndex;
        OBJECT_PT_glacier2PropertiesBaseSubpanel.drawBase(self, context);

# Entity post-init properties subpanel
class OBJECT_PT_glacier2PostInitProperties(OBJECT_PT_glacier2PropertiesBaseSubpanel, bpy.types.Panel):
    bl_label = "Post-Initial Properties";
    bl_parent_id = "OBJECT_PT_glacier2";

    m_propertyValuesKey = "HM3MapGenerator_postInitPropertyValues";
    m_propertyValuesActiveIndexKey = "HM3MapGenerator_postInitPropertyValuesActiveIndex";
    m_operAddName = "wm.hm3mapgenerator_add_postinit_property_to_entity";
    m_operDelName = "wm.hm3mapgenerator_delete_postinit_property_from_entity";
    
    def draw(self, context):
        ob = context.object;
        self.m_propertyValues = ob.HM3MapGenerator_postInitPropertyValues;
        self.m_propertyValuesActiveIndex = ob.HM3MapGenerator_postInitPropertyValuesActiveIndex;
        OBJECT_PT_glacier2PropertiesBaseSubpanel.drawBase(self, context);


# Event handler for clicking the "Export Hitman Map Data" button
def onClickExport(self, context):
    self.layout.operator(HM3MapGenerator_Export.bl_idname);


# Declare array of classes to be registered/unregistered
classes = [
    HM3MapGenerator_Export,
    HM3MapGenerator_Add_Property_To_Entity,
    HM3MapGenerator_Delete_Property_From_Entity,
    HM3MapGenerator_Add_PostInit_Property_To_Entity,
    HM3MapGenerator_Delete_PostInit_Property_From_Entity,
    Glacier2Property,
    GLACIER2_UL_properties,
    OBJECT_PT_glacier2,
    OBJECT_PT_glacier2EntityType,
    OBJECT_PT_glacier2Properties,
    OBJECT_PT_glacier2PostInitProperties
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
    
    bpy.types.Object.HM3MapGenerator_bExportTrans = bpy.props.BoolProperty(
        name="Export Transform",
        description="If true, the m_mTransform property will be set",
        default=True
    );
    
    bpy.types.Object.HM3MapGenerator_bExportScale = bpy.props.BoolProperty(
        name="Export entity scale",
        description="If true, the m_PrimitiveScale property will be set",
        default=True
    );
    
    bpy.types.Object.HM3MapGenerator_bExportPhysicalParent = bpy.props.BoolProperty(
        name="Set physical parent",
        description="If true, this entity will have it's m_eidParent set to it's parent in Blender. Otherwise, a default value is used",
        default=True
    );
    
    # (This property is more of a placeholder until I handle local origins better)
    bpy.types.Object.HM3MapGenerator_bIsPointEnt = bpy.props.BoolProperty(
        name="Point Entity",
        description="If true, this is treated as a point entity rather than an entity with volume",
        default=False
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
        description="Entity type in the TEMP file",
        #default="0088E52C437BBCAA",
        default="[modules:/zentity.class].pc_entitytype",
    );
    
    bpy.types.Object.HM3MapGenerator_tempFlag = bpy.props.StringProperty(
        name="TEMP entity type flag",
        description="Flags for the entity type in the TEMP meta file",
        default="1F",
    );
    
    bpy.types.Object.HM3MapGenerator_tbluType = bpy.props.StringProperty(
        name="TBLU entity type",
        description="Entity type in the TBLU file",
        #default="002E141E1B1C6EFE",
        default="[modules:/zentity.class].pc_entityblueprint",
    );
    
    bpy.types.Object.HM3MapGenerator_tbluFlag = bpy.props.StringProperty(
        name="TBLU entity type flag",
        description="Flags for the entity type in the TBLU meta file",
        default="1F",
    );
    
    bpy.types.Object.HM3MapGenerator_propertyValues = bpy.props.CollectionProperty(
        type=Glacier2Property,
        name="Property Values",
        description="Properties to set for this entity"
    );
    
    bpy.types.Object.HM3MapGenerator_propertyValuesActiveIndex = bpy.props.IntProperty(
        name="Index of the active property",
        default=0
    );
    
    bpy.types.Object.HM3MapGenerator_postInitPropertyValues = bpy.props.CollectionProperty(
        type=Glacier2Property,
        name="Post-Initialization Property Values",
        description="Properties to set for this entity after it has been initialized"
    );
    
    bpy.types.Object.HM3MapGenerator_postInitPropertyValuesActiveIndex = bpy.props.IntProperty(
        name="Index of the active post-init property",
        default=0
    );
    
    


# Unregister; called when addon is disabled
def unregister():
    # Unregister classes
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls);
    
    # Unregister menu items
    bpy.types.TOPBAR_MT_edit.remove(onClickExport);
    
    # Unregister properties
    del bpy.types.Object.HM3MapGenerator_bExport;
    del bpy.types.Object.HM3MapGenerator_bIsPointEnt;
    del bpy.types.Object.HM3MapGenerator_bExportScale;
    del bpy.types.Object.HM3MapGenerator_baseScale;
    del bpy.types.Object.HM3MapGenerator_tempType;
    del bpy.types.Object.HM3MapGenerator_tempFlag;
    del bpy.types.Object.HM3MapGenerator_tbluType;
    del bpy.types.Object.HM3MapGenerator_tbluFlag;
    del bpy.types.Object.HM3MapGenerator_propertyValues;
    del bpy.types.Object.HM3MapGenerator_propertyValuesActiveIndex;
    del bpy.types.Object.HM3MapGenerator_postInitPropertyValues;
    del bpy.types.Object.HM3MapGenerator_postInitPropertyValuesActiveIndex;
    
    
    
if __name__ == "__main__":
    register();