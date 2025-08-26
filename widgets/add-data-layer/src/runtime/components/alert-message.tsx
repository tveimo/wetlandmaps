// This component displays a warning alert message if the user's data fails to upload
// There are a number of validation checks e.g. data type, file size, max records
// The data upload functionality is disabled until the user closes the alert message
// This was done intentionally to ensure the error message is read

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
    "dataUploadSuccessful": {
      type: "success",
      title: "Success",
      text: props.textMessage,
      withIcon: true,
    },
    "dataUploadFailed": {
      type: "error",
      title: "Warning",
      text: 'Data upload failed. ' + props.textMessage + ' Close this message and try again.',
      withIcon: false,
    },
    // Add more alert configurations as needed
  };

  return (
    <div className='widget-report-request-padding-top'>
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