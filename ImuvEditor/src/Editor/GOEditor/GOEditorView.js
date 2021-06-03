/** @format */
import {
  THREE,
  OrbitControls,
  PointerLockControls,
  Game,
  Components,
} from "ud-viz";

import { HeightMapView } from "./Heightmap/HeightmapView";
import { ColliderView } from "./Collider/ColliderView";

import { JSONEditorView } from "../Components/JSONEditor/JSONEditor";

import "./GOEditor.css";
import "../Editor.css";
import { GOEditorModel } from "./GOEditorModel";
import RenderComponent from "ud-viz/src/Game/Shared/GameObject/Components/Render";
import WorldScriptModule from "ud-viz/src/Game/Shared/GameObject/Components/WorldScript";
import { THREEUtils } from "ud-viz/src/Game/Components/THREEUtils";
import JSONUtils from "ud-viz/src/Components/SystemUtils/JSONUtils";
import { MeshEditorView } from "./MeshEditor/MeshEditorView";

const LOCAL_STORAGE_FLAG_JSON = "GOEditor_bufferJSON";
const LOCAL_STORAGE_FLAG_PREFABS = "GOEditor_bufferPrefabs";

export class GOEditorView {
  constructor(config, assetsManager) {
    this.config = config;

    //where ui is append
    this.rootHtml = document.createElement("div");
    this.rootHtml.classList.add("root_GOEditor");

    //where html goes
    this.ui = document.createElement("div");
    this.ui.classList.add("ui_GOEditor");
    this.rootHtml.appendChild(this.ui);

    //where to render
    const canvas = document.createElement("canvas");
    canvas.classList.add("canvas_GOEditor");
    this.canvas = canvas;
    this.rootHtml.appendChild(canvas);

    //to access 3D model
    this.assetsManager = assetsManager;

    //model
    this.model = new GOEditorModel(assetsManager);

    this.pause = false;

    //THREE

    //camera

    this.camera = new THREE.OrthographicCamera(0, 0, 0, 0, -3000, 3000);
    this.camera.up.set(0, 0, 1);

    //renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    THREEUtils.initRenderer(
      this.renderer,
      new THREE.Color(0.4, 0.6, 0.8),
      true
    );

    //controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    //other view
    this.heightMapView = null;

    //json view
    this.jsonEditorView = new JSONEditorView(this);

    //prefabs
    this.prefabs = {};

    //html
    this.input = null; //open a new prefab json
    this.prefabsList = null; //list prefabs openend
    this.opacitySlider = null; //set opacity go material
    this.checkboxGizmo = null; //display or not gizmo
    this.switchControls = null; //switch controls
    this.inputTag = null; //trigger name of meshes
    this.checkboxVisibility = null;
    this.saveGOButton = null; //save the current go as json
    this.focusGOButton = null; //camera focus current go if render comp
    this.focusTopGOButton = null; //camera focus current go if render comp
    this.focusBotGOButton = null; //camera focus current go if render comp
    this.focusRightGOButton = null; //camera focus current go if render comp
    this.focusLeftGOButton = null; //camera focus current go if render comp
    this.focusBackButton = null; //camera focus current go if render comp
    this.focusForwardGOButton = null; //camera focus current go if render comp
    this.newGOButton = null; //reset scene with new go
    this.addHeightmapButton = null; //add heightmap json in current go
    this.addColliderButton = null; //add collider json in current go
    this.addRenderButton = null; //add render json in current go
    this.addScriptButton = null; //add Script json in current go
    this.generateUUIDButton = null; //regenerate all uuid in the go
    this.editMeshesButton = null; //edit Meshes Selected
  }

  setPause(value) {
    this.pause = value;
  }

  enableControls(value) {
    this.controls.enabled = value;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  getCheckboxVisibilityChecked() {
    return this.checkboxVisibility.checked;
  }

  html() {
    return this.rootHtml;
  }

  focusGameObject() {
    this.alignViewToAxis(new THREE.Vector3(0, 0, 1));
  }

  alignViewToAxis(axis) {
    const bbox = this.model.getBoundingBox();
    if (!bbox) return;

    //set target
    const center = bbox.max.clone().lerp(bbox.min, 0.5);
    this.controls.target = center.clone();

    const vectorOne = new THREE.Vector3(1, 1, 1);
    const cameraPos = axis
      .clone()
      .multiply(bbox.max.clone())
      .add(vectorOne.sub(axis.clone()).multiply(center.clone()));
    this.camera.position.copy(cameraPos);

    this.updateCamera();
  }

  tick() {
    requestAnimationFrame(this.tick.bind(this));

    if (this.pause || !this.model) return;

    if (this.controls.update) this.controls.update();

    this.renderer.render(this.model.getScene(), this.camera);
  }

  onResize() {
    const w = this.rootHtml.clientWidth - this.ui.clientWidth;
    const h = this.rootHtml.clientHeight - this.rootHtml.offsetTop;
    this.renderer.setSize(w, h);
    this.updateCamera();
  }

  updateCamera() {
    const bbox = this.model.getBoundingBox();
    if (!bbox) return;
    const w = bbox.max.x - bbox.min.x;
    const h = bbox.max.y - bbox.min.y;
    const max = Math.max(w, h);

    const aspect = this.canvas.width / this.canvas.height;

    this.camera.left = -max;
    this.camera.right = max;
    this.camera.top = max / aspect;
    this.camera.bottom = -max / aspect;

    this.camera.updateProjectionMatrix();
  }

  getModel() {
    return this.model;
  }

  initCallbacks() {
    const _this = this;

    window.addEventListener("resize", this.onResize.bind(this));

    //input
    this.input.addEventListener(
      "change",
      this.readSingleFile.bind(this),
      false
    );

    this.switchControls.onclick = function () {
      _this.controls.dispose();
      if (_this.controls instanceof OrbitControls) {
        console.log("PointerLockControls");
        _this.renderer.domElement.requestPointerLock();
        _this.controls = new PointerLockControls(
          _this.camera,
          _this.renderer.domElement
        );
      } else {
        console.log("OrbitControls");
        _this.controls = new OrbitControls(
          _this.camera,
          _this.renderer.domElement
        );
      }
    };

    //checkbox
    this.checkboxGizmo.oninput = function (event) {
      if (!_this.model) return;
      const value = event.target.checked;
      _this.model.setGizmoVisibility(value);
    };

    //slider
    this.opacitySlider.oninput = function (event) {
      if (!_this.model) return;

      const ratio = parseFloat(event.target.value) / 100;
      const o = _this.model.getGameObject().fetchObject3D();
      if (!o) return;
      o.traverse(function (child) {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = ratio;
        }
      });
    };

    const applyVisibility = function () {
      const visible = this.getCheckboxVisibilityChecked();
      const text = _this.inputTag.value;
      if (_this.model && _this.model.getGameObject()) {
        const object3D = _this.model.getGameObject().fetchObject3D();
        if (!object3D) return;
        const tag = text.toLowerCase();
        object3D.traverse(function (child) {
          const name = child.name.toLowerCase();
          const tag = text.toLowerCase();
          child.visible = !visible;
          if (visible) {
            if (name.includes(tag)) {
              child.visible = visible;
              while (child.parent) {
                child.parent.visible = visible;
                child = child.parent;
              }
              while (child.child) {
                child.child.visible = visible;
                child = child.child;
              }
            }
          } else {
            if (tag != "" && name.includes(tag)) {
              child.visible = visible;
            }
          }
        });
      }
    };

    this.inputTag.onchange = applyVisibility.bind(this);

    this.checkboxVisibility.onchange = applyVisibility.bind(this);

    this.saveGOButton.onclick = function () {
      if (_this.model && _this.model.getGameObject()) {
        const go = _this.model.getGameObject();
        const goJSON = go.toJSON(true); //TODO remove true by changing the default value
        Components.SystemUtils.File.downloadObjectAsJson(goJSON, goJSON.name);
      }
    };

    this.focusGOButton.onclick = this.focusGameObject.bind(this);

    this.focusTopGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(0, 0, 1)
    );
    this.focusBotGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(0, 0, -1)
    );
    this.focusRightGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(-1, 0, 0)
    );
    this.focusLeftGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(1, 0, 0)
    );
    this.focusBackGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(0, -1, 0)
    );
    this.focusForwardGOButton.onclick = this.alignViewToAxis.bind(
      this,
      new THREE.Vector3(0, 1, 0)
    );

    this.newGOButton.onclick = function () {
      const emptyGOJSON = {
        uuid: THREE.MathUtils.generateUUID(),
        name: "My GameObject",
        static: false,
        type: Game.Shared.GameObject.TYPE,
        components: [],
        children: [],
      };
      _this.onOpenNewJSON(emptyGOJSON);
    };

    let hView;
    this.addHeightmapButton.onclick = function () {
      if (hView) return;

      const go = _this.model.getGameObject();

      if (!go) return;

      const r = go.getComponent(RenderComponent.TYPE);

      if (!r) {
        alert("no render component impossible to add heightmap");
        return;
      }

      //add view
      const wrapper = document.createElement("div");

      hView = new HeightMapView(_this);

      const deleteButton = document.createElement("div");
      deleteButton.classList.add("button_Editor");
      deleteButton.innerHTML = "close";
      wrapper.appendChild(deleteButton);

      const bindButton = document.createElement("div");
      bindButton.classList.add("button_Editor");
      bindButton.innerHTML = "bind";
      wrapper.appendChild(bindButton);

      wrapper.appendChild(hView.html());

      _this.jsonEditorView.onJSON(go.toJSON(true));

      _this.ui.appendChild(wrapper);

      deleteButton.onclick = function () {
        wrapper.remove();
        hView.dispose();
        hView = null;
      };

      bindButton.onclick = function () {
        _this.jsonEditorView.onJSON(_this.model.getGameObject().toJSON(true));
      };
    };

    let bView;
    this.addColliderButton.onclick = function () {
      if (bView) return;

      const go = _this.model.getGameObject();

      if (!go) return;

      //add view
      const wrapper = document.createElement("div");

      bView = new ColliderView(_this);

      const deleteButton = document.createElement("div");
      deleteButton.classList.add("button_Editor");
      deleteButton.innerHTML = "close";
      wrapper.appendChild(deleteButton);

      const bindButton = document.createElement("div");
      bindButton.classList.add("button_Editor");
      bindButton.innerHTML = "bind";
      wrapper.appendChild(bindButton);

      wrapper.appendChild(bView.html());

      _this.jsonEditorView.onJSON(go.toJSON(true));

      _this.ui.appendChild(wrapper);

      deleteButton.onclick = function () {
        wrapper.remove();
        bView.dispose();
        bView = null;
      };

      bindButton.onclick = function () {
        _this.jsonEditorView.onJSON(_this.model.getGameObject().toJSON(true));
      };
    };

    this.addRenderButton.onclick = function () {
      const go = _this.model.getGameObject();

      if (!go) return;

      const r = go.getComponent(RenderComponent.TYPE);

      if (r) return;

      go.setComponent(
        RenderComponent.TYPE,
        new RenderComponent(go, { idModel: "cube" })
      );

      _this.jsonEditorView.onJSON(go.toJSON(true));
      _this.focusGameObject();
    };

    this.addScriptButton.onclick = function () {
      const go = _this.model.getGameObject();

      if (!go) return;

      const r = go.getComponent(WorldScriptModule.TYPE);

      if (r) return;

      go.setComponent(WorldScriptModule.TYPE, new WorldScriptModule(go, {}));

      _this.jsonEditorView.onJSON(go.toJSON(true));
      // _this.focusGameObject();
    };

    this.generateUUIDButton.onclick = function () {
      const go = _this.model.getGameObject();

      if (!go) return;
      const json = go.toJSON(true);
      JSONUtils.parse(json, function (j, key) {
        if (key == "uuid") {
          j[key] = THREE.MathUtils.generateUUID();
        }
      });
      _this.jsonEditorView.onJSON(json);
    };

    let mView;
    this.editMeshesButton.onclick = function () {
      if (mView) return;
      //add view
      const wrapper = document.createElement("div");
      mView = new MeshEditorView(_this);
      const deleteButton = document.createElement("div");
      deleteButton.classList.add("button_Editor");
      deleteButton.innerHTML = "close";

      wrapper.appendChild(deleteButton);
      wrapper.appendChild(mView.html());

      _this.ui.appendChild(wrapper);

      deleteButton.onclick = function () {
        wrapper.remove();
        mView.dispose();
        mView = null;
      };
    };

    this.jsonEditorView.onChange(this.jsonOnChange.bind(this));
  }

  jsonOnChange() {
    const buffer = this.model.getGameObject();
    const old = localStorage.getItem(LOCAL_STORAGE_FLAG_JSON);
    try {
      const newString = this.jsonEditorView.computeCurrentString();
      localStorage.setItem(LOCAL_STORAGE_FLAG_JSON, newString);
      this.onGameObjectJSON(JSON.parse(newString));
      this.inputTag.onchange(); //rest visibility
    } catch (e) {
      console.error(e);
      localStorage.setItem(LOCAL_STORAGE_FLAG_JSON, old);
      if (buffer) this.onGameObjectJSON(buffer.toJSON(true));
    }
  }

  initUI() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    this.ui.appendChild(input);
    this.input = input; //ref

    const prefabsList = document.createElement("ul");
    this.ui.appendChild(prefabsList);
    this.prefabsList = prefabsList;

    const saveGOButton = document.createElement("div");
    saveGOButton.classList.add("button_Editor");
    saveGOButton.innerHTML = "Save";
    this.ui.appendChild(saveGOButton);
    this.saveGOButton = saveGOButton;

    const focusGOButton = document.createElement("div");
    focusGOButton.classList.add("button_Editor");
    focusGOButton.innerHTML = "Focus";
    this.ui.appendChild(focusGOButton);
    this.focusGOButton = focusGOButton;

    const focusTopGOButton = document.createElement("div");
    focusTopGOButton.classList.add("button_Editor");
    focusTopGOButton.innerHTML = "Top";
    this.ui.appendChild(focusTopGOButton);
    this.focusTopGOButton = focusTopGOButton;

    const focusBotGOButton = document.createElement("div");
    focusBotGOButton.classList.add("button_Editor");
    focusBotGOButton.innerHTML = "Bot";
    this.ui.appendChild(focusBotGOButton);
    this.focusBotGOButton = focusBotGOButton;

    const focusRightGOButton = document.createElement("div");
    focusRightGOButton.classList.add("button_Editor");
    focusRightGOButton.innerHTML = "Right";
    this.ui.appendChild(focusRightGOButton);
    this.focusRightGOButton = focusRightGOButton;

    const focusLeftGOButton = document.createElement("div");
    focusLeftGOButton.classList.add("button_Editor");
    focusLeftGOButton.innerHTML = "Left";
    this.ui.appendChild(focusLeftGOButton);
    this.focusLeftGOButton = focusLeftGOButton;

    const focusBackGOButton = document.createElement("div");
    focusBackGOButton.classList.add("button_Editor");
    focusBackGOButton.innerHTML = "Back";
    this.ui.appendChild(focusBackGOButton);
    this.focusBackGOButton = focusBackGOButton;

    const focusForwardGOButton = document.createElement("div");
    focusForwardGOButton.classList.add("button_Editor");
    focusForwardGOButton.innerHTML = "Forward";
    this.ui.appendChild(focusForwardGOButton);
    this.focusForwardGOButton = focusForwardGOButton;

    //opacity object slider label
    const labelOpacity = document.createElement("div");
    labelOpacity.innerHTML = "GameObject opacity";
    this.ui.appendChild(labelOpacity);

    //opacity of the gameobject
    const opacitySlider = document.createElement("input");
    opacitySlider.setAttribute("type", "range");
    opacitySlider.value = "100";
    this.ui.appendChild(opacitySlider);
    this.opacitySlider = opacitySlider; //ref

    //label checkbox
    const labelCheckboxGizmo = document.createElement("div");
    labelCheckboxGizmo.innerHTML = "Gizmo Visibility";
    this.ui.appendChild(labelCheckboxGizmo);

    //checkbox
    const checkboxGizmo = document.createElement("input");
    checkboxGizmo.setAttribute("type", "checkbox");
    this.ui.appendChild(checkboxGizmo);
    this.checkboxGizmo = checkboxGizmo;

    //switch controls
    const switchControls = document.createElement("div");
    switchControls.classList.add("button_Editor");
    switchControls.innerHTML = "Switch Controls";
    this.ui.appendChild(switchControls);
    this.switchControls = switchControls;

    //label input visibility
    const objectVisibilityLabel = document.createElement("div");
    objectVisibilityLabel.innerHTML = "Object Tag Visibility";
    this.ui.appendChild(objectVisibilityLabel);

    const wrapperInputsVisibility = document.createElement("div");
    wrapperInputsVisibility.style.display = "flex";
    this.ui.appendChild(wrapperInputsVisibility);

    const inputTag = document.createElement("input");
    inputTag.type = "text";
    wrapperInputsVisibility.appendChild(inputTag);
    this.inputTag = inputTag;

    //label checkbox visibility
    const checkboxVisibilityLabel = document.createElement("div");
    checkboxVisibilityLabel.innerHTML = "Inverse";
    wrapperInputsVisibility.appendChild(checkboxVisibilityLabel);

    const checkboxVisibility = document.createElement("input");
    checkboxVisibility.type = "checkbox";
    wrapperInputsVisibility.appendChild(checkboxVisibility);
    this.checkboxVisibility = checkboxVisibility;

    //new go
    const newGOButton = document.createElement("div");
    newGOButton.classList.add("button_Editor");
    newGOButton.innerHTML = "New";
    this.ui.appendChild(newGOButton);
    this.newGOButton = newGOButton;

    //new heightmap add button
    const addHeightmapButton = document.createElement("div");
    addHeightmapButton.classList.add("button_Editor");
    addHeightmapButton.innerHTML = "Add Heightmap World Script Component";
    this.ui.appendChild(addHeightmapButton);
    this.addHeightmapButton = addHeightmapButton;

    //new collider add button
    const addColliderButton = document.createElement("div");
    addColliderButton.classList.add("button_Editor");
    addColliderButton.innerHTML = "Add Collider Component";
    this.ui.appendChild(addColliderButton);
    this.addColliderButton = addColliderButton;

    //add render
    const addRenderButton = document.createElement("div");
    addRenderButton.classList.add("button_Editor");
    addRenderButton.innerHTML = "Add Render Component";
    this.ui.appendChild(addRenderButton);
    this.addRenderButton = addRenderButton;

    //add World Script
    const addScriptButton = document.createElement("div");
    addScriptButton.classList.add("button_Editor");
    addScriptButton.innerHTML = "Add World Script Component";
    this.ui.appendChild(addScriptButton);
    this.addScriptButton = addScriptButton;

    //uuid
    const generateUUIDButton = document.createElement("div");
    generateUUIDButton.classList.add("button_Editor");
    generateUUIDButton.innerHTML = "Generate uuid in gameobject";
    this.ui.appendChild(generateUUIDButton);
    this.generateUUIDButton = generateUUIDButton;

    //Edit Mesh
    const editMeshesButton = document.createElement("div");
    editMeshesButton.classList.add("button_Editor");
    editMeshesButton.innerHTML = "Edit Meshes";
    this.ui.appendChild(editMeshesButton);
    this.editMeshesButton = editMeshesButton;

    //jsoneditor
    this.ui.appendChild(this.jsonEditorView.html());
  }

  onGameObjectJSON(json) {
    Components.SystemUtils.JSONUtils.parseNumeric(json);
    console.log("onGameObject => ", json);
    const gameobject = new Game.Shared.GameObject(json);
    gameobject.initAssetsComponents(this.assetsManager, Game.Shared);
    this.model.setGameObject(gameobject);
    //TODO notifier hView et bView to updater leur modele
    this.updateUI();
  }

  updateUI() {
    if (this.model.getGameObject()) {
      this.opacitySlider.oninput({ target: this.opacitySlider }); //force update opacity
      this.checkboxGizmo.oninput({ target: this.checkboxGizmo });
    }

    //clean prefabs list and rebuild it
    const list = this.prefabsList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    const _this = this;
    for (let name in this.prefabs) {
      const li = document.createElement("li");
      li.innerHTML = name;
      li.onclick = function () {
        _this.jsonEditorView.onJSON(_this.prefabs[name]);
        _this.focusGameObject();
      };
      list.appendChild(li);
    }
  }

  onOpenNewJSON(json) {
    //json
    this.jsonEditorView.onJSON(json);

    this.focusGameObject();
    this.onResize();
  }

  onOpenNewPrefab(json) {
    this.prefabs[json.name] = json;
    //store localstorage
    localStorage.setItem(LOCAL_STORAGE_FLAG_PREFABS, this.pack(this.prefabs));
    this.updateUI();
  }

  //TODO mettre in component udviz
  pack(jsonArray) {
    const separator = "&";
    let result = "";
    for (let key in jsonArray) {
      result += JSON.stringify(jsonArray[key]);
      result += separator;
    }

    //remove seprator at the end
    if (result.endsWith(separator)) {
      result = result.slice(0, result.length - separator.length);
    }
    return result;
  }

  unpack(string) {
    const separator = "&";
    const prefabs = string.split(separator);
    const result = {};
    prefabs.forEach(function (p) {
      const json = JSON.parse(p);
      result[json.name] = json;
    });

    return result;
  }

  //TODO mettre cette function dans udv.Components.SysteUtils.File
  readSingleFile(e) {
    try {
      var file = e.target.files[0];
      if (!file) {
        return;
      }
      const _this = this;
      var reader = new FileReader();
      reader.onload = function (e) {
        const json = JSON.parse(e.target.result);
        console.log("PREFAB = ", json);
        _this.onOpenNewPrefab(json);
      };

      reader.readAsText(file);
    } catch (e) {
      throw new Error(e);
    }
  }

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.initUI();

      //start tick
      _this.tick();

      _this.initCallbacks();

      _this.model.initScene();

      _this.initFromLocalStorage();

      resolve();
    });
  }

  initFromLocalStorage() {
    const oldJsonString = localStorage.getItem(LOCAL_STORAGE_FLAG_JSON);
    if (oldJsonString != undefined) {
      try {
        this.onOpenNewJSON(JSON.parse(oldJsonString));
      } catch (e) {
        console.error(e);
      }
    }

    const oldPrefabs = localStorage.getItem(LOCAL_STORAGE_FLAG_PREFABS);
    if (oldPrefabs != undefined) {
      try {
        this.prefabs = this.unpack(oldPrefabs);
        this.updateUI();
      } catch (e) {
        console.error(e);
      }
    }
  }
}
