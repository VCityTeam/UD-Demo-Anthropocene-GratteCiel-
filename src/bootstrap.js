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
    let geoserverAdress = app.config["geoserver"];

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
            base_altitude: 170.1,
            color: colorLineMetro,
          }
      })
    });

    app.view.addLayer(busLayer);

    // Emprise ------------------------------------
    const emprise_1_Source = new udviz.itowns.FileSource({
      url: 'https://raw.githubusercontent.com/VCityTeam/UD_ReAgent_ABM/master/Data/Data_cc46/Emprise_500_1000.geojson',
      crs: 'EPSG:3946',
      format: 'application/json',
    });
    // Create a ColorLayer for the Ariege area
    const emrpise_1_Layer = new udviz.itowns.ColorLayer('emprise', {
        name: 'Emprise_1',
        transparent: true,
        source: emprise_1_Source,
        style: new udviz.itowns.Style({
            fill: {
                color: 'yellow',
                opacity: 0.5,
            },
            stroke: {
                color: 'white',
            },
        }),
    });
    // Add the Ariege ColorLayer to the view and grant it a tooltip
    app.view.addLayer(emrpise_1_Layer);

    // Emprise 2 ------------------------------------
    const emprise_2_Source = new udviz.itowns.FileSource({
      url: 'https://raw.githubusercontent.com/VCityTeam/UD_ReAgent_ABM/master/Data/Data_cc46/Emprise_500_750.geojson',
      crs: 'EPSG:3946',
      format: 'application/json',
    });
    // Create a ColorLayer for the Ariege area
    const emrpise_2_Layer = new udviz.itowns.ColorLayer('emprise2', {
        name: 'Emprise_2',
        transparent: true,
        source: emprise_2_Source,
        style: new udviz.itowns.Style({
            fill: {
                color: 'green',
                opacity: 0.5,
            },
            stroke: {
                color: 'white',
            },
        }),
    });
    // Add the Ariege ColorLayer to the view and grant it a tooltip
    app.view.addLayer(emrpise_2_Layer);

      // Declare the source for the data on Ariege area ------------------------------------
      const ariegeSource = new udviz.itowns.FileSource({
        url: 'https://raw.githubusercontent.com/VCityTeam/UD_ReAgent_ABM/master/Data/Data_cc46/Buildings_3946.geojson',
        crs: 'EPSG:3946',
        format: 'application/json',
    });
    // Create a ColorLayer for the Ariege area
    const ariegeLayer = new udviz.itowns.ColorLayer('ariege', {
        name: 'building',
        transparent: true,
        source: ariegeSource,
        style: new udviz.itowns.Style({
            fill: {
                color: 'orange',
                opacity: 0.5,
            },
            stroke: {
                color: 'white',
            },
        }),
    });
    // Add the Ariege ColorLayer to the view and grant it a tooltip
    app.view.addLayer(ariegeLayer);

    // Road ----------------------------------
     const roadSource = new udviz.itowns.FileSource({
      url: 'https://raw.githubusercontent.com/VCityTeam/UD_ReAgent_ABM/master/Data/Data_cc46/Roads_3946.geojson',
      crs: 'EPSG:3946',
      format: 'application/json',
    });
    // Create a ColorLayer for the road line
    const roadLayer = new udviz.itowns.ColorLayer('road', {
        name: 'Road',
        transparent: true,
        source: roadSource,
        style: new udviz.itowns.Style({
            fill: {
                color: 'red',
                opacity: 0.5,
            },
            stroke: {
                color: 'black',
            },
        }),
    });
    // Add the Ariege ColorLayer to the view and grant it a tooltip
    app.view.addLayer(roadLayer);
});



