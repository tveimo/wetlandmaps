# ExperienceBuilderWidgets
Rebuild of Spatial Team's custom widgets in ESRI's Experience Builder

## Version
In order for the custom widgets to be registered with Spatial Portal, we need to use the appropriate Experience Buidler Developer version.  More info here https://developers.arcgis.com/experience-builder/guide/release-versions/. At time of writing Spatial Portal is at version 1.14 so this is the version you should install locally. 

## Getting started
1. Install ESRI Experience Builder Developer Edition as per ESRI documentation https://developers.arcgis.com/experience-builder/guide/install-guide/ . See note above re which version to download.
2. Create a new folder in your client installation folder called custom-widgets e.g. \..\ArcGISExperienceBuilder\client\custom-widgets
3. Clone the repo to your newly created custom-widgets folder
4. Open your local file \..\ArcGISExperienceBuilder\client\tsconfig.json and add "custom-widgets" to the "include" array. Without this step, our custom widgets will not be recognised by your local Experience Builder application.

You can now create sandbox Experience Builder applications and add the custom widgets for testing.

## Documentation & Resources
- [What is Jimu? Baby don't hurt me](https://developers.arcgis.com/experience-builder/guide/core-concepts/jimu/): understanding the Experience Builder SDK
- [Experience Builder SDK Reference](https://developers.arcgis.com/experience-builder/api-reference/): it's mildly useful at times but it's missing a lot.
- Widget source code: It's generally more helpful to look at the source code of the out-of-the-box widget you want to understand. E.g. the Draw widget code can be found in ..client\dist\widgets\arcgis\draw\src
- [Experience Bulider Storybook](https://developers.arcgis.com/experience-builder/storybook/?path=/docs/welcome--docs): documentation for jimu-ui library of Experience Builder SDK
- [ArcGIS SDK for JS](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Sketch.html#properties-summary): most jimu libraries are wrappers of the JS SDK. E.g.  the [Javascript API Sketch JS widget](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Sketch.html) is wrapped by the Experience Builder Draw widget

## Spatial Team's Custom Widgets
The Spatial Team own three custom widgets. Two widgets were developed as a means to spatially request Maps Online reports, and one allows users to modify the symbology of uploaded spatial data. More content/documentation to follow as they are developed across 2025.

### Report Request (Draw Features) Widget
This widget presents the user with a form for submitting Maps Online report requests. There is a toolbar that enables the user to draw feature(s) as points or polygons. A selector with Maps Online report types is then filtered based on the symbology, number and total area of the drawn features. The rest of the form is two text inputs for report reference and email address. These are validated manually on blur and on form submission. 

At the time of writing, there is an enhancement that should be introduced regarding the area labelling. At the moment all the geometry areas are calculated when the user modifies the drawn features. This involves re-calculating polygon areas that may not have changed. This should be improved (perhaps with a useMemo hook), but I'm not sure if react can detect changes in complex ESRI objects (like a [Graphic](https://developers.arcgis.com/javascript/latest/api-reference/esri-Graphic.html)).

This widget will also require user documentation so they understand how to draw, undo/redo, and delete their geometry. There are keyboard shortcuts that are not obvious and need to be communicated. Most likely this will take the form of a pdf document, or an extensive info button pop up.

### Add Data Layer Widget
This widget is an alternative to ESRI's out-of-the-box Add Data widget, where it allows the user to select symbology before uploading a spatial file and adding it to the map. A symbol selector is offered to the user with the default set to a bright orange. There is a box to drag and drop accepted spatial files or a button to browse their file explorer for files. The code for processing this data on the host portal and adding it to the applications'd Data Store has been based on ESRI's source code for the Add Data widget. Their documentation of the Experience Builder SDK is poor so it's difficult to know what alternative options there are. The data is not stored in the browser's cache however, as this has been deemed unnecessary. 

It was also agreed by the Spatial Team to not display the Data Action component for adding the uploaded data to the map, as it's overcomplicated. The user simply uploads their data and can select Cancel or Add Data. Only one spatial file can be uploaded and added at a time. This was done intentionally, so the user can focus on their data management and choose a different colour for each file.

Two tabs have been created in this widget, one for uploading spatial data and another for adding a spatial layer via URL. The URL option is similar to the out-of-the-box Add Data widget, however the user simply has to click a button to add the layer (as opposed to using the Data Action button).

### Report Request (Popup) Widget
This widget modifies the default popup behaviour for layers in the Map widget. It adds an extra button (ESRI js action button) to the popup template every time a feature is selected by the user. When the action button is clicked, a report request form is launched (as a modal) with dynamic content dependent on the selected feature.

This widget differs in that it is not manually initalised by the user. As ESRI does not provide a means for widgets to initalise on the application start up, a workaround has been created whereby this widget is added to the application outside of a widget container so it starts at runtime. It appears as a small, inconspicuous icon with the Maps Online logo. This can be placed behind another widget to hide the icon if preferred. The icon is not interactive in any way from the user's perspective.

The report request form is similar to the Draw Features widget, except the selected feature provides the bases for the input geometry. The selected layer is also compared with the Maps Online API to see if is a 'reserved layer', i.e. has been configured to use a non-geojson feature type (such as lot plan, protected area name, nature refuge).

Note there is additional functionality provided in the Settings.tsx whereby radio buttons can appear in the report request form for certain map layers. This functionality has been requested by the product owner on behalf of the QPWS division, who have the requirement to select part of a lot plan feature for a report (instead of all polygons with a matching lot plan). This functionality should not be enabled in externally facing web apps.
