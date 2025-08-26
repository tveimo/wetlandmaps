// custom sketch toolbar component that enables users to drawn on the map
// reference for esri icons: https://developers.arcgis.com/javascript/latest/esri-icon-font/#css-class-names-and-unicode-values

import React, { useState, useEffect } from 'react';
import { JimuMapView } from 'jimu-arcgis';
import SketchViewModel  from "esri/widgets/Sketch/SketchViewModel";
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import { Button } from 'jimu-ui';

interface CustomSketchProps {
  jimuMapView: JimuMapView | null;
  graphicsArray: Array<__esri.Graphic> | null;
  setGraphicsArray: React.Dispatch<React.SetStateAction<Array<__esri.Graphic> | null>>;
}

const CustomSketch: React.FC<CustomSketchProps> = (props) => {
  // adds a layer to the current map view to contain the geometry
  const [graphicsLayer, setGraphicsLayer] = useState<GraphicsLayer | null>(null);
  // ESRI's js api sketchViewModel 
  const [sketchViewModel, setSketchViewModel] = useState<SketchViewModel | null>(null);
  // to keep track of which sketch tool button is active
  const [activeTool, setActiveTool] = useState<string>(null);

// Symbology for drawing on the map
const pointSymbol = {
  type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
  style: "circle",
  color: "#0cd1d171",
  size: "20px",
  outline: {  // autocasts as new SimpleLineSymbol()
    color: [ 48, 213, 200 ],
    width: 2  // points
  } 
};

const polygonSymbol = {
  type: "simple-fill", // autocasts as new SimpleFillSymbol()
  color: "#22f0f045",
  outline: {
    // autocasts as new SimpleLineSymbol()
    color: "#0cd1d1df",
    width: 2
  }
};

  // a layer to add the graphics to hold the drawn features
  useEffect(() => {
    if (props.jimuMapView && !graphicsLayer) {
      const layer = new GraphicsLayer();
      layer.title='Report request drawn features'
      props.jimuMapView.view.map.add(layer);
      setGraphicsLayer(layer);
    }
  }, [props.jimuMapView]);

  // when the user completes a drawing, send the geometry to the request form for processing 
  useEffect(() => {
    if (props.jimuMapView && graphicsLayer) {
      const sketchVM = new SketchViewModel({
        view: props.jimuMapView.view,
        layer: graphicsLayer,
        pointSymbol: pointSymbol,
        polygonSymbol: polygonSymbol,
        defaultCreateOptions: {
          hasZ: false, // do not need/want z dimension on drawn geometries
        },
        defaultUpdateOptions: {
          enableZ: false,
          multipleSelectionEnabled: false,
        },
        updateOnGraphicClick: true,
        tooltipOptions: {
          enabled: true,
          inputEnabled: false,
          helpMessage: 'Press z to undo, r to redo', // js api says this exists, but hasn't been ported into experience builder sdk. thanks esri.
          visibleElements: {
            area: true,
            coordinates: true,
            direction: false,
            distance: false,
            elevation: false,
            header: true,
            helpMessage: true,
            orientation: false,
            radius: true,
            rotation: false,
            scale: false,
            size: false,
            totalLength: false,
           } 
          },
      });
      // when a user completes a new drawing, set the graphics array useState
      sketchVM.on('create', (event) => {
        if (event.state === 'complete' && event.graphic.geometry) {
          props.setGraphicsArray(graphicsLayer.graphics.toArray())
          setActiveTool(null);
        }
      });
      // when a user modifies an existing drawing, set the graphics array useState
      sketchVM.on('update', (event) => {
        if (event.state === 'complete') {
          props.setGraphicsArray(graphicsLayer.graphics.toArray())
          setActiveTool(null);
        }
      });
      // when a user deletes an existing drawing, set the graphics array useState
      sketchVM.on('delete', (event) => {
        props.setGraphicsArray(graphicsLayer.graphics.toArray())
      });
      setSketchViewModel(sketchVM);
      
    }
  }, [props.jimuMapView, graphicsLayer]);

  // activate the appropriate sketch view model tool when the user clicks a draw button
  const startDrawing = (geometryType: 'point' | 'polygon' | 'rectangle' | 'circle') => {
    if (activeTool === geometryType) {
      // Deactivate drawing if the button is clicked again
      sketchViewModel?.cancel();
      setActiveTool(null);
    } else {
      // Activate drawing
      sketchViewModel?.cancel(); // Cancel any existing drawing before starting a new one
      sketchViewModel?.create(geometryType);
      setActiveTool(geometryType);
    }
  };
  
  // reset the geometry when the user clicks erase button
  const clearGraphics = () => {
    graphicsLayer.removeAll();
    props.setGraphicsArray(null);
    //props.onGeometryDrawn(null);
    setActiveTool(null);
    sketchViewModel?.cancel(); // Cancel any existing drawing 
  };

  return (
    <div>
      <div className="widget-report-request-sketch-tools">
        <Button
          active={activeTool === 'polygon'} 
          onClick={() => startDrawing('polygon')} 
          className='esri-icon-polygon' 
          title='Draw polygon'
          style={{ border: 'none', padding: '10px 10px' }}>
        </Button>
        <Button
          active={activeTool === 'rectangle'} 
          onClick={() => startDrawing('rectangle')} 
          className='esri-icon-checkbox-unchecked' 
          title='Draw rectangle'
          style={{ border: 'none', padding: '10px 10px' }}>
        </Button>
        <Button
          active={activeTool === 'circle'}  
          onClick={() => startDrawing('circle')} 
          className='esri-icon-radio-unchecked' 
          title='Draw circle'
          style={{ border: 'none', padding: '10px 10px' }}>
        </Button>
        <Button
          active={activeTool === 'point'} 
          onClick={() => startDrawing('point')} 
          className='esri-icon-map-pin' 
          title="Draw point"
          style={{ border: 'none', padding: '10px 10px' }}>
        </Button>
          {/* Vertical separator button */}
        <Button
          style={{
            borderLeft: '0.8px solid #d3d3d3',
            opacity: 0.8,
            cursor: 'default',
            padding: 0,
            background: 'none',
            boxShadow: 'none',
            height: '28px',
          }}
           tabIndex={-1}/>
        <Button 
          onClick={clearGraphics} 
          title='Clear drawings' 
          className='esri-icon-trash'
          style={{ border: 'none', position: 'relative', padding: '10px 10px' }}>
        </Button>
      </div>
    </div>
  );
};

export default CustomSketch;