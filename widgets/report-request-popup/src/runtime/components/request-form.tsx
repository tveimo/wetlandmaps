// this component returns the selector and text input items in the report request form
// it also determines the geometry and handles area calculations of the selected feature 
// although these components could be separated out for clarity, they have been left here to simplify state management
// this code is largely borrowed from the report-request-form widget, however it differs because the layer name is considered
// if the layer name matches a prescribed list in the api, a different feature type is used. for example, the entire lot/plan is used instead of geojson of a single lot

import React, { useEffect, useState } from 'react';
import ReportTypeSelector from './report-types'; // custom component for handling map scale
import AlertMessage from './alert-message'; // custom component for handling Alert Popup after form submit
import FormatGeoJsonString from '../utils/format-geojson-string'; // converts geometry to geojson string for api request
import FormatFeaturesString from '../utils/format-features-string'; // converts attribute values to string for api request
import SubmitReportRequest from './submit-request' // submits the report request to maps online api
import { TextInput, Button, Label, Loading, type ValidityResult} from "jimu-ui"; //ESRI UI modules for form
import { type JimuMapView } from 'jimu-arcgis'
import { Point, Polygon, Polyline } from 'esri/geometry';
import Graphic from 'esri/Graphic';
import * as geometryEngine from 'esri/geometry/geometryEngine'
import LayerNameInfo from './layer-name-info'
import RadioButtons from './radio-buttons';
import { type ReportObjectArray, type FeatureObjectArray } from '../../config';
import '../css/style.css' // custom css styling

// app name configured by user in settings window and stored in application's config file
// measurements info 
// maps online api configured by widget developer in ../config.json file
type requestFormProps = {
    appName: string;
    enableRadioBtns: boolean;
    reportTypesAll: ReportObjectArray;
    featureTypesAll: FeatureObjectArray;
    mapsOnlineAPI: string;
    currentJimuMapView: JimuMapView;
    selectedGraphic: Graphic;
    popupTitle: string;
  }

export interface IformData {
  customerRef: string;
  email: string;
  }

const RequestForm: React.FC<requestFormProps> = (props) => {

  // show loading bar until report contents are ready
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Remaining form data to submit to Maps Online api
  const [formData, setFormData] = useState<IformData>({
    customerRef: "",
    email: "",
  }); 

  // for tracking the selected feature
  const [pointCount, setPointCount] = useState<number>(0);
  const [lineCount, setLineCount] = useState<number>(0);
  const [polygonCount, setPolygonCount] = useState<number>(0);
  const [polygonsAreaGeodesic, setPolygonsAreaGeodesic] = useState<number>(0); 
  const [formattedFeatures, setFormattedFeatures] = useState<string>('');

  // Report type input handed by report-types component. Receive the selected report type through prop
  const [selectedReportType, setSelectedReportType] = useState<string>('');

  // the utils component layer-name-check is used to determine if selected feature type has been configured in maps online api for special use
  const [selectedFeatureType, setSelectedFeatureType] = useState<string>('');
  // this useState contains the fields that are configured for a reserved feature type/ layer name
  const [reservedFeatureFields, setReservedFeatureFields] = useState<Array<string>>([]);

  // the report-types component checks whether the selected feature type is supported by the selected report type
  const [supportsReservedLayer, setSupportsReservedLayer] = useState<boolean>(false);
  // the radio-buttons component offers users the option to override the reserved layer and use geojson for a single polygon
  const [useGeoJsonOverride, setUseGeoJsonOverride] = useState<boolean>(false);

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

  // when input graphic received, increment the geometry counters & build polygon area totals 
  useEffect(() => {
    let newPointCount = 0;
    let newLineCount = 0;
    let newPolygonCount = 0;
    if (props.selectedGraphic) {
        if (props.selectedGraphic.geometry.type === 'point') {
          newPointCount = 1;
        } else if (props.selectedGraphic.geometry.type === 'polygon') {
          const polygonGeometry = props.selectedGraphic.geometry as Polygon;
          // user can only select one polygon at a time, though it might be a multipolygon
          console.log('polygon geometry selected')
          console.log(props.selectedGraphic.geometry)
          newPolygonCount = 1;
          const polygonArea = geometryEngine.geodesicArea(polygonGeometry, "square-kilometers")
          setPolygonsAreaGeodesic(polygonArea);
        } else if (props.selectedGraphic.geometry.type === 'polyline') {
          newLineCount =1;
          console.log('line geometry selected')
          console.log(props.selectedGraphic.geometry)
        }
      setPointCount(newPointCount);
      setLineCount(newLineCount);
      setPolygonCount(newPolygonCount);
    } else if (!props.selectedGraphic) { //reset states when user clears selection
      setPointCount(0);
      setLineCount(0);
      setPolygonCount(0);
      setPolygonsAreaGeodesic(0);
      setSelectedReportType('');
    }
  }, [props.selectedGraphic]);

  // if user selects feature in cadastre or national parks layer then toggles radio buttons, reset selected report type
  // the available report types will differ between the two toggle options
  useEffect(() => {
    setSelectedReportType('');
  }, [useGeoJsonOverride]);

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
      errorMessages.push('multiple points selected, try again with only one point')
    }
    if (pointCount > 0 && polygonCount > 0) {
      errorMessages.push('cannot have mix of selected point and polygon features')
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

  // functions for submitting geometry to format-features-string component
  const getPointGeometry = (inputFeature: Graphic): Point | null => {
    let pointGeom = null
    if (pointCount > 0) {
      pointGeom = inputFeature.geometry as Point;
    }
    return pointGeom
  };

  const getLineGeom = (inputGraphic: Graphic): Polyline | null => {
    let polylineGeom: Polyline = null
    if (lineCount > 0) {
        if (inputGraphic.geometry.type === 'polyline') {
          polylineGeom = inputGraphic.geometry as Polyline
        }
    }
    return polylineGeom
  };

  const getPolygonGeom = (inputGraphic: Graphic): Polygon | null => {
    let polygonGeom: __esri.Polygon = null
    if (polygonCount > 0) {
        if (inputGraphic.geometry.type === 'polygon') {
          polygonGeom = inputGraphic.geometry as Polygon
        }
    }
    return polygonGeom
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
      // if layer name is prescribed in getFeatureTypes api call and user has not overridden geojson option with radio button
      if (supportsReservedLayer && !useGeoJsonOverride) {
        console.log('using the reserved layer option to format feature string')
        setFormattedFeatures(FormatFeaturesString({
          selectedGraphic: props.selectedGraphic,
          reservedFields: reservedFeatureFields
        }))
      } else { // if layer name is not prescribed and/or user has opted to submit a single feature
        setFormattedFeatures(FormatGeoJsonString({
          pointFeature: getPointGeometry(props.selectedGraphic),
          polylineFeature: getLineGeom(props.selectedGraphic), 
          polygonFeature:getPolygonGeom(props.selectedGraphic),
          spatialRef: props.currentJimuMapView.view.spatialReference
        }));
      }
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
    <div className='popup-report-request-padding'>

    <LayerNameInfo
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        layerName={props.selectedGraphic?.layer?.title ? props.selectedGraphic.layer.title : props.popupTitle}
        featureTypesAll={props.featureTypesAll}
        featureType={selectedFeatureType}
        setFeatureType={setSelectedFeatureType}
        fieldsList={reservedFeatureFields}
        setFieldsList={setReservedFeatureFields}/>

      <form onSubmit={handleSubmit}>
        {/* only display radio buttons if this has been set in app config*/}
        <div className="form-group">
          {props.enableRadioBtns && (
            <RadioButtons
            selectedFeatureType={selectedFeatureType}
            supportsReservedLayer={supportsReservedLayer}
            useGeoJsonOverride={useGeoJsonOverride}
            setUseGeoJsonOverride={setUseGeoJsonOverride}/>
          )}
          <Label>
            <span className='popup-report-request-form-warning'>*</span> Maps Online Report:
            <ReportTypeSelector 
              selectedReportType={selectedReportType} 
              setSelectedReportType={setSelectedReportType}
              supportsReservedLayer={supportsReservedLayer}
              setSupportsReservedLayer={setSupportsReservedLayer} 
              selectedFeatureType={selectedFeatureType}
              useGeoJsonOverride={useGeoJsonOverride}
              configuredAppName={props.appName}
              reportTypesAll={props.reportTypesAll}
              submitAttempted={isSubmitForm}
              countPoints={pointCount}
              countLines={lineCount}
              countPolygons={polygonCount}
              areaPolygons={polygonsAreaGeodesic}
              />
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
          <span className='popup-report-request-form-warning'>* </span> Email Address:
            <TextInput
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email} 
              onChange={handleTextInputChange}
              checkValidityOnAccept={checkEmail}
              className={formData.email.length==0 && isSubmitForm ? 'popup-report-request-input-invalid' : ''}
              title="Your pdf report will be sent to this email address"
              />
          </Label>
        </div>
        {showAlertValidForm && ( 
            <div className='popup-report-request-padding-bottom'>
          <SubmitReportRequest 
            submittedReportType={selectedReportType} 
            submittedFeatureType={supportsReservedLayer && !useGeoJsonOverride? selectedFeatureType: pointCount>0? 'point' : 'geojson'}
            submittedFeatures={formattedFeatures}
            submittedEmail={formData.email}
            {...(formData.customerRef && { submittedCustomerRef: formData.customerRef })}
            mapsOnlineApi={props.mapsOnlineAPI}
            onClose={handleCloseAlert} 
            />
          </div>) 
        }
        {showAlertInvalidForm && ( 
            <div className='popup-report-request-padding-bottom'>
          <AlertMessage responseType="formInvalid" onClose={handleCloseAlert} textMessage={errorMessages}/>
          </div>) 
        }
        <div className="form-group popup-report-request-padding-top">
          <Button
            htmlType="submit"
            size='lg'
            type="primary"
            disabled={showAlertValidForm}>
            Submit
          </Button>
        </div>
      </form>
      <div>
      </div>
    </div>

     {
      isLoading &&
      <div className='popup-report-request-form-loading-container' title='Form is loading'>
        <div className='popup-report-request-form-loading-content'>
          <Loading className='popup-report-request-form-loading' type='PRIMARY' width={30} height={28} />
            <div className='w-100 font-14 text-center'>
              Form is loading
            </div>
        </div>
      </div>
    }
    </>
  );
};

export default RequestForm;
