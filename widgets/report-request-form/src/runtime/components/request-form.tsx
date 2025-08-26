// this component returns the selector and text input items in the report request form
// it also handles the area calculations of drawn features and dynamically adds text labels if the user chooses to show area
// although these components could be separated out for clarity, they have been left here to simplify state management

import { React } from 'jimu-core'
import InformationBanner from './information-banner';
import ReportTypeSelector from './report-types'; // custom component for handling map scale
import AlertMessage from './alert-message'; // custom component for handling Alert Popup after form submit
import FormatGeoJsonString from '../utils/format-geojson-string'; // converts polygon geometry to api format
import SubmitReportRequest from './submit-request' // submits the report request to maps online api
import { useState, useEffect } from 'react';
import { TextInput, Button, Label, Switch, type ValidityResult} from "jimu-ui"; //ESRI UI modules for form
import { type JimuMapView } from 'jimu-arcgis'
import CustomSketch from './sketch-features'; // custom component with js api sketch components
import { Point, Polygon } from 'esri/geometry';
import TextSymbol from 'esri/symbols/TextSymbol'
import Graphic from 'esri/Graphic';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import * as geometryEngine from 'esri/geometry/geometryEngine'
import '../css/style.css' // custom css styling

// app name configured by user in settings window and stored in application's config file
// measurements info 
// maps online api configured by widget developer in ../config.json file
type requestFormProps = {
    appName: string;
    mapsOnlineAPI: string;
    currentJimuMapView: JimuMapView;
  }

export interface IformData {
  customerRef: string;
  email: string;
  }
  
const RequestForm: React.FC<requestFormProps> = (props) => {

  // receive drawn geometry as array of esri Graphic objects from sketch-features component
  // did not use native esri GraphicsLayer for useState because React does not detect changes to this object
  const [sketchGraphicsArray, setSketchGraphicsArray] = useState<Array<__esri.Graphic> | null>(null);
  // for managing text graphics
  const [textGraphicsArray, setTextGraphicsArray] = useState<Array<__esri.Graphic> | null>(null);
  // adds a layer to the current map view to contain the area labels 
  const [graphicsLabelsLayer, setGraphicsLabelsLayer] = useState<GraphicsLayer | null>(null);
  // showLabels linked to Switch component in form 
  const [showLabels, setShowLabels] = useState<boolean> (true);
  // for tracking the drawn features
  const [pointCount, setPointCount] = useState<number>(0);
  const [polygonCount, setPolygonCount] = useState<number>(0);
  const [polygonsAreaGeodesic, setPolygonsAreaGeodesic] = useState<number>(0); 
  const [featuresDrawn, setFeaturesDrawn] = useState<boolean>(false);
  const [formattedFeatures, setFormattedFeatures] = useState<string>('');

  // Report type input handed by report-types component. Receive the selected report type through prop
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  // Remaining form data to submit to Maps Online api
  const [formData, setFormData] = useState<IformData>({
    customerRef: "",
    email: "",
  }); 

  // States to control the visibility of the AlertMessage component
  const [showAlertValidForm, setShowAlertValidForm] = useState<boolean>(false);
  const [showAlertInvalidForm, setShowAlertInvalidForm] = useState<boolean>(false);
  // has submit (Request) button been pressed
  const [isSubmitForm, setIsSubmitForm] = useState<boolean>(false);
  // has form data been validated
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  // dynamic error messages to display to user upon form validation
  const [errorMessages, setErrorMessages] = useState<string>('');
  // was the report requested successfully to api?
  const [isRequestSent, setIsRequestSent] = useState<boolean>(false);
  
  // a layer to add the graphics to hold the drawn features
  useEffect(() => {
    if (props.currentJimuMapView && !graphicsLabelsLayer) {
      const layer = new GraphicsLayer();
      layer.title='Report request area labels'
      props.currentJimuMapView.view.map.add(layer);
      setGraphicsLabelsLayer(layer);
    }
  }, [props.currentJimuMapView]);
  
  // when sketch graphics array changes, increment the geometry counters, rebuild area totals 
  useEffect(() => {
    let newPointCount = 0;
    let newPolygonCount = 0;
    let newTextGraphics: Array<__esri.Graphic> = [];
    if (sketchGraphicsArray) {
      sketchGraphicsArray.forEach(graphic => {
        if (graphic.geometry.type === 'point') {
          newPointCount += 1;
          // create lat/long label for point feature, with offset so it does not obscure point symbol
          const pointGeometry = graphic.geometry as Point;
          const labelSymbolPoint = new TextSymbol({
            text: `${pointGeometry.latitude.toFixed(6)}, ${pointGeometry.longitude.toFixed(6)}`, // Format the coords to 6 decimal places
            color: "#042222",
            haloColor: "#ffffff",
            haloSize: "1px",
            xoffset: 15,
            yoffset: 15,
            font: { // autocast as esri/symbols/Font
              size: 12,
              family: "sans-serif",
              weight: 'bold',
            }
          });
          // Create a new graphic for the label
          const labelGraphic = new Graphic({
            geometry: pointGeometry,
            symbol: labelSymbolPoint,
          });
            // Add the label graphics to setTextGraphicsLayer
          newTextGraphics.push(labelGraphic)
        } else if (graphic.geometry.type === 'polygon') {
          newPolygonCount += 1;
          // calculate area for getting cumulative total and creating labels
          const polygonGeometry = graphic.geometry as Polygon;
          const polygonArea = geometryEngine.geodesicArea(polygonGeometry, "square-kilometers")
          setPolygonsAreaGeodesic(polygonsAreaGeodesic + polygonArea);
          // create graphic labels as new point graphics. graphics do not have a label property. thanks ESRI.
          if (polygonArea) {
            // Get the centroid of the polygon
            const centroid: __esri.Point = polygonGeometry.extent.center
            // Create a text symbol for the centroid
            const labelSymbol = new TextSymbol({
              text: `${Math.ceil(polygonArea*100)/100} km²`, // Format the area value to two decimal places
              color: "#063d3d",
              haloColor: "#ffffff",
              haloSize: "1px",
              font: { // autocast as esri/symbols/Font
                size: 12,
                family: "sans-serif",
                weight: 'bold',
              }
            });
            // Create a new graphic for the label
            const labelGraphic = new Graphic({
              geometry: centroid as Point,
              symbol: labelSymbol
            });
              // Add the label graphics to setTextGraphicsLayer
            newTextGraphics.push(labelGraphic)
          }
        }
      });
      setPointCount(newPointCount);
      setPolygonCount(newPolygonCount);
      setFeaturesDrawn(true)
      setSelectedReportType('') // reset selected report type, previous selection could now be disabled
      setTextGraphicsArray(newTextGraphics)
    } else if (!sketchGraphicsArray) { //reset states when user clears drawings
      setPointCount(0);
      setPolygonCount(0);
      setPolygonsAreaGeodesic(0);
      setFeaturesDrawn(false);
      setSelectedReportType('');
      setTextGraphicsArray(null);
    }
  }, [sketchGraphicsArray]);

  // calculate the area labels layer
  useEffect(() => {
    if (props.currentJimuMapView && showLabels && graphicsLabelsLayer) {
      graphicsLabelsLayer.visible = true;   
      if (textGraphicsArray && textGraphicsArray.length > 0) {
        // Clear the existing graphics
        graphicsLabelsLayer.removeAll();
        // Add the new text graphics to the existing graphicsLabelsLayer
        textGraphicsArray.forEach(graphic => {
          graphicsLabelsLayer.add(graphic);
        })
      };
      if (textGraphicsArray && textGraphicsArray.length ===0 || !textGraphicsArray){
        // Clear the existing graphics
        graphicsLabelsLayer.removeAll();
      }
    }
    if (props.currentJimuMapView && !showLabels && graphicsLabelsLayer) {
      graphicsLabelsLayer.visible = false;
    }
  }, [textGraphicsArray, showLabels]);

    // The user can choose to show area labels for drawn polygons
  // When user enables switch, the request-form component handles labelling
  const onEnableLabelsChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setShowLabels(checked)
  }

  // Set states as form text input data is populated by user
  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
 
  // Some form validation done in realtime as user inputs data e.g. invalid characters in customer ref
  // Detailed and specific error messages will be displayed to user upon submit request
  const validateForm = (data: IformData) => {
    const errorMessages = [];
    if (!featuresDrawn) {
      errorMessages.push('no features drawn');
    }
    if (!selectedReportType) {
      errorMessages.push('no report type selected')
    }
    if (data.customerRef && !formData.customerRef.match(regexCustomerRef)) {
      errorMessages.push('invalid customer reference');
    }
    if (!data.email) {
      errorMessages.push('no email input');
    }
    if (data.email && !formData.email.match(regexEmail)) {
      errorMessages.push('invalid email');
    }
    if (pointCount > 1) {
      errorMessages.push('multiple points drawn, try again with only one point')
    }
    if (pointCount > 0 && polygonCount > 0) {
      errorMessages.push('cannot have mix of drawn point and polygon features')
    }
    let errorText = '';
    // single error - return one message
    if (errorMessages.length === 1) {
      errorText = errorMessages[0]
    }
    // if multiple errors, join together
    if (errorMessages.length> 1) {
      errorText = errorMessages.join(' and ')
    };
    return errorText;
  };

  // regex used to validate customer reference text input
  const regexCustomerRef = /^[A-Za-z0-9_\s-]{0,40}$/;

  // real time validation of user typing customer reference
  const checkCustomerRef = (inputData: string): ValidityResult => {
    const valid = regexCustomerRef.test(inputData)
    return { valid, msg: !valid && 'Must be 40 characters or less and contain only alphanumeric characters, dashes and underscores' }
  };

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // real time validation of user typing email. ESRI's default version is horrible (i.e. using type=email for text input)
  const checkEmail = (inputData: string): ValidityResult => {
    const valid = regexEmail.test(inputData)
    return { valid, msg: !valid && 'Enter a valid email address' }
  };

  // functions for submitting validated geometry to format-features-string component
  const getPointGeometry = (inputGraphicArray: Array<__esri.Graphic>): Point | null => {
    let pointGeom = null
    if (pointCount > 0 && polygonCount === 0) {
      pointGeom = inputGraphicArray[0].geometry as Point;
    }
    return pointGeom
  };

  const getPolygonArray = (inputGraphicArray: Array<__esri.Graphic>): Array<__esri.Polygon> | null => {
    let polygonArray: Array<__esri.Polygon> = []
    if (polygonCount > 0) {
      inputGraphicArray.forEach(graphic => {
        if (graphic.geometry.type === 'polygon') {
          polygonArray.push(graphic.geometry as Polygon)
        } 
      })
    }
    return polygonArray
  };

  // Using react form submit event to trigger validation of report types, drawn features, email
  // If successful validation, trigger API request + alert message
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowAlertInvalidForm(false)
    setIsSubmitForm(true)
    // validate inputs
    const Validate = validateForm(formData)
    setErrorMessages(Validate)
    // if form is valid, submit request to Maps Online api
    if (Validate.length === 0){
      setIsFormValid(true);
      console.log('Form is valid!');
      setFormattedFeatures(FormatGeoJsonString({
          pointFeature: getPointGeometry(sketchGraphicsArray), 
          polygonFeatures:getPolygonArray(sketchGraphicsArray),
          spatialRef: props.currentJimuMapView.view.spatialReference
        }));
      setShowAlertValidForm(true);
      setIsSubmitForm(true);
    } else {
      // when form is invalid, display appropriate Alert to user and reset states
      setShowAlertInvalidForm(true);
      setIsFormValid(false);
      setIsRequestSent(false);
    }
  };

  // Component to hide an alert after it's displayed
  const handleCloseAlert = () => {
    setIsSubmitForm(false);
    setShowAlertValidForm(false);
    setShowAlertInvalidForm(false);
    setIsFormValid(false);
    setIsRequestSent(false);
  };

  return (
    <>
    <div className='widget-report-request-padding'>
      <InformationBanner />
      <br />
      <Label className='widget-report-request-padding-top'>
        <span className='widget-report-request-form-warning'>* </span>
        {pointCount === 0 && polygonCount === 0 ? (
          <span className="widget-report-request-text-invalid">Draw features to request a report</span>
        ) : (
          "Draw features to request a report"
        )}
      </Label>
      <br />
      <CustomSketch 
        jimuMapView={props.currentJimuMapView} 
        graphicsArray={sketchGraphicsArray}
        setGraphicsArray={setSketchGraphicsArray}
        >          
      </CustomSketch>
      <div className='widget-report-request-padding'>
        Points drawn: {pointCount}
        <br />
        Polygons drawn: {polygonCount}
        <br />
        <span className='widget-report-request-padding-right'>
        Show area labels 
        </span>
        <Switch
          aria-label="Show labels"
          checked={showLabels}
          title='Show labels'
          onChange={onEnableLabelsChange}
        />
      </div>   
      <form onSubmit={handleSubmit}>
        {/* error handling will display messages and add styling to inputs*/}
        <div className="form-group">
          <Label>
            <span className='widget-report-request-form-warning'>*</span> Maps Online Report:
            <ReportTypeSelector 
              selectedReportType={selectedReportType} 
              setSelectedReportType={setSelectedReportType} 
              configuredAppName={props.appName}
              mapsOnlineAPI={props.mapsOnlineAPI}
              submitAttempted={isSubmitForm}
              disabled={!featuresDrawn}
              countPoints={pointCount}
              countPolygons={polygonCount}
              areaPolygons={polygonsAreaGeodesic}/>
          </Label>
        </div>
        <div className="form-group">
          <Label>
            Customer Reference (optional):
            <TextInput 
            id="customerRef"
            name="customerRef"
            value={formData.customerRef}
            onChange={handleTextInputChange}
            checkValidityOnChange={checkCustomerRef}
            title="Optional file reference for your report"            
            />
          </Label>
        </div>
        <div className="form-group">
          <Label>
          <span className='widget-report-request-form-warning'>* </span> Email Address:
            <TextInput
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email} 
              onChange={handleTextInputChange}
              checkValidityOnAccept={checkEmail}
              className={formData.email.length==0 && isSubmitForm ? 'widget-report-request-input-invalid' : ''}
              title="Your pdf report will be sent to this email address"
              />
          </Label>
        </div>
        {showAlertValidForm && ( 
            <div className='widget-report-request-padding-bottom'>
          <SubmitReportRequest 
            submittedReportType={selectedReportType} 
            submittedFeatureType={polygonCount > 0 ? 'geojson' : (pointCount === 1 ? 'point': 'geojson')}
            submittedFeatures={formattedFeatures}
            submittedEmail={formData.email}
            {...(formData.customerRef && { submittedCustomerRef: formData.customerRef })}
            mapsOnlineAPI={props.mapsOnlineAPI}
            onClose={handleCloseAlert} 
            />
          </div>) 
        }
        {showAlertInvalidForm && ( 
            <div className='widget-report-request-padding-bottom'>
          <AlertMessage responseType="formInvalid" onClose={handleCloseAlert} textMessage={errorMessages}/>
          </div>) 
        }
        <div className="form-group">
          {/* Form disables request button until feautres are drawn  */}
          <Button
            htmlType="submit"
            type="primary"
            disabled={showAlertValidForm}>
            Submit
          </Button>
        </div>
      </form>
      <div>
      </div>
    </div>
    </>
  );
};

export default RequestForm;
