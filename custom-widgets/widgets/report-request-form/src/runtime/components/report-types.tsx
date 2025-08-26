// This component will provide the report type options in the request report widget
// It returns the jimu-ui Select component for the request form
// The report type options will be filtered based on the app name (set by app owner in Settings UI)
// Individual options may then be disabled based on drawn features geometry
// Report Types that are not available through custom geoJson feature types are displayed as disabled

import React, { useEffect, useState } from 'react';
import { Select } from 'jimu-ui'; // request form is built using ESRI's jimi-ui library
import esriRequest from 'esri/request'; // ESRI's module for making http requests - handles CORS
import { type ReportObjectArray } from '../../config';
import '../css/style.css' // custom css styling

// These props communicate the Selector options, and configured app name and maps online url between the widget and report-type components
type ReportTypeSelectorProps = {
  selectedReportType: string
  setSelectedReportType: React.Dispatch<React.SetStateAction<string>>
  configuredAppName: string
  mapsOnlineAPI: string
  submitAttempted: boolean
  disabled: boolean
  countPoints: number
  countPolygons: number
  areaPolygons: number
}

const ReportTypeSelector = (props: ReportTypeSelectorProps) => {
  // useStates for managing report request api calls
  const [reportTypes, setReportTypes] = useState<ReportObjectArray>([]);
  // useStates for managing report requests filtered by app name
  const [filteredReportTypes, setFilteredReportTypes] = useState<ReportObjectArray>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch report types from the Maps Online API using ESRI's request module
  useEffect(() => {
    const requestOptions: __esri.RequestOptions = {
      // empty call to api; getReportTypes request does not take any parameters
      query: {
        f: 'json'
      },
      responseType: 'json'
    };
    console.log('I am sending a request to the maps online api')

    // Maps Online uri is set by the widget developers in the ../config.json file
    esriRequest(props.mapsOnlineAPI + 'getReportTypes', requestOptions)
      .then((response) => {
        // The API response is json data with relevant information in the "output" element
        console.log('report types', response)
        setReportTypes(response.data.output);
      })
      .catch((e) => {
        console.error('unable to query report types', e)
        // Handle any errors that occurred during the request
        setError(e.message || (e.details && e.details.error && e.details.error.message));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

    // Need to filter the response json by the "applicationTags" element
    // The Spatial Team controls/configures which reports an application has access to via the Unified Reports Admin Dashboard
    // Users creating applications with Experience Builder then set their corresponding app name in the widget setting UI
    // Spelling errors will mean that no report types are displayed in app. Code below handles case sensitivity
  useEffect(() => {
    const appNameLowercase = props.configuredAppName.toLowerCase();
    console.log("report types 1", reportTypes, appNameLowercase);
    console.log("x")
    let filteredData = []
    console.log("y")
    try {
      console.log("1")
      // filteredData = reportTypes.filter(item => {
      //     console.log("tags: ", item.applicationTags, item)
      //     return item.applicationTags && item.applicationTags.map(tag => tag.toLowerCase()).includes(appNameLowercase)
      //   }
      // );
      console.log("2")
    } catch (e) {
      console.error(" filter error", e);
    }
    console.log("filteredData 2", reportTypes);
    setFilteredReportTypes(reportTypes);
    //console.log(reportTypes)
  }, [reportTypes]) // must set reportTypes as a dependency otherwise the filter runs before the reportTypes state is set

  // When user select report type from drop down, set useState to pass back to request form
  const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    props.setSelectedReportType(event.target.value);
  };

  // The "name" property will be rendered in the form and the "type" property will be used to make report request to Maps Online api
  return (
    <div className='widget-report-request-select'>
    <Select
      autoWidth
      aria-required
      className={!props.selectedReportType && props.submitAttempted ? 'widget-report-request-input-invalid' : ''}
      value={props.selectedReportType}
      title="Report type options depend on your drawn features"
      fluid
      placeholder='Select report type'
      onChange={handleChange}
      disabled={props.disabled}
      >
        {filteredReportTypes.map((reportType, index) => {
          // Determine if the option should be disabled and why
          const isMaxPointExceeded = reportType.maxPoint < props.countPoints;
          const isMaxPolygonExceeded = reportType.maxPolygon < props.countPolygons;
          const isMaxPolygonAreaExceeded = reportType.maxGeoJsonAreaSkm < props.areaPolygons;
          const isMinPolygonAreaRequired = reportType.minGeoJsonAreaSkm > 0 && reportType.minGeoJsonAreaSkm > props.areaPolygons;
          const isAllowGeojson = reportType.allowGeoJson;
          //const isAllowGeojson = false;
          const disabled = isMaxPointExceeded || isMaxPolygonExceeded || isMaxPolygonAreaExceeded || isMinPolygonAreaRequired || !isAllowGeojson;

          // Generate messages based on the disabled reasons
          const disabledReasons = [];
          if (isMaxPointExceeded && reportType.maxPoint === 0) {
            disabledReasons.push('points not accepted');
          }
          if (isMaxPointExceeded && reportType.maxPoint === 1) {
            disabledReasons.push('too many points drawn, maximum is 1');
          }
          if (isMaxPolygonExceeded && reportType.maxPolygon === 0) {
            disabledReasons.push('polygons not accepted');
          }
          if (isMaxPolygonExceeded && reportType.maxPolygon >= 1) {
            disabledReasons.push(`too many polygons, maximum is ${reportType.maxPolygon}`);
          }
          if (isMaxPolygonAreaExceeded) {
            disabledReasons.push(`maximum total area of polygons (${reportType.maxGeoJsonAreaSkm} sq km) exceeded`);
          }
          if (isMinPolygonAreaRequired && props.countPolygons > 0) {
            disabledReasons.push(`minimum total area of polygons (${reportType.maxGeoJsonAreaSkm} sq km) is not drawn`);
          }
          if (!isAllowGeojson && reportType.maxPoint === 0) {
            disabledReasons.push('try selecting a feature in a map layer')
          };

          // Join the reasons into a single sentence
          const reasonText = disabledReasons.join(' and ');
          const optionText = disabledReasons.length > 0 ? `${reportType.name} - ${reasonText}` : reportType.name;

          console.log('option', reportType)
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
