import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-demo-triangle',
  templateUrl: './demo-triangle.component.html',
  styleUrls: ['./demo-triangle.component.scss']
})
export class DemoTriangleComponent implements OnInit {

  @ViewChild("glCanvas", {static: true}) glCanvas: ElementRef<HTMLCanvasElement>;
  gl: WebGLRenderingContext;

  constructor() { }

  ngOnInit() {
    this.initWebGL();
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
    gl.clear(gl.COLOR_BUFFER_BIT);
    
  }

}
