// import the necessary modules
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SelectionBox } from 'three/addons/interactive/SelectionBox.js';
import { SelectionHelper } from 'three/addons/interactive/SelectionHelper.js';

let initScene = () => {
  // init scene, camera, renderer
  let scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );

  let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(60, 80, 60);
  camera.lookAt(0, 0, 0);

  let renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  // background color
  // renderer.setClearColor(0xeeeeee, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  // Orbit controls
  let controls = new OrbitControls(camera, renderer.domElement);
  controls.mouseButtons.LEFT = null; // disable left click

  // Selection box
  const selectionBox = new SelectionBox( camera, scene );
  const helper = new SelectionHelper( renderer, 'selectBox' );

  window.shiftDown = false;

  document.addEventListener( 'keydown', function ( event ) {
    if ( event.shiftKey ) {
      window.shiftDown = true;
    }
  });

  document.addEventListener( 'keyup', function ( event ) {
    if ( !event.shiftKey ) {
      window.shiftDown = false;
    }
  });



  document.addEventListener( 'pointerdown', function ( event ) {

    if ( event.button !== 0 ) {
      // hide the selection box
      helper.enabled = false;
    }
    else {
      // enable the selection box
      helper.enabled = true;
    }

    selectionBox.startPoint.set(
      ( event.clientX / window.innerWidth ) * 2 - 1,
      - ( event.clientY / window.innerHeight ) * 2 + 1,
      0.5 );

  } );

  document.addEventListener( 'pointermove', function ( event ) {

    if (!helper.enabled) return;

    if ( helper.isDown ) {

      model.unHoverAll();

      selectionBox.endPoint.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0.5);

      const allSelected = selectionBox.select();
      
      for ( let i = 0; i < allSelected.length; i ++ ) {
        // assert allSelected[i].object is a module
        if (allSelected[i].module !== undefined) {
          let module = allSelected[i].module;
          model.select(module);
        }
      }

    }

  } );


  document.addEventListener( 'pointerup', function ( event ) {
    // if (!helper.enabled) return;

    //
    // selectionBox.endPoint.set(
    //   ( event.clientX / window.innerWidth ) * 2 - 1,
    //   - ( event.clientY / window.innerHeight ) * 2 + 1,
    //   0.5 );
    //
    // const allSelected = selectionBox.select();
  } );


  // light
  let ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  let directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(30, 50, 80);
  scene.add(directionalLight);

  // axis
  const axesHelper = new THREE.AxesHelper( 100 );
  axesHelper.position.y = -4.2;
  scene.add( axesHelper );

  const grid = new THREE.GridHelper(500, 50);
  grid.position.y = -4.2;
  scene.add(grid);


  // animate
  let animate = () => {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
  }

  return {scene, camera, renderer, animate};

}



export { initScene};