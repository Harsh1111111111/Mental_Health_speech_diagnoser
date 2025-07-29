const { exec } = require("child_process");
const { nanoid } = require("nanoid");
const path = require("path");

const wav_files = require("./utils/wav_files");

const mix_audio_files = (missing_fq, reportId) => {
  try {
    const file_id = nanoid();
    const audio_file_name = file_id + ".mp3";

    const all_oct_wav_files = {};
    for (let octave in missing_fq) {
      octave = Number(octave);

      const oct_waves = wav_files[octave];
      const nodes = missing_fq[octave];
      const wav_file_names = [];

      nodes.forEach((node) => {
        wav_file_names.push(oct_waves[node]);
      });

      all_oct_wav_files[octave] = wav_file_names;
    }

    let ffmpeg_string = "";
    let inputs_length = 0;

    for (let oct in all_oct_wav_files) {
      oct = Number(oct);
      if (all_oct_wav_files[oct].length === 0) continue;

      all_oct_wav_files[oct].forEach((oct_string) => {
        inputs_length = inputs_length + 1;
        ffmpeg_string = ffmpeg_string + "-i " + __dirname + "/public/files/" + oct_string + " ";
      });
    }

    exec(
      `ffmpeg ${ffmpeg_string} -filter_complex amix=inputs=${inputs_length}:duration=longest ${__dirname}/audio/${audio_file_name}`,
      async (error, _stdout, _stderr) => {
        if (error) {
          console.error(`ffmpeg error: ${error}`);
          return;
        }

        console.log("================Sound Therapy Generated================");
        console.log("PATH: ", path.join(__dirname, `audio/${audio_file_name}`));
      }
    );
  } catch (err) {
    console.error("Something went wrong occur while generating audio file");
    console.error(err);
    console.error(err.message);
  }
};

module.exports = mix_audio_files;
