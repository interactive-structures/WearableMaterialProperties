// Pipe.js
import * as THREE from 'three';

class Pipe {
  static createStraightPipe(startPoint, endPoint, radius = 0.2, groupNumber = 1) {
    const start = new THREE.Vector3(startPoint[0], startPoint[1], startPoint[2]);
    const end = new THREE.Vector3(endPoint[0], endPoint[1], endPoint[2]);
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
    let color = 0x4682B4;

    if (groupNumber === 2) {
      color = 0x40E0D0;
    }


    const material = new THREE.MeshPhongMaterial({ color: color });
    
    const pipe = new THREE.Mesh(geometry, material);
    
    // Position and orient the cylinder
    pipe.position.copy(start);
    pipe.position.addScaledVector(direction, 0.5);
    pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    
    return pipe;
  }
}

export default Pipe;