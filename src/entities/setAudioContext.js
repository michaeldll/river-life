const BaseAudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new BaseAudioContext();

//single compressor
const compressor = audioContext.createDynamicsCompressor();
compressor.threshold.setValueAtTime(-22, audioContext.currentTime);
compressor.knee.setValueAtTime(30, audioContext.currentTime);
compressor.ratio.setValueAtTime(8, audioContext.currentTime);
compressor.attack.setValueAtTime(0.1, audioContext.currentTime);
compressor.release.setValueAtTime(0.2, audioContext.currentTime);

let analysers = [];
let buffersLengths = [];
let dataArrays = [];
let players = [];

const setAudioContext = file => {
    const init = buffer => {
        newPlayer.file = file;
        newPlayer.buffer = buffer;
        newPlayer.loop = false;

        // newPlayer.start();
        // console.log('launching sound');

        newPlayer.connect(newAnalyser);
        newAnalyser.connect(compressor);

        let newBufferLength = newAnalyser.frequencyBinCount;
        let newDataArray = new Uint8Array(newBufferLength);

        newAnalyser.getByteTimeDomainData(newDataArray);

        compressor.connect(audioContext.destination);

        players.push(newPlayer);
        buffersLengths.push(newBufferLength);
        dataArrays.push(newDataArray);
        analysers.push(newAnalyser);
    };

    /* Analyser */
    let newAnalyser = audioContext.createAnalyser();
    newAnalyser.fftSize = 1024;

    /* Music */
    let newPlayer = audioContext.createBufferSource();
    newPlayer.connect(compressor);

    fetch(file) // i.e. :'./assets/bass.mp3'
        .then(response => response.arrayBuffer())
        .then(binAudio => audioContext.decodeAudioData(binAudio))
        .then(buffer => {
            init(buffer);
        });
};

export {
    setAudioContext,
    audioContext,
    buffersLengths,
    dataArrays,
    analysers,
    players,
};
