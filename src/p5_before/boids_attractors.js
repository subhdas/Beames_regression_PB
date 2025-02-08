/*
CLASS HOLDING AN ATTRACTOR POINT WHERE BOIDS GETS ATTRACTED TO  ===================================================================================================
*/
class Attractor {

  constructor(x, y) {
    this.scene = p5D.scene;
    this.position = createVector(x, y);
    this.r = 6
    this.col = Phaser.Display.Color.GetColor(255, 0, 100)
    // this.ciratt = scene.add.circle(x, y, this.r)
    // this.ciratt.setFillStyle(this.col, 0.6);
    // this.ciratt.setStrokeStyle(1, this.col, 1);


    // ADD A SEPARATOR LINE
    let linecol = '0xC9C9C9'
    var line = this.scene.add.line(0, 0, x, y, x, y + 5000, linecol);
    line.setStrokeStyle(0.1, linecol, 0.1);
  }

  show() {
    this.ciratt.x = this.position.x
    this.ciratt.y = this.position.y
  }

  update_pos(x, y) {
    this.position = createVector(x, y);
  }
}



/*
CLASS TO RENDER AND REPRESENT BOIDS FOR MODELS  ===========================================================================================================
*/
class Boid {
  constructor(config) {
    let {
      scene,
      x,
      y,
      modresults,
      attractor,
      modtype
    } = config
    this.scene = scene;
    this.modtype = modtype
    this.container = p5D.bodcontainerlist[this.modtype].container
    // debugger
    this.wid = scene.game.config.width;
    this.ht = scene.game.config.height;
    this.modresults = modresults
    this.id = modresults['id']
    this.acceleration = createVector(0, 0);
    this.velocity = p5.Vector.random2D();
    this.position = createVector(x, y);
    this.attractor = attractor
    this.tooltipclass = 'tooltip_boid'
    this.tooltipclassId = 'tooltip_boid_' + this.id
    this.r = modresults['r2_score']
    this.r = map(this.r, 0, 1, 10, 70);
    // console.log('compare orig and mapped radius ', this.r, modresults['r2_score'])

    this.maxspeed = 5; // Maximum speed
    this.maxforce = 0.5; // Maximum steering force
    this.dead = false;
    this.add_geom()
    console.log('NEW BOID CREATED ... ', this.scene, ' ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ ');
  }

  add_geom() {
    this.col = Phaser.Display.Color.GetColor(100, 54, 2)
    if (this.modtype == 'tf') this.col = Phaser.Display.Color.GetColor(135, 15, 200)
    this.hovcol = Phaser.Display.Color.GetColor(50, 154, 200)
    console.log('MOD RESULTS ', this.modresults);
    let strokewid = constrain(this.modresults['colsuse'].length, 1, 5)

    //ADD CIRCLES
    // this.circleboid = scene.add.circle(this.position.x, this.position.y, this.r).setInteractive()
    //ADD ROUNDED RECTANGLE
    this.circleboid = this.scene.add.rexRoundRectangle(this.position.x, this.position.y, this.r, this.r, 3, this.col).setInteractive()

    this.circleboid.setFillStyle(this.col, 0.6);
    this.circleboid.setStrokeStyle(strokewid, this.col, 1);
    this.scene.input.setDraggable(this.circleboid);


    this.hover = false;
    this.circleboid.on('pointerover', (pointer, localX, localY, event) => {
      this.tooltiptextDOM_show()
      this.scene.children.bringToTop(this.circleboid);
      this.hover = true;
    })

    this.circleboid.on('pointerout', (pointer) => {
      this.tooltiptextDOM_hide();
      this.hover = false;
    })

    this.circleboid.on('pointerdown', (pointer, localX, localY, event) => {
      // console.log('CLICK DOWN', pointer)
      this.add_json()
      // ...
    });

    this.circleboid.on('pointerup', (pointer, localX, localY, event) => {
      // console.log('CLICK UP', pointer)
      // ...
    });
    this.circleboid.on('drag', (gameObject, dragX, dragY) => {
      this.position.x = dragX;
      this.position.y = dragY;
    });
    if (this.container) this.container.add(this.circleboid);
  }


  add_json() {
    $("#json").remove()
    let content = `<pre id="json"></pre>`;
    $("body").append(content);
    let jsondata = JSON.stringify(p5D.modman.modellist[this.id], undefined, 2);
    $("#json").html(jsondata)
  }

  run(boids) {
    if (!this.dead) {
      this.flock(boids);
      this.update();
      this.borders_reverse()
    }
    this.show();
  }

  tooltiptextDOM_hide() {
    $('#' + this.tooltipclassId).remove();
    this.circleboid.setFillStyle(this.col, 0.6);
  }

  tooltiptextDOM_show() {
    let px = this.scene.input.mousePointer.x,
      py = this.scene.input.mousePointer.y
    let mx = px + 10,
      my = py + 10
    $('#' + this.tooltipclassId).remove();
    let str = `<div class = ${this.tooltipclass} id = ${this.tooltipclassId}></div>`
    $('body').append(str);

    let content = `<span> Mod ID | Name: ${this.id} | ${this.modresults['name']} </span>
                   <span> Mod R2_Score: ${this.modresults['r2_score'].toFixed(3)}</span>
                   <span> Mod RMSE: ${this.modresults['rmse'].toFixed(3)} </span>
                   <span> Num Cols Used: ${this.modresults['colsuse'].length} | ${this.modresults['colsuse']} </span>
                  `;
    $("#" + this.tooltipclassId).append(content);
    let pos = $('canvas').position()
    let tp = pos.top + my,
      lft = pos.left + mx
    $('.' + this.tooltipclass).css('top', tp);
    $('.' + this.tooltipclass).css('left', lft);
    this.circleboid.setFillStyle(this.hovcol, 0.6);
  }

  show_points() {
    for (let i = 0; i < 360; i += 30) {
      let angle = (PI / 180) * (i)
      let x = this.position.x + this.r * 0.5 * Math.cos(angle);
      let y = this.position.y + this.r * 0.5 * Math.sin(angle);
      stroke(255)
      strokeWeight(5);
      point(x, y);
      strokeWeight(1)


      let a = createVector(x, y)
      let v = p5.Vector.sub(a, this.position)
      v.normalize()
      v.mult(random(1, 50))
      let xn = x + v.x,
        yn = y + v.y

      // line(this.position.x, this.position.y, x, y)
      line(x, y, xn, yn)
    }
  }

  show_experiments() {
    let scene = this.scene,
      mx = this.scene.game.input.mousePointer.x,
      my = this.scene.game.input.mousePointer.y
    var vector = new Phaser.Math.Vector2(100, 100);
    var svec = new Phaser.Math.Vector2(30, 30);
    //        let p1 = new Phaser.Point(this.wid*0.2, this.ht*0.2);
    this.exppt.x = mx
    this.exppt.y = my

    // let line =this.scene.add.line(svec.x,svec.y, vector.x, vector.y)
    var graphics = scene.add.graphics();
    graphics.lineBetween(mx, my, vector.x, vector.y);

    let cir1 = this.scene.add.circle(mx, my, 10)
    let cir2 = this.scene.add.circle(vector.x, vector.y, 10)
    cir1.setStrokeStyle(1, 0xbb8700, 1);
    cir2.setStrokeStyle(1, 0xbb8700, 1);


  }

  // Draw boid as a circle
  show() {
    // this.show_experiments();
    // return
    this.circleboid.x = this.position.x
    this.circleboid.y = this.position.y

    // adding embellishings : wil comment back
    //        this.show_points()
  }

  // Forces go into acceleration
  apply_force(force) {
    this.acceleration.add(force);
  }

  // We accumulate a new acceleration each time based on three rules
  flock(boids) {
    let sep = this.separate(boids); // Separation
    let ali = this.align(boids); // Alignment
    let coh = this.cohesion(boids); // Cohesion
    // let coh_att = this.cohesion_attractor(this.attractor)
    // let coh_mouse = this.cohesion_mouse()
    // Arbitrarily weight these forces
    sep.mult(5.0);
    ali.mult(1.0);
    coh.mult(1.0);
    // coh_att.mult(10.0);
    // coh_mouse.mult(2.0);
    // Add the force vectors to acceleration
    this.apply_force(sep);
    this.apply_force(ali);
    this.apply_force(coh);
    // this.apply_force(coh_att);
    // this.apply_force(coh_mouse);
  }

  // Method to update location
  update() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }

  // A method that calculates and applies a steering force towards a target
  // STEER = DESIRED MINUS VELOCITY
  seek(target) {
    let desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce); // Limit to maximum steering force
    return steer;
  }


  borders_reverse() {

    let wid = this.wid,
      ht = this.ht,
      allowedX = 300,
      allowedY = 50
    let allowed = allowedY
    if (Math.abs(this.position.x - wid * 0.5) >= Math.abs(this.position.y - ht * 0.5)) allowed = allowedX
    // to place within a box
    // if ((this.position.x < wid * 0.25 || this.position.x > wid * 0.75) ||
    //   (this.position.y < ht * 0.25 || this.position.y > ht * 0.75)) this.velocity.mult(-10)

    // to place within a circle
    let d = p5.Vector.dist(this.position, createVector(wid * 0.5, ht * 0.5));
    if (d > allowed) this.velocity.mult(-10)
    // if(d > allowed){
    //   this.position.x = wid*0.5
    //   this.position.y = ht*0.5
    // }
  }

  // Separation
  // Method checks for nearby boids and steers away
  separate(boids) {
    let desiredseparation = 200.0;
    let steer = createVector(0, 0);
    let count = 0,
      fac = 10; //-10
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
      // console.log('in separate ', i, boids, boids[i]);
      // debugger
      let d = dist(this.position.x, this.position.y, boids[i].position.x, boids[i].position.y)
      let rads = this.r + boids[i].r + fac
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      // if ((d > 0) && (d < desiredseparation) && (d < rads)) {
      if ((d > 0) && (d < rads)) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.position, boids[i].position);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align(boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxspeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxforce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  cohesion(boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].position); // Add location
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum); // Steer towards the location
    } else {
      return createVector(0, 0);
    }
  }

  cohesion_mouse() {
    let mx = this.scene.input.mousePointer.x,
      my = this.scene.input.mousePointer.y
    mx = mouseX, my = mouseY
    let neighbordist = 400
    let vec = createVector(mx, my),
      count = 0
    let d = p5.Vector.dist(this.position, vec);
    if ((d > 0) && (d < neighbordist)) {
      count += 1
    }

    if (count > 0) {
      vec.div(count);
      return this.seek(vec); // Steer towards the location
    } else {
      return createVector(0, 0);
    }
  }

  //computes cohesion towards a given attractor
  cohesion_attractor(attractor) {
    let neighbordist = 200
    let vec = null,
      count = 0
    let d = p5.Vector.dist(this.position, attractor.position);
    if ((d > 0) && (d < neighbordist)) {
      vec = attractor.position
      count += 1
    }

    if (count > 0) {
      vec.div(count);
      return this.seek(vec); // Steer towards the location
    } else {
      return createVector(0, 0);
    }
  }
}