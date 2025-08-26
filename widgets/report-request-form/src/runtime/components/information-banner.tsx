// this component is used to provide general information about the widget to the user
// it does not take any parameters or perform functions

import React from 'react';
import { Alert } from "jimu-ui";

const InformationBanner = () => {
    return (
        <>
        <div className='widget-report-request-padding-top'>
            <Alert
              aria-live="polite"
              form="basic"
              open
              size="medium"
              fullWidth
              style={{
                width: 325
              }}
              text="Request a Maps Online pdf report for a drawn custom area. 
                    Start by drawing your area of interest on the map."
              type="info"
              variant="contained"
              withIcon={true}
            />
          </div>
      </>
    );
};

export default InformationBanner;