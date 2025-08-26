// This component provides the information alert at the top of the modal
// Additionally, it gets the feature types data from the Maps Online api to compare with the selected graphic's layer name

// Some map layer names are conifigured in the getFeatureTypes api call under the tag layerNameAliases
// If the selected graphic is in a layerNameAliases list, then the corresponding feature type and features parameters can be submitted for the report request
// For example, the graphic is from the layer called "Cadastral parcels" then the feature type = LotPlan and the features = lot,plan
// However, not all report types support every feature type. So even if the selected graphic is in a configured layer, you still need to check if the feature type is supported
// Otherwise, the feature type = geojson and the features = the geometry in geojson format

import React, { useEffect } from 'react';
import { Alert } from "jimu-ui";
import { type FeatureObjectArray } from '../../config';
import '../css/style.css' // custom css styling

type LayerNameInfoProps = {
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  layerName: string
  featureTypesAll: FeatureObjectArray
  featureType: string
  setFeatureType: React.Dispatch<React.SetStateAction<string>>
  fieldsList: Array<string>
  setFieldsList: React.Dispatch<React.SetStateAction<Array<string>>>
}

const LayerNameInfo = (props: LayerNameInfoProps) => {

  useEffect(() => {
    // Loop through the response to find if selected graphic's layer name exists in any layerNameAliases
    // Convert the target string "title" to lowercase for case-insensitive comparison
    const layerLowerCase = props.layerName.toLowerCase();
    // Loop through the response to find if layer exists in any layerNameAliases
    for (const item of props.featureTypesAll) {
      if (item.layerNameAliases.some(alias => alias.toLowerCase() === layerLowerCase)) {
      console.log('yes the layer is a reserved name')
      props.setFeatureType(item.type)
      props.setFieldsList(item.fields)
      return; // stop when found
      }
    }
    props.setIsLoading(false);
  }, []);

  return (<>
  <div className='popup-report-request-padding-bottom'>
      <Alert
        aria-live="polite"
        form="basic"
        open
        size="medium"
        fullWidth
        style={{
          width: 440
        }}
        text={`Complete the form below to request a Maps Online report.
              The pdf report will summarise information for your selected feature in ${props.layerName}.`}
        type="info"
        variant="contained"
        withIcon={true}
      />
    </div>
  </>);
};

export default LayerNameInfo;