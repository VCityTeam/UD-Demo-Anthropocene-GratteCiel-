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
    let geoserverAdress = app.config["geoserver"];

    let wmsPolutedGroundSource = new udviz.itowns.WMSSource({
      extent: app.extent,
      name: 'SSP_CLASSIFICATION',
      url: ' https://www.georisques.gouv.fr/services',
      version: '1.3.0',
      crs: 'EPSG:4326',
      format: 'image/png',
    });

    let wmsPolutedGroundLayer = new udviz.itowns.ColorLayer('wms_Ground_Polution', {
        updateStrategy: {
            type: udviz.itowns.STRATEGY_DICHOTOMY,
            options: {},
            altitude: 1,

        },
        source: wmsPolutedGroundSource,
    });

    app.view.addLayer(wmsPolutedGroundLayer);

    var color = new udviz.THREE.Color();

    function colorLineRoads() {
        return color.set(0xffff00);
    }

    function colorLineRails() {
        return color.set(0xff0000);
    }

    function colorLineMetro() {
      return color.set(0xff00ff);
    }

    function colorEVAArtif(properties) {
        return color.set(0x0000ff);
    }

    function colorEVAVegetation(properties) {
        if (properties.strate == 1 ) 
        {
            return color.set(0x005500);
        }
        else
        if(properties.strate == 2 )
        {
            return color.set(0x00b000);
        }
        else
        return color.set(0x00ff00);
    }

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
          base_altitude: 180.1,
          color: colorLineMetro,
        }
    })
  });

  app.view.addLayer(busLayer);

    var travauxSource = new udviz.itowns.WFSSource({
      url: 'https://download.data.grandlyon.com/wfs/grandlyon?',
      protocol: 'wfs',
      version: '2.0.0',
      id: 'bus',
      typeName: 'plu_h_opposable.pluzoncol',
      crs: 'EPSG:3946',
      extent: app.extent,
      format: 'geojson',
  });

  var travauxLayer = new udviz.itowns.GeometryLayer('zone d assainissement collectif', new udviz.THREE.Group(), {
      update: udviz.itowns.FeatureProcessing.update,
      convert: udviz.itowns.Feature2Mesh.convert(),
      source: travauxSource,
      style: new udviz.itowns.Style({
        fill:{
          base_altitude: 180.1,
          color: colorLineMetro,
        }
    })
  });

  app.view.addLayer(travauxLayer);


    ////---GeoServer layers---////

    // let wfsMetroSource = new udviz.itowns.WFSSource({
    //   url: geoserverAdress,
    //   protocol: 'wfs',
    //   version: '1.0.0',
    //   id: 'Metro',
    //   typeName: 'cite:metro_lines_buffer',
    //   crs: 'EPSG:3946',
    //   extent: app.extent,
    //   format: 'application/json',
    // });

    // var wfsMetroLayer = new udviz.itowns.GeometryLayer('Metro', new udviz.THREE.Group(), {
    //     update: udviz.itowns.FeatureProcessing.update,
    //     convert: udviz.itowns.Feature2Mesh.convert(),
    //     source: wfsMetroSource,
    //     style: new udviz.itowns.Style({
    //       fill:{
    //         color: colorLineMetro,
    //         base_altitude : 170.2,
    //       }
    //   })
    // });

    // app.view.addLayer(wfsMetroLayer);

    // let wfsRoadsSource = new udviz.itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'Roads',
    //     typeName: 'cite:Voirie_Extent',
    //     crs: 'EPSG:3946',
    //     extent: app.extent,
    //     format: 'application/json',
    // });

    // var wfsRoadsLayer = new udviz.itowns.GeometryLayer('Chaussee_Trottoirs', new udviz.THREE.Group(), {
    //     update: udviz.itowns.FeatureProcessing.update,
    //     convert: udviz.itowns.Feature2Mesh.convert(),
    //     source: wfsRoadsSource,
    //     style: new udviz.itowns.Style({
    //       fill:{
    //         color: colorLineRoads,
    //         base_altitude : 170.3,
    //       }
    //   })
    // });

    // app.view.addLayer(wfsRoadsLayer);

    // let wfsRailsSource = new udviz.itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.3.0',
    //     id: 'Rails',
    //     typeName: '	cite:fpcvoieferree_Extent',
    //     crs: 'EPSG:3946',
    //     extent: app.extent,
    //     format: 'application/json',
    // });

    // var wfsRailsLayer = new udviz.itowns.GeometryLayer('Réseau de bus', new udviz.THREE.Group(), {
    //     update: udviz.itowns.FeatureProcessing.update,
    //     convert: udviz.itowns.Feature2Mesh.convert(),
    //     source: wfsRailsSource,
    //     style: new udviz.itowns.Style({
    //       fill:{
    //         color: colorLineRails,
    //         base_altitude : 170.4,
    //       }
    //   })
    // });

    // app.view.addLayer(wfsRailsLayer);

    // let wfsEVA_STRSource = new udviz.itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'wfs_EVA_STR',
    //     typeName: '	cite:EVA2015_Vegetation3STR_Extent',
    //     crs: 'EPSG:3946',
    //     extent: app.extent,
    //     format: 'application/json',
    // });

    // var wfsEVA_STRLayer = new udviz.itowns.GeometryLayer('EVA_Vegetation', new udviz.THREE.Group(), {
    //     update: udviz.itowns.FeatureProcessing.update,
    //     convert: udviz.itowns.Feature2Mesh.convert(),
    //     source: wfsEVA_STRSource,
    //     style: new udviz.itowns.Style({
    //       fill:{
    //         color: colorEVAVegetation,
    //         base_altitude : 170.5,
    //       }
    //   })
    // });

    // app.view.addLayer(wfsEVA_STRLayer);
    
    // let wfsEVA_ArtifSource = new udviz.itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'wfs_EVA_Artif',
    //     typeName: 'cite:EVA2015_Artif_Sols_Extent',
    //     crs: 'EPSG:3946',
    //     extent: app.extent,
    //     format: 'application/json',
    // });

    // var wfsEVA_ArtifLayer = new udviz.itowns.GeometryLayer('EVA_Artif_Sols_Nus', new udviz.THREE.Group(), {
    //     update: udviz.itowns.FeatureProcessing.update,
    //     convert: udviz.itowns.Feature2Mesh.convert(),
    //     source: wfsEVA_ArtifSource,
    //     style: new udviz.itowns.Style({
    //       fill:{
    //         color: colorEVAArtif,
    //         base_altitude : 170,
    //       }
    //   })
    // });

    // app.view.addLayer(wfsEVA_ArtifLayer);

    ////---Masks---////
    // let wfsMaskASource = new udviz.itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'MaskA',
    //     typeName: 'cite:A=Difference_EVA_Artificialise-Routes',
    //     crs: 'EPSG:3946',
    //     extent: app.extent,
    //     format: 'application/json',
    // });

    // var wfsMaskALayer = new udviz.itowns.GeometryLayer('MaskA', new udviz.THREE.Group(), {
    //     update: udviz.itowns.FeatureProcessing.update,
    //     convert: udviz.itowns.Feature2Mesh.convert(),
    //     source: wfsMaskASource,
    //     style: new udviz.itowns.Style({
    //       fill:{
    //         color: colorEVAArtif,
    //         base_altitude : 170,
    //       }
    //   })
    // });

    // app.view.addLayer(wfsMaskALayer);

    // let wfsMaskBSource = new udviz.itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'MaskB',
    //     typeName: 'cite:B=A-Voies_ferree',
    //     crs: 'EPSG:3946',
    //     extent: app.extent,
    //     format: 'application/json',
    // });

    // var wfsMaskBLayer = new udviz.itowns.GeometryLayer('MaskB', new udviz.THREE.Group(), {
    //     update: udviz.itowns.FeatureProcessing.update,
    //     convert: udviz.itowns.Feature2Mesh.convert(),
    //     source: wfsMaskBSource,
    //     style: new udviz.itowns.Style({
    //       fill:{
    //         color: colorEVAArtif,
    //         base_altitude : 170,
    //       }
    //   })
    // });

    // app.view.addLayer(wfsMaskBLayer);

    // let wfsMaskCSource = new udviz.itowns.WFSSource({
    //     url: geoserverAdress,
    //     protocol: 'wfs',
    //     version: '1.0.0',
    //     id: 'MaskC',
    //     typeName: 'cite:C=B-Batiments',
    //     crs: 'EPSG:3946',
    //     extent: app.extent,
    //     format: 'application/json',
    // });

    // var wfsMaskCLayer = new udviz.itowns.GeometryLayer('MaskC', new udviz.THREE.Group(), {
    //     update: udviz.itowns.FeatureProcessing.update,
    //     convert: udviz.itowns.Feature2Mesh.convert(),
    //     source: wfsMaskCSource,
    //     style: new udviz.itowns.Style({
    //       fill:{
    //         color: colorEVAArtif,
    //         base_altitude : 170,
    //       }
    //   })
    // });
    // app.view.addLayer(wfsMaskCLayer);  

});



