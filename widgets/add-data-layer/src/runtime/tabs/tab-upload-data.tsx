// this tab presents the user with the panel for uploading their own spatial data in their colour choice
// clicking between tabs will take the user to the panel for adding a layer by url

import { React, type FeatureLayerDataSource } from 'jimu-core';
import { useState } from 'react';
import UploadData from '../components/upload-data';
import DataList from '../components/data-list';
import InformationBannerUpload from '../components/info-banner-upload'
import { type DataOptions } from '../types'
import { createDataSourcesByDataOptions, destroyDataSourcesById, getDataSource } from '../utils/utils'
import { JimuMapView } from 'jimu-arcgis';

interface UploadDataTabProps {
    widgetId: string
    jmv: JimuMapView
    portalUrl: string
    enableDataAction: boolean
  }

const DataUpload = (props: UploadDataTabProps) => {

    const [multiDataOptions, setMultiDataOptions] = useState<DataOptions[]>([]);
    // state for loading user's file into data store
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const onAddData = (addedMultiDataOptions: DataOptions[], fillColour: number[], outlineColour: number[]) => {
      setIsLoading(true)
      createDataSourcesByDataOptions(addedMultiDataOptions, props.widgetId, fillColour, outlineColour).catch(err => {
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
      //setMultiDataOptions(multiDataOptions.filter(d => d.dataSourceJson.id !== dsId))
      setMultiDataOptions([])
    }
  
    // when user clicks OK button, add the layer to the map
    // then remove layer from data store and data-list
    const onAddLayer = (dsId: string) => {
      // add data source to map
      const ds = getDataSource(dsId) as FeatureLayerDataSource;
      console.log(ds)
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
    
            <InformationBannerUpload/>
    
            <UploadData  
            portalUrl={props.portalUrl} 
            widgetID={props.widgetId}
            onAdd={onAddData}
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

export default DataUpload;