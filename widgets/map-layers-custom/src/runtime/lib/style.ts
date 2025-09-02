import { type IMThemeVariables, css, type SerializedStyles } from 'jimu-core'
import type { IMConfig } from '../../config'

export function getStyle (theme: IMThemeVariables, widgetConfig: IMConfig): SerializedStyles {
  let displayItemIcon
  let itemLabelOutLine
  if (widgetConfig.setVisibility && widgetConfig.useMapWidget) {
    displayItemIcon = 'block'
    itemLabelOutLine = ''
  } else {
    displayItemIcon = 'none'
    itemLabelOutLine = 'unset'
  }

  const root = theme.sys.color.surface.paper

  return css`
    overflow: auto;
    .widget-layerlist {
      width: 100%;
      height: 100%;
      min-height: 32px;
      overflow-x: hidden;
      background-color: var(--calcite-color-foreground-1);

      .data-action-list-loading {
        height: 32px;
        border: 1px solid rgba(0,0,0,0);
        border-top: 2px solid ${theme.sys.color.secondary.light};
        padding-left: 16px;

        display: flex;
        align-items: center;
        @keyframes ball-fall {
          0%{
            opacity: 0;
            transform: translateY(-145%);
          }
          10%{
            opacity: .5;
          }
          20%{
            opacity: 1;
            transform: translateY(0);
          }
          80%{
            opacity: 1;
            transform: translateY(0);
          }
          90%{
            opacity: .5;
          }
          100%{
            opacity: 0;
            transform:translateY(145%);
          }
        }
        &:before,
        &:after,
        .dot-loading {
          width: 0.25rem;
          height: 0.25rem;
          border-radius: 0.25rem;
          box-sizing: border-box;
          opacity:0;
          animation: ball-fall 1s ease-in-out infinite;
        }
        &:before,
        &:after {
          content: '';
          display: inline-block;
        }
        &:before {
          left: -0.375rem;
          animation-delay: -200ms;
        }
        .dot-loading {
          display: inline-block;
          margin: 0 0.125rem;
          animation-delay: -100ms;
        }
        &:after {
          left: 0.375rem;
          animation-delay: 0ms;
        }
        .dot-loading, &:before, &:after {
          background: ${theme.sys.color.secondary.main};
        }
      }

      .esri-layer-list__item-label:focus {
        outline: ${itemLabelOutLine};
      }

      .esri-layer-list__item-toggle {
        display: ${displayItemIcon};
      }

      .esri-layer-list {
        background-color: ${root};
      }

      .esri-layer-list__list {
        padding: 0px 2px;
      }

      .esri-list-item-panel {
        .esri-legend.esri-widget {
          background-color: var(--calcite-color-foreground-1);
        }
      }

      .esri-layer-list__item {
        background-color: var(--calcite-color-foreground-1);
        .data-action-list-wrapper {
          padding: 0;

          .jimu-dropdown, .jimu-dropdown-item {
            font-size: 12px;
            color: ${theme?.arcgis?.widgets?.layerlist?.icon?.default?.color};
          }

          .jimu-dropdown-item {
            padding: 6px 15px;
            border: 1px solid rgba(0,0,0,0);
            border-top: 2px solid ${theme?.sys.color.divider?.primary};
          }

          .dropdown-item:hover {
            .jimu-icon-auto-color {
              color: ${theme.sys.color.primary.main} !important;
            }
            background: transparent;
            color: ${theme.sys.color.primary.main} !important;
          }
        }
        .ml-2 {
          margin-left: 5px !important;
        }
      }

      .esri-layer-list__item-action {
        outline-offset: -2px;
      }

      .invalid-ds-message {
        font-size: 12px;
        padding: 6px 15px;
        border: 1px solid rgba(0,0,0,0);
        border-top: 2px solid #d5d5d5;
        color: ${theme.ref.palette.neutral[1000]};
      }

      .table-list-divider {
        background-color: var(--calcite-color-foreground-1);
        color: var(--calcite-color-text-2);
        border-block-start: 1px solid var(--calcite-color-border-3);
        font-size: var(--calcite-font-size--1);
        padding-left: 12px;
        height: 28px;
      }
    }
  `
}
