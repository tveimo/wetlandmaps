// this component provides the user interface for uploading files by browsing or drag and drop
// the type and size of spatial files is limited by ESRI's capabilities, and the Spatial Team's preferences
// the spatial data is converted into web features using the ESRI JS API Generate call
// there is a known bug that is preventing geojson files from being generated on ESRI Portal
// once uploaded into the Data Store, users can either cancel the operation or add it to the map as a feature layer (in data-list.tsx)

import { React, uuidv1, DataSourceTypes, loadArcGISJSAPIModule, getAppStore } from 'jimu-core'
import { useState, useRef, useEffect, useMemo } from 'react';
import { PlusOutlined } from 'jimu-icons/outlined/editor/plus'
import { type DataOptions, type FeatureCollection, type LayerInFeatureCollection } from '../types'
import { getNextAddedDataId, preventDefault, isIOSDevice } from '../utils/utils'
import ColourSelector from './colour-selector'
import { Button, Icon, Label, Input, Loading } from "jimu-ui";
import AlertMessage from './alert-message'; // custom component for handling Alert error messages
import '../css/style.css' // custom css styling

// types, enums, variables for AddData component

type UploadDataProps = {
    portalUrl: string;
    widgetID: string;
    onAdd: (multiDataOptions: DataOptions[], fillColour: number[], outlineColour: number[]) => void; 
}


enum SupportedFileTypes {
  CSV = 'csv',
  GeoJson = 'geojson',
  Shapefile = 'shapefile',
  KML = 'kml',
  GPX = 'gpx'
}

const INPUT_ACCEPT = isIOSDevice() ? undefined : Object.values(SupportedFileTypes).filter(t => t !== SupportedFileTypes.GPX).map(t => getFileExtension(t)).join(',')

interface FileInfo {
  id: string
  name: string
  type: SupportedFileTypes
  data: FormData
  size: number //bytes
}

const MaxFileSize: { [key in SupportedFileTypes]: number /** bytes */ } = {
  [SupportedFileTypes.CSV]: 10485760,
  [SupportedFileTypes.GeoJson]: 10485760,
  [SupportedFileTypes.Shapefile]: 2097152,
  // KML size limitaion: https://doc.arcgis.com/en/arcgis-online/reference/kml.htm
  [SupportedFileTypes.KML]: 10485760,
  [SupportedFileTypes.GPX]: 10485760
}

enum UploadFileError {
  NotSupportedType = 'The file type of {fileName} is not supported.',
  FailedToUpload = 'The file {fileName} cannot be successfully uploaded.',
  ExceedMaxSize = 'The file size exceeds the maximum ESRI limit (2 MB for a shapefile and 10 MB for all other file types).',
  ExceedMaxRecords = 'The number of records exceeds the maximum ESRI limit (1,000 for .csv files and 4,000 for all other files types).'
}

const UploadData = (props: UploadDataProps) => {
    const { portalUrl, widgetID, onAdd } = props
    // set default colours as per symbol selector defaults
    const [selectedColour, setSelectedColour] = useState<number[]>([187, 187, 187, 0.5]);
    const [selectedOutlineColour, setSelectedOUtlineColour] = useState<number[]>([0,0,0,1]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [multiDataOptionsFromFile, setMultiDataOptionsFromFile] = useState<DataOptions[]>([]);
    const [processUploadedData, setProcessUploadedData] = useState<boolean>(false);
    const nextOrder = useMemo(() => multiDataOptionsFromFile.length > 0 ? Math.max(...multiDataOptionsFromFile.map(d => d.order)) + 1 : 0, [multiDataOptionsFromFile]);
    const dragToUploadBtnId = useMemo(() => `${widgetID}-drag-to-upload`, [widgetID]);
    const clickToUploadBtnId = useMemo(() => `${widgetID}-click-to-upload`, [widgetID]);
    const uploadingFileInfo = useRef<FileInfo>(null);
    const toRemoveFilesInfo = useRef<FileInfo[]>([]);
    const [errorMsg, setErrorMsg] = useState<string>(null);
    const [showAlertUploadFail, setShowAlertUploadFail] = useState(false);
    const [isUploadDisabled, setIsUploadDisabled] = useState(false);

    const uploadRef = useRef();

    const [hasFeaturesDataOptions, setHasFeaturesDataOptions] = useState<DataOptions[]>([]);
    
    
    // when the user uploads data, validate the file type and size, create DataSourceJSON, add file to Data Options array
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) {
            return
          }

          try {
            setIsLoading(true)

            const file: File = e.target.files[0]
            const fileInfo = getFileInfo(file)
            uploadingFileInfo.current = fileInfo
            console.log('uploading file info:')
            console.log(uploadingFileInfo)
            // check file type
            if (!fileInfo.type) {
              throw new Error(UploadFileError.NotSupportedType)
            }
            // check file size
            if (fileInfo.size > MaxFileSize[fileInfo.type]) {
              throw new Error(UploadFileError.ExceedMaxSize)
            }

            const featureCollection = await generateFeatureCollection(fileInfo, portalUrl)

            // Break the process if uploading of the file is canceled.
            if (toRemoveFilesInfo.current.some(f => f.id === fileInfo.id)) {
              toRemoveFilesInfo.current = toRemoveFilesInfo.current.filter(f => f.id !== fileInfo.id)
              return
            }

            if (featureCollection?.layers?.length > 0) {
              setMultiDataOptionsFromFile(featureCollection.layers.map((l: LayerInFeatureCollection, i) => ({
                dataSourceJson: {
                  id: getNextAddedDataId(widgetID, nextOrder + i),
                  type: DataSourceTypes.FeatureLayer,
                  sourceLabel: l.layerDefinition?.name || (i === 0 ? fileInfo.name : `${fileInfo.name} ${i}`)
                },
                order: nextOrder + i,
                restLayer: l
              })))
            }

          } catch (err) {
            // Set error message
            if (err.message === UploadFileError.NotSupportedType) {
              setErrorMsg(UploadFileError.NotSupportedType.replace('{fileName}', uploadingFileInfo.current?.name))
            } else if (err.message === UploadFileError.ExceedMaxSize || err.details?.messages?.[0]?.includes('max size')) { // File exceeds the max size allowed of 10MB.
              setErrorMsg(UploadFileError.ExceedMaxSize)
            } else if (err.message === UploadFileError.ExceedMaxRecords || err.message?.includes('maximum number')) { // The maximum number of records allowed (1000) has been exceeded.
              setErrorMsg(UploadFileError.ExceedMaxRecords)
            } else {
              setErrorMsg(UploadFileError.FailedToUpload.replace('{fileName}', uploadingFileInfo.current?.name))
              console.log(err)
            }
          } finally {
            setProcessUploadedData(true)
            setIsLoading(false)
            uploadingFileInfo.current = null
            // Clear value to allow to upload the same file again.
            e.target.value = null

            if (uploadRef.current) {
              (uploadRef.current as HTMLInputElement).focus()
            }

          }
    };

  // filter uploaded data to remove any layers with zero features
  // this is especially a problem with kml files, as the esri portal "sharing" service will create empty layers for any geometry types not present
  useEffect(() => {
    let dataOptionsWithFeatures: DataOptions[] = []
    multiDataOptionsFromFile.forEach((d) => {
      if (d.restLayer.featureSet.features.length > 0) {
        dataOptionsWithFeatures.push(d);
      }
    });
    setHasFeaturesDataOptions(dataOptionsWithFeatures)
  }, [multiDataOptionsFromFile]) 

  // send file data to parent component for processing when user has uploaded data (that contains features)
  useEffect(() => {
    if (processUploadedData && hasFeaturesDataOptions.length > 0) {
      onAdd(hasFeaturesDataOptions, selectedColour, selectedOutlineColour)
      // once successfully sent data for processing, clear local state
      setMultiDataOptionsFromFile([])
      setProcessUploadedData(false)
    }
  }, [hasFeaturesDataOptions, processUploadedData])

    // when error message has been set, show alert and disable uploads
    useEffect(() => {
      console.log('errMsg changed')
      console.log(errorMsg)
      if (errorMsg && errorMsg.length > 0) {
        setShowAlertUploadFail(true);
        setIsUploadDisabled(true);
      }
    }, [errorMsg])

    // to hide an alert after it's displayed
    const handleCloseAlert = () => {
      setErrorMsg(null);
      setShowAlertUploadFail(false);
      setIsUploadDisabled(false);
    };

    const onFileRemove = () => {
      toRemoveFilesInfo.current.push(uploadingFileInfo.current)
      uploadingFileInfo.current = null
      setIsLoading(false)
    }

    return (
      <div>

        {/* <div className='supported-types padding-all'>
            Supported formats: Shapefile (zipped), CSV, KML, GeoJSON.
        </div> */}

        <ColourSelector fillColour={selectedColour} setFillColour={setSelectedColour} outlineColour={selectedOutlineColour} setOutlineColour={setSelectedOUtlineColour}/>

        <div className='mt-4 drag-area-container padding-bottom-20'>

          <Label for={dragToUploadBtnId} className='drag-area text-center'>
              <div className='font-14'>Drag data here or browse to upload</div>
              <div className='upload-btn-container w-50' title='Upload'>
                  <Label for={clickToUploadBtnId} className='upload-btn text-center mt-4 mb-0 text-truncate'>
                      <PlusOutlined size={15} className='mr-2' />
                      <span>Upload</span>
                  </Label>
                  <Input disabled={isUploadDisabled} id={clickToUploadBtnId} title='' className='upload-btn-file-input' type='file' accept={INPUT_ACCEPT} onChange={handleFileChange} />
              </div>
          </Label>
          <Input disabled={isUploadDisabled} id={dragToUploadBtnId} onClick={preventDefault} title='' className='drag-area-file-input' type='file' accept={INPUT_ACCEPT} onChange={handleFileChange} />
        </div>

        <div className='supported-type-icons d-flex justify-content-around align-items-center px-6 mb-4'>
              <Icon width={13} height={16} icon={require('../assets/file.svg')} />
              <Icon width={24} height={24} icon={require('../assets/file1.svg')} />
              <Icon width={32} height={32} icon={require('../assets/file2.svg')} />
              <Icon width={24} height={24} icon={require('../assets/file3.svg')} />
              <Icon width={13} height={16} icon={require('../assets/file.svg')} />
          </div>

        {showAlertUploadFail && ( 
            <div className='padding-all'>
          <AlertMessage responseType="dataUploadFailed" onClose={handleCloseAlert} textMessage={errorMsg}/>
          </div>) 
        }

        {
          isLoading &&
          <div className='upload-loading-container' title='File is uploading'>
            <div className='upload-loading-content'>
              <Loading className='upload-loading' type='PRIMARY' width={30} height={28} />
              <div className='upload-loading-file-name d-flex justify-content-center align-items-center'>
                <div className='w-100 font-14 text-center'>
                  File is uploading
                </div>
              </div>
              <div className='upload-loading-btn d-flex justify-content-center'>
                <Button type='danger' onClick={onFileRemove}>Cancel</Button>
              </div>
            </div>
          </div>
        }

      </div>
    );
  };
  
  function getFileInfo (file: File): FileInfo {
    const type = getFileType(file.name)
    const name = file.name.replace(`.${type}`, '')
    const data = new FormData()
    data.set('file', file)
    data.set('filetype', type)
    data.set('f', 'json')
    return {
      id: uuidv1(),
      type,
      name,
      data,
      size: file.size
    }
  }
  
  function readFileAsText (fileInfo: FileInfo) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (event: any) => {
        resolve(event.target.result)
      }
      reader.readAsText(fileInfo.data.get('file') as File)
    })
  }
  
  function getKmlServiceUrl () {
    const isPortal = getAppStore().getState()?.portalSelf?.isPortal
    if (isPortal) {
      const portalUrl = getAppStore().getState()?.portalUrl
      return `${portalUrl}/sharing/kml`
    }
    const env = window.jimuConfig.hostEnv
    const envHost = env === 'dev' ? 'devext' : env === 'qa' ? 'qa' : ''
    return `https://utility${envHost}.arcgis.com/sharing/kml`
  }
  
  async function generateFeatureCollection (fileInfo: FileInfo, portalUrl: string): Promise<FeatureCollection> {
    const esriRequest: typeof __esri.request = await loadArcGISJSAPIModule('esri/request')
  
    if (fileInfo.type === SupportedFileTypes.KML) {
      const serviceUrl = getKmlServiceUrl()
      const kmlString = await readFileAsText(fileInfo)
      const res = await esriRequest(serviceUrl, {
        query: {
          kmlString: encodeURIComponent(kmlString),
          model: 'simple',
          folders: ''
          // outSR: JSON.stringify(outSpatialReference)
        },
        responseType: 'json'
      })
      return res?.data?.featureCollection as FeatureCollection
    }
  
    let publishParameters = {}
  
    // 1. Use REST API analyze to get `publishParameters` which is needed in REST API generate.
    if (fileInfo.type !== SupportedFileTypes.GPX) {
      const analyzeUrl = `${portalUrl}/sharing/rest/content/features/analyze`
      fileInfo.data.set('analyzeParameters', JSON.stringify({
        enableGlobalGeocoding: true,
        sourceLocale: getAppStore().getState().appContext?.locale ?? 'en'
      }))
      const analyzeResponse = await esriRequest(analyzeUrl, {
        body: fileInfo.data,
        method: 'post'
      })
      fileInfo.data.delete('analyzeParameters')
      publishParameters = analyzeResponse?.data?.publishParameters
    }
  
    // 2. Use REST API generate to get features from the uploaded file.
    const generateUrl = `${portalUrl}/sharing/rest/content/features/generate`
    fileInfo.data.set('publishParameters', JSON.stringify({
      ...publishParameters,
      name: fileInfo.name
    }))
    const generateResponse = await esriRequest(generateUrl, {
      body: fileInfo.data,
      method: 'post'
    })
    fileInfo.data.delete('publishParameters')
  
    if (generateResponse?.data?.featureCollection) {
      (generateResponse?.data?.featureCollection as FeatureCollection)?.layers?.forEach((ly) => {
        ly.featureSet?.features?.forEach((feature) => {
          ly.layerDefinition?.fields?.forEach((field) => {
            const attrValue = feature.attributes?.[field.name]
            if (field.type === 'esriFieldTypeSmallInteger') {
              if (typeof attrValue === 'boolean') {
                feature.attributes[field.name] = attrValue ? 1 : 0
                return
              }
              if (typeof attrValue !== 'number') {
                feature.attributes[field.name] = null
              }
            }
          })
        })
      })
    }
  
    return generateResponse?.data?.featureCollection as FeatureCollection
  }
  
  function getFileType (name: string): SupportedFileTypes {
    return Object.values(SupportedFileTypes).find(t => name?.endsWith(getFileExtension(t)))
  }
  
  function getFileExtension (supportedFileType: SupportedFileTypes): string {
    return supportedFileType === 'shapefile' ? '.zip' : `.${supportedFileType}`
  }

export default UploadData;