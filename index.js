// Create an empty scene
let scene = new THREE.Scene();

// Create a basic perspective camera
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = -8.5;
camera.position.y = 1;

//light
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);
// Create a renderer with Antialiasing
let renderer = new THREE.WebGLRenderer({ antialias: true });

// Configure renderer clear color
renderer.setClearColor('#000000');

// Configure renderer size
renderer.setSize(window.innerWidth, window.innerHeight);

// Append Renderer to DOM
document.body.appendChild(renderer.domElement);

let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 0.7;

// axes

const axesHelper = new THREE.AxesHelper(-8.5);
//scene.add(axesHelper);

// Milky Way Disk
const texture = new THREE.TextureLoader().load('milkyway.png');

const mwGeometry = new THREE.CircleGeometry(22.15, 128);
const material = new THREE.MeshPhysicalMaterial({
    side: THREE.DoubleSide,
    map: texture,
    transmission: 0.5,
    transparent: true
});

const mwDisk = new THREE.Mesh(mwGeometry, material);
mwDisk.name = 'mwDisk';
mwDisk.rotation.x = Math.PI / 2;
mwDisk.rotation.z = -Math.PI / 2;

mwDisk.material.color.set(0x888888);

scene.add(mwDisk);

//dots
const amount = 157;
let colors = new Array(amount);
colors.fill({ r: 1, g: 1, b: 1 });

let dotGeometry = new THREE.Geometry();

let rawFile = new XMLHttpRequest();
rawFile.open('GET', 'data.txt', false);
rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
        if (rawFile.status === 200 || rawFile.status == 0) {
            let data = rawFile.responseText.split('\n');

            for (let i = 0; i < 157; i++) {
                let parts = data[i].split(/ +/);
                dotGeometry.vertices.push(
                    new THREE.Vector3(parseFloat(parts[0]) - 8.5, parseFloat(parts[2]), parseFloat(parts[1]))
                );
            }
        }
    }
};
rawFile.send(null);
let names;
rawFile = new XMLHttpRequest();
rawFile.open('GET', 'name.txt', false);
rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
        if (rawFile.status === 200 || rawFile.status == 0) {
            allText = rawFile.responseText;
            names = allText.split('\n');
        }
    }
};
rawFile.send(null);

dotGeometry.colors = colors;

const sprite = new THREE.TextureLoader().load('three/disc.png');

let size = 0.2;
let dotMaterial = new THREE.PointsMaterial({
    size,
    transparent: true,
    vertexColors: THREE.VertexColors,
    map: sprite
});
let dots = new THREE.Points(dotGeometry, dotMaterial);
scene.add(dots);

// Render Loop
let render = function () {
    requestAnimationFrame(render);
    controls.update();
    // Render the scene
    renderer.render(scene, camera);
    TWEEN.update();
};

render();

window.addEventListener('resize', onWindowResize, false);
window.addEventListener('mousemove', onDocumentMouseMove, false);
window.addEventListener('click', onDocumentMouseClick, false);
window.addEventListener('wheel', onDocumentMouseWheel, true);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let centerindex = 0;
// let centerdist = document.getElementById('centerdist');
// let centerdistval = 200;
// let startstring = document.getElementById('startstring');
let selectedObject = -1;
let clickedObject = -1;

function onDocumentMouseWheel() {
    updateCenterGUI();
}

document.getElementById('srchkey').addEventListener('keyup', function (event) {
    if (event.keyCode === 13) document.getElementById('srchbtn').click();
});

function searchfunc() {
    let srchkey = document.getElementById('srchkey').value;
    if (srchkey == '') return;
    let key = srchkey.replace(/[^A-Z0-9]/gi, '').toLowerCase();

    let found = false;
    for (let i = 0; i < 4673; i++) {
        let name = names[i];
        if (name.indexOf(',') > -1) {
            let namearr = name.split(',');
            for (let j = 0; j < namearr.length; j++) {
                if (namearr[j].replace(/[^A-Z0-9]/gi, '').toLowerCase() == key) {
                    found = true;
                    break;
                }
            }
            if (found) {
                if (centerindex !== i) dots.geometry.colors[centerindex] = new THREE.Color('#fff');
                centerindex = i;

                updatePage(i);
                updateCenterGUI();
                break;
            }
        } else {
            if (name.replace(/[^A-Z0-9]/gi, '').toLowerCase() == key) {
                updatePage(i);
                found = true;
                break;
            }
        }
    }
    if (!found) alert(srchkey + ' not found. Yes, we know we need to improve our search 😊');
}

function onDocumentMouseMove(event) {
    if (selectedObject >= 0) {
        if (selectedObject === clickedObject) dots.geometry.colors[selectedObject] = new THREE.Color('#f0f');
        else dots.geometry.colors[selectedObject] = new THREE.Color('#fff');

        dots.geometry.colorsNeedUpdate = true;

        selectedObject = -1;
    }
    let idx = getIntersect(event.layerX, event.layerY);

    if (idx) {
        dots.geometry.colors[idx] = new THREE.Color('#69f');
        dots.geometry.colorsNeedUpdate = true;
        selectedObject = idx;
    }
}

function onDocumentMouseClick(event) {
    let idx = getIntersect(event.layerX, event.layerY);

    if (idx) {
        if (centerindex !== idx) dots.geometry.colors[centerindex] = new THREE.Color('#fff');

        updatePage(idx);

        dots.geometry.colorsNeedUpdate = true;
        clickedObject = idx;
        centerindex = idx;
        updateCenterGUI();
    }
}

let raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = size * 0.5;
let mouseVector = new THREE.Vector3();

function getIntersect(x, y) {
    x = (x / window.innerWidth) * 2 - 1;
    y = -(y / window.innerHeight) * 2 + 1;

    mouseVector.set(x, y, 0.5);
    raycaster.setFromCamera(mouseVector, camera);

    const intersects = raycaster.intersectObject(dots, true);

    if (intersects.length) {
        let n = 0;
        let index = intersects[n].index;
        for (let i = 0; i < index.length; i++) {
            n++;
            index = intersects[n].index;
        }
        return index;
    }
}
let objName = document.getElementById('objName');
let objNames = document.getElementById('objNames');

let image = document.getElementById('image');

let aladinDiv = document.getElementById('aladin-lite-div');
let img = document.getElementById('img');
let distance = document.getElementById('distance'); // distance to cluster from earth

function updatePage(i) {
    let name = names[i];
    dots.geometry.colors[clickedObject] = new THREE.Color('#fff');
    dots.geometry.colors[i] = new THREE.Color('#f0f');

    let tokens = name.split(',');
    let firstname = tokens.length > 1 ? tokens[1] : tokens[0];
    let propername = tokens[1];
    objName.innerText = firstname;
    objNames.innerText = name;

    if (typeof A !== 'undefined') {
        let d = dots.geometry.vertices[i].length(); // distance
        A.aladin('#aladin-lite-div', { target: firstname, fov: 0.5, showLayersControl: false, showGotoControl: false });
    } else {
    }

    let dist = dots.geometry.vertices[i].distanceTo(new THREE.Vector3(-8.5, 0, 0));
    distance.innerText = `Distance from us: ${(dist * 3.262).toFixed(1)} kly / ${dist.toFixed(1)} kpc`;
    let oldPos = camera.position;
    let newPos = dots.geometry.vertices[i].clone();
    newPos = newPos.multiplyScalar(1.2);

    let tween = new TWEEN.Tween(oldPos)
        .to(newPos, 750)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(function (p) {
            camera.position = p;
        })
        .onComplete(function () {
            TWEEN.removeAll();
        });

    tween.start();

    dots.geometry.colorsNeedUpdate = true;
    clickedObject = i;
    onDocumentMouseMove();
}
function updateCenterGUI() {
    // let cameraloc = camera.position;
    // centerdistval = cameraloc.distanceTo(dots.geometry.vertices[centerindex]);
    // centerdist.innerHTML = centerdistval.toFixed(2);
    // centerdistly.innerHTML = (3.262 * centerdistval).toFixed(2);
}
