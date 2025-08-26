// this component is used to provide general information about the widget to the user
// it does not take any parameters or perform functions

import React from 'react';
import { Alert } from "jimu-ui";
import '../css/style.css' // custom css styling

const InformationBannerURL = () => {
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
              text="Add online spatial data  
              to the map. Start by selecting from the 
              supported data types then enter 
              the URL."
              type="info"
              variant="contained"
              withIcon={true}
            />
          </div>
      </>
    );
};

export default InformationBannerURL;