import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { mat4, vec3 } from 'gl-matrix';


@Component({
  selector: 'app-demo-animation',
  templateUrl: './demo-animation.component.html',
  styleUrls: ['./demo-animation.component.scss']
})

export class DemoAnimationComponent implements OnInit {
  @ViewChild("glCanvas", {static: true}) glCanvas: ElementRef<HTMLCanvasElement>;
  gl: WebGLRenderingContext;
  vshaderSource: string;
  fshaderSource: string;
  program: WebGLProgram;
  model: Model;
  prevDrawTime: number;
  u_ModelMatrix: WebGLUniformLocation;

  constructor(private httpClient: HttpClient) { }

  async ngOnInit() {
    await this.loadAssets();
    this.createModel();
    this.initWebGL();
    if (this.gl) {
      this.initArrayBuffer(this.model.vertices, this.model.vertexSize, this.gl.FLOAT, 'a_Position', this.program);
      this.initArrayBuffer(this.model.vertexColours, this.model.colourSize, this.gl.FLOAT, 'a_Colour', this.program);
      this.prevDrawTime = Date.now();
      this.drawScene();
    }
  }

  initWebGL() {
    let gl = this.glCanvas.nativeElement.getContext('webgl');
    if (!gl) {
      gl = this.glCanvas.nativeElement.getContext("experimental-webgl") as WebGLRenderingContext;
    }
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    this.gl = gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const vshader = this.createShader(gl.VERTEX_SHADER, this.vshaderSource);
    const fshader = this.createShader(gl.FRAGMENT_SHADER, this.fshaderSource);
    this.createProgram(vshader, fshader);
    gl.useProgram(this.program);

    this.u_ModelMatrix = gl.getUniformLocation(this.program, 'u_ModelMatrix');
  }

  drawScene() {
    this.resizeCanvas();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.model.vertices.length/this.model.vertexSize);

    const now = Date.now();
    const timeDelta = now - this.prevDrawTime;
    this.prevDrawTime = now;

    this.animateModel(this.model, timeDelta);

    window.requestAnimationFrame(() => { this.drawScene(); });
  }

  animateModel(model: Model, timeDelta: number) {
    for (let i = 0; i < 3; i++) {
      if (model.animation.position[i] > 1 && model.animation.movementSpeed[i] > 0) {
        model.animation.movementSpeed[i] *= -1;
      } else if (model.animation.position[i] < -1 && model.animation.movementSpeed[i] < 0) {
        model.animation.movementSpeed[i] *= -1;
      }
    }
    const move_change = vec3.create();
    vec3.scale(move_change, model.animation.movementSpeed, timeDelta/1000);
    vec3.add(model.animation.position, model.animation.position, move_change);

    const rot_change = vec3.create();
    vec3.scale(rot_change, model.animation.rotationSpeed, timeDelta/1000);
    vec3.add(model.animation.angle, model.animation.angle, rot_change);
    
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, model.animation.position);
    mat4.rotate(modelMatrix, modelMatrix, vec3.length(model.animation.angle), model.animation.angle);
    mat4.scale(modelMatrix, modelMatrix, model.animation.scale);

    this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, modelMatrix);
  }

  createProgram(vshader: WebGLShader, fshader: WebGLShader): WebGLProgram {
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vshader);
    this.gl.attachShader(this.program, fshader);
    this.gl.linkProgram(this.program);
    const success = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
    if (success) {
      return this.program;
    }

    console.log(this.gl.getProgramInfoLog(this.program));
    this.gl.deleteProgram(this.program);
    return null;
  }

  async loadAssets() {
    this.vshaderSource = await this.httpClient.get('assets/DemoAnimation_v.glsl', { responseType: 'text' }).toPromise();
    this.fshaderSource = await this.httpClient.get('assets/DemoAnimation_f.glsl', { responseType: 'text' }).toPromise();
  }

  createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }

    console.log(this.gl.getShaderInfoLog(shader));
    this.gl.deleteShader(shader);
    return null;
  }

  initArrayBuffer(data: any, size: number, dataType: number, attributeName: string, program: WebGLProgram) {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    const a_attribute = this.gl.getAttribLocation(program, attributeName);
    this.gl.vertexAttribPointer(a_attribute, size, dataType, false, 0, 0);
    this.gl.enableVertexAttribArray(a_attribute);
  }

  createModel() {
    this.model = {
      vertexSize: 3, // XYZ
      vertices: new Float32Array([
        -0.5, -0.5, 0.0,
         0.5, -0.5, 0.0,
         -0.5, 0.5, 0.0,

         0.5, -0.5, 0.0,
         -0.5, 0.5, 0.0,
         0.5, 0.5, 0.0
      ]),
      colourSize: 4, // RGBA
      vertexColours: new Float32Array([
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,

        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0,
        0.5, 0.5, 0.5, 1.0
      ]),
      animation: {
        position: vec3.fromValues(0.0, 0.0, 0.0),
        movementSpeed: vec3.fromValues(1.0, 0.35, 0.0),
        scale: vec3.fromValues(0.5, 0.5, 0.5),
        angle: vec3.fromValues(0.0, 0.0, 0.0),
        rotationSpeed: vec3.fromValues(0.0, 0.0, 1.0)
      }
    };
  }

  resizeCanvas() {
    if (!this.gl) {
      return;
    }
   
    const canvas = this.gl.canvas as HTMLCanvasElement;
    if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
        canvas.width  = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        this.gl.viewport(0, 0, canvas.width, canvas.height);
      }
  }
}

class Model {
  vertices: Float32Array;
  vertexSize: number;

  vertexColours: Float32Array;
  colourSize: number;

  animation: Animation;
}

class Animation {
  position: vec3;
  movementSpeed: vec3;
  scale: vec3;
  angle: vec3;
  rotationSpeed: vec3;
}