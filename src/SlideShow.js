import { THREE } from 'ud-viz/src';

/**
 * 
 */
export class SlideShow {
  /**
   * 
   * @param {*} app 
   * @param {*} extent 
   * @param {*} inputManager 
   */
  constructor(app, extent, inputManager) {
    this.app = app;
    const extentCenter = extent.center();
    const geometry = new THREE.PlaneGeometry(
      Math.abs(extent.west - extent.east),
      Math.abs(extent.north - extent.south)
    );

    this.texturesFiles = null;
    this.iCurrentText = 0;

    this.defaultTexture = new THREE.TextureLoader().load(
      'assets/img/planeText.png'
    );

    const material = new THREE.MeshBasicMaterial({
      map: this.defaultTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    this.plane = new THREE.Mesh(geometry, material);

    this.plane.position.set(extentCenter.x, extentCenter.y, 200);
    this.plane.updateMatrixWorld();
    app.view.scene.add(this.plane);
    this.initInput(app, inputManager);
    this.initCBDrop();
  }

  /**
   * 
   */
  initCBDrop() {
    const _this = this;
    const body = document.body;
    body.addEventListener('drop', function (event) {
      _this.texturesFiles = [
        { index: 0, name: 'First', texture: _this.defaultTexture },
      ];
      _this.iCurrentText = 0;
      let items = event.dataTransfer.items;

      for (let i = 0; i < items.length; i++) {
        let item = items[i].webkitGetAsEntry();
        let file = items[i].getAsFile();

        if (item) {
          if (item.isFile) {
            try {
              const reader = new FileReader();
              reader.onload = function (data) {
                _this.texturesFiles.push({
                  index: i + 1,
                  name: file.name,
                  texture: new THREE.TextureLoader().load(data.target.result),
                });
              };
              reader.readAsDataURL(file);
            } catch (e) {
              throw new Error(e);
            }
          }
        }
      }
      _this.setTexture(0);

      console.log(_this.texturesFiles);

      event.preventDefault();
    });

    body.addEventListener(
      'dragover',
      function (event) {
        event.preventDefault();
      },
      false
    );
  }

  /**
   * 
   * @param {*} app 
   * @param {InputManager} iM 
   */
  initInput(app, iM) {
    const plane = this.plane;
    const _this = this;

    // Clamp number between two values with the following line:
    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    iM.addKeyInput('h', 'keydown', function () {
      plane.visible = !plane.visible;
      app.update3DView();
    });
    iM.addKeyInput('ArrowRight', 'keydown', function () {
      if (!_this.texturesFiles) return;
      _this.iCurrentText = clamp(
        _this.iCurrentText + 1,
        0,
        _this.texturesFiles.length - 1
      );
      _this.setTexture(_this.iCurrentText);

      app.update3DView();
    });
    iM.addKeyInput('ArrowLeft', 'keydown', function () {
      if (!_this.texturesFiles) return;
      _this.iCurrentText = clamp(
        _this.iCurrentText - 1,
        0,
        _this.texturesFiles.length - 1
      );
      _this.setTexture(_this.iCurrentText);

      app.update3DView();
    });
  }

  /**
   * 
   * @param {*} iText 
   */
  setTexture(iText) {
    let texture;
    this.texturesFiles.forEach(function (tf) {
      if (tf.index == iText) {
        texture = tf.texture;
      }
    });

    this.plane.material.map = texture;
    const app = this.app;
    app.update3DView();
    // setTimeout(() => {
    // }, 100);
  }

  /**
   * 
   */
  createVideoTexture(){
    const video = document.createElement('video');
    video.src = '/assets/video/videoTemporal.mp4';
    video.autoplay = true;
    video.muted = true;
    video.load();

    video.play();



    const texture = new THREE.VideoTexture( video );
    texture.flipX =false ;

    this.plane.material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    });


  }
}
