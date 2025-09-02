// import {MessageManager, ExtentChangeMessage, MessageType} from 'jimu-core';
import Action from './action'
import type { Widget } from '../widget'

export default class Leabel extends Action {
  titleShow: string
  titleHide: string

  constructor (widget: Widget, titleShow: string, titleHide: string) {
    super()
    this.id = 'label'
    this.className = 'esri-icon-labels label-action-title'
    this.group = 0
    this.widget = widget
    this.titleShow = titleShow
    this.titleHide = titleHide
  }

  isValid = (layerItem, isTableList): boolean => {
    if (isTableList) {
      return false
    }
    if (typeof layerItem.layer.id === 'string' && layerItem.layer.id.startsWith('jimu-draw')) {
      return false
    }
    this.title = layerItem.layer.labelsVisible ? this.titleHide : this.titleShow
    if (!this.useMapWidget() || !this.widget.props.config.label || !layerItem?.layer?.labelingInfo) {
      return false
    } else {
      return true
    }
  }

  execute = (layerItem): void => {
    layerItem.layer.labelsVisible = !layerItem.layer.labelsVisible
  }
}
