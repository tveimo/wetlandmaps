/** @jsx jsx */
import { AppMode, React, jsx, type AllWidgetProps, DataSourceComponent, MutableStoreManager, isKeyboardMode, focusElementInKeyboardMode, type MapDataSource, DataSourceTypes, type IMState, ExBAddedJSAPIProperties } from 'jimu-core'
import {
  loadArcGISJSAPIModules,
  JimuMapViewComponent,
  type JimuMapView,
  MapViewManager
} from 'jimu-arcgis'
import { WidgetPlaceholder, Popper, defaultMessages as jimuDefaultMessages, Loading, getFocusableElements } from 'jimu-ui'
import type { IMConfig } from '../config'
import { getStyle } from './lib/style'
import type Action from './actions/action'
import defaultMessages from './translations/default'
import layerListIcon from '../../icon.svg'
import { versionManager } from '../version-manager'
import type { ReactNode } from 'react'
import MapLayersActionList from './components/map-layers-action-list'
import { TableOutlined } from 'jimu-icons/outlined/data/table'
import { getLayerListActions } from './actions'
import MapLayersHeader from './components/map-layers-header'

const allDefaultMessages = Object.assign({}, defaultMessages, jimuDefaultMessages)

export enum LoadStatus {
  Pending = 'Pending',
  Fulfilled = 'Fulfilled',
  Rejected = 'Rejected',
}

export interface WidgetProps extends AllWidgetProps<IMConfig> { }

export interface WidgetState {
  mapWidgetId: string
  jimuMapViewId: string
  mapDataSourceId: string
  listLoadStatus: LoadStatus
  tableLoadStatus: LoadStatus
  isActionListPopperOpen: boolean
  actionListDOM: ReactNode
  nativeActionPopper: React.JSX.Element
}

interface ExtraProps {
  isDesignMode: boolean
}

export class Widget extends React.PureComponent<WidgetProps & ExtraProps, WidgetState> {
  public viewFromMapWidget: __esri.MapView | __esri.SceneView
  // This is used by the popup action
  public jmvFromMap: JimuMapView
  private dataSource: MapDataSource
  private mapView: __esri.MapView
  private sceneView: __esri.SceneView
  private MapView: typeof __esri.MapView
  private SceneView: typeof __esri.SceneView
  private LayerList: typeof __esri.LayerList
  private TableList: typeof __esri.TableList
  private readonly layerListActions: Action[]
  private renderPromise: Promise<void>
  private currentUseMapWidgetId: string
  private currentUseDataSourceId: string
  private jimuMapView: JimuMapView

  static mapExtraStateProps = (state: IMState, props: AllWidgetProps<IMConfig>): ExtraProps => {
    return {
      isDesignMode: state.appRuntimeInfo.appMode === AppMode.Design
    }
  }

  static versionManager = versionManager

  mapContainerRef: React.RefObject<HTMLDivElement>
  layerListContainerRef: React.RefObject<HTMLDivElement>
  tableListContainerRef: React.RefObject<HTMLDivElement>
  optionBtnRef: React.MutableRefObject<HTMLElement | null>
  layerListRef: React.MutableRefObject<__esri.LayerList | null>
  tableListRef: React.MutableRefObject<__esri.TableList | null>

  constructor(props) {
    super(props)
    this.state = {
      mapWidgetId: null,
      mapDataSourceId: null,
      jimuMapViewId: null,
      listLoadStatus: LoadStatus.Pending,
      isActionListPopperOpen: false,
      actionListDOM: null,
      tableLoadStatus: LoadStatus.Pending,
      nativeActionPopper: null,
    }
    this.renderPromise = Promise.resolve()
    this.layerListActions = getLayerListActions(this)
    this.mapContainerRef = React.createRef()
    this.layerListContainerRef = React.createRef()
    this.tableListContainerRef = React.createRef()
    this.optionBtnRef = React.createRef()
    this.layerListRef = React.createRef()
    this.tableListRef = React.createRef()
  }

  public translate = (stringId: string) => {
    return this.props.intl.formatMessage({
      id: stringId,
      defaultMessage: allDefaultMessages[stringId]
    })
  }

  componentDidMount() {
    this.bindClickHandler()
  }

  componentDidUpdate(prevProps: WidgetProps & ExtraProps, prevState: WidgetState) {
    if (this.props.isDesignMode && this.props.isDesignMode !== prevProps.isDesignMode) {
      // Clean up the native popper when switch to the design mode
      this.setState({ nativeActionPopper: null })
    }

    if (this.needToPreventRefreshList(prevProps, prevState)) {
      return
    }

    // Close the popper when dataAction toggled OR config changed
    // This could keep the action list's state to the latest
    if (this.props.enableDataAction !== prevProps.enableDataAction || this.props.config !== prevProps.config) {
      this.optionBtnRef.current = null
      this.setState({ isActionListPopperOpen: false })
    }

    this.bindClickHandler()

    if (this.props.config?.showTables !== prevProps.config?.showTables) {
      this.renderTableList()
      return
    }

    if ((this.props.config.useMapWidget && this.state.mapWidgetId === this.currentUseMapWidgetId) ||
      (!this.props.config.useMapWidget && this.state.mapDataSourceId === this.currentUseDataSourceId)) {
      this.syncRenderer(this.renderPromise)
    }
    if (!this.props.config.popup && prevProps.config.popup) {
      this.restoreLayerPopupField()
    }
  }

  restoreLayerPopupField() {
    const popupValue = MutableStoreManager.getInstance().getStateValue([this.props.widgetId, 'popup']) || {}
    for (const entry of Object.values(popupValue)) {
      (entry as any).layer.popupEnabled = (entry as any).initialValue
    }
    if (popupValue) {
      MutableStoreManager.getInstance().updateStateValue(this.props.widgetId, 'popup', null)
    }
  }

  bindClickHandler() {
    const bindHelper = (refNode: HTMLElement) => {
      if (refNode && !refNode.onclick) {
        refNode.onclick = (e) => {
          const target = e.target as HTMLElement
          // Only manipulate the fake action
          if (target.nodeName === 'CALCITE-ACTION' && target.title === this.translate('options')) {
            if (this.optionBtnRef.current !== target) {
              this.optionBtnRef.current = target
              // The popper here is kept mounted, this results in re-render the popper's content
              // instead of creating a new popper component, which causes overlap problem.
              // Give the popper a random key so it will force the popper to re-calculate the position again.
              this.setState({ isActionListPopperOpen: true, nativeActionPopper: null })
            } else {
              this.setState({ isActionListPopperOpen: !this.state.isActionListPopperOpen, nativeActionPopper: null })
            }
          }
        }
      }
    }

    bindHelper(this.layerListContainerRef.current)
    bindHelper(this.tableListContainerRef.current)
  }

  needToPreventRefreshList(prevProps: WidgetProps & ExtraProps, prevState: WidgetState) {
    if (prevState.isActionListPopperOpen !== this.state.isActionListPopperOpen || prevState.nativeActionPopper !== this.state.nativeActionPopper || prevState.listLoadStatus !== this.state.listLoadStatus || prevState.tableLoadStatus !== this.state.tableLoadStatus) {
      return true
    }
    if (prevState.actionListDOM !== this.state.actionListDOM) {
      return true
    }
    if (prevState.tableLoadStatus !== this.state.tableLoadStatus) {
      return true
    }
    if (this.props.isDesignMode !== prevProps.isDesignMode) {
      return true
    }
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  async createView(): Promise<__esri.MapView | __esri.SceneView | unknown> {
    if (this.props.config.useMapWidget) {
      return this.viewFromMapWidget
    } else {
      return await this.createViewByDataSource()
    }
  }

  async createViewByDataSource() {
    await this.loadViewModules(this.dataSource)

    if (this.dataSource.type === DataSourceTypes.WebMap) {
      return await new Promise((resolve, reject) => { this.createWebMapView(this.MapView, resolve, reject) })
    } else if (this.dataSource.type === DataSourceTypes.WebScene) {
      return new Promise((resolve, reject) => { this.createSceneView(this.SceneView, resolve, reject) })
    } else {
      return Promise.reject(new Error(null))
    }
  }

  createWebMapView(MapView, resolve, reject) {
    if (this.mapView) {
      this.mapView.map = this.dataSource.map
    } else {
      const mapViewOption: __esri.MapViewProperties = {
        map: this.dataSource.map,
        container: this.mapContainerRef.current
      }
      this.mapView = new MapView(mapViewOption)
    }
    this.mapView.when(
      () => {
        resolve(this.mapView)
      },
      (error) => reject(error)
    )
  }

  createSceneView(SceneView, resolve, reject) {
    if (this.sceneView) {
      this.sceneView.map = this.dataSource.map
    } else {
      const mapViewOption: __esri.SceneViewProperties = {
        map: this.dataSource.map,
        container: this.mapContainerRef.current
      }
      this.sceneView = new SceneView(mapViewOption)
    }

    this.sceneView.when(
      () => {
        resolve(this.sceneView)
      },
      (error) => reject(error)
    )
  }

  destroyView() {
    this.mapView && !this.mapView.destroyed && this.mapView.destroy()
    this.sceneView && !this.sceneView.destroyed && this.sceneView.destroy()
  }

  async getModule(moduleName: string, getter: any, setter: any) {
    const currentValue = getter()
    if (currentValue) {
      return currentValue
    }
    const module = await loadArcGISJSAPIModules([moduleName])
    setter(module[0])
    return module[0]
  }

  async loadViewModules(dataSource: MapDataSource): Promise<typeof __esri.MapView | typeof __esri.SceneView> {
    let ret = null
    if (dataSource.type === DataSourceTypes.WebMap) {
      ret = await this.getModule('esri/views/MapView', () => this.MapView, (value) => { this.MapView = value })
    } else if (dataSource.type === DataSourceTypes.WebScene) {
      ret = await this.getModule('esri/views/SceneView', () => this.SceneView, (value) => { this.SceneView = value })
    }
    return ret
  }

  destroyTableList() {
    this.tableListRef.current && !this.tableListRef.current.destroyed && this.tableListRef.current.destroy()
  }

  destroyLayerList() {
    this.layerListRef.current && !this.layerListRef.current.destroyed && this.layerListRef.current.destroy()
  }

  async createTableList(view: __esri.MapView | __esri.SceneView) {
    this.setState({ tableLoadStatus: LoadStatus.Pending })
    await this.getModule('esri/widgets/TableList', () => this.TableList, (value) => { this.TableList = value })

    const container = document && document.createElement('div')
    container.className = 'table-list'
    this.tableListContainerRef.current.appendChild(container)

    this.destroyTableList()

    this.tableListRef.current = new this.TableList({
      container: container,
      map: view.map,
      dragEnabled: this.props.config?.reorderLayers,
      listItemCreatedFunction: this.defineLayerListActionsGenerator(true)
    })

    this.tableListRef.current.on('trigger-action', (event) => {
      this.onLayerListActionsTriggered(event, true)
    })

    return this.tableListRef.current
  }

  async createLayerList(view: __esri.MapView | __esri.SceneView) {
    this.setState({ listLoadStatus: LoadStatus.Pending })
    if (!this.LayerList) {
      const modules = await loadArcGISJSAPIModules([
        'esri/widgets/LayerList'
      ])
      this.LayerList = modules[0]
    }

    const container = document && document.createElement('div')
    container.className = 'jimu-widget'
    this.layerListContainerRef.current.appendChild(container)

    this.destroyLayerList()

    let option: __esri.LayerListProperties = {
      view: view,
      listItemCreatedFunction: this.defineLayerListActionsGenerator(false),
      container: container
    }
    if (this.props.config.useMapWidget) {
      option = {
        ...option,
        dragEnabled: this.props.config?.reorderLayers ?? false,
        visibilityAppearance: this.props.config?.useTickBoxes ? 'checkbox' : 'default',
      }
    }

    const layerList = new this.LayerList(option)

    layerList.on('trigger-action', (event) => {
      this.onLayerListActionsTriggered(event)
    })

    layerList.when(() => {
      if (this.props.config.expandAllLayers) {
        this.toggleExpand(layerList.operationalItems, true)
      }

      // Set up visibility watchers after the layer list is ready
      this.setLayerVisibilityWatchers(layerList);
    })

    this.layerListRef.current = layerList
  }

  // New function to set up watchers for layer visibility changes
  setLayerVisibilityWatchers(layerList: __esri.LayerList) {
    if (!layerList || !layerList.operationalItems) return;

    this.watchLayerItemsVisibility(layerList.operationalItems);
  }

  // New recursive function to watch all items including nested ones
  watchLayerItemsVisibility(items: __esri.Collection<__esri.ListItem>, isTopLevel: boolean = true) {
    if (!items) return;

    items.forEach(item => {
      // Set top-level group layers to always be expanded
      if (isTopLevel && item.children && item.children.length > 0) {
        item.open = true;
      }

      // Watch for visibility changes (only for non-top level group layers)
      if (item.layer) {
        item.layer.watch('visible', (visible) => {
          // Only modify open state for items that have children (group layers)
          // and are not top-level group layers
          if (item.children && item.children.length > 0 && !isTopLevel) {
            // Expand when turned on, collapse when turned off
            item.open = visible;
          }
          // ensure parent layers are visible
          if (item.visible && !isTopLevel) {
            let parent = item.parent;
            while (parent != null) {
              try {
                if (!parent.visible) {
                  parent.visible = true;
                }
                if (parent.parent) {
                  parent = parent.parent;
                } else {
                  parent = null;
                }
              } catch (ex) {
                console.error("unable to toggle parent visibility; ", ex)
                break;
              }
            }
          }
        });
      }

      // Recursively watch children (with isTopLevel=false for the next level)
      if (item.children) {
        this.watchLayerItemsVisibility(item.children, false);
      }
    });
  }

  defineLayerListActionsGenerator = (isTableList = false) => {
    return async (event) => {
      const listItem = event.item
      let actionGroups = {}
      listItem.actionsSections = []

      if (!isTableList && this.props.config?.useMapWidget && this.props.config?.enableLegend && listItem.layer.legendEnabled) {
        if (typeof listItem.layer?.id !== 'string' || !listItem.layer.id.startsWith('jimu-draw')) {
          listItem.panel = {
            content: 'legend',
            open: listItem.layer.visible && this.props.config?.showAllLegend
          }
        }
      }

      // After this block, all native actions AND option-action are stored in the actionGroups
      this.layerListActions.forEach((actionObj) => {
        if (actionObj.isValid(listItem, isTableList)) {
          let actionGroup = actionGroups[actionObj.group]
          if (!actionGroup) {
            actionGroup = []
            actionGroups[actionObj.group] = actionGroup
          }

          actionGroup.push({
            id: actionObj.id,
            title: actionObj.title,
            className: actionObj.className
          })
        }
      })

      // When disable data-action, stay untouched
      // Otherwise, show up the custom popper
      const dataActionEnabled = this.props.enableDataAction ?? true
      const OPTION_ACTION_INDEX = 100
      const TRANSPARENCY_ACTION_INDEX = 1
      const RANGE_ACTION_INDEX = 7

      // Extract the option-action for the minus 1
      const nativeActionCount = Object.keys(actionGroups).length - 1

      // Delete the fake option when: data-action disabled & Less than 1 native action & it's not transparency action
      // Otherwise, we go the fake option action way
      if (!dataActionEnabled && nativeActionCount <= 1 && !actionGroups[TRANSPARENCY_ACTION_INDEX] && !actionGroups[RANGE_ACTION_INDEX]) {
        delete actionGroups[OPTION_ACTION_INDEX]
      } else {
        actionGroups = { OPTION_ACTION_INDEX: actionGroups[OPTION_ACTION_INDEX] }
      }

      const customizeLayerOptions = this.props?.config?.customizeLayerOptions?.[this.state.jimuMapViewId]
      if (customizeLayerOptions && customizeLayerOptions.isEnabled) {
        const hiddenLayerSet = new Set(customizeLayerOptions?.hiddenJimuLayerViewIds)
        const showLayerSet = new Set(customizeLayerOptions?.showJimuLayerViewIds)
        const currentJimuLayerViewId = this.jimuMapView.getJimuLayerViewIdByAPILayer(listItem.layer)
        if (hiddenLayerSet.has(currentJimuLayerViewId)) {
          listItem.hidden = true
        }

        if (customizeLayerOptions?.showJimuLayerViewIds) {
          listItem.hidden = !showLayerSet.has(currentJimuLayerViewId)
        }

        if (this.isLayerFromRuntime(listItem.layer)) {
          listItem.hidden = !(customizeLayerOptions?.showRuntimeAddedLayers ?? true)
        }

        if (this.isSpecialLayer(listItem.layer)) {
          listItem.hidden = false
        }
      }

      Object.entries(actionGroups)
        .sort((v1, v2) => Number(v1[0]) - Number(v2[0]))
        .forEach(([key, value]) => {
          listItem.actionsSections.push(value)
        })
    }
  }

  onActionListItemClick() {
    // Let the action popper find the reference DOM node
    setTimeout(() => {
      this.setState({ isActionListPopperOpen: false })
    }, 100)
  }

  onLayerListActionsTriggered = (event, isTableList = false) => {
    const action = event.action
    const listItem = event.item
    const actionObj = this.layerListActions.find(
      (actionObj) => actionObj.id === action.id
    )

    if (actionObj.id === 'option-action') {
      // Popup the window when click option-action
      const supportedActionObjects = this.layerListActions.filter((actionObj) => {
        return actionObj.isValid(listItem, isTableList) && actionObj.id !== 'option-action'
      })

      const shouldHideEmptyList = supportedActionObjects.length > 0
      const enableDataAction = this.props.enableDataAction ?? true

      // Create data action list in the next macro task so the optionBtnRef is the latest
      setTimeout(() => {
        const mapLayersDsActionList = <MapLayersActionList
          widgetId={this.props.id}
          jimuMapView={this.jimuMapView}
          mapDataSource={this.dataSource}
          actionObjects={supportedActionObjects}
          listItem={listItem} onActionListItemClick={() => { this.onActionListItemClick() }}
          enableDataAction={enableDataAction}
          shouldHideEmptyList={shouldHideEmptyList}
          optionBtnRef={this.optionBtnRef}
        >
        </MapLayersActionList>

        this.setState({ actionListDOM: mapLayersDsActionList })
      }, 0)
    } else {
      // A native action
      const actionElement = actionObj.execute(listItem)
      if (actionElement) {
        this.setState({
          nativeActionPopper: actionElement
        })
      }
    }
  }

  async renderLayerList() {
    try {
      const view = await this.createView() as __esri.MapView | __esri.SceneView
      if (this.props.config?.showTables) {
        await this.renderTableList()
      }
      await this.createLayerList(view)
      this.setState({
        listLoadStatus: LoadStatus.Fulfilled
      })
    } catch (error) {
      console.error(error)
    }
  }

  async renderTableList() {
    try {
      const view = await this.createView() as __esri.MapView | __esri.SceneView
      if (this.props.config?.showTables) {
        await this.createTableList(view)
        this.setState({ tableLoadStatus: LoadStatus.Fulfilled })
      } else {
        this.destroyTableList()
      }
    } catch (error) {
      console.error(error)
    }
  }

  async syncRenderer(preRenderPromise) {
    this.jimuMapView = MapViewManager.getInstance().getJimuMapViewById(this.state.jimuMapViewId)

    // The datasource mode does not have a jimuMapView
    if (this.jimuMapView) {
      await this.jimuMapView.whenJimuMapViewLoaded()
    }
    await preRenderPromise

    this.renderPromise = this.renderLayerList()
  }

  onActiveViewChange = (jimuMapView: JimuMapView) => {
    const useMapWidget =
      this.props.useMapWidgetIds && this.props.useMapWidgetIds[0]
    if ((jimuMapView && jimuMapView.view) || !useMapWidget) {
      this.jmvFromMap = jimuMapView
      this.viewFromMapWidget = jimuMapView && jimuMapView.view
      this.setState({
        nativeActionPopper: null
      }, function afterPopperClose() {
        this.setState({
          mapWidgetId: useMapWidget,
          jimuMapViewId: jimuMapView.id,
        })
      })
    } else {
      this.destroyLayerList()
    }
  }

  onDataSourceCreated = (dataSource: MapDataSource): void => {
    this.dataSource = dataSource
    this.setState({
      mapDataSourceId: dataSource.id,
    })
  }

  isLayerFromRuntime = (layer): boolean => {
    if (this.isSpecialLayer(layer)) {
      return false
    }

    return layer[ExBAddedJSAPIProperties.EXB_LAYER_FROM_RUNTIME]
  }

  isSpecialLayer(layer: __esri.Layer): boolean {
    let parentLayer = layer.parent
    const layerTypes: string[] = [
      'esri.layers.WMSLayer',
      'esri.layers.WMTSLayer',
      'esri.layers.KMLLayer',
      'esri.layers.CatalogLayer'
    ]

    while (parentLayer) {
      if (layerTypes.includes(parentLayer.declaredClass)) {
        return true
      }
      parentLayer = (parentLayer as any).parent
    }

    return false
  }

  onToggleActionsPopper = () => {
    this.setState({ isActionListPopperOpen: false, actionListDOM: null })
    if (isKeyboardMode()) {
      const focusableElements: HTMLElement[] = getFocusableElements(this.optionBtnRef.current)
      focusElementInKeyboardMode(focusableElements[0])
    }
  }

  toggleExpand = (operationalItems: __esri.Collection<__esri.ListItem>, expand: boolean) => {
    for (const item of operationalItems) {
      item.open = expand
      if (item.children) {
        this.toggleExpand(item.children, expand)
      }
    }
  }

  render() {
    const useMapWidget = this.props.useMapWidgetIds && this.props.useMapWidgetIds[0]
    const useDataSource = this.props.useDataSources && this.props.useDataSources[0]

    this.currentUseMapWidgetId = useMapWidget
    this.currentUseDataSourceId = useDataSource && useDataSource.dataSourceId

    let dataSourceContent = null
    if (this.props.config.useMapWidget) {
      dataSourceContent = (
        <JimuMapViewComponent
          useMapWidgetId={this.props.useMapWidgetIds?.[0]}
          onActiveViewChange={this.onActiveViewChange}
        />
      )
    } else if (useDataSource) {
      dataSourceContent = (
        <DataSourceComponent
          useDataSource={useDataSource}
          onDataSourceCreated={this.onDataSourceCreated}
          onCreateDataSourceFailed={(err) => { console.error(err) }}
        />
      )
    }

    let content = null
    if (this.props.config.useMapWidget ? !useMapWidget : !useDataSource) {
      this.destroyLayerList()
      content = (
        <div className="widget-layerlist">
          <WidgetPlaceholder
            icon={layerListIcon}
            message={this.translate('_widgetLabel')}
            widgetId={this.props.id}
          />
        </div>
      )
    } else {
      let loadingContent = null
      if (this.state.listLoadStatus === LoadStatus.Pending) {
        loadingContent = <div className="jimu-secondary-loading" />
      }

      content = (
        <div className={`widget-layerlist widget-layerlist_${this.props.id}`}>
          {!loadingContent &&
            <MapLayersHeader
              theme={this.props.theme}
              jimuMapViewId={this.state.jimuMapViewId}
              layerListRef={this.layerListRef}
              tableListRef={this.tableListRef}
              enableSearch={this.props.config.searchLayers ?? false}
              enableBatchOption={this.props.config.layerBatchOptions ?? false}
              isMapWidgetMode={this.props.config?.useMapWidget}
            ></MapLayersHeader>
          }
          <div ref={this.layerListContainerRef} />
          {
            this.props.config.showTables && (
              <React.Fragment>
                {
                  (loadingContent === null && this.state.tableLoadStatus === LoadStatus.Fulfilled) &&
                  <div className='table-list-divider d-flex align-items-center'>
                    <TableOutlined></TableOutlined>
                    <span className='ml-1'>{this.translate('tables')}</span>
                  </div>
                }
                {
                  (loadingContent === null && this.state.tableLoadStatus === LoadStatus.Pending) && <Loading type='DOTS_PRIMARY'></Loading>
                }
                <div ref={this.tableListContainerRef} className='table-list-wrapper' />
              </React.Fragment>
            )
          }
          <div style={{ position: 'absolute', opacity: 0 }} ref={this.mapContainerRef}>
            mapContainer
          </div>
          <div style={{ position: 'absolute', display: 'none' }}>
            {dataSourceContent}
          </div>
        </div>
      )
    }

    return (
      <div
        css={getStyle(this.props.theme, this.props.config)}
        className="jimu-widget"
      >
        {content}
        {
          <Popper style={{ minWidth: '170px' }} keepMount reference={this.optionBtnRef.current} open={this.state.isActionListPopperOpen} toggle={this.onToggleActionsPopper}>
            {this.state.actionListDOM}
          </Popper>
        }
        {this.state.nativeActionPopper}
      </div>
    )
  }
}

export default Widget
