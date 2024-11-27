import type {Object3D} from 'three';
import type {BillboardProps} from '@pmndrs/vanilla';
import {Billboard as BillboardImpl} from '@pmndrs/vanilla';
import {Component} from '@/manager/component';

export interface Options {
  object: Object3D;
  billboardConfig?: BillboardProps;
}

export class Billboard extends Component<Options> {
  readonly name = 'Billboard';

  billboard?: ReturnType<typeof BillboardImpl>;

  create() {
    const {object, billboardConfig = {}} = this.options;
    const billboard = BillboardImpl();
    billboard.group.add(object);
    billboard.updateProps(billboardConfig);
    this.billboard = billboard;
    this.object3D = billboard.group;
  }

  updateProps(props: BillboardProps) {
    this.billboard?.updateProps(props);
  }

  update() {
    this.billboard?.update(this.viz!.camera);
  }

  dispose() {
    super.dispose();
    this.billboard = undefined;
  }
}
