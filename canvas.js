const CANVAS_FAC = 0.8;

function setUpperLeft(element) {
    element['style']['position'] = "absolute";
    element['style']['top'] = 0;
    element['style']['left'] = 0;
    element['style']['text-align'] = "left";
}

function setWidthHeight(element, width, height) {
    element['style']['width'] = width + "px";
    element['style']['height'] = height + "px";
}

class CameraCanvas {
    constructor() {
        let video = document.createElement("video");
        // Suggested on https://github.com/jeeliz/jeelizFaceFilter/issues/14#issuecomment-682209245
        /*video['style']['transform'] = 'scale(0.1,0.1)';
        video['style']['position'] = 'fixed';
        video['style']['bottom'] = '0px';
        video['style']['right'] = '0px';*/

        window.onresize = this.resizeElements.bind(this);
        setUpperLeft(video);


        video.autoplay = true;
        video.muted = true;
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
        this.dx = 0;
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
            },
            audio:false
        }).then(async stream => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if ("srcObject" in video) {
                video.srcObject = stream;
            }
            else {
                video.src = window.URL.createObjectURL(stream);
            }
            video.onloadeddata = function() {
                //that.initializeCanvas();
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
        setUpperLeft(canvas);
        canvas.style["z-index"] = 10;
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.resizeElements();
    }

    resizeElements() {
        let vw = this.video.videoWidth;
        let vh = this.video.videoHeight;
        let w = window.innerWidth;
        let h = vh*w/vw;
        if (h > window.innerHeight) {
            const fac = window.innerHeight/h;
            h *= fac;
            w *= fac;
        }
        setWidthHeight(this.video, w, h);
        //setWidthHeight(this.canvas, w, h);
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

            context.clearRect(0, 0, canvas.width, canvas.height);
            let cx = canvas.width/2 + this.dx;
            let cy = canvas.height/2;
            context.beginPath();
            context.arc(cx, cy, 50, 0, 2*Math.PI, false);
            context.fillStyle = "green";
            context.fill();
            this.dx += 0.1;
        }
        else {
            this.debugArea.innerHTML += "<p>Not enough video data: video state " + video.readyState + "</p>";
        }
        requestAnimationFrame(this.repaint.bind(this));
        //console.log("left " + video.offsetLeft + ", top " + video.offsetTop + ", width " + video.offsetWidth + ", height " + video.offsetHeight);
    }
}