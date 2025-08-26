// this component is used to provide general information about the widget to the user
// it does not take any parameters or perform functions

import React from 'react';

const PrivacyStatement = () => {
    return (
        <>
        <div className='popup-report-request-padding popup-report-request-max-width-privacy'>
            <h4>Privacy</h4>
            <p>
                The email address you enter is used to process your request and is collected and logged for quality assurance and product enhancement purposes only.  
                For further information about how the department handles personal information, please refer to our website at 
                <a href="https://www.detsi.qld.gov.au/help/legal/privacy" target="_blank"> www.detsi.qld.gov.au/help/legal/privacy</a> 
            </p>
          </div>
      </>
    );
};

export default PrivacyStatement;