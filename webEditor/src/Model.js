import Module from './Module.js';
import * as THREE from "three";
import Pipe from "./Pipe.js";

// Model class
// includes the grid of modules
class Model {
  constructor(nRowsMax, nColsMax, nRows, nCols, orientation, gapX, gapY) {
    this.scene = null; 

    this.nRows = nRows;
    this.nCols = nCols;
    this.nRowsMax = nRowsMax;
    this.nColsMax = nColsMax;
    this.orientation = true;
    this.gapX = gapX;
    this.gapY = gapY;
    this.gui = null;

    this.xOffset = 10;
    this.yOffset = 10;

    this.mouseDown = false;
    this.mouseDownPos = [0, 0];

    this.selections = [];
    this.hoverings = [];

    this.modules = [];

    for (let iCol = 0; iCol < nColsMax; iCol++) {
      console.log(iCol/this.nCols);
      let modulesRow = [];
      this.modules.push(modulesRow);

      for (let iRow  = 0; iRow < nRowsMax; iRow++) {
        let x = this.xOffset + iCol * gapX;
        let y = null;

        if (this.orientation) {
          y = this.yOffset + iRow * gapX;
        }
        else {
          y = this.yOffset + iRow * gapY;
        }

        let existing = iRow < nRows && iCol < nCols;

        let module = new Module(x, y, iRow, iCol, existing, this);
        modulesRow.push(module);
      }
    }


    this.pipes = []; // Store all pipe meshes

  }

  addToScene(scene) {
    this.modules.forEach((row) => {
      row.forEach((module) => {
        module.addToScene(scene);
      });
    });
  }

  bindEvents(scene, camera, renderer) {
    this.bindHoverEvent(scene, camera, renderer);
    this.bindClickEvent(scene, camera, renderer);
  }

  bindHoverEvent(scene, camera, renderer) {
    renderer.domElement.addEventListener('mousemove',
      (event) => {
        if (this.mouseDown) {
          return;
        }

        this.unHoverAll();

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);

        let modules = this.modules.flat();
        let intersects = raycaster.intersectObjects(modules.map(m => m.mesh));
        if (intersects.length > 0) {
          for (let i = 0; i < intersects.length; i++) {
            let module = intersects[i].object.module;
            this.hover(module);
          }
        }
      }
    );
  }

  bindClickEvent(scene, camera, renderer) {

    renderer.domElement.addEventListener('mousedown',
      (event) => {

        if (!window.shiftDown) {
          model.unSelectAll();
        }

        this.mouseDown = true;
        this.mouseDownPos = [event.clientX, event.clientY];
      }
    );

    renderer.domElement.addEventListener('mouseup',
      (event) => {
        this.mouseDown = false;

        if (event.clientX === this.mouseDownPos[0] && event.clientY === this.mouseDownPos[1]) { // click
          if (this.hoverings.length === 0) {
            this.gui.onUnSelect();
          } else {
            for (let i = 0; i < this.hoverings.length; i++) {
              this.select(this.hoverings[i]);
            }
            this.gui.onSelect();
          }
        }
      }
    );
  }

  bindGUI(gui) {
    this.gui = gui;
  }

  firstSelectedModule() {
    return this.selections[0];
  }

  unSelectAll() {
    for (let i = 0; i < this.selections.length; i++) {
      this.selections[i].unSelect();
    }
    this.selections = [];
  }

  select(module) {
      if (this.selections.includes(module)) {
      }
      else {
        module.select();
        this.selections.push(module);
      }

      window.selected = this.selections[0];
  }

  hover(module) {
    module.hover();
    this.hoverings.push(module);
  }

  unHoverAll() {
    for (let i = 0; i < this.hoverings.length; i++) {
      this.hoverings[i].unHover();
    }
    this.hoverings = [];
  }

  updateVisibility(nRows, nCols) {
    this.modules.forEach((row, i) => {
      row.forEach((module, j) => {
        if (i < nCols && j < nRows) {
          module.exist();
        } else {
          module.unExist();
        }
      });
    });
  }

  updateModules() {
    this.modules.forEach((row) => {
      row.forEach((module) => {
        module.orientation = this.orientation;
        module.updateGeometry();
      });
    });

    for (let iCol = 0; iCol < this.nColsMax; iCol++) {
      let modulesRow = [];
      this.modules.push(modulesRow);

      for (let iRow  = 0; iRow < this.nRowsMax; iRow++) {
        let x = this.xOffset + iCol * this.gapX;
        let y = null;

        if (this.orientation) {
          y = this.yOffset + iRow * this.gapX;
        }
        else {
          y = this.yOffset + iRow * this.gapY;
        }

        this.modules[iRow][iCol].mesh.position.set(x, 0, y);
        this.modules[iRow][iCol].bottomMesh.position.set(x, 0, y);
        this.modules[iRow][iCol].sheetMesh.position.set(x, 0, y);
      }
    }


  }

  addModules() {
    for (let i = 0; i < this.selections.length; i++) {
      let module = this.selections[i];
      module.exist();
    }
    this.unSelectAll();
  }

  removeModules() {
    for (let i = 0; i < this.selections.length; i++) {
      let module = this.selections[i];
      module.unExist();
    }
    this.unSelectAll();
  }

  downloadAllObjFiles() {
    this.modules.forEach((row) => {
      row.forEach((module) => {
        if (module.existing) {
          module.downloadObjFile();
        }
      });
    });

    this.downloadBottom();

  }
  //
  // downloadBottom() {
  //   // get all bottom Geometries in a list
  //   let geometries = [];
  //   this.modules.forEach((row) => {
  //     row.forEach((module) => {
  //       if (module.existing) {
  //         geometries.push(module.getBottomGeometry());
  //       }
  //     });
  //   });
  //
  //   const group = new THREE.Group();
  //   group.add(...geometries);
  //
  //   this.exportToObj(group);
  //
  //
  //
  //
  // }


  downloadBottom() {
    // get all bottom Geometries in a list
    let geometries = [];
    this.modules.forEach((row) => {
      row.forEach((module) => {
        if (module.existing) {
          geometries.push(module.bottomMesh);
          geometries.push(module.sheetMesh);
        }
      });
    });

    const objData = this.exportToObj(geometries);

    // Create a Blob with the OBJ data
    const blob = new Blob([objData], { type: "text/plain" });

    // Create a download link and trigger the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bottom.obj";
    link.click();
  }

  exportToObj(geometries) {
    let output = "";
    let vertexOffset = 0;

    geometries.forEach((geometry) => {
      let mesh = geometry;
      geometry = geometry.geometry;


      const positions = geometry.getAttribute("position");
      const normals = geometry.getAttribute("normal");
      const uvs = geometry.getAttribute("uv");
      const indices = geometry.getIndex();

      // Write vertices
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) + mesh.position.x;
        const y = positions.getY(i) + mesh.position.y;
        const z = positions.getZ(i) + mesh.position.z;
        output += `v ${x} ${y} ${z}\n`;
      }

      // Write normals
      if (normals !== undefined) {
        for (let i = 0; i < normals.count; i++) {
          const nx = normals.getX(i);
          const ny = normals.getY(i);
          const nz = normals.getZ(i);
          output += `vn ${nx} ${ny} ${nz}\n`;
        }
      }

      // Write UV coordinates
      if (uvs !== undefined) {
        for (let i = 0; i < uvs.count; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
          output += `vt ${u} ${v}\n`;
        }
      }

      // Write face indices
      if (indices !== null) {
        for (let i = 0; i < indices.count; i += 3) {
          const a = indices.getX(i) + 1 + vertexOffset;
          const b = indices.getX(i + 1) + 1 + vertexOffset;
          const c = indices.getX(i + 2) + 1 + vertexOffset;
          output += `f ${a} ${b} ${c}\n`;
        }
      } else {
        for (let i = 0; i < positions.count; i += 3) {
          const a = i + 1 + vertexOffset;
          const b = i + 2 + vertexOffset;
          const c = i + 3 + vertexOffset;
          output += `f ${a} ${b} ${c}\n`;
        }
      }

      vertexOffset += positions.count;
    });

    return output;
  }

  setGroup(module, groupNumber) {
    module.group = groupNumber;
    module.updateAppearance();
  }


  setSelectedToGroup(groupNumber) {
    for (let i = 0; i < this.selections.length; i++) {
        this.setGroup(this.selections[i], groupNumber);
    }
  }

  getUnitPipePoints(module, groupNumber) {
    // Points for single unit: bottom front -> middle -> bottom back
    let x_offset = 1.5;
    if (groupNumber === 1) {
      x_offset = 1.5;
    }
    else if (groupNumber === 2) {
      x_offset = -1.5;
    }

    let y_offset = 7.5;
    let z_offset = (4 * 2 + 1.2) / 2.0;
    let wall_thickness = 1.3;

    let z_shift = 0;
    if (groupNumber === 1) {
      z_shift = -0.15;
    }
    else {
      z_shift = 0.15;
    }
    
    let y_bottom = -0.5
    return {
        p0: [module.x, y_bottom + z_shift, module.z - z_offset],
        p1: [module.x, y_bottom + z_shift, module.z - z_offset + wall_thickness],
        p2: [module.x, y_offset + z_shift, module.z - z_offset + wall_thickness],
        p3: [module.x, y_offset + z_shift, module.z + z_offset - wall_thickness],
        p4: [module.x, y_bottom + z_shift, module.z + z_offset - wall_thickness],
        p5: [module.x, y_bottom + z_shift, module.z + z_offset]
    };
  }

  getUnitPipePointsBack(module, groupNumber) {
    // Points for single unit: bottom front -> middle -> bottom back
    let x_offset = 1.5;
    let y_offset = 7.5;
    let z_offset = (4 * 2 + 1.2) / 2.0;
    let wall_thickness = 1.3;
    
    let y_bottom = -0.5

    let z_shift = -1;

    if (groupNumber === 1) {
      z_shift = -0.15;
    }
    else {
      z_shift = 0.15;
    }

    return {
        p0: [module.x  - 2, y_bottom + 2 + z_shift, module.z - z_offset],
        p1: [module.x  - 2, y_bottom + 2 + z_shift, module.z - z_offset + wall_thickness],
        p2: [module.x + 1, y_bottom + 2 + z_shift, module.z - 1],

        p3: [module.x + 1, y_bottom + 3 + z_shift, module.z - 1],
        p4: [module.x + 1, y_bottom + 3 + z_shift, module.z + 1],

        p5: [module.x + 1, y_bottom + 2 + z_shift, module.z + 1],
        p6: [module.x  - 2, y_bottom + 2 + z_shift, module.z + z_offset - wall_thickness],
        p7: [module.x  - 2, y_bottom + 2 + z_shift, module.z + z_offset]
    };


  }

  createPipes() {

      let radius = 0.15;

      this.removePipes();


      this.setModulesTransparency(true);

      let pa = null;
      let pb = null;

      // Process each visible unit
      this.modules.forEach((row, colIndex) => {
          row.forEach((module, rowIndex) => {

              if (!module.existing) return;

              let points = this.getUnitPipePoints(module, 1);

              if (rowIndex === 0) {
                pa = points.p0;
              }
              
              // Create vertical pipes for this unit
              if (module.group === 1) {
                  // Group 1: Create front to middle to back

                  this.pipes.push(Pipe.createStraightPipe(points.p0, points.p1, radius, 1));
                  this.pipes.push(Pipe.createStraightPipe(points.p1, points.p2, radius, 1));
                  this.pipes.push(Pipe.createStraightPipe(points.p2, points.p3, radius, 1));
                  this.pipes.push(Pipe.createStraightPipe(points.p3, points.p4, radius, 1));
                  this.pipes.push(Pipe.createStraightPipe(points.p4, points.p5, radius, 1));
                  
              } else if (module.group === 2) {
                  // Group 2: Create direct front to back
                  this.pipes.push(Pipe.createStraightPipe(points.p0, points.p5, radius, 1));
              }

              // Connect to next unit in same row if exists
              if (rowIndex < row.length - 1 && row[rowIndex + 1].existing) {
                  const nextPoints = this.getUnitPipePoints(row[rowIndex + 1], 1);
                  this.pipes.push(Pipe.createStraightPipe(points.p5, nextPoints.p0, radius, 1));
              }

              //  going back
              points = this.getUnitPipePointsBack(module, 1);

              if (rowIndex === 0) {
                pb = points.p0;
              }

              this.pipes.push(Pipe.createStraightPipe(points.p0, points.p1, radius, 1));
              this.pipes.push(Pipe.createStraightPipe(points.p1, points.p2, radius, 1));
              this.pipes.push(Pipe.createStraightPipe(points.p2, points.p3, radius, 1));
              this.pipes.push(Pipe.createStraightPipe(points.p3, points.p4, radius, 1));
              this.pipes.push(Pipe.createStraightPipe(points.p4, points.p5, radius, 1));
              this.pipes.push(Pipe.createStraightPipe(points.p5, points.p6, radius, 1));
              this.pipes.push(Pipe.createStraightPipe(points.p6, points.p7, radius, 1));
              
              if (rowIndex < row.length - 1 && row[rowIndex + 1].existing) {
                  const nextPoints = this.getUnitPipePointsBack(row[rowIndex + 1]);
                  this.pipes.push(Pipe.createStraightPipe(points.p7, nextPoints.p0, radius, 1));
              }

              if (rowIndex === 0) {
                this.pipes.push(Pipe.createStraightPipe(pa, pb, radius, 1));
              }


          });
      });


      // group 2

      // Process each visible unit
      this.modules.forEach((row, colIndex) => {
        row.forEach((module, rowIndex) => {
            if (!module.existing) return;

            let points = this.getUnitPipePoints(module, 2);

            if (rowIndex === 0) {
              pa = points.p0;
            }
            
            // Create vertical pipes for this unit
            if (module.group === 2) {
                // Group 1: Create front to middle to back

                this.pipes.push(Pipe.createStraightPipe(points.p0, points.p1, radius, 2));
                this.pipes.push(Pipe.createStraightPipe(points.p1, points.p2, radius, 2));



                this.pipes.push(Pipe.createStraightPipe(points.p2, points.p3, radius, 2));

                // [module.x - 7.5 - 2, -0.5 + 2, module.z - (4 * 2 + 1.2) / 2.0],



                this.pipes.push(Pipe.createStraightPipe(points.p3, points.p4, radius, 2));
                this.pipes.push(Pipe.createStraightPipe(points.p4, points.p5, radius, 2));
                
            } else if (module.group === 1) {
                // Group 2: Create direct front to back
                this.pipes.push(Pipe.createStraightPipe(points.p0, points.p5, radius, 2));
            }

            // Connect to next unit in same row if exists
            if (rowIndex < row.length - 1 && row[rowIndex + 1].existing) {
                const nextPoints = this.getUnitPipePoints(row[rowIndex + 1], 2);
                this.pipes.push(Pipe.createStraightPipe(points.p5, nextPoints.p0, radius, 2));
            }

            //  going back
            points = this.getUnitPipePointsBack(module, 2);

            if (rowIndex === 0) {
              pb = points.p0;
            }

            this.pipes.push(Pipe.createStraightPipe(points.p0, points.p1, radius, 2));
            this.pipes.push(Pipe.createStraightPipe(points.p1, points.p2, radius, 2));
            this.pipes.push(Pipe.createStraightPipe(points.p2, points.p3, radius, 2));
            this.pipes.push(Pipe.createStraightPipe(points.p3, points.p4, radius, 2));
            this.pipes.push(Pipe.createStraightPipe(points.p4, points.p5, radius, 2));
            this.pipes.push(Pipe.createStraightPipe(points.p5, points.p6, radius, 2));
            this.pipes.push(Pipe.createStraightPipe(points.p6, points.p7, radius, 2));
            
            if (rowIndex < row.length - 1 && row[rowIndex + 1].existing) {
                const nextPoints = this.getUnitPipePointsBack(row[rowIndex + 1]);
                this.pipes.push(Pipe.createStraightPipe(points.p7, nextPoints.p0, radius, 2));
            }

            if (rowIndex === 0) {
              this.pipes.push(Pipe.createStraightPipe(pa, pb, radius, 2));
            }


        });
    });

      // Add all pipes to scene
      this.pipes.forEach(pipe => {
          if (pipe) this.scene.add(pipe);
      });
  }

  
  removePipes() {
    this.pipes.forEach(pipe => {
        if (pipe) {
            this.scene.remove(pipe);
            pipe.geometry.dispose();
            pipe.material.dispose();
        }
    });
    this.pipes = [];

    this.setModulesTransparency(false);
  }

  updateVisibility(nRows, nCols) {
      this.modules.forEach((row, i) => {
          row.forEach((module, j) => {
              if (i < nCols && j < nRows) {
                  module.exist();
              } else {
                  module.unExist();
              }
          });
      });
  }

  setModulesTransparency(transparent) {
    const opacity = transparent ? 0.3 : 1.0; // 0.3 for semi-transparent, 1.0 for opaque
    
    this.modules.forEach((row) => {
        row.forEach((module) => {
            module.setTransparency(opacity);
        });
    });
  }


}

export default Model;
