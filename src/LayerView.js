/** @format */
import * as udviz from 'ud-viz';
/**
 * 
 */
export class LayerView {
  /**
     * 
     * @param {*} name 
     * @param {*} configLayer 
     */
  constructor(name, configLayer){

    this.name = name;

    this.url = configLayer['url'];

    this.crs = configLayer['crs'];

    this.colorFill = configLayer['color_fill'];
    this.colorStroke = configLayer['color_stroke'];

    this.opacity = parseInt(configLayer['opacity']);

  }

  /**
   * 
   * @param {*} view 
   */
  createColorLayer(view){
    // layer source 
    const layerSource = new udviz.itowns.FileSource({
      url: this.url,
      crs: this.crs,
      format: 'application/json',
    });
    // Create layer
    const layer = new udviz.itowns.ColorLayer(this.name, {
      name: this.name,
      transparent: true,
      source: layerSource,
      style: new udviz.itowns.Style({
        fill: {
          color: this.colorFill,
          opacity: this.opacity,
        },
        stroke: {
          color: this.colorStroke,
        },
      }),
    });
    // Add layer to the view
    view.addLayer(layer);
  }
}