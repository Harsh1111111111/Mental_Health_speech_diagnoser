const os = require("os");
const ejs = require("ejs");
const path = require("path");
const fs = require("fs/promises");
const { nanoid } = require("nanoid");
const { spawn } = require("child_process");

const mix_audio_files = require("./mix_audio");

const generatePdf = async (data = {}, missing_fq, charts_urls = []) => {
  ejs.renderFile(path.join(__dirname, "views/fq-report-new.ejs"), { data }, async (err, html) => {
    if (err) {
      console.error(err);
      return;
    }

    const pdf_id = nanoid();

    const tempHtmlFilePath = path.join(os.tmpdir(), `html_jvscan_${pdf_id}.html`);
    await fs.writeFile(tempHtmlFilePath, html);

    const pdfChild = spawn("python3", ["generate_pdf.py", tempHtmlFilePath, pdf_id], {
      shell: true,
    });

    pdfChild.stdout.on("data", function (data) {
      // console.log("Pipe data from python script ...");
      // console.log(data);
    });

    pdfChild.stderr.on("data", (data) => {
      console.error("PDF Generate Error");
      console.error(`PDF::: child stderr:\n${data}`);
    });

    pdfChild.on("close", async (code) => {
      await fs.unlink(tempHtmlFilePath);

      if (code === 0) {
        const pdf_path = pdf_id + ".pdf";

        console.log("================PDF Report Generated================");
        console.log("PATH: ", path.join(__dirname, "pdfs", pdf_path));

        try {
          mix_audio_files(missing_fq, data.file_id);

          // Delete Charts After All Process
          charts_urls.forEach(async (chart) => {
            await fs.unlink(chart);
          });
        } catch (err) {
          console.log(err);
          console.error("Pdf report data sending or file deleting error");
        }
      } else {
        console.error("Something went wrong occur while generating pdf");
        console.error(`PDF::: exit with:${code}`);
      }
    });
  });
};

module.exports = generatePdf;
