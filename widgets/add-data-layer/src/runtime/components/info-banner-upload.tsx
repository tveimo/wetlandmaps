// this component is used to provide general information about the widget to the user
// it does not take any parameters or perform functions

import React from 'react';
import { Alert } from "jimu-ui";
import '../css/style.css' // custom css styling

const InformationBannerUpload = () => {
    return (
        <>
        <div className='padding-top-20 padding-left padding-right padding-bottom-20'>
            <Alert
              aria-live="polite"
              form="basic"
              open
              size="medium"
              fullWidth
              style={{
                width: 325
              }}
              text="Add your own spatial data to the map
                    and display the layer in a colour of your choice.
                    Start by selecting a symbol, then upload one of the supported data formats
                    (CSV, KML, Shapefile (zipped), or GeoJSON)."
              type="info"
              variant="contained"
              withIcon={true}
            />
          </div>
      </>
    );
};

export default InformationBannerUpload;