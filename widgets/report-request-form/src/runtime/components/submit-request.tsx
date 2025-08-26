// This component will submit the report request to the Maps Online API with the user specified parameters
// It returns the success boolean value and message from the api response

import React, { useEffect, useState } from 'react';
import esriRequest from 'esri/request'; // ESRI's module for making http requests - handles CORS (in theory, in practice hhmmmm)
import AlertMessage from './alert-message'; // custom component for handling Alert Popup after form submit
import { Loading } from 'jimu-ui'

// props for maps online api report request
type SubmitReportRequestProps = {
  submittedReportType: string
  submittedFeatureType: string
  submittedFeatures: string
  submittedCustomerRef?: string
  submittedEmail: string
  mapsOnlineAPI: string
  onClose: () => void;
}

const SubmitReportRequest = (props: SubmitReportRequestProps) => {
  // Data state
  const [responseSuccess, setResponseSuccess] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [success, setSuccess] = useState<boolean | undefined>(undefined);

  // Fetch report types from the Maps Online API (UAT) using ESRI's request module
  useEffect(() => {
    const requestOptions: __esri.RequestOptions = {
      // ADD REPORT PARAMETERS
      query: {
        reportType: props.submittedReportType,
        featureType: props.submittedFeatureType,
        features: props.submittedFeatures,
        emailAddress: props.submittedEmail,
        customerReference: props.submittedCustomerRef,
        f: 'json'
      },
      responseType: 'json'
    };

    // Maps Online uri is set by the widget developers in the ../config.json file
    esriRequest(props.mapsOnlineAPI + 'request', requestOptions)
      .then((response) => {
        // The API response is json data with relevant information in three elements
        setResponseSuccess(response.data.success);
        if (response.data.success) {
          setResultMessage('Report Requested');
          setSuccess(true);
        } else {
          const outputText: Array<any> = response.data.output
          // to make error message more readable, stringify item in array to remove square brackets
          setResultMessage('Report request failed with message: ' + JSON.stringify(outputText[0]) + '. Try clearing your features and submit again.');
          setSuccess(false);
        }
      })
      .catch((e) => {
        // Handle any errors that occurred during the request
        const errorMessage = e?.message || 'An unexpected error occurred';
        setError(errorMessage);
        setSuccess(false);
        setResultMessage(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
 
  // add loading icon
  return (<>
        {loading && (
          <div
          style={{
            height: '80px',
            position: 'relative',
            width: '200px'
          }}
        >
            <Loading />
          </div>)
        }
        {success && ( 
            <div className='widget-report-request-padding-bottom'>
              <AlertMessage 
                responseType="reportRequested" 
                onClose={props.onClose}
              />
          </div>) 
        }
        {!success && !loading && ( 
            <div className='widget-report-request-padding-bottom'>
              <AlertMessage 
                responseType="reportRequestFailed" 
                onClose={props.onClose} 
                textMessage={resultMessage}
              />
          </div>) 
        }
  </>)
};

export default SubmitReportRequest;