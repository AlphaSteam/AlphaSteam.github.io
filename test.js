
import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Vector2 } from 'three';
import jQuery from "jquery";
window.$ = window.jQuery = jQuery;

var stats = new Stats();
document.body.appendChild(stats.dom);

var lastTime = (new Date()).getTime();
var controls = new function () {
    this.Speed = 0;
    this.SizeX = 1000;
    this.SizeY = 1000;
    this.DotSizeX = 1000;
    this.DotSizeY = 1000;
}
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(0, 0);
var interpoint = new THREE.Vector2(0, 0);
var interpoint2 = new THREE.Vector2(0, 0);
function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    interpoint2 = interpoint;
    interpoint2.x = (interpoint.x/1000) * 2-1;
    interpoint2.z = (interpoint.z/1000) * 2+1;
    console.log(interpoint2);
}

var DEMO = {
    ms_Renderer: null,
    ms_Camera: null,
    ms_Scene: null,
    ms_Controls: null,
    raycaster: null,
    mouse: null,
    uniforms: null,
    Initialize: function () {

        this.ms_Renderer = new THREE.WebGLRenderer(
            {
                //alpha: false,
                antialias: true,
                //depth:true,
                //logarithmicDepthBuffer: false,
                //powerPreference: "high-performance",
                //precision:'highp',
                //premultipliedAlpha: true


            }
        );
        this.ms_Renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.ms_Renderer.domElement);

        this.ms_Scene = new THREE.Scene();
        this.ms_Scene.name = 'Viewer';

        this.ms_Camera = new THREE.PerspectiveCamera(55.0, window.innerWidth / window.innerHeight, 0.5, 300000);
        this.ms_Camera.position.set(450, 350, 450);
        this.ms_Camera.lookAt(0, 0, 0);

        // Initialize Orbit control
        this.ms_Controls = new OrbitControls(this.ms_Camera, this.ms_Renderer.domElement);
        this.ms_Controls.userPan = false;
        this.ms_Controls.userPanSpeed = 0.0;
        this.ms_Controls.minDistance = 0;
        this.ms_Controls.maxDistance = 2000.0;
        this.ms_Controls.minPolarAngle = 0;
        this.ms_Controls.maxPolarAngle = Math.PI * 0.495;

        var gsize = 512;
        var res = 1024;
        var gres = res / 2;
        var origx = - gsize / 2;
        var origz = - gsize / 2;
        var size = 500;
        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(-size, 0, size),//vertex0
            new THREE.Vector3(size, 0, size),//1
            new THREE.Vector3(size, 0, -size),//2
            new THREE.Vector3(-size, 0, -size)//3
        );
        geometry.faces.push(
            new THREE.Face3(0, 1, 2),//use vertices of rank 2,1,0
            new THREE.Face3(2, 3, 0)//vertices[3],1,2...
        );
        var vShader = $('vertexshader');
        console.log(vShader);
        var fShader = $('fragmentshader');
        this.uniforms = {

            u_resolution: { value: new THREE.Vector2(100,100)},
            u_mouse: { value: new THREE.Vector2(interpoint.x, interpoint.z) },
            dotSize:{value: new THREE.Vector2(controls.DotSizeX,controls.DotSizeY)},
            u_time: { value: 0}


        }
        var material = new THREE.ShaderMaterial({
            vertexShader: ` 
            #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
            #else
            precision mediump float;
            #endif
            precision mediump int;
            
            
            attribute float vertex_z_r;
            attribute float vertex_z_i;

            varying float c_r;
            varying float c_i;
            
            
            void main() {
                c_r = vertex_z_r;
	            c_i = vertex_z_i;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
                    `,
            side: THREE.DoubleSide,
            uniforms: this.uniforms,

            fragmentShader: `
            #ifdef GL_ES
            precision mediump float;
            #endif
            
        varying float c_r;
        varying float c_i;

            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_time;
            uniform vec2 dotSize;

            vec2 random2( vec2 p ) {
                return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
            }
            
            void main() {
                vec2 st = gl_FragCoord.xy/u_resolution.xy;
                st.x *= u_resolution.x/u_resolution.y;
                vec3 color = vec3(.0);
            
                // Scale
                st *= 5.;
            
                // Tile the space
                vec2 i_st = floor(st);
                vec2 f_st = fract(st);
            
                float m_dist = 10.;  // minimum distance
                vec2 m_point;        // minimum point
                vec2 point2 = vec2(0.25,0.5);
                for (int j=-1; j<=1; j++ ) {
                    for (int i=-1; i<=1; i++ ) {
                        vec2 neighbor = vec2(float(i),float(j));
                        vec2 point = random2(i_st + neighbor);
                        point = 0.5 + 0.5*sin(u_time + 6.2831*point);
                        vec2 diff = neighbor + point - f_st;
                        float dist = length(diff);
            
                        if( dist < m_dist ) {
                            m_dist = dist;
                            m_point = point;
                        }
                    }
                }	
                         vec2 st2 = gl_FragCoord.xy/dotSize;
                        st2.x *= u_resolution.x/u_resolution.y;
                        float dist = distance(st2, point2);
                    if ( dist < m_dist ) {
                        // Keep the closer distance
                        m_dist = dist;
            
                        // Kepp the position of the closer point
                        m_point = point2;
                    }
                color += m_dist*0.2;
                color.rg = m_point;
                // Assign a color using the closest point position
                color += dot(m_point,vec2(.3,.6));
            
                // Add distance field to closest point center
                // color.g = m_dist;
            
                // Show isolines
                color -= abs(sin(40.0*m_dist))*0.07;
            
                // Draw cell center
                color += 1.-step(.05, m_dist);
            
                // Draw grid
                //color.r += step(.98, f_st.x) + step(.98, f_st.y);
            
                gl_FragColor = vec4(color,1.0);
            }
            `,



        });
        var plane = new THREE.Mesh(geometry, material);
        this.ms_Scene.add(plane);

        var gui = new GUI();
        gui.add(controls, 'Speed', 0, 0.25);
        gui.add(controls, 'SizeX', 1, 1000);
        gui.add(controls, 'SizeY', 1, 1000);
        gui.add(controls, 'DotSizeX', 1, 100000);
        gui.add(controls, 'DotSizeY', 1, 100000);
    },

    Display: function () {

        this.ms_Renderer.render(this.ms_Scene, this.ms_Camera);

    },

    Update: function () {

        var currentTime = new Date().getTime()*0.001;
        var delta = lastTime-currentTime;
        //console.log(mouse);
        lastTime = currentTime;
        this.uniforms.u_resolution.value = new THREE.Vector2(controls.SizeX,controls.SizeY);
        this.uniforms.u_time.value +=controls.Speed;
        this.uniforms.u_mouse.value = new Vector2(interpoint2.x, interpoint2.z);
        this.uniforms.dotSize.value = new Vector2(controls.DotSizeX,controls.DotSizeY)
        this.Display();

    },

    Resize: function (inWidth, inHeight) {

        this.ms_Camera.aspect = inWidth / inHeight;
        this.ms_Camera.updateProjectionMatrix();
        this.ms_Renderer.setSize(inWidth, inHeight);
        this.Display();

    },


};

DEMO.Initialize();

window.addEventListener('resize', function () {

    DEMO.Resize(window.innerWidth, window.innerHeight);


});
window.addEventListener('mousemove', onMouseMove, false);

DEMO.Resize(window.innerWidth, window.innerHeight);

var render = function () {


    DEMO.Update();
    raycaster.setFromCamera(mouse, DEMO.ms_Camera);
    var intersects = raycaster.intersectObjects(DEMO.ms_Scene.children);
    if (intersects != undefined && intersects != null) {

        if (intersects.length != 0) {
            interpoint = intersects[0].point;
            //console.log(interpoint.x);

        }


    }




    stats.update();

    requestAnimationFrame(render);
    //window.requestAnimationFrame(render);




};

render();