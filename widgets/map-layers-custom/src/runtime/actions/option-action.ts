import Action from './action'
import type { Widget } from '../widget'

export default class OptionAction extends Action {
  constructor (widget: Widget, title: string) {
    super()
    this.id = 'option-action'
    this.title = title
    // This should be an ellipse, in calcite name
    this.className = 'esri-icon-handle-horizontal'
    this.group = 100
    this.widget = widget
  }

  isValid = (layerItem): boolean => {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  execute = (layerItem): void => {
  }
}
