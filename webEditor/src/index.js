import "./styles/main.css";

import {initScene} from "./Scene";
import Model from './Model';
import { Gui } from './Gui';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { fromGeometry } from '@jscad/modeling/src/geometries/geom3';
import { deserialize } from '@jscad/io';
import { geometries } from '@jscad/modeling';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


let {scene, camera, renderer, animate} = initScene();

// add model
let model = new Model(5, 5, 2, 2, true, 10, 12.5);
model.addToScene(scene);
model.scene = scene;
model.bindEvents(scene, camera, renderer);
window.model = model;

// add gui
let gui = new Gui(model);
model.bindGUI(gui);
window.gui = gui;

const fileInput = document.getElementById('topFileInput');
fileInput.addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const contents = e.target.result;
    loadOBJGeometry(contents);
  };

  reader.readAsText(file);
}




function loadOBJGeometry(objContents) {
  const loader = new OBJLoader();
  const object = loader.parse(objContents);

  object.traverse(function (child) {
    if (child instanceof THREE.Mesh) {

      let geometry = child.geometry;

      geometry = BufferGeometryUtils.mergeVertices(geometry);

      function convertToCSG(geometry) {
        const positions = geometry.attributes.position.array;
        const indices = geometry.index.array;

        const polygons = [];

        for (let i = 0; i < indices.length; i += 3) {
          const a = indices[i];
          const b = indices[i + 1];
          const c = indices[i + 2];

          const vertex1 = [positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]];
          const vertex2 = [positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]];
          const vertex3 = [positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]];

          polygons.push([vertex1, vertex2, vertex3]);
        }

        const csg = geometries.geom3.fromPoints(polygons);
        return csg;
      }

      const csg = convertToCSG(geometry);

      // for all modules that are selected
      model.modules.forEach((row, i) => {
        row.forEach((module, j) => {
          if (module.selected) {
            module.topCSG = csg;
          } else {

          }
        });
      });

    }
  });
}

// start animation
animate();
