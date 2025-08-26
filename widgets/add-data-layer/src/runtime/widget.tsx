// this widget is a simplified and extended version of ESRI's Add Data widget
// users can upload spatial files (within limitations) and add them to the map in a colour of their choice

import { React, type AllWidgetProps } from 'jimu-core';
import {Tab, Tabs} from 'jimu-ui';

import { useState } from 'react';
import { JimuMapView, JimuMapViewComponent } from 'jimu-arcgis';
import DataUpload from './tabs/tab-upload-data';
import AddURL from './tabs/tab-add-url';
import TestTab from './tabs/test'


// default widget settings
const Widget = (props: AllWidgetProps<any>) => {
  const { portalUrl, id, enableDataAction = true, config, mutableStateProps } = props
  // this widget interacts with a map, hence need to set the active map widget (view)
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>();

  // watching for user changing active view. apps not expected to have multiple views
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv); // set map view
    }
  };


  return (
<div className="add-data-styler-widget-container">
  {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
    <JimuMapViewComponent 
        useMapWidgetId={props.useMapWidgetIds?.[0]} 
        onActiveViewChange={activeViewChangeHandler} />
  )}

  <Tabs
      defaultValue='upload-data'
      fill
      keepMount
      onChange={() => {}}
      onClose={() => {}}
      type="tabs"
    >
      <Tab
        id='upload-data'
        title='Upload data'>
          <DataUpload
            widgetId={id}
            jmv={jimuMapView}
            portalUrl={portalUrl}
            enableDataAction={enableDataAction}/>
        
      </Tab>
      <Tab
        id='add-url'
        title='Add URL'>
          <AddURL
            widgetId={id}
            jmv={jimuMapView}
            portalUrl={portalUrl}
            enableDataAction={enableDataAction}/>
      </Tab>
    </Tabs>

</div>
  );
};

export default Widget;