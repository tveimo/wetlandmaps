// this component converts the geometry of a selected features to a string, formatted as per maps online api requirements
// the data structure for submitting polygons complex. Several interfaces are used to create the polygon geojson string
// for some reason, ESRI does not always provide the final (closing) vertex on polygons. thanks ESRI.
// the final vertex of each ring needs to be inserted manually if missing, otherwise will fail on geojson validation service
// TODO: test line geometry. not currently supported by any reports, but good for future proofing

import { Polygon, Point, Polyline } from 'esri/geometry'
import SpatialReference from 'esri/geometry/SpatialReference';
import { webMercatorToGeographic } from 'esri/geometry/support/webMercatorUtils';

interface IFeatureCollection {
    type: "FeatureCollection";
    features: IFeature[];
  }
  
  interface IFeature {
    type: "Feature";
    geometry: IPolygonGeometry | IMultiPolygonGeometry | IMultiLineGeometry;
    properties: { [key: string]: any }; // Can be strings, nulls, numbers etc.
  }


  interface IPolygonGeometry {
    type: "Polygon";
    coordinates: number[][][]; // Array of arrays of arrays of numbers. Yay.
    bbox: number[]; // bbox required for each individual polygon
  }

  interface IMultiPolygonGeometry {
    type: "MultiPolygon";
    coordinates: number[][][][]; // Array of arrays of arrays of arrays of numbers. Yay.
    bbox: number[]; // bbox of entire multipolygon
  }

  interface IMultiLineGeometry {
    type: "MultiLineString";
    coordinates: number[][][]; // Array of arrays of arrays of numbers. Yay.
    bbox: number[]; // bbox of polyline
  }

  interface  FormatGeoJsonStringProps {
    pointFeature: Point | null;
    polylineFeature: Polyline | null;
    polygonFeature: Polygon | null;
    spatialRef: SpatialReference;
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
    if (props.pointFeature) {
      featureType = 'point'
      featurePoint = `${props.pointFeature.longitude},${props.pointFeature.latitude}`
    }
    else if (props.polygonFeature.rings.length > 0) {
      featureType = 'geojson'

      // Transform the projected coordinates to geographic coordinates (as expected by maps online api?!)
      const geographicPolygon = webMercatorToGeographic(props.polygonFeature) as Polygon;

        console.log('polygon selected')

        let closedPolygonRings: number[][][] = geographicPolygon.rings

        // check if the last vertex in each ring is the same as the first
        // if different, push the first vertex to the end of the polygon
        closedPolygonRings.forEach((ring) => {
          console.log(ring[0])
          console.log(ring[ring.length-1])
          if (JSON.stringify(ring[0]) !== JSON.stringify(ring[ring.length-1])) {
            console.log('the ring is not closed')
            ring.push(ring[0])
            console.log('added the closing vertex')
          } else {
            console.log('the ring is already closed')
          }
        });

        // Get the extent of the polygon
        const extent = geographicPolygon.extent;

        // Build the IFeature object
        let feature: IFeature = null;
        // Check number of rings to determine if type is Polygon or MultiPolygon
        if (props.polygonFeature.rings.length == 1) {
          feature = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: closedPolygonRings,
              bbox: [
                  extent.xmin,
                  extent.ymin,
                  extent.xmax,
                  extent.ymax
              ]
            },
            properties: {}
          }
          console.log('single polygon feature formatted')
        } else if (props.polygonFeature.rings.length > 1) {
          feature = {
              type: "Feature",
              geometry: {
                type: "MultiPolygon",
                coordinates: [closedPolygonRings],
                bbox: [
                    extent.xmin,
                    extent.ymin,
                    extent.xmax,
                    extent.ymax
                ]
              },
              properties: {}
            }
            console.log('multi polygon feature formatted')
        }
        // Add the polygon to the feature collection
        featureCollection.features.push(feature);
    }
    else if (props.polylineFeature.paths.length > 0) {
      featureType = 'geojson'

      // Transform the projected coordinates to geographic coordinates (as expected by maps online api?!)
      const geographicPolyline = webMercatorToGeographic(props.polygonFeature) as Polyline;

      console.log('polyline selected')

      // Get the extent of the polyline
      const extent = geographicPolyline.extent;

      // Build the IFeature object
      const feature: IFeature = {
        type: "Feature",
        geometry: {
          type: "MultiLineString",
          coordinates: geographicPolyline.paths,
          bbox: [
              extent.xmin,
              extent.ymin,
              extent.xmax,
              extent.ymax
          ]
        },
        properties: {}
      };
      // Add the polyline to the feature collection
      featureCollection.features.push(feature);
    };

    // build featureString
    let featureString = '';
    // add features based on point or geojson geometry
    if (featureType === 'point') {
      featureString = featurePoint
    } else if (featureType === 'geojson') {
      featureString = JSON.stringify(featureCollection)
    };

    const formattedString: string = featureString;

    // queryString is sent to MapsOnline API
    return formattedString;
  };

  export default FormatGeoJsonString;