


import { useEffect, useRef } from "react";
import * as THREE from "three";
import simplexNoise from "../helper/noiseGlsl.js"
// import './earthStyle.scss';

function Erath() {
    const refContainer = useRef(null);
    useEffect(() => {

        let renderer, scene, camera, clock;
        let rotCam;
        let wc, hc;
        let gu = {
            time: { value: 0 }
        };

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(2);

        !refContainer.current.children.length && refContainer.current.appendChild(renderer.domElement);

        clock = new THREE.Clock();

        scene = new THREE.Scene();

        scene.background = new THREE.Color(0.5, 0.75, 1).multiplyScalar(0.2);

        wc = window.innerWidth / 2.5;
        hc = window.innerHeight / 2.5;
        camera = new THREE.OrthographicCamera(- wc, wc, hc, -hc, - wc, wc);
        rotCam = new THREE.Vector3(-0.5, 0, 0)
        camera.rotation.set(rotCam.x, rotCam.y, rotCam.z);

        createSphereTypo()
        createSubsetSphere()



        renderer.setAnimationLoop(() => {

            let t = clock.getElapsedTime();
            gu.time.value = t;
            scene.children[2].position.set(Math.sin(gu.time.value / 2) * 200, Math.sin(gu.time.value / 2 * 1.1) * 200, Math.cos(gu.time.value / 2) * 200);
            goBackToMainAngle()
            renderer.render(scene, camera);

        });

        document.addEventListener("mousemove", (e) => {

            if (e.buttons) {

                let t = clock.getElapsedTime();
                rotCam.z += e.movementX / window.innerWidth * 2;
                rotCam.x += e.movementY / window.innerWidth * 2;
                camera.rotation.z = rotCam.z;
                camera.rotation.x = rotCam.x;
                gu.time.value = t;
                renderer.render(scene, camera);
            }

        })

        window.addEventListener('resize', () => {

            renderer.setSize(window.innerWidth, window.innerHeight);
            wc = window.innerWidth / 3;
            hc = window.innerHeight / 3;

            camera = new THREE.OrthographicCamera(- wc, wc, hc, -hc, - wc, wc);
            camera.rotation.z = rotCam.z;
            camera.rotation.x = rotCam.x;
            renderer.render(scene, camera);
        }, false);

        function goBackToMainAngle() {
            function lerp(n0, n1, n2) {
                return (n1 - n0) * n2 + n0;
            }
            rotCam.x = lerp(rotCam.x, -0.5, 0.006)
            rotCam.z = lerp(rotCam.z, 0.0, 0.006)
            camera.rotation.z = rotCam.z;
            camera.rotation.x = rotCam.x;

        }

        function createSphereTypo() {

            let g = new THREE.SphereGeometry(150, 150, 150);

            let m = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                map: getTexture(),
                alphaTest: 0.5,

                onBeforeCompile: shader => {
                    shader.uniforms.time = gu.time;
                    shader.vertexShader = `
                      uniform float time;
                      ${simplexNoise}
                      ${shader.vertexShader}
                    `.replace(
                        `#include <begin_vertex>`,
                        `#include <begin_vertex>
                        float t = time * 0.1;
                        vec3 pos = position;
        
                        float nX = snoise(vec3(pos.xy / 500. + 500., t));
                        float nY = snoise(vec3(pos.xy / 500. + 1000., t));
                        float nZ = snoise(vec3(pos.xy / 500. + 1500., t));
        
                        // pos += vec3(nX, nY, nZ) * vec3(3, 2, 3) * 20.;
        
                        transformed = pos;
                      `
                    );
                    shader.fragmentShader = `
                  uniform float time;
        
                  float rand(float n){return fract(sin(n) * 43758.5453123);}
        
                  ${shader.fragmentShader}
                `.replace(
                        `#include <map_fragment>`,
                        `
                    #ifdef USE_MAP
                      float t = time * 0.05;
                      vec2 tUv = vUv * 8.-0.0;
                      float rowId = floor(tUv.y);
        
                      float phase = rand(rowId);
                      tUv.x += sin(phase * 3.1415926 * 2. + t) * 5.;
                      vec2 cUv = fract(tUv * 7.);
                      vec4 sampledDiffuseColor = texture2D( map, fract(tUv) );
                      diffuseColor *= sampledDiffuseColor;
                    #endif
                  `
                    );

                }
            });


            let m1 = new THREE.MeshBasicMaterial({
                color: scene.background


            });
            let o = new THREE.Mesh(g, m);
            o.material.map.repeat.set(0.5, 1);

            scene.add(o);

            g = new THREE.SphereGeometry(150 - 1, 150, 150);
            let o1 = new THREE.Mesh(g, m1);

            scene.add(o1);
        }

        function createSubsetSphere() {
            let g1 = new THREE.SphereGeometry(10, 150, 150);
            let m1 = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                alphaTest: 0.5

            });

            let o1 = new THREE.Mesh(g1, m1);

            scene.add(o1);
        }

        function getTexture() {

            // create texture buffer with simple canvas html 2d
            // first create canvas 
            // second connect element to THREE.CanvasTexture and create object
            // load font to draw in context 
            // finaly return object and use on texture

            let c = document.createElement("canvas");
            c.width = 1024 / 0.98;
            c.height = 256 * 0.9 * 1;

            let ctx = c.getContext("2d");
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgb(255,255,255)";

            ctx.lineWidth = 1;

            let ct = new THREE.CanvasTexture(c);

            let ff = new FontFace(
                "Khand-Bold",
                "url(./fonts/Khand/Khand-Bold.woff2)"
            );

            ff.load().then(
                () => {
                    ctx.clearRect(0, 0, c.width, c.height);
                    ctx.font = '225px "Khand"';
                    let text = "ALLIANCEPOST";
                    ctx.fillText(text, c.width * 0.5, c.height * 0.5);
                    ct.needsUpdate = true;

                },
                (err) => {
                    console.error(err);
                }
            );
            return ct;
        }


    }, []);


    return (
        <div className="canvas" ref={refContainer}></div>
    );
}

export default Erath;