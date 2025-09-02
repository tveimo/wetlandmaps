/** @jsx jsx */
import { MapViewManager } from 'jimu-arcgis'
import { css, hooks, type IMThemeVariables, jsx, lodash, React } from 'jimu-core'
import { FilterOutlined } from 'jimu-icons/outlined/editor/filter'
import { SelectOptionOutlined } from 'jimu-icons/outlined/editor/select-option'
import { Button, Dropdown, DropdownButton, DropdownItem, DropdownMenu, TextInput, Tooltip } from 'jimu-ui'
import message from '../translations/default'

interface MapLayersHeaderProps {
    theme: IMThemeVariables
    jimuMapViewId: string
    layerListRef: React.MutableRefObject<__esri.LayerList>
    tableListRef: React.MutableRefObject<__esri.TableList>
    enableSearch: boolean
    enableBatchOption: boolean
    isMapWidgetMode: boolean
}

const getStyle = (theme: IMThemeVariables) => {
    return css`
    background-color: ${theme.sys.color.surface.paper};
    .map-layers-header-title{
      span {
        font-size: 16px;
        font-weight: 500;
      }
    }
  `
}

const { useState, useCallback, useEffect } = React

const onFilterListItem = (searchContent) => {
    return (item) => {
        // If there's no item, always return true
        if (!item) {
            return true
        }
        // If search content is empty or undefined, show all items
        if (!searchContent || searchContent.trim() === '') {
            return true
        }
        // Otherwise, filter based on the layer title
        return item.layer.title.toLowerCase().includes(searchContent.toLowerCase())
    }
}


export default function MapLayersHeader(props: MapLayersHeaderProps) {
    const { theme, jimuMapViewId, layerListRef, tableListRef, enableSearch, enableBatchOption, isMapWidgetMode } = props

    const translate = hooks.useTranslation(message)

    const [isSearchOpen, setIsSearchOpen] = useState(true)
    const [searchInput, setSearchInput] = useState('')

    const onSearchBtnClick = () => {
        setIsSearchOpen(!isSearchOpen)
    }

    const onSearchInputChange = lodash.throttle((event) => {
        const inputStr = event.target.value
        setSearchInput(inputStr)

        // Ensure filter is reset when text is cleared
        if (!inputStr || inputStr.trim() === '') {
            if (layerListRef.current) {
                layerListRef.current.filterPredicate = onFilterListItem('')
            }
            if (tableListRef.current) {
                tableListRef.current.filterPredicate = onFilterListItem('')
            }
        }
    }, 200)

    const onTurnAllLayersClickGenerator = useCallback((visible: boolean) => {
        return () => {
            function toggleVisible(jimuLayerViews, visible) {
                for (const layerView of jimuLayerViews) {
                    const layer = layerView.layer
                    layer.visible = visible
                }
            }
            const jimuMapView = MapViewManager.getInstance().getJimuMapViewById(jimuMapViewId)
            toggleVisible(jimuMapView.getAllJimuLayerViews(), visible)
        }
    }, [jimuMapViewId])

    const onExpandAllLayersClickGenerator = useCallback((expand: boolean) => {
        return () => {
            function toggleExpand(items, expand) {
                if (!items) {
                    return
                }
                for (const item of items) {
                    item.open = expand
                    if (item.children) {
                        toggleExpand(item.children, expand)
                    }
                }
            }
            toggleExpand(layerListRef.current.operationalItems, expand)
        }
    }, [layerListRef])

    useEffect(() => {
        layerListRef.current && (layerListRef.current.filterPredicate = onFilterListItem(searchInput))
        tableListRef.current && (tableListRef.current.filterPredicate = onFilterListItem(searchInput))
    }, [layerListRef, searchInput, tableListRef])

    if (!enableBatchOption && !enableSearch) {
        return null
    }

    return (
        <div className='map-layers-header d-flex justify-content-between p-1' css={getStyle(theme)}>
            {
                isSearchOpen ?
                    <TextInput
                        className='w-100 mr-1'
                        type='text'
                        onChange={onSearchInputChange}
                        allowClear
                        placeholder='Filter Layers'></TextInput> :
                    <div className='map-layers-header-title d-flex align-items-center'>
                        <span className='ml-2'>{translate('layers')}</span>
                    </div>
            }
            <div className='map-layers-header-icons d-flex'>
                {(enableBatchOption && !isSearchOpen) &&
                    <Dropdown className='map-layers-batch-action-dropdown' aria-label={translate("batchOptions")}>
                        <Tooltip role='tooltip' title={translate("batchOptions")} enterDelay={1000} enterNextDelay={1000} placement='top'>
                            <DropdownButton icon arrow={false} variant='text'>
                                <SelectOptionOutlined></SelectOptionOutlined>
                            </DropdownButton>
                        </Tooltip>
                        <DropdownMenu>
                            {
                                isMapWidgetMode && (
                                    <React.Fragment>
                                        <DropdownItem onClick={onTurnAllLayersClickGenerator(true)}>{translate('turnOnAllLayers')}</DropdownItem>
                                        <DropdownItem onClick={onTurnAllLayersClickGenerator(false)}>{translate('turnOffAllLayers')}</DropdownItem>
                                        <DropdownItem divider></DropdownItem>
                                    </React.Fragment>
                                )
                            }
                            <DropdownItem onClick={onExpandAllLayersClickGenerator(true)}>{translate('expandAllLayers')}</DropdownItem>
                            <DropdownItem onClick={onExpandAllLayersClickGenerator(false)}>{translate('collapseAllLayers')}</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                }
                {
                    enableSearch &&
                    <Tooltip role='tooltip' title="Filter Layers" enterDelay={1000} enterNextDelay={1000} placement='top'>
                        <Button variant='text' className='map-layers-search-btn' icon onClick={onSearchBtnClick} aria-label="Filter Layers">
                            <FilterOutlined></FilterOutlined>
                        </Button>
                    </Tooltip>
                }
            </div>
        </div>
    )
}