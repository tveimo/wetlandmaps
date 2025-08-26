// this code has been modelled from ESRI's default Add Data widget
// it has been customised to add the data to the map immeidately instead of adding it to the data store and awaiting a user-triggered data action


import { React, jsx, css, type DataSourceJson, type URIScheme, dataSourceUtils, esri, requestUtils, DataSourceTypes, ServiceManager, type ServiceDefinition, SupportedLayerServiceTypes, classNames, defaultMessages as jimuCoreMessages, hooks } from 'jimu-core'
import { Button, defaultMessages as jimuUIMessages, Dropdown, DropdownButton, DropdownMenu, DropdownItem, UrlInput, type ValidityResult, type UrlInputResult, Loading, LoadingType } from 'jimu-ui'
// Only used as type.
import { type IItem } from '@esri/arcgis-rest-types'

import defaultMessages from '../translations/default'
import { type DataOptions } from '../types'
import { getDsJsonFromSingleLayerServiceDefinition, getNextAddedDataId } from '../utils/utils'
const dataSourceJsonCreator = dataSourceUtils.dataSourceJsonCreator;
import AlertMessage from './alert-message'; // custom component for handling Alert error messages
import '../css/style.css' // custom css styling

type AddURLDataProps = {
  portalUrl: string;
  widgetID: string;
  onAddURL: (multiDataOptions: DataOptions[]) => void; 
}

// value is translate key
enum UrlError {
  NotSupportedType = 'addDataErrorNotSupported',
  FailedToFetch = 'invalidResourceItem',
  CannotBeAdded = 'cannotBeAddedError'
}

const { useState, useMemo, useRef, useEffect } = React

// value is translate key
enum SupportedUrlTypes {
  ArcGISWebService = 'arcgisUrl',
  WMS = 'wmsUrl',
  WMTS = 'wmtsUrl',
  WFS = 'wfsUrl',
  KML = 'kmlUrl',
  CSV = 'csvUrl',
  GeoJSON = 'geojsonUrl'
}

const SampleURL: { [key in SupportedUrlTypes]: string } = {
  [SupportedUrlTypes.ArcGISWebService]: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0',
  [SupportedUrlTypes.WMS]: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?service=WMS&request=GetCapabilities',
  [SupportedUrlTypes.WMTS]: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/45134/%7Blevel%7D/%7Brow%7D/%7Bcol%7D',
  [SupportedUrlTypes.WFS]: 'https://dservices.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/services/JapanPrefectures2018/WFSServer',
  [SupportedUrlTypes.KML]: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month_age_animated.kml',
  [SupportedUrlTypes.CSV]: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.csv',
  [SupportedUrlTypes.GeoJSON]: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
}

const SupportedSchemes: URIScheme[] = ['https']

export const AddURLData = (props: AddURLDataProps) => {
  const { portalUrl, widgetID, onAddURL } = props
  const translate = hooks.useTranslation(jimuCoreMessages, jimuUIMessages, defaultMessages)
  const [selectedUrlType, setSelectedUrlType] = useState<SupportedUrlTypes>(SupportedUrlTypes.ArcGISWebService)
  const [urlResult, setUrlResult] = useState<UrlInputResult>({ value: '', valid: true })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const addingDsJson = useRef<DataSourceJson>(null)
  const [dataOptionsFromURL, setDataOptionsFromURL] = useState<DataOptions[]>([]);
  const nextOrder = useMemo(() => dataOptionsFromURL.length > 0 ? Math.max(...dataOptionsFromURL.map(d => d.order)) + 1 : 0, [dataOptionsFromURL]);
  const [processUploadedData, setProcessUploadedData] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>(null);
  const [showAlertURLFail, setShowAlertURLFail] = useState(false);
  const [isOKButtonDisabled, setIsOKButtonDisabled] = useState(false);
  
  const dropdownItems = useMemo(() => {
    const items = {} as { [key in SupportedUrlTypes]: string }
    Object.values(SupportedUrlTypes).forEach(key => {
      items[key] = translate(key)
    })
    return items
  }, [translate])

  const onDropdownItemClick = e => {
    if (e.target.value !== selectedUrlType) {
      setSelectedUrlType(e.target.value)
      setUrlResult({ value: '', valid: urlResult.valid })
    }
  }

  const checkUrl = (url: string): ValidityResult => {
    const valid = isUrlValid(url, selectedUrlType)
    return { valid, msg: !valid && translate('invalidUrlMessage') }
  }

  const onUrlChange = (result: UrlInputResult) => {
    setUrlResult(result)
  }

  const onClear = (e) => {
    setUrlResult({ value: '', valid: urlResult.valid })
  }

  // setDataOptionsFromURL using input URL
  const onAdd = async () => {
    const url = urlResult?.value
    if (!url) {
      return
    }

    try {
      setIsLoading(true)

      const dsJson = await getDsJsonFromUrl(getNextAddedDataId(widgetID, nextOrder), url, selectedUrlType)
      addingDsJson.current = dsJson
      /**
       * Do not allow to add a group layer by URL.
       * Since we can not create a proper JS API layer and add the layer to map without the map service layer.
       */
      if (dsJson.type === DataSourceTypes.GroupLayer) {
        throw new Error(UrlError.CannotBeAdded)
      }
      if (dsJson) {
        const newDataOptions: DataOptions[] = [
          {
            dataSourceJson: dsJson,
            order: nextOrder
          }
        ]
        setDataOptionsFromURL(newDataOptions)
        //onChange(multiDataOptions.concat({ dataSourceJson: dsJson, order: nextOrder }))
      }
    } catch (err) {
      // Show warning.
      if (err.message === UrlError.NotSupportedType) {
        setErrorMsg(translate(UrlError.NotSupportedType))
      } else if (err.message === UrlError.CannotBeAdded) {
        setErrorMsg(translate(UrlError.CannotBeAdded, { layerName: addingDsJson.current?.sourceLabel }))
      } else {
        setErrorMsg(translate(UrlError.FailedToFetch))
      }
    } finally {
      setProcessUploadedData(true)
      addingDsJson.current = null
      setIsLoading(false)
    }
  }

  // send file data to parent component for processing when user has uploaded data (that contains features)
  useEffect(() => {
    if (processUploadedData && dataOptionsFromURL.length > 0) {
      props.onAddURL(dataOptionsFromURL)
      // once successfully sent data for processing, clear local states
      setDataOptionsFromURL([])
      setProcessUploadedData(false)
    }
  }, [processUploadedData, dataOptionsFromURL])

  // when error message has been set, show alert and disable uploads
  useEffect(() => {
    console.log('errMsg changed')
    console.log(errorMsg)
    if (errorMsg && errorMsg.length > 0) {
      setShowAlertURLFail(true);
      setIsOKButtonDisabled(true);
    }
  }, [errorMsg])

  // to hide an alert after it's displayed
  const handleCloseAlert = () => {
    setErrorMsg(null);
    setShowAlertURLFail(false);
    setIsOKButtonDisabled(false);
  };

  return <div className='data-url-input w-100 h-100 p-4' css={style}>
    <div>
      <div className='url-input-label'>
        {translate('urlType')}
      </div>
      <Dropdown className='w-100'>
        <DropdownButton size='sm' className='text-left' aria-label={translate('urlType')}>
          {dropdownItems[selectedUrlType]}
        </DropdownButton>
        <DropdownMenu>
          {
            Object.keys(dropdownItems).map((id, index) => {
              return <DropdownItem key={index} value={id} onClick={onDropdownItemClick}>{dropdownItems[id]}</DropdownItem>
            })
          }
        </DropdownMenu>
      </Dropdown>
    </div>

    <div className='mt-4'>
      <div className='url-input-label'>
        {translate('url')}
      </div>
      <UrlInput className={classNames({ 'with-error': !urlResult.valid })} height={80} schemes={SupportedSchemes} value={urlResult.value} checkValidityOnChange={checkUrl} checkValidityOnAccept={checkUrl} onChange={onUrlChange} aria-label={translate('url')} />
    </div>

    <div className='mt-4'>
      <Button onClick={onAdd} type='primary' disabled={!urlResult.value || !urlResult.valid || isOKButtonDisabled} className='px-4 w-55' title='OK' aria-label='OK'>
        OK
      </Button>
      <span className='padding-left'>
        <Button onClick={onClear} type='secondary' disabled={!urlResult.value} className='px-4 w-45' title='Clear' aria-label='Clear'>
          Clear
        </Button>
      </span>
    </div>

    <div className='mt-4'>
      <div className='url-input-label mb-1'>
        {translate('sampleUrl')}
      </div>
      <div className='sample-url'>
        {SampleURL[selectedUrlType]}
      </div>
    </div>

    {showAlertURLFail && ( 
        <div className='padding-all'>
          <AlertMessage responseType="dataUploadFailed" onClose={handleCloseAlert} textMessage={errorMsg}/>
        </div>) 
        }

    {
      isLoading &&
      <div className='upload-loading-container'>
        <div className='upload-loading-content'>
          <Loading className='upload-loading' type={LoadingType.Primary} width={30} height={28} />
        </div>
      </div>
    }
  </div>
}

function isUrlValid (url: string, urlType: SupportedUrlTypes): boolean {
  if (!url || !urlType) {
    // Do not show error message
    return true
  }
  // If the service is not provided by AGOL or portal, we won't check the url since the service url doesn't have a specific format.
  if (urlType !== SupportedUrlTypes.ArcGISWebService) {
    return /^https:\/\//.test(url)
  } else {
    return dataSourceUtils.isSupportedArcGISService(url) || isSupportedVectorTileStyleJson(url)
  }
}

/**
 * Vector tile service data source is from a vector tile service or a vector tile style json.
 * If is from a style json, the url format will be different. Need to check it separately.
 */
function isSupportedVectorTileStyleJson (url: string): boolean {
  if (!url || !/^https:\/\//.test(url)) {
    return false
  }
  // Item resources url, https://developers.arcgis.com/rest/users-groups-and-items/item-resources.htm .
  return /\/content\/items\/.+\/resources\/styles\/root.json/.test(url)
}

// Services which are not provided by AGOL or portal.
const NonArcGISServiceUrlTypeToDsType = {
  [SupportedUrlTypes.CSV]: DataSourceTypes.CSV,
  [SupportedUrlTypes.GeoJSON]: DataSourceTypes.GeoJSON,
  [SupportedUrlTypes.KML]: DataSourceTypes.KML,
  [SupportedUrlTypes.WFS]: DataSourceTypes.WFS,
  [SupportedUrlTypes.WMS]: DataSourceTypes.WMS,
  [SupportedUrlTypes.WMTS]: DataSourceTypes.WMTS
}

async function getDsJsonFromUrl (dsId: string, url: string, urlType: SupportedUrlTypes): Promise<DataSourceJson> {
  if (!url || !urlType) {
    return Promise.reject('Need URL.')
  }

  url = url.replace(/^http:/, 'https:')

  // If the service is not provided by AGOL or portal, we won't check the url.
  if (Object.keys(NonArcGISServiceUrlTypeToDsType).some(nonArcGISServiceUrlType => nonArcGISServiceUrlType === urlType)) {
    return {
      id: dsId,
      type: NonArcGISServiceUrlTypeToDsType[urlType],
      sourceLabel: url.split('?')[0].split('/').filter(c => !!c).reverse()[0],
      url
    }
  } else if (urlType === SupportedUrlTypes.ArcGISWebService) {
    url = url.split('?')[0]
    return isSupportedVectorTileStyleJson(url) ? getDsJsonFromVectorTileStyleJson(url, dsId) : getDsJsonFromArcGISService(url, dsId)
  }

  return Promise.reject(UrlError.NotSupportedType)
}

async function getDsJsonFromArcGISService (url: string, dsId: string): Promise<DataSourceJson> {
  if (!url || !dsId) {
    return Promise.reject(UrlError.NotSupportedType)
  }

  const serviceDefinition = await ServiceManager.getInstance().fetchServiceInfo(url).then(res => res.definition)

  /**
   * For feature service, if it is single layer but the url is not end up with layer id, we need to find the single layer and create a feature layer data source, not feature service data source.
   * This is to make single layer feature service item to support 'set filter' action and 'view in table' action.
   */
  if (dataSourceUtils.isSupportedWholeArcGISService(url) && dataSourceJsonCreator.getDataSourceTypeFromArcGISWholeServiceUrl(url) === DataSourceTypes.FeatureService) {
    const layers = (serviceDefinition?.layers || []).concat(serviceDefinition?.tables || [])
    // If the single layer is not feature layer or table, will still create feature service data source.
    if (layers.length === 1 && ((serviceDefinition?.layers?.length === 1 && serviceDefinition?.layers?.[0]?.type === SupportedLayerServiceTypes.FeatureLayer) || (serviceDefinition?.tables?.length === 1))) {
      const serviceUrl = url.split('?')[0].replace(/^http:/, 'https:').replace(/\/$/, '')
      return getDsJsonFromSingleLayerServiceDefinition(serviceUrl, serviceDefinition, dsId)
    }
  }

  return getSingleDsJsonFromArcGISServiceDefinition(dsId, url, serviceDefinition)
}

function getSingleDsJsonFromArcGISServiceDefinition (dsId: string, url: string, serviceDefinition: ServiceDefinition): DataSourceJson {
  const dsJson: DataSourceJson = dataSourceJsonCreator.createDataSourceJsonByLayerDefinition(dsId, serviceDefinition, url)?.asMutable({ deep: true })

  if (!dsJson) {
    throw new Error(UrlError.FailedToFetch)
  } else {
    return dsJson
  }
}

async function getDsJsonFromVectorTileStyleJson (url: string, dsId: string): Promise<DataSourceJson> {
  if (!url || !dsId) {
    return Promise.reject(UrlError.NotSupportedType)
  }

  const portalUrl = url.match(/(?<portalUrl>.+)content\/items\/.+\/resources\/styles\/root.json/).groups.portalUrl
  const itemId = url.match(/.+\/content\/items\/(?<itemId>.+)\/resources\/styles\/root.json/).groups.itemId
  const itemInfo: IItem = await requestUtils.requestWrapper(portalUrl, (session) => {
    return esri.restPortal.getItem(itemId, {
      portal: portalUrl,
      authentication: session
    })
  })
  if (itemInfo.type !== 'Vector Tile Service') {
    return Promise.reject(UrlError.NotSupportedType)
  }
  return {
    id: dsId,
    type: DataSourceTypes.VectorTileService,
    sourceLabel: itemInfo.title,
    url,
    itemId,
    portalUrl: portalUrl.replace('/sharing/rest/', '')
  }
}

const style = css`
  position: relative;
  overflow: auto;
`
