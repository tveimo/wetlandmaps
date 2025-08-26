// this widget extends the popup template for all map layers to add a new ActionButton
// the ActionButton called "Request Report" launches a modal with a simplified report request form
// several components are rendered via the report-request-form widget
// the widget.tsx also calls the Maps Online api to prepare and store the data for later use

import { React, type AllWidgetProps} from 'jimu-core';
import { JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import Collection from 'esri/core/Collection'
import PopupTemplate from 'esri/PopupTemplate';
import { useState, useEffect } from 'react';
import './css/style.css' // custom css styling
import { type IMConfig, type ReportObjectArray, type FeatureObjectArray, MAPS_ONLINE_URL, MAPS_ONLINE_URL_INT } from '../config';
import { Icon, Modal, ModalFooter, ModalBody, ModalHeader } from 'jimu-ui';
import esriRequest from 'esri/request'; // ESRI's module for making http requests - handles CORS
import ActionButton from 'esri/support/actions/ActionButton';
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import RequestForm from './components/request-form';
import PrivacyStatement from './components/privacy-statememt'
import Graphic from 'esri/Graphic';

// default widget settings
const Widget = (props: AllWidgetProps<IMConfig>) => {

  // this widget interacts with a map, hence need to set the active map widget (view)
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>();
  const [popupActionTriggered, setPopupActionTriggered] = useState<boolean>(false);
  const [selectedGraphic, setSelectedGraphic] = useState<Graphic>();
  const [popupTitle, setPopupTitle] = useState<string>('');

  // for managing report request api calls
  const [reportTypes, setReportTypes] = useState<ReportObjectArray>([]);
  const [errorReportTypes, setErrorReportTypes] = useState(null);
  const [featureTypes, setFeatureTypes] = useState<FeatureObjectArray>([]);
  const [errorFeatureTypes, setErrorFeatureTypes] = useState(null);

  // get appropriate Maps Online API for internal vs external app
  const mapsOnlineAPI = props.config.internalApp ? MAPS_ONLINE_URL_INT : MAPS_ONLINE_URL;

  // Fetch report types and feature types from the Maps Online API using ESRI's request module
  // this useEffect will just run once due to empty dependency list. the resulting json data can then be used for the duration of the app session
  // note that the Maps Online api does not support caching at the time of writing
  useEffect(() => {
    const requestOptions: __esri.RequestOptions = {
      // empty call to api; getReportTypes request does not take any parameters
      query: {
        f: 'json'
      },
      responseType: 'json'
    };
    // Maps Online uri is set by the widget developers in the ../config.json file
    esriRequest(mapsOnlineAPI + 'getReportTypes', requestOptions)
      .then((response) => {
        // The API response is json data with relevant information in the "output" element
        setReportTypes(response.data.output);
      })
      .catch((e) => {
        // Handle any errors that occurred during the request
        setErrorReportTypes(e.message || (e.details && e.details.error && e.details.error.message));
      })
      .finally(() => {
        console.log('errors found: ', errorReportTypes);
      });

      esriRequest(mapsOnlineAPI + 'getFeatureTypes', requestOptions)
      .then((response) => {
        // The API response is json data with relevant information in the "output" element
        setFeatureTypes(response.data.output);
      })
      .catch((e) => {
        // Handle any errors that occurred during the request
        setErrorFeatureTypes(e.message || (e.details && e.details.error && e.details.error.message));
      })
      .finally(() => {
        console.log('errors found: ', errorFeatureTypes);
      });

  }, []);

  // watching for user changing active view. apps not expected to have multiple views
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv); // set map view
    }
  };

  // Create a custom action to launch a Report Request form
  const requestReportAction = new ActionButton({
    title: "Request Report",
    id: "request-report",
    icon: "launch"
  });

  // Watch for when features are selected in the map
  useEffect(() => {
    if (jimuMapView) {
      jimuMapView.view.when(() => {
        reactiveUtils.watch(
          () => jimuMapView.view.popup.selectedFeature,
          (graphic) => {
            if (graphic) {
              // set the selected graphic useState to send to Modal component
              setSelectedGraphic(graphic);
              // Add the custom ActionButton to the existing PopupTemplate
              let graphicTemplate: PopupTemplate = graphic.getEffectivePopupTemplate();

              // if the graphic does not have a PopupTemplate, create a simple one
              if (!graphicTemplate) {
                graphicTemplate = new PopupTemplate({
                  title: graphic.layer.title,
                  content: graphic.attributes // Sometimes error is logged for uploaded files but it still works
                });
              }

              if (graphicTemplate) {
                // Initialize actions as a new Collection, as they are generally null or undefined
                graphicTemplate.actions = new Collection();
              } else {      
                console.log('no graphic template, something went wrong')       
              }
    
              // now add the new action to graphic's actions collection
              if (graphicTemplate.actions && !graphicTemplate.actions.find(action => action.id === 'request-report')) {
                graphicTemplate.actions.add(requestReportAction);
                graphic.popupTemplate = graphicTemplate;
              };
            }
          }
        );
        // Watch for the trigger-action event on the popup to launch custom action
        reactiveUtils.on(
          () => jimuMapView.view.popup,
          "trigger-action",
          (event) => {
            if (event.action.id === "request-report") {
              // the title of a layer in a group layer does not come through with the Graphic object
              // hence, get the layer name from the popup title and pass to request form
              setPopupTitle(jimuMapView.view.popup.title);
              // set request-report action triggered 
              setPopupActionTriggered(true);
            }
          }
        );
      });
    }
}, [jimuMapView]);

const handleModalClose = () => {
  setPopupActionTriggered(false);
};

  return (
    <div className="popup-report-request-widget-container">
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent 
          useMapWidgetId={props.useMapWidgetIds?.[0]} 
          onActiveViewChange={activeViewChangeHandler} />
      )}

      <Icon 
        size='m'
        icon={require('./assets/mapsonline_logo_color.svg')} 
        title='Maps Online'/>

      <Modal
        isOpen={popupActionTriggered}
        onClosed={handleModalClose}
        toggle={handleModalClose}
        centered
        scrollable
      >
        <ModalHeader
          toggle={handleModalClose}>
          Request a Report  
        </ModalHeader>
        <ModalBody>
          {/* <InformationBanner/> */}
          <RequestForm
            appName={props.config.appName || ''}
            enableRadioBtns={props.config.enableRadioBtns || false}
            reportTypesAll={reportTypes}
            featureTypesAll={featureTypes}
            mapsOnlineAPI={mapsOnlineAPI}
            currentJimuMapView= {jimuMapView}
            selectedGraphic={selectedGraphic}
            popupTitle={popupTitle}
            />
        </ModalBody>
        <ModalFooter>
          <PrivacyStatement/>
        </ModalFooter>
      </Modal>

    </div>
  );
};

export default Widget;