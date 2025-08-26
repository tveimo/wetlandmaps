System.register(["jimu-core","jimu-theme","jimu-ui","jimu-for-builder"],(function(e,t){var i={},s={},o={},n={};return{setters:[function(e){i.ReactRedux=e.ReactRedux,i.classNames=e.classNames,i.css=e.css,i.hooks=e.hooks,i.jsx=e.jsx,i.polished=e.polished},function(e){s.ThemeSwitchComponent=e.ThemeSwitchComponent,s.useTheme=e.useTheme,s.useTheme2=e.useTheme2,s.useUseTheme2=e.useUseTheme2},function(e){o.Link=e.Link,o.defaultMessages=e.defaultMessages},function(e){n.getAppConfigAction=e.getAppConfigAction}],execute:function(){e((()=>{var e={1888:e=>{"use strict";e.exports=s},4108:e=>{"use strict";e.exports=n},14321:e=>{"use strict";e.exports=o},79244:e=>{"use strict";e.exports=i}},t={};function u(i){var s=t[i];if(void 0!==s)return s.exports;var o=t[i]={exports:{}};return e[i](o,o.exports,u),o.exports}u.d=(e,t)=>{for(var i in t)u.o(t,i)&&!u.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:t[i]})},u.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),u.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},u.p="";var r={};return u.p=window.jimuConfig.baseUrl,(()=>{"use strict";u.r(r),u.d(r,{default:()=>l});var e=u(79244),t=u(1888),i=u(14321),s=u(4108);const o=["default","primary","secondary","tertiary","danger","link"],n=(t,i)=>e.css`
    width: 360px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: ${t.sys.spacing[3]};
    padding: ${t.sys.spacing[5]};
    .button-item{
      width: 100%;
      font-size: ${e.polished.rem(13)};
    }
    .button-item.jimu-link-link {
      text-decoration: underline;
    }
    .quick-style-item{
      padding: ${t.sys.spacing[2]};
      margin: 2px;
      &.quick-style-item-selected{
        outline: 2px solid ${i.sys.color.primary.light};
      }
      background-color: ${t.sys.color.surface.background};
        cursor: pointer;
    }
  `,l={QuickStyle:u=>{var r,l,a;const{widgetId:c}=u,d=e.ReactRedux.useSelector((e=>{var t;return null===(t=(e.appStateInBuilder?e.appStateInBuilder:e).appConfig.widgets[c])||void 0===t?void 0:t.config})),m=!(null===(r=null==d?void 0:d.styleConfig)||void 0===r?void 0:r.useCustom)&&(null===(a=null===(l=null==d?void 0:d.styleConfig)||void 0===l?void 0:l.themeStyle)||void 0===a?void 0:a.quickStyleType)||"default",p=(0,t.useTheme)(),g=(0,t.useTheme2)(),f=(0,t.useUseTheme2)(),y=window.jimuConfig.isBuilder!==f?g:p,h=window.jimuConfig.isBuilder!==f?p:g,v=e.hooks.useTranslation(i.defaultMessages);return(0,e.jsx)("div",{css:n(y,h)},(0,e.jsx)(t.ThemeSwitchComponent,{useTheme2:window.jimuConfig.isBuilder},o.map(((t,o)=>(0,e.jsx)("div",{key:o,className:(0,e.classNames)("quick-style-item",{"quick-style-item-selected":m===t}),onClick:()=>{(e=>{let t=d.setIn(["styleConfig","useCustom"],!1);t=t.setIn(["styleConfig","themeStyle","quickStyleType"],e),t=t.set("styleConfig",t.styleConfig.without("customStyle")),(0,s.getAppConfigAction)().editWidgetConfig(c,t).exec()})(t)}},(0,e.jsx)(i.Link,{title:v("variableButton"),role:"button",className:"button-item text-truncate",type:t},v("variableButton")))))))}}})(),r})())}}}));