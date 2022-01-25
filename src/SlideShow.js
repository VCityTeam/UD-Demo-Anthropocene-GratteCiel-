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
    this.currentTextureFiles = null;

    this.notifyValue = false;

    this.defaultTexture = new THREE.TextureLoader().load(
      'assets/img/planeText.png'
    );

    const material = new THREE.MeshBasicMaterial({
      map: this.defaultTexture,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 0.9,
    });
    this.plane = new THREE.Mesh(geometry, material);

    this.plane.position.set(extentCenter.x, extentCenter.y, 200);
    this.plane.updateMatrixWorld();
    app.view.scene.add(this.plane);
    this.initInput(app, inputManager);
    this.initCBDrop();
    const _this = this;
    const tick = function () {
      requestAnimationFrame(tick);
      _this.notifyChangeEachFrame();
    };
    tick();
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
      _this.currentTextureFiles = _this.texturesFiles[0];
      const files = Array.from(event.dataTransfer.files);

      files.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (file) {
          try {
            const reader = new FileReader();

            reader.onload = function (data) {
              if (file.type.includes('image/')) {
                _this.texturesFiles.push({
                  index: i + 1,
                  name: file.name,
                  texture: new THREE.TextureLoader().load(data.target.result),
                });
              } else if (file.type.includes('video/')) {
                const video = document.createElement('video');
                video.src = data.target.result;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                video.load();

                const videoTexture = new THREE.VideoTexture(video);
                videoTexture.center.set(0.5, 0.5);

                videoTexture.rotation = -Math.PI / 2;

                _this.texturesFiles.push({
                  index: i + 1,
                  name: file.name,
                  texture: videoTexture,
                  video: video,
                });
              }
            };

            reader.readAsDataURL(file);
          } catch (e) {
            throw new Error(e);
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
    const _this = this;
    if (this.currentTextureFiles.video) {
      this.currentTextureFiles.video.pause();
      this.currentTextureFiles.video.currentTime = 0;
      this.notifyValue = false;
    }
    this.texturesFiles.forEach(function (tf) {
      if (tf.index == iText) {
        _this.currentTextureFiles = tf;
        if (tf.video) {
          tf.video.play();
          _this.notifyValue = true;
        }
      }
    });

    this.plane.material.map = this.currentTextureFiles.texture;
    const app = this.app;
    app.update3DView();
  }

  notifyChangeEachFrame() {
    if (this.notifyValue) {
      this.app.update3DView();
    }
  }

  /**
   *
   */
  createVideoTexture() {
    const video = document.createElement('video');
    video.src = '/assets/video/videoTemporal.mp4';
    video.autoplay = true;
    video.muted = true;
    video.load();

    video.play();

    const texture = new THREE.VideoTexture(video);

    this.plane.material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
  }
}
