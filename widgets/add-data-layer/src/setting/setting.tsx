import { React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'

const Setting = (props: AllWidgetSettingProps<any>) => {
    const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
        props.onSettingChange({
          id: props.id,
          useMapWidgetIds: useMapWidgetIds
        })
      }
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
        </div>
        )
    }

export default Setting