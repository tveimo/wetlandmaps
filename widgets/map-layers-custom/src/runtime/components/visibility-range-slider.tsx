/** @jsx jsx */
import { React, css, getAppStore, jsx } from 'jimu-core'
import { FloatingPanel } from 'jimu-ui'
import type Widget from '../widget'
import { rem } from 'polished'

interface Props {
  widget: Widget
  listItem: __esri.ListItem
  scaleRangeSliderClass: typeof __esri.ScaleRangeSlider
}

const { useState, useCallback, useRef, useEffect } = React

const getStyle = () => {
  return css`
    .visibility-range-container {
      min-width: 342px;
      .visibility-range-panel-title {
        display: block;
        -webkit-box-orient: vertical;
        word-break: break-all;
        white-space: normal;
        -webkit-line-clamp: 1;
        font-size: ${rem(14)};
        padding: 1rem 1rem 0 1rem;
      }
      .scale-range-slider-container {
        padding: 1rem;
      }
    }
  `
}

export default function VisibilityRangeSlider (props: Props) {
  const { widget, listItem, scaleRangeSliderClass } = props
  const [isOpen, setIsOpen] = useState(true)
  const [scaleRangeSlider, setScaleRangeSlider] = useState(null)
  const sliderRef = useRef(null)

  useEffect(() => {
    if (!scaleRangeSlider) {
      const locale = getAppStore().getState()?.appContext?.locale
      let scaleRegion: __esri.ScaleRangeSliderProperties['region'] = 'US'
      if (locale) {
        // e.g. en-us
        const splits = locale.split('-')
        if (splits?.length > 0) {
          const lastSplit = splits[splits.length - 1]
          if (lastSplit) {
            const region = lastSplit.toUpperCase()
            const validRegions = [
              'AE', 'AR', 'AT', 'AU', 'BE', 'BG', 'BO', 'BR', 'CA', 'CH', 'CI', 'CL', 'CN', 'CO', 'CR', 'CZ', 'DE',
              'DK', 'EE', 'EG', 'ES', 'FI', 'FR', 'GB', 'GL', 'GR', 'GT', 'HK', 'ID', 'IE', 'IL', 'IN', 'IQ', 'IS', 'IT',
              'JP', 'KE', 'KR', 'KW', 'LI', 'LT', 'LU', 'LV', 'MA', 'MG', 'ML', 'MO', 'MX', 'MY', 'NI', 'NL', 'NO', 'NZ',
              'PE', 'PL', 'PR', 'PT', 'RO', 'RU', 'RW', 'SE', 'SG', 'SK', 'SR', 'SV', 'TH', 'TN', 'TW', 'US', 'VE', 'VI', 'ZA'
            ]
            if (validRegions.includes(region)) {
              scaleRegion = region as any
            }
          }
        }
      }

      const SliderClass = scaleRangeSliderClass
      const scaleRangeSlider = new SliderClass({
        view: widget.jmvFromMap.view,
        layer: listItem.layer as __esri.Layer,
        region: scaleRegion,
        container: sliderRef.current
      });
      setScaleRangeSlider(scaleRangeSlider)
      scaleRangeSlider.watch(["minScale", "maxScale"], function (value, oldValue, field) {
        listItem.layer[field] = value;
      });
    }
  }, [listItem.layer, scaleRangeSlider, scaleRangeSliderClass, widget.jmvFromMap.view])

  const onHeaderClose = useCallback(() => {
    setIsOpen(false)
    widget.setState({ nativeActionPopper: null })
  }, [widget])

  return (
    <FloatingPanel
      toggle={(event, type) => { type !== 'clickOutside' && onHeaderClose() }}
      headerTitle={widget.translate('visibilityRange')}
      reference={widget.optionBtnRef.current}
      open={isOpen}
      className='visibility-range-panel'
      autoSize
      onHeaderClose={onHeaderClose}
      css={getStyle()}
    >
      <div className='visibility-range-container'>
        <span title={listItem.layer.title} className='visibility-range-panel-title'>{listItem.layer.title}</span>
        <div className='scale-range-slider-container'>
          <div ref={sliderRef} className='scale-range-slider'></div>
        </div>
      </div>
    </FloatingPanel>
  )
}
