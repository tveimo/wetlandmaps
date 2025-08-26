// this component converts the geometry of drawn polygon features to a string, formatted as per maps online api requirements
// the data structure for submitting polygons complex. Several interfaces are used to create the polygon geojson string

import Graphic from 'esri/Graphic';

interface  FormatFeaturesStringProps {
  selectedGraphic: Graphic;
  reservedFields: Array<string>;
}

  // format string to pass to Maps Online api when submitting validated report request parameters
  const FormatFeaturesString = (props: FormatFeaturesStringProps) => {
    // the features string is obtained by joining the reservedFields array by a comma e.g. the lot and plan fields become 1,RP1.
    //  most feature strings are obtained from a single field e.g. national park name
    let formattedString: string = '';

    const attributes = props.selectedGraphic.attributes
    // if only one field name describing feature, use this as output string
    if (props.reservedFields.length == 1) {
      formattedString = attributes[props.reservedFields[0]];
    }
    // otherwise concatenate the reserved fields
    if (props.reservedFields.length > 1) {
      const reservedAttributeValues: string[] = props.reservedFields.map(field => {
        // Check if the graphic has this attribute
        if (attributes[field] !== undefined) {
          return attributes[field].toString();
        }
        return ''; // If the attribute is not found, return an empty string
      });

      formattedString = reservedAttributeValues.join(', ');
    }

    // queryString is sent to MapsOnline API
    return formattedString;
  };

  export default FormatFeaturesString;