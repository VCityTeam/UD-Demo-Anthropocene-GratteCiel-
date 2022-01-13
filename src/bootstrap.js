/** @format */

import * as udviz from 'ud-viz';

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

  ////// LINKS MODULE
  new udviz.Widgets.LinkModule(
    documentModule,
    cityObjectModule,
    requestService,
    app.view,
    app.controls,
    app.config
  );

  ////// 3DTILES DEBUG
  const debug3dTilesWindow = new udviz.Widgets.Extensions.Debug3DTilesWindow(
    app.layerManager
  );
  app.addModuleView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });

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
    // let geoserverAdress = app.config["geoserver"];

    // let wmsPolutedGroundSource = new itowns.WMSSource({
    //   extent: this.extent,
    //   name: 'SSP_CLASSIFICATION',
    //   url: ' https://www.georisques.gouv.fr/services',
    //   version: '1.3.0',
    //   crs: 'EPSG:4326',
    //   format: 'image/png',
    // });

    // let wmsPolutedGroundLayer = new itowns.ColorLayer('wms_Ground_Polution', {
    //     updateStrategy: {
    //         type: itowns.STRATEGY_DICHOTOMY,
    //         options: {},
    //         altitude: 1,

    //     },
    //     source: wmsPolutedGroundSource,
    // });

    // this.view.addLayer(wmsPolutedGroundLayer);

    // var color = new THREE.Color();

    // function colorLineRoads() {
    //     return color.set(0xffff00);
    // }

    // function colorLineRails() {
    //     return color.set(0xff0000);
    // }

    // function colorLineMetro() {
    //   return color.set(0xff00ff);
    // }

    // function colorEVAArtif(properties) {
    //     return color.set(0x0000ff);
    // }

    // function colorEVAVegetation(properties) {
    //     if (properties.strate == 1 ) 
    //     {
    //         return color.set(0x005500);
    //     }
    //     else
    //     if(properties.strate == 2 )
    //     {
    //         return color.set(0x00b000);
    //     }
    //     else
    //     return color.set(0x00ff00);
    // }

    // function colorSurfaceBatiments() {
    //     return color.set(0x00ffff);
    // }

    // ////---DataGrandLyon Layers---////

    // var BatimentsSource = new itowns.WFSSource({
    //     url: 'https://download.data.grandlyon.com/wfs/grandlyon?',
    //     protocol: 'wfs',
    //     version: '2.0.0',
    //     id: 'batiments',
    //     typeName: 'cad_cadastre.cadbatiment',
    //     crs: 'EPSG:3946',
    //     extent: this.extent,
    //     format: 'geojson',
    // });
    
    // var BatimentsLayer = new itowns.GeometryLayer('Batiments', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: BatimentsSource,
    //     style: new itowns.Style({
    //       fill:{
    //         base_altitude: 170.1,
    //         color: colorSurfaceBatiments,
    //       }
    //   })
    // });

    // this.view.addLayer(BatimentsLayer);

    // ////---GeoServer layers---////

    // let wfsMetroSource = new itowns.WFSSource({
    //   url: geoserverAdress,
    //   protocol: 'wfs',
    //   version: '1.0.0',
    //   id: 'Metro',
    //   typeName: 'cite:metro_lines_buffer',
    //   crs: 'EPSG:3946',
    //   extent: this.extent,
    //   format: 'application/json',
    // });

    // var wfsMetroLayer = new itowns.GeometryLayer('Metro', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: wfsMetroSource,
    //     style: new itowns.Style({
    //       fill:{
    //         color: colorLineMetro,
    //         base_altitude : 170.2,
    //       }
    //   })
    // });

    // this.view.addLayer(wfsMetroLayer);

    // let wfsRoadsSource = new itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'Roads',
    //     typeName: 'cite:Voirie_Extent',
    //     crs: 'EPSG:3946',
    //     extent: this.extent,
    //     format: 'application/json',
    // });

    // var wfsRoadsLayer = new itowns.GeometryLayer('Chaussee_Trottoirs', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: wfsRoadsSource,
    //     style: new itowns.Style({
    //       fill:{
    //         color: colorLineRoads,
    //         base_altitude : 170.3,
    //       }
    //   })
    // });

    // this.view.addLayer(wfsRoadsLayer);

    // let wfsRailsSource = new itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'Rails',
    //     typeName: '	cite:fpcvoieferree_Extent',
    //     crs: 'EPSG:3946',
    //     extent: this.extent,
    //     format: 'application/json',
    // });

    // var wfsRailsLayer = new itowns.GeometryLayer('Voies_Ferrées', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: wfsRailsSource,
    //     style: new itowns.Style({
    //       fill:{
    //         color: colorLineRails,
    //         base_altitude : 170.4,
    //       }
    //   })
    // });

    // this.view.addLayer(wfsRailsLayer);

    // let wfsEVA_STRSource = new itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'wfs_EVA_STR',
    //     typeName: '	cite:EVA2015_Vegetation3STR_Extent',
    //     crs: 'EPSG:3946',
    //     extent: this.extent,
    //     format: 'application/json',
    // });

    // var wfsEVA_STRLayer = new itowns.GeometryLayer('EVA_Vegetation', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: wfsEVA_STRSource,
    //     style: new itowns.Style({
    //       fill:{
    //         color: colorEVAVegetation,
    //         base_altitude : 170.5,
    //       }
    //   })
    // });

    // this.view.addLayer(wfsEVA_STRLayer);
    
    // let wfsEVA_ArtifSource = new itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'wfs_EVA_Artif',
    //     typeName: 'cite:EVA2015_Artif_Sols_Extent',
    //     crs: 'EPSG:3946',
    //     extent: this.extent,
    //     format: 'application/json',
    // });

    // var wfsEVA_ArtifLayer = new itowns.GeometryLayer('EVA_Artif_Sols_Nus', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: wfsEVA_ArtifSource,
    //     style: new itowns.Style({
    //       fill:{
    //         color: colorEVAArtif,
    //         base_altitude : 170,
    //       }
    //   })
    // });

    // this.view.addLayer(wfsEVA_ArtifLayer);

    // ////---Masks---////
    // let wfsMaskASource = new itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'MaskA',
    //     typeName: 'cite:A=Difference_EVA_Artificialise-Routes',
    //     crs: 'EPSG:3946',
    //     extent: this.extent,
    //     format: 'application/json',
    // });

    // var wfsMaskALayer = new itowns.GeometryLayer('MaskA', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: wfsMaskASource,
    //     style: new itowns.Style({
    //       fill:{
    //         color: colorEVAArtif,
    //         base_altitude : 170,
    //       }
    //   })
    // });

    // this.view.addLayer(wfsMaskALayer);

    // let wfsMaskBSource = new itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'MaskB',
    //     typeName: 'cite:B=A-Voies_ferree',
    //     crs: 'EPSG:3946',
    //     extent: this.extent,
    //     format: 'application/json',
    // });

    // var wfsMaskBLayer = new itowns.GeometryLayer('MaskB', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: wfsMaskBSource,
    //     style: new itowns.Style({
    //       fill:{
    //         color: colorEVAArtif,
    //         base_altitude : 170,
    //       }
    //   })
    // });

    // this.view.addLayer(wfsMaskBLayer);

    // let wfsMaskCSource = new itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'MaskC',
    //     typeName: 'cite:C=B-Batiments',
    //     crs: 'EPSG:3946',
    //     extent: this.extent,
    //     format: 'application/json',
    // });

    // var wfsMaskCLayer = new itowns.GeometryLayer('MaskC', new THREE.Group(), {
    //     update: itowns.FeatureProcessing.update,
    //     convert: itowns.Feature2Mesh.convert(),
    //     source: wfsMaskCSource,
    //     style: new itowns.Style({
    //       fill:{
    //         color: colorEVAArtif,
    //         base_altitude : 170,
    //       }
    //   })
    // });
    // this.view.addLayer(wfsMaskCLayer);  

});



