import { THREE } from 'ud-viz/src';

export class SlideShow {
  constructor(app, extent) {
    const extentCenter = extent.center();
    const geometry = new THREE.PlaneGeometry(
      extent.west - extent.east,
      extent.north - extent.south
    );
    const texture = new THREE.TextureLoader().load('assets/img/planeText.png');

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const plane = new THREE.Mesh(geometry, material);

    plane.position.set(extentCenter.x, extentCenter.y, 100);
    plane.updateMatrixWorld();
    app.view.scene.add(plane);
  }
}
