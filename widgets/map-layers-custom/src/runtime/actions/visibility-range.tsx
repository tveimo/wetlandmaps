import { React } from 'jimu-core'
import Action from './action'
import type { Widget } from '../widget'
import VisibilityRangeSlider from '../components/visibility-range-slider'
import { RangeOutlined } from 'jimu-icons/outlined/application/range'

export default class VisibilityRange extends Action {
  private ScaleRangeSlider: typeof __esri.ScaleRangeSlider
  constructor(widget: Widget, title: string) {
    super()
    this.id = 'visibility-range'
    this.title = title
    this.className = 'esri-icon-sliders-horizontal'
    this.group = 7
    this.widget = widget
    this.ScaleRangeSlider = null
    this.icon = <RangeOutlined />
  }

  isValid = (layerItem, isTableList): boolean => {
    if (isTableList) {
      return false
    }
    if (this.useMapWidget() && this.widget.props.config.visibilityRange) {
      this.widget.getModule('esri/widgets/ScaleRangeSlider', () => this.ScaleRangeSlider, (value) => { this.ScaleRangeSlider = value })
      return true
    } else {
      return false
    }
  }

  execute = (layerItem) => {
    const element = <VisibilityRangeSlider widget={this.widget} listItem={layerItem} scaleRangeSliderClass={this.ScaleRangeSlider} />
    this.widget.setState({ nativeActionPopper: element })
  }
}
