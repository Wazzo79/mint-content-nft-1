"use strict";
(() => {
var exports = {};
exports.id = 662;
exports.ids = [662];
exports.modules = {

/***/ 43:
/***/ ((module) => {

module.exports = require("@ffmpeg/ffmpeg");

/***/ }),

/***/ 738:
/***/ ((module) => {

module.exports = require("multer");

/***/ }),

/***/ 616:
/***/ ((module) => {

module.exports = import("next-connect");;

/***/ }),

/***/ 661:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "config": () => (/* binding */ config),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _ffmpeg_ffmpeg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(43);
/* harmony import */ var _ffmpeg_ffmpeg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_ffmpeg_ffmpeg__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_connect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(616);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([next_connect__WEBPACK_IMPORTED_MODULE_1__]);
next_connect__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];


const multer = __webpack_require__(738);
const apiRoute = (0,next_connect__WEBPACK_IMPORTED_MODULE_1__["default"])({
    onError (error, req, res) {
        res.status(501).json({
            error: `Sorry something Happened! ${error.message}`
        });
    },
    onNoMatch (req, res) {
        res.status(405).json({
            error: `Method "${req.method}" Not Allowed`
        });
    }
});
apiRoute.use(multer().any());
// const ffmpeg = createFFmpeg({
//   log: false,
// });
const ffmpegInstance = (0,_ffmpeg_ffmpeg__WEBPACK_IMPORTED_MODULE_0__.createFFmpeg)({
    log: true
});
let ffmpegLoadingPromise = ffmpegInstance.load();
async function getFFmpeg() {
    if (ffmpegLoadingPromise) {
        await ffmpegLoadingPromise;
        ffmpegLoadingPromise = undefined;
    }
    return ffmpegInstance;
}
apiRoute.post(async (req, res)=>{
    console.log(req.files);
    console.log(req.body);
    if (req.files.length) {
        var audio = req.files[0].buffer;
        var image = req.files[1].buffer;
        const ffmpeg = await getFFmpeg();
        const outputFileName = "nftFile.mp4";
        //await ffmpeg.load();
        ffmpeg.FS("writeFile", "image.png", await (0,_ffmpeg_ffmpeg__WEBPACK_IMPORTED_MODULE_0__.fetchFile)(image));
        ffmpeg.FS("writeFile", "sound.mp3", await (0,_ffmpeg_ffmpeg__WEBPACK_IMPORTED_MODULE_0__.fetchFile)(audio));
        await ffmpeg.run("-i", "image.png", "-vf", "scale=600:600:force_original_aspect_ratio=increase,crop=600:600", "cropped.png");
        await ffmpeg.run("-framerate", "1/10", "-i", "cropped.png", "-i", "sound.mp3", "-c:v", "libx264", // "-t",
        // "10",
        "-pix_fmt", "yuv420p", "-vf", "scale=600:600", outputFileName);
        let data = await ffmpeg.FS("readFile", outputFileName);
        res.writeHead(200, {
            "Content-Type": "application/mp4",
            "Content-Disposition": `attachment;filename=${outputFileName}`,
            "Content-Length": data.length
        });
        res.end(Buffer.from(data));
    }
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (apiRoute);
const config = {
    api: {
        bodyParser: false
    }
};

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(661));
module.exports = __webpack_exports__;

})();