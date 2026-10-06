// --- VARIÁVEIS GLOBAIS E ESTADOS DO TAMAGOTCHI ---
let petName = "Doguinho";
let stats = {
    hunger: 80,
    energy: 100,
    fun: 50,
    music: 70
};

let isPlayingFetch = false;
let ballInAir = false;
let ballTarget = new THREE.Vector3();
let ballVelocity = new THREE.Vector3();

// --- THREE.JS CONFIGURAÇÃO DA CENA 3D ---
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0e0ff);
scene.fog = new THREE.Fog(0xa0e0ff, 10, 50);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Não passar do chão
controls.minDistance = 3;
controls.maxDistance = 15;

// --- ILUMINAÇÃO DA CENA ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffaed, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// --- CENÁRIO (CHÃO E ELEMENTOS) ---
const floorGeo = new THREE.PlaneGeometry(60, 60);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x7bed9f, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// CASINHA DO CACHORRO 3D
const houseGroup = new THREE.Group();
const houseBody = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0xff7f50 })
);
houseBody.position.y = 1;
houseBody.castShadow = true;

const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.8, 1.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xd63031 })
);
roof.position.y = 2.5;
roof.rotation.y = Math.PI / 4;
houseGroup.add(houseBody, roof);
houseGroup.position.set(-4, 0, -3);
scene.add(houseGroup);

// --- CONSTRUÇÃO DO CACHORRINHO 3D (PROCEDURAL) ---
const dogGroup = new THREE.Group();

// Corpo
const bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 1.6);
const dogMat = new THREE.MeshStandardMaterial({ color: 0xe1b12c, roughness: 0.6 });
const dogBody = new THREE.Mesh(bodyGeo, dogMat);
dogBody.position.y = 0.8;
dogBody.castShadow = true;
dogGroup.add(dogBody);

// Cabeça
const headGeo = new THREE.BoxGeometry(0.9, 0.8, 0.9);
const dogHead = new THREE.Mesh(headGeo, dogMat);
dogHead.position.set(0, 1.4, 0.7);
dogHead.castShadow = true;
dogGroup.add(dogHead);

// Focinho e Olhos
const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.3, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xfff8e7 })
);
snout.position.set(0, 1.3, 1.2);
dogGroup.add(snout);

const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x2d3436 })
);
nose.position.set(0, 1.4, 1.42);
dogGroup.add(nose);

// Orelhas
const earMat = new THREE.MeshStandardMaterial({ color: 0xcd8409 });
const earL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.3), earMat);
earL.position.set(0.5, 1.4, 0.7);
const earR = earL.clone();
earR.position.set(-0.5, 1.4, 0.7);
dogGroup.add(earL, earR);

// Rabinho
const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.6), earMat);
tail.position.set(0, 1.1, -0.9);
tail.rotation.x = Math.PI / 4;
dogGroup.add(tail);

scene.add(dogGroup);

// --- BOLINHA DE BRINQUEDO (PARA O MINIGAME) ---
const ballGeo = new THREE.SphereGeometry(0.25, 16, 16);
const ballMat = new THREE.MeshStandardMaterial({ color: 0xff4757, roughness: 0.3 });
const fetchBall = new THREE.Mesh(ballGeo, ballMat);
fetchBall.castShadow = true;
fetchBall.visible = false;
scene.add(fetchBall);


// --- GERENCIAMENTO DO TAMAGOTCHI E INTERFAZ ---

// Verificar se existe nome salvo no localStorage
window.onload = () => {
    const savedName = localStorage.getItem('tamagotchi_pet_name');
    if (savedName) {
        petName = savedName;
        document.getElementById('name-modal').classList.add('hidden');
        document.getElementById('ui-container').classList.remove('hidden');
        document.getElementById('display-pet-name').innerText = `🐾 ${petName}`;
    }
};

function confirmPetName() {
    const input = document.getElementById('pet-name-input').value.trim();
    if (input !== "") {
        petName = input;
        localStorage.setItem('tamagotchi_pet_name', petName);
        document.getElementById('name-modal').classList.add('hidden');
        document.getElementById('ui-container').classList.remove('hidden');
        document.getElementById('display-pet-name').innerText = `🐾 ${petName}`;
    }
}

// Atualização visual dos status
function updateUI() {
    document.getElementById('bar-hunger').style.width = `${stats.hunger}%`;
    document.getElementById('bar-energy').style.width = `${stats.energy}%`;
    document.getElementById('bar-fun').style.width = `${stats.fun}%`;
    document.getElementById('bar-music').style.width = `${stats.music}%`;
}

// Loop de degradação temporal do Tamagotchi
setInterval(() => {
    stats.hunger = Math.max(0, stats.hunger - 1);
    stats.energy = Math.max(0, stats.energy - 0.5);
    stats.fun = Math.max(0, stats.fun - 1);
    updateUI();
}, 4000);


// --- AÇÕES DO PET ---

function feedPet() {
    stats.hunger = Math.min(100, stats.hunger + 25);
    showToast(`Você alimentou ${petName}! 🍖`);
    // Animação de pulinho
    dogGroup.position.y = 0.5;
    setTimeout(() => dogGroup.position.y = 0, 300);
    updateUI();
}

function sleepPet() {
    stats.energy = Math.min(100, stats.energy + 40);
    showToast(`${petName} tirou uma soneca gostosa! 💤`);
    updateUI();
}

function toggleMusic() {
    stats.music = Math.min(100, stats.music + 30);
    showToast(`Tocando as músicas preferidas de ${petName}! 🎵`);
    updateUI();
}

function showToast(text) {
    const toast = document.getElementById('instruction-toast');
    toast.innerText = text;
}


// --- MINIGAME: JOGAR BOLA E BUSCAR ---

function toggleFetchGame() {
    isPlayingFetch = !isPlayingFetch;
    const btn = document.getElementById('play-btn');

    if (isPlayingFetch) {
        btn.innerText = "❌ Sair do Minigame";
        showToast("Clique no chão de grama para arremessar a bolinha! ⚽");
    } else {
        btn.innerText = "⚽ Jogar Bola";
        fetchBall.visible = false;
        showToast("Você saiu do minigame.");
    }
}

// Evento de clique para jogar a bola na cena 3D via Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (!isPlayingFetch || ballInAir) return;

    // Ignorar cliques em cima dos botões/interfaces
    if (event.target.tagName === 'BUTTON' || event.target.closest('#ui-container')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(floor);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        
        // Lançar a bola a partir da posição do jogador/câmera
        fetchBall.position.set(dogGroup.position.x, 0.3, dogGroup.position.z + 1);
        fetchBall.visible = true;

        ballTarget.copy(point);
        ballInAir = true;
    }
});


// --- ANIMATION LOOP (LÓGICA DO 3D) ---
let clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // 1. Animação de respiração / balanço do rabo em tempo de espera (Idle)
    if (!ballInAir) {
        tail.rotation.z = Math.sin(time * 8) * 0.3; // Rabinho balançando
        dogHead.rotation.y = Math.sin(time * 2) * 0.1; // Olha em volta levemente
    }

    // 2. Lógica do Minigame de Pegar a Bola
    if (ballInAir) {
        // Mover cachorro na direção da bola
        const direction = new THREE.Vector3().subVectors(ballTarget, dogGroup.position);
        direction.y = 0; // Manter no chão

        if (direction.length() > 0.5) {
            // Rotacionar o cachorro para encarar o destino
            dogGroup.lookAt(ballTarget.x, dogGroup.position.y, ballTarget.z);
            
            // Mover em direção à bola
            dogGroup.translateZ(delta * 4);
            
            // Pulinho da corrida
            dogGroup.position.y = Math.abs(Math.sin(time * 12)) * 0.2;
            tail.rotation.z = Math.sin(time * 20) * 0.5;
        } else {
            // Cachorro pegou a bola!
            ballInAir = false;
            fetchBall.visible = false;
            dogGroup.position.y = 0;

            // Aumentar status de diversão
            stats.fun = Math.min(100, stats.fun + 20);
            updateUI();
            showToast(`Boa! ${petName} pegou a bola! 🐶🎉`);
        }

        // Atualizar posição da bola suavemente
        fetchBall.position.lerp(ballTarget, delta * 5);
    }

    controls.update();
    renderer.render(scene, camera);
}

// Ajuste responsivo de tela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Iniciar a renderização do loop
animate();
