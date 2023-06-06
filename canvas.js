const CANVAS_FAC = 0.8;


class CameraCanvas {
    constructor() {
        let video = document.createElement("video");
        video.style = "display:none;";
        // Suggested on https://github.com/jeeliz/jeelizFaceFilter/issues/14#issuecomment-682209245
        /*video['style']['transform'] = 'scale(0.0001,0.0001)';
        video['style']['position'] = 'fixed';
        video['style']['bottom'] = '0px';
        video['style']['right'] = '0px';*/


        video.autoplay = true;
        video.loop = true;
        video.controls = true;
        this.video = video;
        document.getElementById("videoArea").appendChild(video);

        let debugArea = document.getElementById("debugArea");
        this.debugArea = debugArea;

        if (document.readyState === "complete") {
            this.initializeVideo();
        }
        else {
            window.onload = this.initializeVideo.bind(this);
        }
    }

    /**
     * Initialize a (back facing) video stream to fill the available window
     * as well as possible
     */
    initializeVideo() {
        const that = this;
        const video = this.video;
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }
        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = function(constraints) {
                let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                }
                return new Promise(function(resolve, reject) {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }
        navigator.mediaDevices.getUserMedia({
            video:{
                width: {ideal:window.innerWidth*CANVAS_FAC},
                facingMode: "environment"
            }
        }).then(async stream => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if ("srcObject" in video) {
                video.srcObject = stream;
            }
            else {
                video.src = window.URL.createObjectURL(stream);
            }
            video.onloadeddata = function() {
                that.initializeCanvas();
                that.repaint();
            }
        }).catch(function(err) {
            console.log(err);
        })
    }

    /**
     * Initialize a canvas to which to draw the video frame
     */
    initializeCanvas() {
        const canvas = document.getElementById("maincanvas");
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    repaint() {
        const canvas = this.canvas;
        const video = this.video;
        const context = this.context;
        let thisTime = new Date();
        let elapsed = thisTime - this.lastTime;
        this.lastTime = thisTime;
        this.debugArea.innerHTML = "";
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            this.debugArea.innerHTML += "Successful streaming<p>" + Math.round(1000/elapsed) + " fps</p>";
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            video.play();
        }
        else {
            this.debugArea.innerHTML += "<p>Not enough video data: video state " + video.readyState + "</p>";
        }
        requestAnimationFrame(this.repaint.bind(this));
    }
}