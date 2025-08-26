// This component presents the user with two radio buttons when they have selected a graphic from the cadastral parcels layer
// The buttons allow the user to request a report on an individual polygon, as opposed to all polygons that form the given lot/plan
// This functionality is known to be useful for the national parks and wildlife division, who need information on individual parcels within a national park

import React from 'react';
import { Radio, Label } from 'jimu-ui';
import { DCDB_FEATURE_TYPE, PROTECTED_AREA_TYPE } from '../../config' // the feature type of cadastre parcels is defined in the Maps Online API. set in config for this widget
import '../css/style.css' // custom css styling

type RadioButtonsProps = {
  selectedFeatureType: string
  supportsReservedLayer: boolean
  useGeoJsonOverride: boolean
  setUseGeoJsonOverride: React.Dispatch<React.SetStateAction<boolean>>
}

const RadioButtons = (props: RadioButtonsProps) => {

  // label text for radio buttons set dynamically according to selected feature type
  let reservedLayerText = ''
  let geoJsonOverrideText = ''

  if (props.selectedFeatureType == DCDB_FEATURE_TYPE) {
    reservedLayerText = 'All parcels with this lot plan'
    geoJsonOverrideText = 'Only selected parcel'
  }
  if (props.selectedFeatureType == PROTECTED_AREA_TYPE) {
    reservedLayerText = 'All Protected Area parcels with this name'
    geoJsonOverrideText = 'Only selected parcel'
  }

  // When user changes radio button selection, update the useState
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    props.setUseGeoJsonOverride(checked);
  };

  return (<>
        {(props.selectedFeatureType==DCDB_FEATURE_TYPE || props.selectedFeatureType==PROTECTED_AREA_TYPE) && (
          <> 
            <div role='radiogroup' className="radio-group-container popup-report-request-padding-bottom">
              <div className='radio-option'>
                <img src={require('../assets/selectAllPoly.jpg')} alt='All lot plans image' width="150" height="150"/>
                  <Label for='use-reserved-layer' className='d-flex align-items-center'>
                    <Radio
                      className='mr-2'
                      id='use-reserved-layer'
                      name='request-options'
                      onChange={(e) => { handleRadioChange(e, false) }}
                      checked={!props.useGeoJsonOverride}
                    />
                    {reservedLayerText}
                  </Label>
              </div>
              <div className='radio-option'>
                <img src={require('../assets/selectPartPoly.jpg')} alt='Single lot plan image' width="150" height="150"/>
                  <Label for='use-geojson' className='d-flex align-items-center'>
                    <Radio
                      className='mr-2'
                      id='use-geojson'
                      name='request-options'
                      onChange={(e) => { handleRadioChange(e, true) }}
                      checked={props.useGeoJsonOverride}
                    />
                    {geoJsonOverrideText}
                  </Label>
              </div>
            </div>
          </>
        )}
  </>);
};

export default RadioButtons;