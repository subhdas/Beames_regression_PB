class BoidContainer {
  constructor(config) {
    let {
      scene,
      x,
      y,
      modtype
    } = config
    this.scene = scene
    this.position = createVector(x, y)
    this.modtype = modtype
    this.wid = 400
    this.ht = 400
    //later can connect with input x and y
    if(this.modtype == 'reg'){
      this.x = p5D.wid*0.52
      this.y = p5D.ht*0.05
    }else{
      this.x = p5D.wid*0.05
      this.y = p5D.ht*0.05
    }
    this.container = null
    this.container_view()
  }

  container_view() {
    this.container = this.scene.add.container(this.x, this.y).setInteractive();
    this.graphics = this.scene.add.graphics().setInteractive()
    // console.log('checking ', this.scene, this.scene.input)
    // this.scene.input.setDraggable(this.container);
    this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
      this.show()
    });
  }


  show() {
    this.graphics.clear();
    this.graphics.lineStyle(2, 0xff0000);
    this.graphics.strokeRectShape(this.container.getBounds());
  }
}
