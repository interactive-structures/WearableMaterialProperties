import * as THREE from "three";
const { path2, geom2 } = require("@jscad/modeling").geometries;
const { line, arc, cuboid, polyhedron, cylinder } =
  require("@jscad/modeling").primitives;
const { extrudeLinear } = require("@jscad/modeling").extrusions;
const { mirrorX, mirrorY, translate, rotateX, rotateY } =
  require("@jscad/modeling").transforms;
const { union, subtract, intersect } = require("@jscad/modeling").booleans;
// const { console } = require("@jscad/modeling").utils;


class Module {
  constructor(x, z, iRow, iCol, existing, model) {
    this.x = x;
    this.z = z;
    this.iRow = iRow;
    this.iCol = iCol;
    this.model = model;
    this.group = 1;

    this.hovered = false;
    this.selected = false;
    this.existing = existing;
    this.orientation = true;

    this.hoveredColor = this.colorMap(100, 1, 90);
    this.selectedColor = this.colorMap(0, 1, 90, true);
    this.bottomColor = '#E1E1E1'; //this.colorMap(0, 20, 90);

    this.params = {
      type: "flat", //"arc" / "flat" / "ori" / "cus"
      connected: false,
      height: 9.8,
      angle: 46,
      thickness: 0.4,
      beamLength: 3,
    }

    this.paramsRange = {
      type: ["arc", "flat", "ori", "cus"],
      connected: [false, true],
      height: [1, 20],
      angle: [20, 70],
      thickness: [0.1, 0.8],
      beamLength: [1, 4],
    }

    this.paramsName = {
      type: "Type",
      connected: "Connected",
      height: "Height",
      angle: "Angle",
      thickness: "Thickness",
      beamLength: "Beam Length",
    }

    this.mesh = null;
    this.geometry = null;

    // this.topMesh = null;
    // this.topGeometry = null;
    this.topCSG = null;

    this.bottomMesh = null;
    this.sheetMesh = null;


    this.createMeshes();
    this.updateGeometry();
  }

  // color mapping function
  colorMap(value, min, max, bright=false) {
    // let hue = ((1 - (value - min) / (max - min)) * 120).toString(10);
    let hue = 204;
    let saturation = 85;
    let lightness = (90 - 40) * (1 - (value - min) / (max - min)) + 40;

    if (bright) {
      saturation = 100;
      lightness = 50;
    }

    return ["hsl(", hue, ",",saturation,"%,",lightness , "%)"].join("");

  }

  uploadEndEffector() {
    const fileInput = document.getElementById('topFileInput');
    fileInput.click();

  }

  unSelect() {
    this.selected = false;
    this.updateAppearance();
  }

  select() {
    console.log(this.existing);
    this.selected = true;
    this.updateAppearance();
  }

  hover() {
    this.hovered = true;
    this.updateAppearance();
  }

  unHover() {
    this.hovered = false;
    this.updateAppearance();
  }

  updateAppearance() {
    if (this.hovered) {
      this.setColor(this.hoveredColor);
    } else if (this.selected) {
      this.setColor(this.selectedColor);
    } else {
        let thicknessCoefficient = (this.params.thickness - this.paramsRange.thickness[0]) / (this.paramsRange.thickness[1] - this.paramsRange.thickness[0]);
        let beamLengthCoefficient = 1 - (this.params.beamLength - this.paramsRange.beamLength[0]) / (this.paramsRange.beamLength[1] - this.paramsRange.beamLength[0]);

        let value = thicknessCoefficient * 0.5 + beamLengthCoefficient * 0.5;
        let minimum = 0;
        let maximum = 1;

        let color = this.colorMap(value, minimum, maximum);

        if (this.group === 2) {
          this.setColor('#40E0D0');
        }
        else{
          this.setColor(color);
        }
        
    }

    this.mesh.visible = this.hovered || this.selected || this.existing;
    // this.topMesh.visible = this.hovered || this.selected || this.existing;
    this.bottomMesh.visible = this.hovered || this.selected || this.existing;
    this.sheetMesh.visible = this.hovered || this.selected || this.existing;
  }

  createMeshes() {

    const material = new THREE.MeshPhongMaterial({
      color: this.bottomColor,
      transparent: true,
    });
    material.side = THREE.DoubleSide;
    material.flatShading = true;

    this.createSwitchGeometry();

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.module = this;

    // this.topMesh = new THREE.Mesh(this.topGeometry, material);
    // this.topMesh.position.set(this.x, 0, this.z);
    // this.topMesh.module = this;

    let bottomGeometry = this.createBottomGeometry();

    this.bottomMesh = new THREE.Mesh(bottomGeometry, material);
    this.bottomMesh.position.set(this.x, 0, this.z);
    this.bottomMesh.module = this;

    this.sheetGeometry = this.createSheetGeometry();

    this.sheetMesh = new THREE.Mesh(this.sheetGeometry, material);
    this.sheetMesh.position.set(this.x, 0, this.z);
    this.sheetMesh.module = this;


    this.updateAppearance();
  }

  createSheetGeometry() {
    const params = this.params;
    const angle = params.angle;
    const thickness = params.thickness;
    const beamLength = params.beamLength;
    const height = params.height;
    const connected = params.connected;
    const type = params.type;
    const beamDistance = 0.6;

    const depth = 7;
    const totalWidth = 4;
    const blockWidth = 1;
    const bottomHeight = 1.2;

    function lengthOffsetBeam(offset) {
      return beamLength + offset / Math.tan(angle / 180 * Math.PI) + offset * Math.tan(angle/180 * Math.PI);
    }

    const blockHeight =
      (2 * thickness + beamDistance) / Math.cos((angle * Math.PI) / 180);
    const constrainWidth =
      totalWidth - blockWidth - beamLength * Math.cos((angle * Math.PI) / 180);
    const constrainHeight =
      lengthOffsetBeam(thickness + beamDistance / 2) *
      Math.sin((angle * Math.PI) / 180);
    const totalHeight = Math.max(
      1.2 +
      bottomHeight +
      constrainHeight +
      beamLength * Math.sin((angle * Math.PI) / 180) +
      blockHeight,
      height
    );

    const switchHeight = 1.2 + constrainHeight + thickness / Math.cos(angle * Math.PI / 180) - 0.4;

    let model = null;


    if (this.orientation) {
      model = cuboid({size: [totalWidth * 2 + 1.2 + 0.8, totalWidth * 2 + 1.2 + 0.8, 1.6], center: [0, 0, -(switchHeight + 1.6) / 2]});
    }
    else {
      model = cuboid({size: [totalWidth * 2 + 1.2 + 0.8, totalWidth * 2 + 1.2 + 0.8 + switchHeight + 1.6, 1.6], center: [0, 0, -(totalWidth * 2 + 1.2 + 0.8) / 2]});
    }




    return this.CSG2Geom(model);


  }

  createBottomGeometry() {
    const params = this.params;
    const angle = params.angle;
    const thickness = params.thickness;
    const beamLength = params.beamLength;
    const height = params.height;
    const connected = params.connected;
    const type = params.type;
    const beamDistance = 0.6;

    const depth = 7;
    const totalWidth = 4;
    const blockWidth = 1;
    const bottomHeight = 1.2;

    function lengthOffsetBeam(offset) {
      return beamLength + offset / Math.tan(angle / 180 * Math.PI) + offset * Math.tan(angle/180 * Math.PI);
    }

    const blockHeight =
      (2 * thickness + beamDistance) / Math.cos((angle * Math.PI) / 180);
    const constrainWidth =
      totalWidth - blockWidth - beamLength * Math.cos((angle * Math.PI) / 180);
    const constrainHeight =
      lengthOffsetBeam(thickness + beamDistance / 2) *
      Math.sin((angle * Math.PI) / 180);
    const totalHeight = Math.max(
      1.2 +
      bottomHeight +
      constrainHeight +
      beamLength * Math.sin((angle * Math.PI) / 180) +
      blockHeight,
      height
    );

    const switchHeight = 1.2 + constrainHeight + thickness / Math.cos(angle * Math.PI / 180) - 0.4;

    // let model = translate([0, totalWidth + 0.6 - 1.1, switchHeight / 2 + 0.5],
    //   subtract(
    //     cuboid({size: [totalWidth * 2 + 1.2, totalWidth * 2 + 1.2, switchHeight + 1.6]}),

    //     translate([0, 0, 1.6],
    //       cuboid({size: [totalWidth * 2, 7.2, switchHeight]})
    //     )
    //   )
    // )


    let model = translate([0, totalWidth + 0.6 - 1.1, switchHeight / 2 + 0.5],
      subtract(
      subtract(
      subtract(
        subtract(
          subtract(
            cuboid({size: [totalWidth * 2 + 1.2, totalWidth * 2 + 1.2, switchHeight + 1.6]}),
            translate([0, 0, 1.6],
              cuboid({size: [totalWidth * 2, 7.2, switchHeight]})
            )
          ),
          translate([1.5, 0, -1.5],
            rotateX(Math.PI/2,
              cylinder({
                radius: 0.3,
                height: totalWidth * 2 + 2, // Slightly longer than the model width
                center: [0, 0, 0]
              })
            )
          )
      ),

      translate([-1.5, 0, -1.5],
        rotateX(Math.PI/2,
          cylinder({
            radius: 0.3,
            height: totalWidth * 2 + 2, // Slightly longer than the model width
            center: [0, 0, 0]
          })
        )
      )
    ),

    translate([-1.5, 0, -0.5],
      rotateX(Math.PI/2,
        cylinder({
          radius: 0.3,
          height: totalWidth * 2 + 2, // Slightly longer than the model width
          center: [0, 0, 0]
        })
      )
    ), 
    translate([1.5, 0, -0.5],
      rotateX(Math.PI/2,
        cylinder({
          radius: 0.3,
          height: totalWidth * 2 + 2, // Slightly longer than the model width
          center: [0, 0, 0]
        })
      )
    )
  )
  
  )

    )

    let bottomSheet = translate([0, totalWidth + 0.6 - 1.1, switchHeight / 2 + 0.5],
        cuboid({size: [totalWidth * 2 + 1.2, totalWidth * 2 + 1.2, switchHeight + 1.6]}),
    )

    return this.CSG2Geom(model);

    // this.geometry = geom;
    // return geom;

  }

  createSwitchGeometry() {
    const params = this.params;

    const depth = 6;
    const beamDistance = 0.6;
    const totalWidth = 4;
    const blockWidth = 1;
    const bottomHeight = 1.2;

    const angle = params.angle;
    const thickness = params.thickness;
    const beamLength = params.beamLength;
    const height = params.height;
    const connected = params.connected;
    const type = params.type;

    const blockHeight =
      (2 * thickness + beamDistance) / Math.cos((angle * Math.PI) / 180);
    const constrainWidth =
      totalWidth - blockWidth - beamLength * Math.cos((angle * Math.PI) / 180);
    const constrainHeight =
      lengthOffsetBeam(thickness + beamDistance / 2) *
      Math.sin((angle * Math.PI) / 180);
    const totalHeight = Math.max(
      1.2 +
        bottomHeight +
        constrainHeight +
        beamLength * Math.sin((angle * Math.PI) / 180) +
        blockHeight,
      height
    );

    function lengthOffsetBeam(offset) {
      return (
        beamLength +
        offset / Math.tan((angle * Math.PI) / 180) +
        offset * Math.tan((angle * Math.PI) / 180)
      );
    }

    function getWidth() {
      return Math.min(
        0.8,
        (thickness + beamDistance) * Math.sin((angle * Math.PI) / 180)
      );
    }

    function half(angle, beamLength, thickness) {
      const bottom = cuboid({
        size: [totalWidth, depth, bottomHeight],
        center: [totalWidth / 2, 0, bottomHeight / 2],
      });

      const constraint = translate(
        [totalWidth - constrainWidth, 0, bottomHeight],
        cuboid({
          size: [constrainWidth, depth, constrainHeight],
          center: [constrainWidth / 2, 0, constrainHeight / 2],
        })
      );

      const block = translate(
        [
          0,
          0,
          bottomHeight +
            constrainHeight +
            beamLength * Math.sin((angle * Math.PI) / 180),
        ],
        cuboid({
          size: [blockWidth, depth, blockHeight],
          center: [blockWidth / 2, 0, blockHeight / 2],
        })
      );

      const beam1 = translate(
        [
          blockWidth - thickness * Math.sin((angle * Math.PI) / 180),
          0,
          bottomHeight +
            constrainHeight +
            lengthOffsetBeam(thickness) * Math.sin((angle * Math.PI) / 180) -
            thickness * Math.cos((angle * Math.PI) / 180),
        ],
        rotateY(
          (angle * Math.PI) / 180,
          cuboid({
            size: [lengthOffsetBeam(thickness), depth, thickness],
            center: [lengthOffsetBeam(thickness) / 2, 0, thickness / 2],
          })
        )
      );

      const beam2 = intersect(
        cuboid({
          size: [
            totalWidth,
            depth,
            blockHeight +
              1.2 +
              constrainHeight +
              beamLength * Math.sin((angle * Math.PI) / 180),
          ],
          center: [
            totalWidth / 2,
            0,
            (blockHeight +
              1.2 +
              constrainHeight +
              beamLength * Math.sin((angle * Math.PI) / 180)) /
              2,
          ],
        }),
        translate(
          [
            blockWidth - thickness * Math.sin((angle * Math.PI) / 180),
            0,
            blockHeight +
              1.2 +
              constrainHeight +
              beamLength * Math.sin((angle * Math.PI) / 180) -
              thickness * Math.cos((angle * Math.PI) / 180),
          ],
          rotateY(
            (angle * Math.PI) / 180,
            cuboid({
              size: [
                lengthOffsetBeam(2 * thickness + beamDistance),
                depth,
                thickness,
              ],
              center: [
                lengthOffsetBeam(2 * thickness + beamDistance) / 2,
                0,
                thickness / 2,
              ],
            })
          )
        )
      );

      console.log(getWidth());
      console.log(blockHeight +
        beamLength * Math.sin((angle * Math.PI) / 180) -
        (totalWidth - blockWidth - 0.4) *
        Math.tan((angle * Math.PI) / 180));

      let height = blockHeight +
        beamLength * Math.sin((angle * Math.PI) / 180) -
        (totalWidth - blockWidth - 0.4) *
        Math.tan((angle * Math.PI) / 180);

      if (height < 0) {
        height = 0.1;
      }

      const connector = translate(
        [totalWidth - getWidth(), 0, 1.2 + constrainHeight],
        cuboid({
          size: [
            getWidth(),
            depth,
            height,
          ],
          center: [
            getWidth() / 2,
            0,
            (blockHeight +
              beamLength * Math.sin((angle * Math.PI) / 180) -
              (totalWidth - blockWidth - 0.4) *
                Math.tan((angle * Math.PI) / 180)) /
              2,
          ],
        })
      );

      const wedgePoints = [
        [0, 0, 0],
        [0, depth, 0],
        [0, depth, constrainHeight],
        [0, 0, constrainHeight],
        [-0.8, 0, 0],
        [-0.8, depth, 0],
      ];
      const wedgeFaces = [
        [0, 1, 2, 3],
        [5, 4, 3, 2],
        [0, 4, 5, 1],
        [0, 3, 4],
        [5, 2, 1],
      ];
      const wedge = translate(
        [totalWidth - constrainWidth, -depth / 2, 1.2],
        polyhedron({ points: wedgePoints, faces: wedgeFaces })
      );

      return union(bottom, constraint, block, beam1, beam2, connector, wedge);
    }
    function bistableSwitch(angle, beamLength, thickness) {
      const halfSwitch = half(angle, beamLength, thickness);
      const mirroredHalfSwitch = mirrorX(halfSwitch);

      const hole = translate(
        [
          0,
          0,
          blockHeight / 2 +
            1.2 +
            constrainHeight +
            beamLength * Math.sin((angle * Math.PI) / 180),
        ],
        rotateX(Math.PI / 2, cylinder({ radius: 0.4, height: depth }))
      );

      const switchBody = subtract(union(halfSwitch, mirroredHalfSwitch), hole);

      const padWidth = (totalWidth - constrainWidth) * 2;
      const padDepth = depth;
      const padHeight = 0.6;
      const padHoleRadius = 0.3;

      const pad = subtract(
        translate(
          [-(totalWidth - constrainWidth), 0, 1.2 + 0.6],
          subtract(
            cuboid({
              size: [padWidth, padDepth, padHeight],
              center: [padWidth / 2, 0, padHeight / 2],
            }),
            cuboid({
              size: [1.2, padDepth + 2, 0.8 + 2],
              center: [1.2 / 2, 0, 0.8 / 2],
            })
          )
        ),
        union(
          translate(
            [
              -(totalWidth - constrainWidth - 1.3 - 1),
              1.4,
              (bottomHeight + 0.6 + thickness + 0.5) / 2,
            ],
            cylinder({
              radius: padHoleRadius,
              height: bottomHeight + 0.6 + thickness + 0.5,
            })
          ),
          translate(
            [
              -(totalWidth - constrainWidth - 1.3 - 1),
              -1.4,
              (bottomHeight + 0.6 + thickness + 0.5) / 2,
            ],
            cylinder({
              radius: padHoleRadius,
              height: bottomHeight + 0.6 + thickness + 0.5,
            })
          )
        )
      );

      return union(switchBody, pad);
    }

    function arc(angle, beamLength) {
      const arcRadius = totalWidth;
      const arcThickness = 0.4;

      const arcShape = translate(
        [0, 0, totalHeight - totalWidth],
        intersect(
          rotateX(
            Math.PI / 2,
            subtract(
              cylinder({ radius: arcRadius, height: depth }),
              cylinder({ radius: arcRadius - arcThickness, height: depth })
            )
          ),
          cuboid({
            size: [totalWidth * 2, depth, totalWidth],
            center: [0, 0, totalWidth / 2],
          })
        )
      );

      let foo = Math.max(
        totalHeight -
          1.2 -
          totalWidth -
          (constrainHeight +
            blockHeight +
            beamLength * Math.sin((angle * Math.PI) / 180)) +
          (totalWidth - blockWidth - 0.4) * Math.tan((angle * Math.PI) / 180),
        0
      );

      // foo should be correct here but the position of the arcConnectors are not sure

      const arcConnector1 = translate(
        [
          totalWidth - 0.2,
          0,
          1.2 +
            constrainHeight +
            blockHeight +
            beamLength * Math.sin((angle * Math.PI) / 180) -
            (totalWidth - blockWidth - 0.4) * Math.tan((angle * Math.PI) / 180),
        ],
        cuboid({ size: [0.4, depth, foo] })
      );

      const arcConnector2 = translate(
        [
          -(totalWidth - 0.2),
          0,
          1.2 +
            constrainHeight +
            blockHeight +
            beamLength * Math.sin((angle * Math.PI) / 180) -
            (totalWidth - blockWidth - 0.4) * Math.tan((angle * Math.PI) / 180),
        ],
        cuboid({ size: [0.4, depth, foo] })
      );

      return union(arcShape, arcConnector1, arcConnector2);
    }

    function square(angle, beamLength) {
      return translate(
        [0, 0, totalHeight / 2],
        subtract(
          cuboid({
            size: [totalWidth * 2, depth, totalHeight],
          }),
          cuboid({
            size: [(totalWidth - 0.4) * 2, depth, totalHeight - 0.8],
          })
        )
      );
    }

    function origami(angle, beamLength) {
      //1.2 here is hard-coded, oriHeight here is the totalHeight for origami
      let oriHeight =
        1.2 +
        bottomHeight +
        constrainHeight +
        beamLength * Math.sin((Math.PI * angle) / 180) +
        blockHeight;
      const square = subtract(
        translate(
          [0, 0, oriHeight / 2],
          subtract(
            cuboid({
              size: [totalWidth * 2, depth, oriHeight],
            }),
            cuboid({
              size: [(totalWidth - 0.4) * 2, depth, oriHeight - 0.8],
            })
          )
        ),
        translate(
          [
            -blockWidth,
            -1,
            blockHeight +
              bottomHeight +
              constrainHeight +
              beamLength * Math.sin((Math.PI * angle) / 180),
          ],
          cuboid({
            size: [blockWidth * 2, depth + 2, 3],
            center: [blockWidth, 0, 1.5],
          })
        )
      );

      const tobeSubtracted = translate(
        [0, 0, oriHeight],
        cuboid({
          size: [
            totalWidth,
            depth,
            0.8 +
              oriHeight -
              blockHeight -
              constrainHeight -
              bottomHeight -
              beamLength * Math.sin(angle),
          ],
          center: [
            0,
            0,
            -(
              0.8 +
              oriHeight -
              blockHeight -
              constrainHeight -
              bottomHeight -
              beamLength * Math.sin(angle)
            ) / 2,
          ],
        })
      );

      const origamiConnector = intersect(
        translate(
          [
            0,
            0,
            0.6 +
              blockHeight +
              constrainHeight +
              beamLength * Math.sin((Math.PI * angle) / 180),
          ],
          rotateY(
            (Math.PI * 40) / 180,
            cuboid({ size: [0.4, depth, 3], center: [-0.2, 0, 1.5] })
          )
        ),
        tobeSubtracted
      );

      return union(square, origamiConnector, mirrorX(origamiConnector));
    }

    function custom(csg) {

      return translate(
        [0, 0, totalHeight / 2],
        csg
      )
    }

    // @Jianzhe, three types of cells can be created by type and connected
    // when upwards, stiffnessCell : type = "arc", connnected = false; heightCell : type = "arc", connnected = true
    // when !upwards, stiffnessCell : type = "flat", connnected = false; heightCell : type = "flat", connnected = true
    // origamiCell : type = "ori", connnected = false
    function cell(angle, beamLength, thickness, topCSG) {
      const switchPart = bistableSwitch(angle, beamLength, thickness);
      let endEffector;
      switch (type) {
        case "arc":
          endEffector = arc(angle, beamLength);
          break;
        case "flat":
          endEffector = square(angle, beamLength);
          break;
        case "ori":
          endEffector = origami(angle, beamLength);
          break;
        case "cus":
          endEffector = custom(topCSG);
      }
      if (connected) {
        const connectLength =
          totalHeight -
          (bottomHeight +
            constrainHeight +
            beamLength * Math.sin((angle * Math.PI) / 180) +
            blockHeight);
        const connectBar = translate(
          [
            -0.2,
            0,
            blockHeight + 1.2 + constrainHeight + beamLength * Math.sin(angle),
          ],
          cuboid({ size: [0.4, depth, connectLength], center: [0.2, 0, 0] })
        );
        return union(switchPart, connectBar, endEffector)
      }
      return  union(switchPart, endEffector)
    }

    // get switchPart and endEffector
    const model = cell(angle, beamLength, thickness, this.topCSG);

    this.geometry = this.CSG2Geom(model);
  }

  addToScene(scene) {
    scene.add(this.mesh);
    // scene.add(this.topMesh);
    scene.add(this.bottomMesh);
    scene.add(this.sheetMesh);
  }


  exist() {
    this.existing = true;
    this.mesh.visible = this.hovered || this.existing || this.selected;
    // this.topMesh.visible = this.hovered || this.existing || this.selected;
    this.bottomMesh.visible = this.hovered || this.selected || this.existing;
    this.sheetMesh.visible = this.hovered || this.selected || this.existing;
  }

  unExist() {
    this.existing = false;
    this.mesh.visible = this.hovered || this.existing || this.selected;
    // this.topMesh.visible = this.hovered || this.existing || this.selected;
    this.bottomMesh.visible = this.hovered || this.selected || this.existing;
    this.sheetMesh.visible = this.hovered || this.selected || this.existing;
  }

  updateGeometry() {
    this.createSwitchGeometry();

    this.sheetGeometry = this.createSheetGeometry();

    let bottomGeometry = this.createBottomGeometry();



    if (this.model.orientation) {
      this.geometry.rotateX(-Math.PI / 2);
      // this.topGeometry.rotateX(-Math.PI / 2);

      // this.bottomMesh.rotation.x = -Math.PI / 2;
      bottomGeometry.rotateX(-Math.PI / 2);

    }
    else {
      this.geometry.rotateX(0);
      // this.topGeometry.rotateX(0);
      // this.bottomMesh.rotation.x = 0;
      // this.sheetMesh.rotation.x = 0;
      bottomGeometry.rotateX(0);
    }


    this.sheetGeometry.rotateX(-Math.PI/2);

    // this.sheetMesh.rotation.x = -Math.PI/2;


    this.mesh.geometry.dispose();
    this.mesh.geometry = this.geometry;

    this.sheetMesh.geometry.dispose();
    this.sheetMesh.geometry = this.sheetGeometry;

    this.bottomMesh.geometry.dispose();
    this.bottomMesh.geometry = bottomGeometry;



    // this.topMesh.geometry.dispose();
    // this.topMesh.geometry = this.topGeometry;


  }

  setColor(newColor) {
    const material = new THREE.MeshPhongMaterial({
      color: newColor,
    });
    material.side = THREE.DoubleSide;
    material.flatShading = true;

    this.mesh.material.dispose();
    this.mesh.material = material;
    // this.topMesh.material.dispose();
    // this.topMesh.material = material;
  }

  // convert CSG to three.js geometry
  CSG2Geom(csg) {
    const vertices = [];
    const indices = [];
    let idx = 0;

    const pointAdd = (v) => {
      if (v.index === undefined) {
        v.index = idx++;
        vertices.push(v[0], v[1], v[2] || 0);
      }
    };

    for (let poly of csg.polygons) {
      let arr = poly.vertices;
      arr.forEach(pointAdd);
      let first = arr[0].index;
      for (let i = 2; i < arr.length; i++) {
        indices.push(first, arr[i - 1].index, arr[i].index);
      }
    }
    const geo = new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(vertices), 3)
    );
    geo.setIndex(indices);

    geo.computeVertexNormals();

    return geo;
  }

  exportToObj(geometry) {
    let output = "";

    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");
    const uvs = geometry.getAttribute("uv");
    const indices = geometry.getIndex();

    // Write vertices
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
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
        const a = indices.getX(i) + 1;
        const b = indices.getX(i + 1) + 1;
        const c = indices.getX(i + 2) + 1;
        output += `f ${a} ${b} ${c}\n`;
      }
    } else {
      for (let i = 0; i < positions.count; i += 3) {
        const a = i + 1;
        const b = i + 2;
        const c = i + 3;
        output += `f ${a} ${b} ${c}\n`;
      }
    }

    return output;
  }

  downloadObjFile() {
    const geometry = this.mesh.geometry;
    const obj = this.exportToObj(geometry);
    const blob = new Blob([obj], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // format download name as "module_iRow_iCol.obj"
    link.download = `module_${this.iRow}_${this.iCol}.obj`;
    link.click();
  }

  downloadBottomObjFile() {
    const geometry = this.bottomMesh.geometry;
    const obj = this.exportToObj(geometry);
    const blob = new Blob([obj], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // format download name as "module_iRow_iCol.obj"
    link.download = `bottom.obj`;
    link.click();
  }

  getBottomGeometry() {
    return this.bottomMesh.geometry;
  }


  setTransparency(opacity) {
    // Update all materials
    this.mesh.material.transparent = opacity < 1;
    this.mesh.material.opacity = opacity;
    
    this.bottomMesh.material.transparent = opacity < 1;
    this.bottomMesh.material.opacity = opacity;
    
    this.sheetMesh.material.transparent = opacity < 1;
    this.sheetMesh.material.opacity = opacity;
  }


}

export default Module;
