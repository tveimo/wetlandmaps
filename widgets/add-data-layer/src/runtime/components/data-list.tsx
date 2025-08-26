// this component will display the uploaded dataset once it has been successfully processed by the portal
// the user can then choose to cancel the process or add the layer to the map
// it was decided to not use ESRI's data list action component, as it's over the top for our requirements


import { React, ReactRedux, Immutable, i18n, defaultMessages as jimuCoreMessages, classNames, dataSourceUtils, type IMState, DataSourceStatus, hooks } from 'jimu-core'
import { Button, defaultMessages as jimuUIMessages, Loading, LoadingType, Icon, Alert } from 'jimu-ui'

import { getDataSource } from '../utils/utils'
import { type DataOptions } from '../types'
import '../css/style.css' // custom css styling

export interface DataListProps {
  uploadedDataOptions: DataOptions[]
  setUploadedDataOptions: React.Dispatch<React.SetStateAction<DataOptions[]>>
  enableDataAction: boolean
  isLoading: boolean
  widgetId: string
  onRemoveData: (id: string) => void
  onAddLayer: (id: string) => void
}

const { useSelector } = ReactRedux

const DataList = (props: DataListProps) => {

  const translate = hooks.useTranslation(jimuUIMessages, jimuCoreMessages)

  const dssInfo = useSelector((state: IMState) => state.dataSourcesInfo)
  const intl = i18n.getIntl()

  // add all listed layers to the map
  const onClickDone = () => {
    props.uploadedDataOptions.map((d, i) => {
      props.onAddLayer(d.dataSourceJson.id)
    })
  }

  // remove all listed layers from the data store
  const onClickCancel = () => {
    console.log('user clicked cancel')
    props.uploadedDataOptions.map((d, i) => {
      props.onRemoveData(d.dataSourceJson.id)
      console.log('removed layer ', d.dataSourceJson.label)
    })
  }

  return <div className='data-list' role="list">
    {
      props.uploadedDataOptions.map((d, i) => {
        const ds = getDataSource(d.dataSourceJson.id)
        const dsInfo = dssInfo?.[d.dataSourceJson.id]
        const isDataError = dsInfo ? dsInfo.instanceStatus === DataSourceStatus.CreateError : !ds && !props.isLoading
        const isDataLoading = dsInfo ? dsInfo.instanceStatus === DataSourceStatus.NotCreated : !ds && props.isLoading
        const label = d.dataSourceJson.label || d.dataSourceJson.sourceLabel
        
        return <div key={d.dataSourceJson.id} className={classNames('d-flex justify-content-between align-items-center data-item', { 'pt-3': i !== 0 })} role="listitem" aria-label={label}>
                  <div className='flex-grow-1 text-truncate d-flex justify-content-start align-items-center'>
                    {
                      isDataLoading &&
                      <div className='flex-shrink-0 d-flex justify-content-center align-items-center mr-1 data-item-loading'>
                        <Loading type={LoadingType.Donut} width={16} height={16} />
                      </div>
                    }
                    <div className='flex-grow-1 text-truncate d-flex align-items-center' title={dataSourceUtils.getDsTypeString(d.dataSourceJson?.type, intl)}>
                      {
                        !isDataLoading &&
                        <div className='flex-shrink-0 d-flex justify-content-center align-items-center data-thumbnail'>
                          <Icon icon={dataSourceUtils.getDsIcon(Immutable(d.dataSourceJson))} color='#FFFFFF' size='12' />
                        </div>
                      }
                      {
                        isDataError &&
                        <Alert className='flex-shrink-0' buttonType='tertiary' form='tooltip' size='small' type='error' text={translate('dataSourceCreateError')} />
                      }
                      <div className={classNames('flex-grow-1 text-truncate data-label', { 'pl-2': !isDataError })} title={label}>
                        {label}
                      </div>
                    </div>
                  </div>
        </div>
      })
    }
    
    <div className='centered-container-row-flex padding-all'>
      <span className='padding-right'>
        <Button type='primary' size='sm' onClick={onClickDone} title='Add Layer' aria-label='Add Layer'>
          Add my layer
        </Button>
      </span>
      <Button type='danger' size='sm' icon onClick={onClickCancel} title='Cancel' aria-label='Cancel'>
        Cancel
      </Button>
    </div>
  </div>
}

export default DataList;