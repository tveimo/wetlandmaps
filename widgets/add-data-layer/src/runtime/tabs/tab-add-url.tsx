// this tab presents the user with the panel for uploading their own spatial data in their colour choice
// clicking between tabs will take the user to the panel for adding a layer by url

import { React, type FeatureLayerDataSource } from 'jimu-core';
import { useState } from 'react';
import { AddURLData } from '../components/add-url-layer';
import DataList from '../components/data-list';
import InformationBannerURL from '../components/info-banner-add-url'
import { type DataOptions } from '../types'
import { createDataSourcesByDataOptions, destroyDataSourcesById, getDataSource } from '../utils/utils'

import FeatureLayer from 'esri/layers/FeatureLayer';
import { IFeatureLayer } from '@esri/arcgis-rest-types';
import { JimuMapView } from 'jimu-arcgis';

interface UploadDataTabProps {
    widgetId: string
    jmv: JimuMapView
    portalUrl: string
    enableDataAction: boolean
  }

const AddURL = (props: UploadDataTabProps) => {

    const [multiDataOptions, setMultiDataOptions] = useState<DataOptions[]>([]);
    // state for loading user's file into data store
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const onAddData = (addedMultiDataOptions: DataOptions[]) => {
      setIsLoading(true)
      console.log(addedMultiDataOptions)
      createDataSourcesByDataOptions(addedMultiDataOptions, props.widgetId).catch(err => {
        console.error('Failed to create data source', err)
      }).finally(() => {
        setIsLoading(false)
      })
      // changed from concat as we only want user to upload one dataset at a time
      //setMultiDataOptions(multiDataOptions.concat(addedMultiDataOptions))
      // TODO: need to remove any unused data from datastore once user uploads
      setMultiDataOptions(addedMultiDataOptions)
    }
  
    // when user adds layer to the map, remove the data Data Source manager
    // there is a bug here - not being removed from data store
    const onRemoveData = (dsId: string) => {
  
      destroyDataSourcesById([dsId], props.widgetId).catch(err => {
        console.error('Failed to remove data source', err)
      })
      console.log('hit removed data button. multiDataOptions in widget tsx is:')
      console.log(multiDataOptions)
      //setMultiDataOptions(multiDataOptions.filter(d => d.dataSourceJson.id !== dsId))
      setMultiDataOptions([])
    }
  
    // when user clicks OK button, add the layer to the map
    // then remove layer from data store and data-list
    const onAddLayer = (dsId: string) => {
      // add data source to map
      const ds = getDataSource(dsId) as FeatureLayerDataSource;

      // If the layer property is not defined in ds, create from restLayer
      if (typeof ds.layer === 'undefined' && typeof ds.restLayer!== 'undefined') {
        console.log('layer is undefined');
        const templyr: IFeatureLayer = ds.restLayer
        const esriFeatureLayer = new FeatureLayer({
          ...templyr
        });
        ds.layer = esriFeatureLayer
      };
      
      props.jmv.view.map.add(ds.layer)
    
      // find layer to zoom to
      const layer = props.jmv.view.map.findLayerById(ds.layer.id);
  
      // After the layer is created, zoom to the layer's extent
      layer.on('layerview-create', (event) => {
        // Check if the layer has a full extent
        if (layer.fullExtent) {
          // Set the view's extent to the layer's full extent
          props.jmv.view.goTo(layer.fullExtent).catch((error) => {
            console.error('Error zooming to layer extent:', error);
          });
        }
      })
      onRemoveData(dsId)
    };


    return (
        <div className="add-data-styler-widget-container">
    
            <InformationBannerURL/>
    
            <AddURLData  
            portalUrl={props.portalUrl} 
            widgetID={props.widgetId}
            onAddURL={onAddData}
            />
    
            { multiDataOptions.length > 0 &&
            <DataList
                uploadedDataOptions={multiDataOptions}
                setUploadedDataOptions={setMultiDataOptions}
                enableDataAction={props.enableDataAction} 
                isLoading={isLoading} 
                widgetId={props.widgetId} 
                onRemoveData={onRemoveData}
                onAddLayer={onAddLayer} />
            }
      </div>
    )
};

export default AddURL;