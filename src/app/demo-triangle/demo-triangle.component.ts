import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-demo-triangle',
  templateUrl: './demo-triangle.component.html',
  styleUrls: ['./demo-triangle.component.scss']
})

export class DemoTriangleComponent implements OnInit {
  @ViewChild("glCanvas", {static: true}) glCanvas: ElementRef<HTMLCanvasElement>;
  gl: WebGLRenderingContext;
  vshaderSource: string;
  fshaderSource: string;
  program: WebGLProgram;
  model: Model;

  constructor(private httpClient: HttpClient) { }

  public demoText(): string {
    return 'Test!';
  }

  async ngOnInit() {
    await this.loadAssets();
    this.createModel();
    this.initWebGL();
    if (this.gl) {
      this.initArrayBuffer(this.model.vertices, this.model.vertexSize, this.gl.FLOAT, 'a_Position', this.program);
      this.drawScene();
    }
  }

  initWebGL() {
    let gl = this.glCanvas.nativeElement.getContext('webgl');
    if (!gl) {
      gl = this.glCanvas.nativeElement.getContext("experimental-webgl");
    }
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    this.gl = gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const vshader = this.createShader(gl.VERTEX_SHADER, this.vshaderSource);
    const fshader = this.createShader(gl.FRAGMENT_SHADER, this.fshaderSource);
    const program = this.createProgram(vshader, fshader);
    gl.useProgram(program);
  }

  drawScene() {
    this.resizeCanvas();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.model.vertices.length/this.model.vertexSize);
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
    this.vshaderSource = await this.httpClient.get('assets/DemoTriangle_v.glsl', { responseType: 'text' }).toPromise();
    this.fshaderSource = await this.httpClient.get('assets/DemoTriangle_f.glsl', { responseType: 'text' }).toPromise();
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
      vertexSize: 3, 
      vertices: new Float32Array([
        -0.5, -0.5, 0,
         0.5, -0.5, 0,
         0.0, 0.5, 0,
      ])
    };
  }

  @HostListener('window:resize', ['$event'])
  resizeCanvas() {
    if (!this.gl) {
      return;
    }
   
    if (this.gl.canvas.width != this.gl.canvas.clientWidth || this.gl.canvas.height != this.gl.canvas.clientHeight) {
        this.gl.canvas.width  = this.gl.canvas.clientWidth;
        this.gl.canvas.height = this.gl.canvas.clientHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);  
      }
  }
}

class Model {
  vertices: Float32Array;
  vertexSize: number;
}