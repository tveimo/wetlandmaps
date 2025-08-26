//The settings.tsx file provides a UI for application owners to configure the widget in Experience Builder

import { React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput, Switch } from 'jimu-ui'
import { useState, useEffect } from 'react';
import { type IMConfig } from '../config'
                                            
const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  
  // The user needs to configure the map widget that this custom widget will interact with
    const onMapWidgetSelected = (selectedMapWidgetIds: string[]) => {
        props.onSettingChange({
          id: props.id,
          useMapWidgetIds: selectedMapWidgetIds,
        })
      }

    // Custom setting for user to configure the name of their application, which will determine the reports made available in the widget
    // The app name must match the "applicationTags" elements in the Maps Online api getReportTypes query
    const [inputValue, setInputValue] = useState(props.config?.appName || '');

    // custom setting to enable radio buttons with geoJson override option. this setting should only be checked for the internal Science division web app
    const [isInternalApp, setIsInternalAppn] = useState(props.config?.internalApp || false);

    // useEffect(() => {
    //   // Update state if config changes from outside this settings component
    //   if (props.config.appName !== inputValue) {
    //     setInputValue(props.config?.appName || '');
    //   }
    // }, [props.config.appName]);

    const handleAppNameChange = (value: string) => {
      setInputValue(value);
      props.onSettingChange({
        id: props.id,
        config: props.config.set('appName', value),
      });
    };

    const handleInternalAppChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setIsInternalAppn(checked);
      props.onSettingChange({
        id: props.id,
        config: props.config.set('internalApp', checked),
      });
    };

    return (
    <div  style={{
            display: 'flex',
            flexDirection: 'column'
                }}>

      {/* 1.Map Selection */}
      <SettingSection
        className="map-selector-section"
        title="Source"
        aria-label="Source"
        >
        <SettingRow>
          <MapWidgetSelector aria-label="Select your map widget" 
                              useMapWidgetIds={props.useMapWidgetIds} 
                                onSelect={onMapWidgetSelected} 
                                  showLabel/>
        </SettingRow>
      </SettingSection>

      {/* 2.App Name Text Input */}
      <SettingSection
        title="Your application name"
        aria-label="Your application name">
        <SettingRow>
          <TextInput
            className="mb-4"
            placeholder="placeholder..."
            onAcceptValue={handleAppNameChange}
            defaultValue={inputValue}
            type="text"
          />
        </SettingRow>
      </SettingSection>

      {/* 3.Internal app switch */}
      <SettingSection
        title="Advanced Options (Science only)"
        aria-label="Advanced Options (Science only)">
        <SettingRow>
          <span className='popup-report-request-padding-right'>
            Internal Maps Online
          </span>
          <Switch
            className='can-x-switch'
            checked={isInternalApp}
            onChange={handleInternalAppChange}
            title='Internal Maps Online'
          />
        </SettingRow>
      </SettingSection>
    </div>
    )
    }
    
export default Setting