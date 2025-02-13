import { GUI } from 'lil-gui';

class Gui {
  constructor(model) {
    this.model = model;

    this.gui = new GUI();
    this.globalFolder = this.gui.addFolder('Edit surface contour');

    this.moduleFolder = this.gui.addFolder('Edit selected cells');
    this.moduleFolder.open();

    this.groupFolder = this.gui.addFolder('Group cells');

    this.exportFolder = this.gui.addFolder('Export models');
    this.createGlobalFolder();
    this.globalFolder.open();
    this.groupFolder.open();

  }

  getModuleValues() {
    let values = [];
    for (let controller of this.moduleFolder.controllers) {

      if (controller._hasSlider) {
        let value = controller.getValue();
        values.push(value);
      }
    }
    return values;
  }

  onSelect() {
    this.onUnSelect();
    this.createModuleFolder(this.model.firstSelectedModule());
  }

  onUnSelect() {
    this.destroyModuleFolder();
  }

  // once a module is selected, create a folder for it
  createModuleFolder(selectedModule) {
    const params = selectedModule.params;
    const paramsRange = selectedModule.paramsRange;
    const paramsName = selectedModule.paramsName;

    for (let i = 0; i < Object.keys(params).length; i++) {
      const key = Object.keys(params)[i];

      // if is number
      if (typeof paramsRange[key][0] === 'number') {
        this.moduleFolder[paramsName[key]] = this.moduleFolder.add(selectedModule.params, key, paramsRange[key][0], paramsRange[key][1], 0.1).name(paramsName[key]);
      }
      // if is boolean
      else if (typeof paramsRange[key][0] === 'boolean') {
        this.moduleFolder[paramsName[key]] = this.moduleFolder.add(selectedModule.params, key).name(paramsName[key]);
      }
      // if is string
      else if (typeof paramsRange[key][0] === 'string') {
        this.moduleFolder[paramsName[key]] = this.moduleFolder.add(selectedModule.params, key, paramsRange[key]).name(paramsName[key]);
      }
    }

    for (let controller of this.moduleFolder.controllers) {
      controller.onChange((value) => {
        // get the name of the controller
        const paramKey = controller.property;

        for (let i = 0; i < this.model.selections.length; i++) {
          let module = this.model.selections[i];

          module.params[paramKey] = value;

          module.updateGeometry();
        }
      })
    }

    // this.moduleFolder.downloadObjFile = this.moduleFolder.add(selectedModule, 'downloadObjFile').name('Download OBJ file');
    this.moduleFolder.uploadEndEffector = this.moduleFolder.add(selectedModule, 'uploadEndEffector').name('Upload End Effector');
  }

  // once no module is selected, destroy the folder
  destroyModuleFolder() {
    try {
      while (this.moduleFolder.controllers.length > 0) {
        this.moduleFolder.controllers[0].destroy();
      }
    } catch (e) {
    }
  }

  createGlobalFolder() {
    this.globalFolder.nRows = this.globalFolder.add(model, 'nRows', 1, 50, 1).name('Num of Rows');
    this.globalFolder.nCols = this.globalFolder.add(model, 'nCols', 1, 50, 1).name('Num of Columns');
    this.globalFolder.nRows.onChange((value) => {
      this.model.updateVisibility(this.globalFolder.nRows.getValue(), this.globalFolder.nCols.getValue());
    })
    this.globalFolder.nCols.onChange((value) => {
      this.model.updateVisibility(this.globalFolder.nRows.getValue(), this.globalFolder.nCols.getValue());
    })

    this.globalFolder.orientation = this.globalFolder.add(model, 'orientation').name('Upwards?');
    this.globalFolder.orientation.onChange((value) => {
      this.model.updateModules();
    })

    this.globalFolder.Add = this.globalFolder.add(model, 'addModules').name('Add Modules');
    this.globalFolder.Remove = this.globalFolder.add(model, 'removeModules').name('Remove Modules');

    this.exportFolder.downloadObjFiles = this.exportFolder.add(model, 'downloadAllObjFiles').name('Download All OBJ Files');

    this.groupFolder.setGroup1 = this.groupFolder.add(model, 'setSelectedToGroup').name('Set to Group 1');
    this.groupFolder.setGroup2 = this.groupFolder.add(model, 'setSelectedToGroup').name('Set to Group 2');

    // Set up the button callbacks
    this.groupFolder.setGroup1.onChange(() => {
      model.setSelectedToGroup(1);
    });
    this.groupFolder.setGroup2.onChange(() => {
      model.setSelectedToGroup(2);
    });

    this.groupFolder.showPipes = this.groupFolder.add(model, 'createPipes').name('Show tendons');
    this.groupFolder.hidePipes = this.groupFolder.add(model, 'removePipes').name('Hide tendons');
  }
}



export { Gui };