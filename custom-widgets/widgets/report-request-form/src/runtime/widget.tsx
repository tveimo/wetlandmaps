import { React, type AllWidgetProps} from 'jimu-core';
import { JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import { useState } from 'react';
import './css/style.css' // custom css styling
import { type IMConfig, MAPS_ONLINE_URL, MAPS_ONLINE_URL_INT } from '../config'
import RequestForm from './components/request-form';
import PrivacyStatement from './components/privacy-statememt';

// default widget settings
const Widget = (props: AllWidgetProps<IMConfig>) => {

  // this widget interacts with a map, hence need to set the active map widget (view)
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>();

  // get appropriate Maps Online API for internal vs external app
  const mapsOnlineAPI = props.config.internalApp ? MAPS_ONLINE_URL_INT : MAPS_ONLINE_URL;

  // watching for user changing active view. apps not expected to have multiple views
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv); // set map view
    }
  };

  return (
    <div className="widget-report-request-widget-container">
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent 
          useMapWidgetId={props.useMapWidgetIds?.[0]} 
          onActiveViewChange={activeViewChangeHandler} />
      )}

      <RequestForm 
        appName={props.config.appName || ''}
        mapsOnlineAPI={mapsOnlineAPI} 
        currentJimuMapView={jimuMapView}
        />
      
      <PrivacyStatement/>
    </div>
  );
};

export default Widget;