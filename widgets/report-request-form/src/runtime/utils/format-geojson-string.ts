// this component converts the geometry of drawn polygon features to a string, formatted as per maps online api requirements
// the data structure for submitting polygons complex. Several interfaces are used to create the polygon geojson string

import { Polygon, Point } from 'esri/geometry'
import SpatialReference from 'esri/geometry/SpatialReference';
import { webMercatorToGeographic } from 'esri/geometry/support/webMercatorUtils';

interface IFeatureCollection {
    type: "FeatureCollection";
    features: IFeature[];
  }
  
  interface IFeature {
    type: "Feature";
    geometry: IPolygonGeometry;
    properties: { [key: string]: any }; // Can be strings, nulls, numbers etc.
  }


  interface IPolygonGeometry {
    type: "Polygon";
    coordinates: number[][][]; // Array of arrays of arrays of numbers
    bbox: number[]; // bbox required for each individual polygon
  }

  interface  FormatGeoJsonStringProps {
    pointFeature: Point | null;
    polygonFeatures: Array<Polygon> | null;
    spatialRef: SpatialReference
  }

  // format string to pass to Maps Online api when submitting validated report request parameters
  const FormatGeoJsonString = (props: FormatGeoJsonStringProps) => {
    let featureType = ''
    let featurePoint = ''
    let featureCollection: IFeatureCollection = {
      type: "FeatureCollection",
      features: [] // Start with an empty array
    };
    // featureType = point for a single point, otherwise geojson
    // multi points are not allowed for report requests so using first and only point in array 
    if (props.pointFeature && props.polygonFeatures.length === 0) {
      featureType = 'point'
      featurePoint = `${props.pointFeature.longitude},${props.pointFeature.latitude}`
    }
    else if (props.polygonFeatures.length > 0) {
      featureType = 'geojson'

      // Loop through the array of polygon features
      props.polygonFeatures.forEach(polygon => {

      // Transform the projected coordinates to geographic coordinates (as expected by maps online api?!)
      const geographicPolygon = webMercatorToGeographic(polygon) as Polygon;

      // Get the extent of the polygon
      const extent = geographicPolygon.extent;
        // Build the IFeature object
        let feature: IFeature = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: geographicPolygon.rings,
            bbox: [
                extent.xmin,
                extent.ymin,
                extent.xmax,
                extent.ymax
            ]
          },
          properties: {}
        };
        // Add the individual polygon to the feature collection
        featureCollection.features.push(feature);
      });
    }
    let featureString = ''
    // add features based on point or geojson geometry
    if (featureType === 'point') {
      featureString = featurePoint
    } else if (featureType === 'geojson') {
      featureString = JSON.stringify(featureCollection)
    }

    const formattedString: string = featureString;
    // queryString is sent to MapsOnline API
    return formattedString;
  };

  export default FormatGeoJsonString;