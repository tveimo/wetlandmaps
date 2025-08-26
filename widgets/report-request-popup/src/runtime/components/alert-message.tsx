// MAY BE REPLACED WITH ALERT-POPUP MESSAGE IF I CAN GET IT TO WORK

// This component will render an alert window to the user after they submit a report request
// The text and appearance of the alert will depend upon the response received from the api post request
// Most requests should be successful, as this custom widget will prevent requests with invalid inputs (e.g. polygon area too large)
// success response json example: { message: "Report Requested", message_code: "success", output: [ ], status: 200, success: true}
// fail response json example: { message: "Report request failed", message_code: "input_validation", output: ["Coordinates outside of Queensland"], status: 200, success: false}

import { Alert } from 'jimu-ui';
import React from 'react';
import '../css/style.css' // custom css styling

interface AlertMessageProps {
  responseType: string;
  onClose: () => void;
  textMessage?: string;
}

const AlertMessage = (props: AlertMessageProps) => {

  // Defines alert types, titles, and messages for different scenarios
  const alertConfig = {
    "reportRequested": {
      type: "success",
      title: "Success",
      text: "Report request submitted. Please clear drawn features and close this message before submitting another request.",
      withIcon: true,
    },
    "reportRequestFailed": {
      type: "error",
      title: "Warning",
      text: props.textMessage,
      withIcon: false,
    },
    "formInvalid": {
      type: "error",
      title: "Warning",
      text: "Request not sent - " + props.textMessage,
      withIcon: false,
    },
  };

  return (
    <div className='popup-report-request-padding-top'>
      <Alert
        aria-live="polite"
        closable
        form="basic"
        onClose={props.onClose}
        open
        style={{
          width: 300
        }}
        text={alertConfig[props.responseType].text}
        title={alertConfig[props.responseType].title}
        type={alertConfig[props.responseType].type}
        withIcon={alertConfig[props.responseType].withIcon}
      />
    </div>
  );
};

export default AlertMessage;