/** @format */

//Components
import { Widgets, Components, itowns, proj4, THREE, jquery, Deck, GeoJsonLayer, ArcLayer } from '../../index';
const ModuleView = Widgets.Components.ModuleView;
const $3DTemporalBatchTable = Widgets.$3DTemporalBatchTable;
const $3DTemporalBoundingVolume = Widgets.$3DTemporalBoundingVolume;
const $3DTemporalTileset = Widgets.$3DTemporalTileset;

import './AllWidget.css';


// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

const INITIAL_VIEW_STATE = {
  latitude: 51.47,
  longitude: 0.45,
  zoom: 4,
  bearing: 0,
  pitch: 30
};


/**
 * Represents the base HTML content of a demo for UD-Viz and provides methods to
 * dynamically add module views.
 */
export class AllWidget {
  constructor() {
    this.modules = {};
    this.moduleNames = {};
    this.moduleActivation = {};
    this.moduleBindings = {};
    this.requireAuthModules = [];
    this.authService;
    this.config = {};
    this.parentElement;
    this.view; // itowns view (3d scene)
    this.extent; // itowns extent (city limits)
    this.controls;
    /**
     * Object used to manage all of the layer.
     *
     * @type {LayerManager}
     */
    this.layerManager;
  }

  start(path) {
    return new Promise( resolve => {
      const _this = this;
      this.appendTo(document.body);
      this.loadConfigFile(path).then(() => {
      // Use the stable server
        _this.addLogos();

        // Initialize iTowns 3D view
        _this.init3DView();

        resolve('resolved');
      });
    });
  }


  /**
   * Returns the basic html content of the demo
   */
  get html() {
    return /*html*/ `
            <header id="${this.headerId}">
                <div>
                    <h1>UD-Viz &bull;</h1>
                    <div id="${this.authFrameLocationId}"></div>
                </div>
                <div id="_all_widget_struct_header_panel">
                    <p style="display: inline-block; color: white; margin: 0;">
                        Icons made by <a href="https://www.freepik.com/"
                        title="Freepik">Freepik</a> from
                        <a href="https://www.flaticon.com/"
                        title="Flaticon">www.flaticon.com</a><br> is licensed by
                        <a href="http://creativecommons.org/licenses/by/3.0/"
                        title="Creative Commons BY 3.0" target="_blank">
                        CC 3.0 BY</a>
                    </p>
                </div>
            </header>
            <div id="_all_widget_stuct_main_panel">
                <nav>
                    <ul id="${this.menuId}">
                    </ul>
                </nav>
                <section id="${this.contentSectionId}">
                    <div id="${this.viewerDivId}">
                    </div>
                    <canvas id="deck-canvas" style="z-index: 2;"></canvas>
                </section>
            </div>
        `;
  }

  addLogos() {
    const logos = this.config.assets.logos;
    const imageFolder = this.config.assets.imageFolder;

    for (let i = 0; i < logos.length; i++) {
      var img = document.createElement('img');
      img.src = imageFolder.concat('/'.concat(logos[i]));
      img.classList.add('logos');
      var src = document.getElementById('_all_widget_struct_header_panel');
      src.appendChild(img);
    }
  }

  /**
   * Returns the html element representing the upper-left frame of the UI,
   * which contains informations
   * about the logged in user.
   */
  get authenticationFrameHtml() {
    return /*html*/ `
            <div id="${this.authenticationMenuLoggedInId}">
                <div id="${this.authenticationUserNameId}"></div>
                <button type="button" id="${this.authenticationLogoutButtonId}"
                class="logInOut">Logout</button>
            </div>
            <div id="${this.authenticationMenuLoggedOutId}">
                <button type="button" id="${this.authenticationLoginButtonId}"
                class="logInOut">Sign in</button>
            </div>
        `;
  }

  /**
   * Appends the demo HTML to an HTML element.
   *
   * @param htmlElement The parent node to add the demo into. The
   * recommended way of implementing the demo is simply to have an
   * empty body and call this method with `document.body` as
   * parameter.
   */
  appendTo(htmlElement) {
    this.parentElement = htmlElement;
    let div = document.createElement('div');
    div.innerHTML = this.html;
    div.id = this.mainDivId;
    htmlElement.appendChild(div);
  }

  //////// MODULE MANAGEMENT

  /**
   * Adds a new module view to the demo.
   *
   * @param moduleId A unique id. Must be a string without spaces. It
   * will be used to generate some HTML ids in the page. It will also
   * be used to look for an icon to put with the button
   * @param moduleClass The module view class. Must implement some
   * methods (`enable`, `disable` and `addEventListener`). The
   * recommended way of implementing them is to extend the
   * `ModuleView` class, as explained [on the
   * wiki](https://github.com/MEPP-team/UD-Viz/wiki/Generic-demo-and-modules-with-ModuleView-&-BaseDemo).
   * @param options An object used to specify various options.
   * `options.name` allows you to specify the name that will be
   * displayed in the toggle button. By default, it makes a
   * transformation of the id (like this : myModule -> My Module).
   * `options.type` is the "type" of the module view that defines how
   * it is added to the demo. The default value is `MODULE_VIEW`,
   * which simply adds a toggle button to the side menu. If set to
   * `AUTHENTICATION_MODULE`, an authentication frame will be created
   * in the upper left corner of the page to contain informations
   * about the user. `options.requireAuth` allows you to
   * specify if this module can be shown without authentication (ie.
   * if no user is logged in). The default value is `false`. If set to
   * `true`, and no athentication module was loaded, it has no effect
   * (the module view will be shown). `options.binding` is the shortcut
   * key code to toggle the module. By default, no shortcut is created.
   */
  addModuleView(moduleId, moduleClass, options = {}) {
    if (
      typeof moduleClass.enable !== 'function' ||
      typeof moduleClass.disable !== 'function'
    ) {
      throw 'A module must implement at least an enable() and a disable() methods';
    }

    //Default name is the id transformed this way :
    // myModule -> My Module
    // my_module -> My module
    let moduleName = moduleId
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase());
    let type = AllWidget.MODULE_VIEW;
    let requireAuth = false;
    if (options) {
      if (options.type) {
        if (
          options.type === AllWidget.MODULE_VIEW ||
          options.type === AllWidget.AUTHENTICATION_MODULE
        ) {
          type = options.type;
        } else {
          throw `Invalid value for option 'type' : '${options.type}'`;
        }
      }
      if (options.name) {
        moduleName = options.name;
      }
      if (options.requireAuth) {
        requireAuth = options.requireAuth;
      }
    }
    const binding = options.binding;

    this.modules[moduleId] = moduleClass;
    this.moduleNames[moduleName] = moduleId;
    this.moduleActivation[moduleId] = false;

    moduleClass.addEventListener(ModuleView.EVENT_ENABLED, () => {
      this.moduleActivation[moduleId] = true;
    });
    moduleClass.addEventListener(ModuleView.EVENT_DISABLED, () => {
      this.moduleActivation[moduleId] = false;
    });

    switch (type) {
      case AllWidget.MODULE_VIEW:
        //create a new button in the menu
        this.createMenuButton(moduleId, moduleName, binding);
        break;
      case AllWidget.AUTHENTICATION_MODULE:
        this.createAuthenticationFrame(moduleId);
        break;
      default:
        throw `Unknown module type : ${type}`;
    }

    if (requireAuth) {
      this.requireAuthModules.push(moduleId);
      this.updateAuthentication();
    }

    if (binding) {
      this.moduleBindings[binding] = moduleId;
    }
  }

  /**
   * Creates a new button in the side menu.
   * @param moduleId The module id.
   * @param buttonText The text to display in the button.
   * @param {String} [accessKey] The key binding for the module.
   */
  createMenuButton(moduleId, buttonText, accessKey) {
    let button = document.createElement('li');
    button.id = this.getModuleButtonId(moduleId);
    button.innerHTML = `<p class="_all_widget_menu_hint">${buttonText}</p>`;
    if (accessKey) {
      button.accessKey = accessKey;
    }
    this.menuElement.appendChild(button);
    let icon = document.createElement('img');

    //creating an icon
    icon.setAttribute(
      'src',
      `${this.config.assets.iconFolder}/${moduleId}.svg`
    );
    icon.className = 'menuIcon';
    button.insertBefore(icon, button.firstChild);

    //define button behavior
    button.onclick = (() => {
      this.toggleModule(moduleId);
    }).bind(this);
    let moduleClass = this.getModuleById(moduleId);

    //dynamically color the button
    moduleClass.parentElement = this.viewerDivElement.parentElement;
    moduleClass.addEventListener(ModuleView.EVENT_ENABLED, () => {
      button.className = 'choiceMenu choiceMenuSelected';
    });
    moduleClass.addEventListener(ModuleView.EVENT_DISABLED, () => {
      button.className = 'choiceMenu';
    });
    moduleClass.disable();
  }

  /**
   * Creates an authentication frame for the authentication module.
   * @param authModuleId The id of the authentication module.
   */
  createAuthenticationFrame(authModuleId) {
    let frame = document.createElement('div');
    frame.id = this.authenticationFrameId;
    frame.innerHTML = this.authenticationFrameHtml;
    this.authFrameLocationElement.appendChild(frame);
    const authView = this.getModuleById(authModuleId);
    authView.parentElement = this.viewerDivElement.parentElement;
    const authService = authView.authenticationService;
    this.authenticationLoginButtonElement.onclick = () => {
      if (this.isModuleActive(authModuleId)) {
        authView.disable();
      } else {
        authView.enable();
      }
    };
    this.authenticationLogoutButtonElement.onclick = () => {
      try {
        authService.logout();
      } catch (e) {
        console.error(e);
      }
    };

    authService.addObserver(this.updateAuthentication.bind(this));
    this.authService = authService;
    this.updateAuthentication();
  }

  /**
   * This method should be called when the authentication state changes
   *  (ie. a user log in / out), or when a module is added. It has two
   *  purposes :
   *  1. To update the upper-left square of the side menu (which contains
   *     use informations)
   *  2. To show / hide the modules that require authentication (as defined
   *     by the `options` parameter in the method `addModuleView`
   */
  updateAuthentication() {
    if (this.authService) {
      if (this.authService.isUserLoggedIn()) {
        const user = this.authService.getUser();
        this.authenticationMenuLoggedInElement.hidden = false;
        this.authenticationMenuLoggedOutElement.hidden = true;
        this.authenticationUserNameElement.innerHTML = `Logged in as <em>${user.firstname} ${user.lastname}</em>`;
        for (let mid of this.requireAuthModules) {
          this.getModuleButton(mid).style.removeProperty('display');
        }
      } else {
        this.authenticationMenuLoggedInElement.hidden = true;
        this.authenticationMenuLoggedOutElement.hidden = false;
        for (let mid of this.requireAuthModules) {
          this.getModuleButton(mid).style.setProperty('display', 'none');
        }
      }
    }
  }

  /**
   * Returns if the module view is currently enabled or not.
   * @param moduleId The module id.
   */
  isModuleActive(moduleId) {
    return this.moduleActivation[moduleId];
  }

  /**
   * Returns the module view class by its id.
   * @param moduleId The module id.
   */
  getModuleById(moduleId) {
    return this.modules[moduleId];
  }

  /**
   * If the module view is enabled, disables it, else, enables it.
   * @param moduleId The module id.
   */
  toggleModule(moduleId) {
    if (!this.isModuleActive(moduleId)) {
      this.getModuleById(moduleId).enable();
    } else {
      this.getModuleById(moduleId).disable();
    }
  }

  getModuleButtonId(moduleId) {
    return `_all_widget_menu_button${moduleId}`;
  }

  // Get module button element
  getModuleButton(moduleId) {
    return document.getElementById(this.getModuleButtonId(moduleId));
  }

  /**
   * Adds WMS elevation Layer of Lyon in 2012 and WMS imagery layer of Lyon in 2009 (from Grand Lyon data).
   */
  addBaseMapLayer() {
    let wmsImagerySource = new itowns.WMSSource({
      extent: this.extent,
      name: this.config['background_image_layer']['name'],
      url: this.config['background_image_layer']['url'],
      version: this.config['background_image_layer']['version'],
      projection: this.config['projection'],
      format: this.config['background_image_layer']['format'],
    });
    // Add a WMS imagery layer
    let wmsImageryLayer = new itowns.ColorLayer(
      this.config['background_image_layer']['layer_name'],
      {
        updateStrategy: {
          type: itowns.STRATEGY_DICHOTOMY,
          options: {},
        },
        source: wmsImagerySource,
        transparent: true,
      }
    );
    this.view.addLayer(wmsImageryLayer);
  }

  addElevationLayer() {
    // Add a WMS elevation source
    let wmsElevationSource = new itowns.WMSSource({
      extent: this.extent,
      url: this.config['elevation_layer']['url'],
      name: this.config['elevation_layer']['name'],
      projection: this.config['projection'],
      heightMapWidth: 256,
      format: this.config['elevation_layer']['format'],
    });
    // Add a WMS elevation layer
    let wmsElevationLayer = new itowns.ElevationLayer(
      this.config['elevation_layer']['layer_name'],
      {
        useColorTextureElevation: true,
        colorTextureElevationMinZ: 144,
        colorTextureElevationMaxZ: 622,
        source: wmsElevationSource,
      }
    );
    this.view.addLayer(wmsElevationLayer);
  }

  /**
   * Create an iTowns 3D Tiles layer based on the specified layerConfig.
   * @param {string} layerConfig The name of the layer to setup from the
   * generalDemoConfig.json config file (should be one of the properties
   * of the 3DTilesLayer object in
   * UD-Viz/UD-Viz-Core/examples/data/config/generalDemoConfig.json
   * config file).
   */
  setup3DTilesLayer() {
    //  ADD 3D Tiles Layer

    // Positional arguments verification
    if (!this.config['3DTilesLayer']) {
      throw (
        'Your layer is not one of the properties of 3DTilesLayer object ' +
        '(in UD-Viz/UD-Viz-Core/examples/data/config/generalDemoConfig.json).'
      );
    }
    if (
      !this.config['3DTilesLayer']['id'] ||
      !this.config['3DTilesLayer']['url']
    ) {
      throw (
        'Your layer does not have url id properties or both. ' +
        '(in UD-Viz/UD-Viz-Core/examples/data/config/generalDemoConfig.json)'
      );
    }

    const extensionsConfig = this.config['3DTilesLayer']['extensions'];
    let extensions = new itowns.C3DTExtensions();
    if (extensionsConfig) {
      for (let i = 0; i < extensionsConfig.length; i++) {
        if (extensionsConfig[i] === '3DTILES_temporal') {
          extensions.registerExtension('3DTILES_temporal', {
            [itowns.C3DTilesTypes.batchtable]: $3DTemporalBatchTable,
            [itowns.C3DTilesTypes.boundingVolume]: $3DTemporalBoundingVolume,
            [itowns.C3DTilesTypes.tileset]: $3DTemporalTileset,
          });
        } else if (extensionsConfig[i] === '3DTILES_batch_table_hierarchy') {
          extensions.registerExtension('3DTILES_batch_table_hierarchy', {
            [itowns.C3DTilesTypes.batchtable]:
              itowns.C3DTBatchTableHierarchyExtension,
          });
        } else {
          console.warn(
            'The 3D Tiles extension ' +
              extensionsConfig[i] +
              ' specified in generalDemoConfig.json is not supported ' +
              'by UD-Viz yet. Only 3DTILES_temporal and ' +
              '3DTILES_batch_table_hierarchy are supported.'
          );
        }
      }
    }

    var $3dTilesLayer = new itowns.C3DTilesLayer(
      this.config['3DTilesLayer']['id'],
      {
        name: 'Lyon-2015-'.concat(this.config['3DTilesLayer']['id']),
        source: new itowns.C3DTilesSource({
          url: this.config['3DTilesLayer']['url'],
        }),
        registeredExtensions: extensions,
      },
      this.view
    );

    let material;
    if (this.config['3DTilesLayer']['pc_size']) {
      material = new THREE.PointsMaterial({
        size: this.config['3DTilesLayer']['pc_size'],
        vertexColors: true,
      });
    } else if (!this.config['3DTilesLayer']['color']) {
      material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    } else {
      material = new THREE.MeshLambertMaterial({
        color: parseInt(this.config['3DTilesLayer']['color']),
      });
    }

    $3dTilesLayer.overrideMaterials = material;
    $3dTilesLayer.material = material;

    const $3DTilesManager = new Widgets.Components.TilesManager(
      this.view,
      $3dTilesLayer
    );
    this.layerManager.tilesManagers.push($3DTilesManager);

    return [$3dTilesLayer, $3DTilesManager];
  }

  /**
   * Adds the specified 3D Tiles layer to the iTowns 3D view.
   * @param {itowns.C3DTilesLayer} layer The layer to add to itowns view.
   */
  add3DTilesLayer(layer) {
    itowns.View.prototype.addLayer.call(this.view, layer);
  }

  /**
   * Sets up a 3D Tiles layer and adds it to the itowns view (for the demos
   * that don't need more granularity than that).
   * @param {string} layerConfig The name of the layer to setup from the
   * generalDemoConfig.json config file (should be one of the properties
   * of the 3DTilesLayer object in
   * UD-Viz/UD-Viz-Core/examples/data/config/generalDemoConfig.json
   * config file).
   */
  setupAndAdd3DTilesLayer() {
    const [$3DTilesLayer] = this.setup3DTilesLayer();
    this.add3DTilesLayer($3DTilesLayer);
  }

  /**
   * Initializes the iTowns 3D view according the config.
   */
  init3DView() {
    proj4.default.defs(
      'EPSG:3946',
      '+proj=lcc +lat_1=45.25 +lat_2=46.75' +
        ' +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    );

    // Define geographic extent: CRS, min/max X, min/max Y
    // area should be one of the properties of the object extents in config file
    let min_x = parseInt(this.config['extents']['min_x']);
    let max_x = parseInt(this.config['extents']['max_x']);
    let min_y = parseInt(this.config['extents']['min_y']);
    let max_y = parseInt(this.config['extents']['max_y']);
    this.extent = new itowns.Extent(
      this.config['projection'],
      min_x,
      max_x,
      min_y,
      max_y
    );

    // Get camera placement parameters from config
    let coordinates = this.extent.center();
    if (
      this.config['camera']['position']['x'] &&
      this.config['camera']['position']['y']
    ) {
      coordinates = new itowns.Coordinates(
        'EPSG:3946',
        parseInt(this.config['camera']['position']['x']),
        parseInt(this.config['camera']['position']['y'])
      );
    }
    let heading = parseFloat(this.config['camera']['position']['heading']);
    let range = parseFloat(this.config['camera']['position']['range']);
    let tilt = parseFloat(this.config['camera']['position']['tilt']);

    // `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
    let viewerDiv = document.getElementById('viewerDiv');
    // Instantiate PlanarView (iTowns' view that will hold the layers)
    // The skirt allows to remove the cracks between the terrain tiles
    // Instantiate controls within PlanarView
    this.view = new itowns.PlanarView(viewerDiv, this.extent, {
      disableSkirt: false,
      controls: {
        maxZenithAngle: 180,
        groundLevel: -100,
        handleCollision: false,
      },
      placement: {
        coord: coordinates,
        heading: heading,
        range: range,
        tilt: tilt,
      },
    });
    this.layerManager = new Widgets.Components.LayerManager(this.view);

    // ********* 3D Elements
    // Lights
    let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 0, 20000);
    directionalLight.updateMatrixWorld();
    this.view.scene.add(directionalLight);

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    ambientLight.position.set(0, 0, 3000);
    directionalLight.updateMatrixWorld();
    this.view.scene.add(ambientLight);

    // Controls
    this.controls = this.view.controls;

    // Set sky color to blue
    this.view.mainLoop.gfxEngine.renderer.setClearColor(0x6699cc, 1);
  }
  /*
   * Updates the 3D view by notifying iTowns that it changed (e.g. because a layer has been added).
   */
  update3DView() {
    // Request itowns view redraw
    this.view.notifyChange();
  }

  /**
   * Loads a config file. Module views should only be added after calling
   * this method.
   * @param filePath The path to the config file.
   */
  async loadConfigFile(filePath) {
    //loading configuration file
    // see https://github.com/MEPP-team/VCity/wiki/Configuring-UDV
    return jquery.ajax({
      type: 'GET',
      url: filePath,
      datatype: 'json',
      success: (data) => {
        this.config = data;
      },
      error: () => {
        throw 'Could not load config file : ' + filePath;
      },
    });
  }
  /**
   * Deckgl view
   */
  initDeckgl(){
    /*var extent = new itowns.Extent(
      'EPSG:3857',
      -20026376.39, 20026376.39,
      -20048966.10, 20048966.10);
  
    // `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
    var viewerDiv = document.getElementById('viewerDiv');
  
    // Instanciate PlanarView
    // By default itowns' tiles geometry have a "skirt" (ie they have a height),
    // but in case of orthographic we don't need this feature, so disable it
    var view = new itowns.PlanarView(viewerDiv, extent, { disableSkirt: false, maxSubdivisionLevel: 10,
        placement: new itowns.Extent('EPSG:3857', -20000000, 20000000, -8000000, 20000000),
    });*/
    var viewD;

    const deck = new Deck({
      canvas: 'deck-canvas',
      width: '100%',
      height: '100%',
      initialViewState: INITIAL_VIEW_STATE,
      map: false,
      controller: true,
      onViewStateChange: ({viewState}) => {

        proj4.default.defs(
          'EPSG:3946',
          '+proj=lcc +lat_1=45.25 +lat_2=46.75' +
            ' +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
        );
    
        // Define geographic extent: CRS, min/max X, min/max Y
        // area should be one of the properties of the object extents in config file
        let min_x = parseInt(this.config['extents']['min_x']);
        let max_x = parseInt(this.config['extents']['max_x']);
        let min_y = parseInt(this.config['extents']['min_y']);
        let max_y = parseInt(this.config['extents']['max_y']);
        this.extent = new itowns.Extent(
          this.config['projection'],
          min_x,
          max_x,
          min_y,
          max_y
        );
    
        // Get camera placement parameters from config
        let coordinates = this.extent.center();
        if (
          this.config['camera']['position']['x'] &&
          this.config['camera']['position']['y']
        ) {
          coordinates = new itowns.Coordinates(
            'EPSG:3946',
            parseInt(this.config['camera']['position']['x']),
            parseInt(this.config['camera']['position']['y'])
          );
        }
        let heading = parseFloat(this.config['camera']['position']['heading']);
        let range = parseFloat(this.config['camera']['position']['range']);
        let tilt = parseFloat(this.config['camera']['position']['tilt']);
    
        // `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
        let viewerDiv = document.getElementById('viewerDiv');
        // Instantiate PlanarView (iTowns' view that will hold the layers)
        // The skirt allows to remove the cracks between the terrain tiles
        // Instantiate controls within PlanarView

        viewD = new itowns.PlanarView(viewerDiv, this.extent, { disableSkirt: false, maxSubdivisionLevel: 10,
          placement: new itowns.Extent('EPSG:3857', -20000000, 20000000, -8000000, 20000000),
        });

        console.log(this.extent);
        

        /*var viewD = new itowns.PlanarView(viewerDiv, this.extent, {
          disableSkirt: false,
          controls: {
            maxZenithAngle: 180,
            groundLevel: -100,
            handleCollision: false,
          },
          placement: {
            coord: coordinates,
            heading: heading,
            range: range,
            tilt: tilt,
          },
        });
        this.layerManager = new Widgets.Components.LayerManager(viewD);*/

        // ********* 3D Elements
        // Lights
        /*let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 0, 20000);
        directionalLight.updateMatrixWorld();
        this.view.scene.add(directionalLight);

        let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        ambientLight.position.set(0, 0, 3000);
        directionalLight.updateMatrixWorld();
        this.view.scene.add(ambientLight);*/

        // Controls
        this.controls = viewD.controls;

        // Set sky color to blue
        viewD.mainLoop.gfxEngine.renderer.setClearColor(0x6699cc, 1);


        const cam3D = viewD.camera.camera3D;
        const prev = itowns.CameraUtils.getTransformCameraLookingAtTarget(viewD, cam3D);
        const newPos = prev;
        newPos.coord = new itowns.Coordinates('EPSG:4326', viewState.longitude, viewState.latitude, 0);
    
        // newPos.range = 64118883.098724395 / (2**(viewState.zoom-1));
        newPos.range = 64118883 / (2**(viewState.zoom-1)); // 64118883 is Range at Z=1 
        newPos.heading = viewState.bearing;
        // for some reason I cant access Math.clamp
        //newPos.tilt = math.clamp((90 - viewState.pitch), 0, 90); 
    
        itowns.CameraUtils.transformCameraToLookAtTarget(viewD, cam3D, newPos);
        viewD.notifyChange();
        cam3D.updateMatrixWorld();
        // We can set pitch and bearing to 0 to disable tilting and turning 
        // viewState.pitch = 0;
        // viewState.bearing = 0;
        viewD.notifyChange();
        return viewState;
      }/*,
      layers: [
        new GeoJsonLayer({
          id: 'airports',
          data: AIR_PORTS,
          // Styles
          filled: true,
          pointRadiusMinPixels: 2,
          pointRadiusScale: 2000,
          getPointRadius: f => 11 - f.properties.scalerank,
          getFillColor: [200, 0, 80, 180],
          // Interactive props
          pickable: true,
          autoHighlight: true,
          onClick: info =>
            // eslint-disable-next-line
            info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
        }),
        new ArcLayer({
          id: 'arcs',
          data: AIR_PORTS,
          dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
          // Styles
          getSourcePosition: f => [-0.4531566, 51.4709959], // London
          getTargetPosition: f => f.geometry.coordinates,
          getSourceColor: [0, 128, 200],
          getTargetColor: [200, 0, 80],
          getWidth: 1
        })
      ]*/
    });

    viewD.notifyChange();
  }

  ////////////////////////////////////////////////////////
  // GETTERS FOR HTML IDS AND ELEMENTS OF THE DEMO PAGE //
  ////////////////////////////////////////////////////////

  get mainDivId() {
    return '_all_widget';
  }

  get headerId() {
    return '_all_widget_header';
  }

  get headerElement() {
    return document.getElementById(this.headerId);
  }

  get authFrameLocationId() {
    return '_all_widget_auth_frame_location';
  }

  get authFrameLocationElement() {
    return document.getElementById(this.authFrameLocationId);
  }

  get contentSectionId() {
    return 'contentSection';
  }

  get contentSectionElement() {
    return document.getElementById(this.contentSectionId);
  }

  get viewerDivId() {
    return 'viewerDiv';
  }

  get viewerDivElement() {
    return document.getElementById(this.viewerDivId);
  }

  get menuId() {
    return '_all_widget_menu';
  }

  get menuElement() {
    return document.getElementById(this.menuId);
  }

  get authenticationFrameId() {
    return '_all_widget_profile';
  }

  get authenticationFrameElement() {
    return document.getElementById(this.authenticationFrameId);
  }

  get authenticationLogoutButtonId() {
    return '_all_widget_button_logout';
  }

  get authenticationLogoutButtonElement() {
    return document.getElementById(this.authenticationLogoutButtonId);
  }

  get authenticationLoginButtonId() {
    return '_all_widget_button_login';
  }

  get authenticationLoginButtonElement() {
    return document.getElementById(this.authenticationLoginButtonId);
  }

  get authenticationMenuLoggedInId() {
    return '_all_widget_profile_menu_logged_in';
  }

  get authenticationMenuLoggedInElement() {
    return document.getElementById(this.authenticationMenuLoggedInId);
  }

  get authenticationMenuLoggedOutId() {
    return '_all_widget_profile_menu_logged_out';
  }

  get authenticationMenuLoggedOutElement() {
    return document.getElementById(this.authenticationMenuLoggedOutId);
  }

  get authenticationUserNameId() {
    return '_all_widget_profile_name';
  }

  get authenticationUserNameElement() {
    return document.getElementById(this.authenticationUserNameId);
  }

  static get MODULE_VIEW() {
    return 'MODULE_VIEW';
  }

  static get AUTHENTICATION_MODULE() {
    return 'AUTHENTICATION_MODULE';
  }
}
