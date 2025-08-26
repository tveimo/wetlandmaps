// this component presents the user with a color picker from esri's jimu-ui library
// the selected colour is passed back to the add-data component
// if the user changes the symbol after uploading data, it will not be applied
// this is because it is computationally expensive to keep recreating the data store with new colours
// the form is presented in a way to guide the user to choose the colour before uploading data

import {SymbolSelector, JimuSymbolType, JimuSymbol } from 'jimu-ui/advanced/map';
import Color from "esri/Color";
import SimpleFillSymbol from "esri/symbols/SimpleFillSymbol";
import { React } from 'jimu-core'
import { useState, useEffect } from 'react';
import '../css/style.css' // custom css styling

interface ColourSelectorProps {
  fillColour: number[]
  setFillColour: React.Dispatch<React.SetStateAction<number[]>>
  outlineColour: number[]
  setOutlineColour: React.Dispatch<React.SetStateAction<number[]>>
}

const ColourSelector = (props: ColourSelectorProps) => {

  // set default colour for symbology picker. will be applied if user doesn't make selection.
  const defaultSymbol = new SimpleFillSymbol({
    // autocasts as new SimpleFillSymbol()
      color: [ 246, 154, 10, 0.4 ],
      style: "solid",
      outline: {  // autocasts as new SimpleLineSymbol()
        color: [ 246, 154, 10, 1 ],
        width: 1.5
      }
    });

  const [currentSymbol, setCurrentSymbol] = useState<JimuSymbol>(defaultSymbol);
  
  const onPolygonSymChanged = (symbol: JimuSymbol) => {
    setCurrentSymbol(symbol)
  }

  useEffect(() => {
    if (currentSymbol) {
      const outColour = new Color(currentSymbol.outline.color)
      props.setFillColour([currentSymbol.color.r, currentSymbol.color.g, currentSymbol.color.b, currentSymbol.color.a])
      props.setOutlineColour([outColour.r, outColour.g, outColour.b, outColour.a])
    }
  }, [currentSymbol])

  return (
      <div className="padding-all centered-container">
        <span className='font-14'>Select colour</span>
          <div className='symbol-selector'>
          <SymbolSelector
              symbol= {currentSymbol}
              jimuSymbolType= {JimuSymbolType.Polygon}
              btnSize={'default'}
              onPolygonSymbolChanged={onPolygonSymChanged}
              isShowPreviewBtn={true}
          />
          </div>
      </div>
  );
};

export default ColourSelector;