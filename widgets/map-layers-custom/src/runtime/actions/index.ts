import Goto from './goto'
import Label from './label'
import Transparency from './transparency'
import Information from './information'
import OptionAction from './option-action'
import Popup from './popup'
import VisibilityRange from './visibility-range'

export function getLayerListActions (widget) {
  const translate = widget.translate

  return [
    new Goto(
      widget,
      translate('goto')
    ),
    new Label(
      widget,
      translate('showLabels'),
      translate('hideLabels')
    ),
    new Transparency(
      widget,
      translate('transparency')
    ),
    new Information(
      widget,
      translate('information')
    ),
    new OptionAction(
      widget,
      translate('options')
    ),
    new Popup(
      widget,
      translate('enablePopup'),
      translate('disablePopup')
    ),
    new VisibilityRange(
      widget,
      translate('visibilityRange')
    ),
  ]
}
