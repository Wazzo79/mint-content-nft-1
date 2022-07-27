import { NextApiRequest, NextApiResponse } from "next";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

import { Stream } from "stream";
import nextConnect from "next-connect";

const multer = require("multer");

const apiRoute = nextConnect({
  onError(error, req: any, res: any) {
    res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method "${req.method}" Not Allowed` });
  },
});

apiRoute.use(multer().any());

// const ffmpeg = createFFmpeg({
//   log: false,
// });

const ffmpegInstance = createFFmpeg({ log: true });
let ffmpegLoadingPromise: any = ffmpegInstance.load();

async function getFFmpeg() {
  if (ffmpegLoadingPromise) {
    await ffmpegLoadingPromise;
    ffmpegLoadingPromise = undefined;
  }

  return ffmpegInstance;
}

apiRoute.post(async (req, res) => {
  console.log(req.files);
  console.log(req.body);

  if (req.files.length) {
    var audio = req.files[0].buffer;
    var image = req.files[1].buffer;

    const ffmpeg = await getFFmpeg();
    const outputFileName = "nftFile.mp4";

    //await ffmpeg.load();
    ffmpeg.FS("writeFile", "image.png", await fetchFile(image!));
    ffmpeg.FS("writeFile", "sound.mp3", await fetchFile(audio!));

    await ffmpeg.run("-i", "image.png", "-vf", "scale=600:600:force_original_aspect_ratio=increase,crop=600:600", "cropped.png");

    await ffmpeg.run(
      "-framerate",
      "1/10",
      "-i",
      "cropped.png",
      "-i",
      "sound.mp3",
      "-c:v",
      "libx264",
      // "-t",
      // "10",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "scale=600:600",
      outputFileName
    );

    let data = await ffmpeg.FS("readFile", outputFileName);

    res.writeHead(200, {
      "Content-Type": "application/mp4",
      "Content-Disposition": `attachment;filename=${outputFileName}`,
      "Content-Length": data.length,
    });

    res.end(Buffer.from(data));
  }
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false,
  },
};
