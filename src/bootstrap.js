/** @format */

import * as udviz from 'ud-viz';
import { LayerView } from './LayerView';

const app = new udviz.Templates.AllWidget();

app.start('../assets/config/config.json').then((config) => {
  app.addBaseMapLayer();

  app.addElevationLayer();

  app.setupAndAdd3DTilesLayers();

  ////// REQUEST SERVICE
  const requestService = new udviz.Components.RequestService();

  ////// ABOUT MODULE
  const about = new udviz.Widgets.AboutWindow();
  app.addModuleView('about', about);

  ////// HELP MODULE
  const help = new udviz.Widgets.HelpWindow(config.helpWindow);
  app.addModuleView('help', help);

  ////// AUTHENTICATION MODULE
  const authenticationService =
    new udviz.Widgets.Extensions.AuthenticationService(
      requestService,
      app.config
    );

  const authenticationView = new udviz.Widgets.Extensions.AuthenticationView(
    authenticationService
  );
  app.addModuleView('authentication', authenticationView, {
    type: udviz.Templates.AllWidget.AUTHENTICATION_MODULE,
  });

  ////// DOCUMENTS MODULE
  let documentModule = new udviz.Widgets.DocumentModule(
    requestService,
    app.config
  );
  app.addModuleView('documents', documentModule.view);

  ////// DOCUMENTS VISUALIZER EXTENSION (to orient the document)
  const imageOrienter = new udviz.Widgets.DocumentVisualizerWindow(
    documentModule,
    app.view,
    app.controls
  );

  ////// CONTRIBUTE EXTENSION
  new udviz.Widgets.Extensions.ContributeModule(
    documentModule,
    imageOrienter,
    requestService,
    app.view,
    app.controls,
    app.config
  );

  ////// VALIDATION EXTENSION
  new udviz.Widgets.Extensions.DocumentValidationModule(
    documentModule,
    requestService,
    app.config
  );

  ////// DOCUMENT COMMENTS
  new udviz.Widgets.Extensions.DocumentCommentsModule(
    documentModule,
    requestService,
    app.config
  );

  ////// GUIDED TOURS MODULE
  const guidedtour = new udviz.Widgets.GuidedTourController(
    documentModule,
    requestService,
    app.config
  );
  app.addModuleView('guidedTour', guidedtour, {
    name: 'Guided Tours',
  });


  ////// GEOCODING EXTENSION
  const geocodingService = new udviz.Widgets.Extensions.GeocodingService(
    requestService,
    app.extent,
    app.config
  );
  const geocodingView = new udviz.Widgets.Extensions.GeocodingView(
    geocodingService,
    app.controls,
    app.view
  );
  app.addModuleView('geocoding', geocodingView, {
    binding: 's',
    name: 'Address Search',
  });

  ////// CITY OBJECTS MODULE
  let cityObjectModule = new udviz.Widgets.CityObjectModule(
    app.layerManager,
    app.config
  );
  app.addModuleView('cityObjects', cityObjectModule.view);

  ////// CAMERA POSITIONER
  const cameraPosition = new udviz.Widgets.CameraPositionerView(
    app.view,
    app.controls
  );
  app.addModuleView('cameraPositioner', cameraPosition);

  ////// LAYER CHOICE MODULE
  const layerChoice = new udviz.Widgets.LayerChoice(app.layerManager);
  app.addModuleView('layerChoice', layerChoice);

  ////// LAYER GEOSERVER
  // let geoserverAdress = app.config['geoserver'];

  var color = new udviz.THREE.Color();

  // function colorLineRoads() {
  //   return color.set(0xffff00);
  // }

  // function colorLineRails() {
  //   return color.set(0xff0000);
  // }

  function colorLineMetro() {
    return color.set(0xff00ff);
  }

  // function colorEVAArtif(properties) {
  //   return color.set(0x0000ff);
  // }

  // function colorEVAVegetation(properties) {
  //   if (properties.strate == 1 ) 
  //   {
  //     return color.set(0x005500);
  //   }
  //   else
  //   if(properties.strate == 2 )
  //   {
  //     return color.set(0x00b000);
  //   }
  //   else
  //     return color.set(0x00ff00);
  // }

  function colorSurfaceBatiments() {
    return color.set(0x00ffff);
  }

  ////---DataGrandLyon Layers---////

  var BatimentsSource = new udviz.itowns.WFSSource({
    url: 'https://download.data.grandlyon.com/wfs/grandlyon?',
    protocol: 'wfs',
    version: '2.0.0',
    id: 'batiments',
    typeName: 'cad_cadastre.cadbatiment',
    crs: 'EPSG:3946',
    extent: app.extent,
    format: 'geojson',
  });
    
  var BatimentsLayer = new udviz.itowns.GeometryLayer('Batiments', new udviz.THREE.Group(), {
    update: udviz.itowns.FeatureProcessing.update,
    convert: udviz.itowns.Feature2Mesh.convert(),
    source: BatimentsSource,
    style: new udviz.itowns.Style({
      fill:{
        base_altitude: 180.1,
        color: colorSurfaceBatiments,
      }
    })
  });

  app.view.addLayer(BatimentsLayer);

  var busSource = new udviz.itowns.WFSSource({
    url: 'https://download.data.grandlyon.com/wfs/grandlyon?',
    protocol: 'wfs',
    version: '2.0.0',
    id: 'bus',
    typeName: 'plu_h_opposable.pluzoncol',
    crs: 'EPSG:3946',
    extent: app.extent,
    format: 'geojson',
  });
  
  var busLayer = new udviz.itowns.GeometryLayer('zone d assainissement collectif', new udviz.THREE.Group(), {
    update: udviz.itowns.FeatureProcessing.update,
    convert: udviz.itowns.Feature2Mesh.convert(),
    source: busSource,
    style: new udviz.itowns.Style({
      fill:{
        base_altitude: 170.1,
        color: colorLineMetro,
      }
    })
  });

  app.view.addLayer(busLayer);

  //Color layers
  const emprise_1_layer = new LayerView('emprise', app.config['color_layer']['layer1']);
  emprise_1_layer.createColorLayer(app.view);

  const emprise_2_layer = new LayerView('emprise_2', app.config['color_layer']['layer2']);
  emprise_2_layer.createColorLayer(app.view);

  const ariege_layer = new LayerView('building', app.config['color_layer']['layer3']);
  ariege_layer.createColorLayer(app.view);

  const road_layer = new LayerView('road', app.config['color_layer']['layer4']);
  road_layer.createColorLayer(app.view);

  // Setup camera 
  let pos_x = parseInt(app.config['camera']['coordinates']['position']['x']);
  let pos_y = parseInt(app.config['camera']['coordinates']['position']['y']);
  let pos_z = parseInt(app.config['camera']['coordinates']['position']['z']);
  let quat_x = parseInt(app.config['camera']['coordinates']['quaternion']['x']);
  let quat_y = parseInt(app.config['camera']['coordinates']['quaternion']['y']);
  let quat_z = parseInt(app.config['camera']['coordinates']['quaternion']['z']);
  let quat_w = parseInt(app.config['camera']['coordinates']['quaternion']['w']);

  app.view.camera.camera3D.position.set(pos_x, pos_y, pos_z);
  app.view.camera.camera3D.quaternion.set(quat_x, quat_y, quat_z, quat_w);
  
});



