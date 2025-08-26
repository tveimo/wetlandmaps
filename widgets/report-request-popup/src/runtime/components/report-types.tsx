// This component will provide the report type options in the request report widget
// It returns the jimu-ui Select component for the request form
// The report type options will be filtered based on the app name (set by app owner in Settings UI)
// Individual options may then be disabled based on the selected features' geometry and/or layer name
// Report Types that are not available through custom geoJson or the layer names' feature types are disabled

import React, { useEffect, useState } from 'react';
import { Select } from 'jimu-ui'; // request form is built using ESRI's jimi-ui library
import { type ReportObjectArray, type ReportObject } from '../../config';
import '../css/style.css'; // custom css styling

// These props communicate the Selector options, and configured app name and maps online url between the widget and report-type components
type ReportTypeSelectorProps = {
  supportsReservedLayer: boolean
  setSupportsReservedLayer: React.Dispatch<React.SetStateAction<boolean>>
  selectedReportType: string
  setSelectedReportType: React.Dispatch<React.SetStateAction<string>>
  selectedFeatureType: string
  useGeoJsonOverride: boolean
  configuredAppName: string
  reportTypesAll: Array<ReportObject>
  submitAttempted: boolean
  countPoints: number
  countLines: number
  countPolygons: number
  areaPolygons: number
};

const ReportTypeSelector = (props: ReportTypeSelectorProps) => {
  // TODO: change this to useMemo
  const [filteredReportTypes, setFilteredReportTypes] = useState<ReportObjectArray>([]);   // report requests filtered by app name

  // Need to filter the response json by the "applicationTags" element 
  // The Spatial Team controls/configures which reports an application has access to via the Unified Reports Admin Dashboard
  // Users creating applications with Experience Builder then set their corresponding app name in the widget setting UI
  // Spelling errors will mean that no report types are displayed in app. Code below handles case sensitivity
  useEffect(() => {
    const appNameLowercase = props.configuredAppName.toLowerCase();
    const filteredData = props.reportTypesAll.filter(item =>
      item.applicationTags && item.applicationTags.map(tag => tag.toLowerCase()).includes(appNameLowercase)
      );
    setFilteredReportTypes(filteredData);
  }, []);

  // When user select report type from drop down, set useState to pass back to request form
  const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    props.setSelectedReportType(event.target.value);
    // if the selected report type supports the selected feature type as a reserved layer, set the useState accordingly
    const selectedReport: ReportObject = filteredReportTypes.find(item => item.type === event.target.value)
    if (typeof selectedReport.allowedFeatureTypes !== 'undefined' && selectedReport.allowedFeatureTypes.includes(props.selectedFeatureType)) {
      props.setSupportsReservedLayer(true);
    } else {
      props.setSupportsReservedLayer(false);
    }
  };

  // The "name" property will be rendered in the form and the "type" property will be used to make report request to Maps Online api
  return (
    <div className='popup-report-request-select'>
    <Select
      autoWidth
      aria-required
      className={!props.selectedReportType && props.submitAttempted ? 'popup-report-request-input-invalid' : ''}
      value={props.selectedReportType} 
      title="Select your report type from the available options"
      fluid
      placeholder='Select report type'
      onChange={handleChange}
      disabled={false}
      >
        {filteredReportTypes.map((reportType, index) => {

            // Determine if the option should be disabled and why
            const isLineGeometryExceeded = reportType.maxLine < props.countLines;
            const isMaxPointExceeded = reportType.maxPoint < props.countPoints;
            const isMaxPolygonExceeded = reportType.maxPolygon < props.countPolygons;
            const isMaxPolygonAreaExceeded = reportType.maxGeoJsonAreaSkm < props.areaPolygons;
            const isMinPolygonAreaRequired = reportType.minGeoJsonAreaSkm > 0 && reportType.minGeoJsonAreaSkm > props.areaPolygons;
            const isAllowedFeatureTypes = reportType.allowedFeatureTypes.includes(props.selectedFeatureType);
            const isAllowGeoJson = reportType.allowGeoJson;
            
            const disabled = isLineGeometryExceeded || isMaxPointExceeded || isMaxPolygonExceeded || isMaxPolygonAreaExceeded || isMinPolygonAreaRequired || !isAllowGeoJson && props.useGeoJsonOverride || (!isAllowGeoJson && !isAllowedFeatureTypes && props.countPoints == 0);
            
            // Generate messages based on the disabled reasons
            let disabledReasons = [];
            if (isLineGeometryExceeded && reportType.maxLine == 0) {
              disabledReasons.push(`lines not accepted`);
            }
            if (isLineGeometryExceeded && reportType.maxLine >= 1) {
              disabledReasons.push(`too many lines, maximum is ${reportType.maxLine}`);
            }
            if (isMaxPointExceeded && reportType.maxPoint === 0) {
              disabledReasons.push(`points not accepted`);
            }
            if (isMaxPointExceeded && reportType.maxPoint === 1) {
              disabledReasons.push(`too many points, maximum is 1`);
            }
            if (isMaxPolygonExceeded && reportType.maxPolygon === 0) {
              disabledReasons.push(`polygons not accepted`);
            }
            if (isMaxPolygonExceeded && reportType.maxPolygon >= 1) {
              disabledReasons.push(`too many polygons, maximum is ${reportType.maxPolygon}`);
            }
            if (isMaxPolygonAreaExceeded) {
              disabledReasons.push(`maximum total area of polygons (${reportType.maxGeoJsonAreaSkm} sq km) exceeded`);
            }
            if (isMinPolygonAreaRequired && props.countPolygons > 0) {
              disabledReasons.push(`minimum total area of polygons (${reportType.maxGeoJsonAreaSkm} sq km) is not met`);
            }
            // to prompt the user that they might be able to request the report if they select from a different map layer
            if (!isAllowGeoJson && !isAllowedFeatureTypes && props.countPoints == 0) {
              disabledReasons.push('selected layer not supported');
            }
            // if user has selected geojson override and it's not supported, this is the only disable reason that need be displayed
            if (!isAllowGeoJson && props.useGeoJsonOverride) {
              disabledReasons = ['custom area not supported for this report'];
            }

            // join the disabled reasons into a single sentence
            const reasonText = disabledReasons.join(' and ');
            const optionText = disabledReasons.length > 0 ? `${reportType.name} - ${reasonText}` : reportType.name;

            return (
              <option
                key={index}
                value={reportType.type}
                disabled={disabled}
              >
                {optionText}
              </option>
            );
          })}
    </Select>
    </div>
  );
};

export default ReportTypeSelector;