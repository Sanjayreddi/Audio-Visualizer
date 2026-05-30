const uploadBtn = document.getElementById('upload-btn');
const audioUpload = document.getElementById('audio-upload');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const trackNameDisplay = document.getElementById('track-name');
const audioElement = document.getElementById('audio-element');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let audioContext;
let analyser;
let source;
let isPlaying = false;
let animationId;

// Handle File Upload click
uploadBtn.addEventListener('click', () => {
    audioUpload.click();
});

// Load the audio file
audioUpload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        // Create an Object URL for the local file
        const audioUrl = URL.createObjectURL(file);
        audioElement.src = audioUrl;
        trackNameDisplay.textContent = file.name;
        playBtn.disabled = false;
        
        // Reset state if a new song is loaded
        if (isPlaying) {
            audioElement.pause();
            togglePlayState();
        }
    }
});

// Initialize Web Audio API (Must be done after user gesture)
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        
        // Connect HTML Audio Element to Web Audio API
        source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Configuration for the visualizer data
        analyser.fftSize = 256; 
    }
    
    // If context is suspended (browser policy), resume it
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Handle Play/Pause
playBtn.addEventListener('click', () => {
    initAudio(); // Safe to initialize now since user clicked
    
    if (audioElement.paused) {
        audioElement.play();
        togglePlayState(true);
        drawVisualizer();
    } else {
        audioElement.pause();
        togglePlayState(false);
        cancelAnimationFrame(animationId);
    }
});

// Update UI state
function togglePlayState(playing) {
    isPlaying = playing;
    if (playing) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

// Setup Canvas size
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call

// The Animation Loop
function drawVisualizer() {
    animationId = requestAnimationFrame(drawVisualizer);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas for next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i]; // Value between 0 and 255
        
        // Create an aesthetic gradient for each bar based on its height
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#00f2fe'); // Cyan at bottom
        gradient.addColorStop(1, '#fe0979'); // Pink at peak
        
        ctx.fillStyle = gradient;
        
        // Draw the bar (centered vertically on the bottom)
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 2; // Add spacing between bars
    }
}

// Listen for audio ending naturally
audioElement.addEventListener('ended', () => {
    togglePlayState(false);
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear screen
});