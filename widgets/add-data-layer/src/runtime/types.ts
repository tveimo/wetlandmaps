// these types were borrowed from ESRI's Add Data widget

import { type DataSourceJson } from 'jimu-core'
import { type IFeatureSet, type ILayerDefinition } from '@esri/arcgis-rest-types'

export interface LayerInFeatureCollection {
  layerDefinition: ILayerDefinition
  featureSet: IFeatureSet
}

export interface FeatureCollection {
  layers: LayerInFeatureCollection[]
}

export interface DataOptions {
  dataSourceJson: DataSourceJson
  // order of the added data.
  order: number
  // Uploaded file will be saved to it.
  restLayer?: LayerInFeatureCollection
}