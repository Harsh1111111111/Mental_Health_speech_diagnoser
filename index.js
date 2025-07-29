require("dotenv/config");
const path = require("path");
const morgan = require("morgan");
const express = require("express");
const { spawn } = require("child_process");

const calulationUtils = require("./frequencyCalulation");
const recommndation = require("./recomandations");
const generatePdf = require("./generatePdf");
const upload = require("./utils/fileUpload");
const { nanoid } = require("nanoid");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.post("/generate-report", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type" });
  }

  const body = req.body;

  // Frequency Object in string to be received from python script
  let freq = "";

  // Wav/Audio file path
  const filePath = req.file.path;
  console.log("UPloaded file path: ", filePath);

  // spawn new child process to call the python script
  const python = spawn("python3", ["parse_frequency.py", filePath]);

  // collect data from script
  python.stdout.on("data", function (data) {
    // console.log("Pipe data from python script ...");
    // console.log("data ->", data);
    freq = data.toString();
  });

  // collect error from script
  python.stderr.on("data", (data) => {
    console.error(body);
    console.error(`Fq Split::: child stderr:\n${data}`);
  });

  // in close event we are sure that stream from child process is closed
  python.on("close", async (code) => {
    // console.log(`child process close all stdio with code ${code}`);
    if (code === 0) {
      try {
        const freqData = JSON.parse(freq);

        const file_id = nanoid();

        const name = body.name;
        const email = body.email;
        const phone = body.mobile;
        const city = body.city || "NA";
        const age = body.dob ? new Date().getFullYear() - new Date(body.dob).getFullYear() : "NA";
        const recording_date = new Date().toDateString();

        // **getting missingg, weak, hyper and normal fq***
        const fq_split = calulationUtils.calculate_missing_weak_hyper_fq(freqData);

        const missing_fq = fq_split["missing"];
        const weak_fq = fq_split["weak_oct"];
        const hyper_fq = fq_split["hyper"];
        const single_digit_weak_fq = fq_split["single_digit_weak"];
        const double_digit_weak_fq = fq_split["double_digit_weak"];
        const hyper_oct_freq_with_hits = fq_split["hyper_oct_freq_with_hits"];
        const forth_oct_nrm_fq = fq_split["forth_nrm_fq"];

        // ---------START: Interpretations for reports on octaves 4th, 5th and 6th -------------------
        // calculating problems on hyper fq for all octaves
        const hyper_problems = calulationUtils.predict_on_hyper_fq(hyper_fq, recommndation.hyperactive_mapping, hyper_oct_freq_with_hits);

        // calculating problems on missing frequency for all octaves
        const missing_problems = calulationUtils.predict_on_missing_fq(missing_fq, recommndation.missing);

        // calculating mild risk and moderate risk on weak frequency at all octaves
        let { mild_risk, moderate_risk, weak_problems_for_you_display } = calulationUtils.predict_on_weak_fq(
          single_digit_weak_fq,
          double_digit_weak_fq,
          weak_fq,
          recommndation.weak_problems
        );
        // let { mild_risk, moderate_risk, weak_problems_for_you_display } = calulationUtils.predict_on_weak_fq(single_digit_weak_fq, double_digit_weak_fq, weak_fq, weak_oct_freq_with_hits, recommndation.weak_problems);

        if (mild_risk.length > 7) {
          mild_risk.splice(7, mild_risk.length);
        }
        // ---------END: Interpretations for reports on octaves 4th, 5th and 6th -------------------

        // Counts of missing, weak and hyper active fq
        let missing_fq_count = 0;
        let weak_fq_count = 0;
        let hyper_fq_count = 0;

        for (let i = 4; i < 7; i++) {
          missing_fq_count += missing_fq[i]?.length || 0;
          weak_fq_count += weak_fq[i]?.length || 0;
          hyper_fq_count += hyper_fq[i]?.length || 0;
        }

        /*
         * START: Positive Traits Calculation
         * Mental Health Positive Traits
         */
        let positive_traits_score = 0;
        let positive_traits = [];
        let traits_chart_url = "";
        let traits_data = [];

        if (Object.keys(forth_oct_nrm_fq).length !== 0) {
          positive_traits_score = 1;
          positive_traits = calulationUtils.get_positive_traits(forth_oct_nrm_fq, recommndation.normal_mapping);
          if (positive_traits.length > 12) {
            positive_traits.splice(12, positive_traits.length);
          }

          // ***** generate positive traits chart *****
          const data = calulationUtils.generate_traits_chart(file_id, forth_oct_nrm_fq);
          traits_chart_url = data.traits_chart_url;
          traits_data = data.traits_data;
        }
        /*
         * END: Positive Traits Calculation
         */

        /*
         * START: ROOT CAUSE CALCULATION
         * ROOT CAUSE HEALTH MAPPING
         * In case of both missing and weak, show only missing health issues.
         * If there are no missing and only weak, show weak health issues.
         *
         * Other scenario:
         * If only 1 missing freq is present, pick 2 more weak freqs for root cause.
         * If 2 missing then pick 1 weak. Overall there should be 3 freqs
         **/

        let root_cause_score = 1;

        // List of root cause issue from missing frequencies in 4th octave
        const root_cause_health_issue_lst_missing = [];

        if (missing_fq["4"].length !== 0) {
          root_cause_score = 0;

          let count = 0;
          let node = 0;
          const root_cause_health_issue_freq = missing_fq["4"];
          const root_cause_health_issue_mapping = recommndation.missing;
          const keys = Object.keys(root_cause_health_issue_mapping[4]);

          while (node < (root_cause_health_issue_freq?.length || 0)) {
            if (keys.indexOf(root_cause_health_issue_freq[node]) !== -1) {
              root_cause_health_issue_lst_missing.push(...root_cause_health_issue_mapping[4][root_cause_health_issue_freq[node]]);
              count += 1;

              if (count > 2) break;
            }

            node += 1;
          }
        }

        // Total Count of Root Cause Interpretaion from missing fq
        const root_cause_count = root_cause_health_issue_lst_missing.length;

        // List of root cause issue from weak frequencies in 4th octave
        const root_cause_health_issue_lst_weak = [];

        if (root_cause_count < 3 && weak_fq["4"].length !== 0) {
          root_cause_score = 0;

          let count = root_cause_count;
          let node = 0;

          const root_cause_health_issue_freq = weak_fq["4"];

          const root_cause_health_issue_mapping = recommndation.weak_problems;
          const keys = Object.keys(root_cause_health_issue_mapping[4]);

          while (node < (root_cause_health_issue_freq?.length || 0)) {
            if (keys.indexOf(root_cause_health_issue_freq[node]) !== -1) {
              root_cause_health_issue_lst_weak.push(...root_cause_health_issue_mapping[4][root_cause_health_issue_freq[node]]);
              count += 1;

              if (count > 2) break;
            }

            node += 1;
          }
        }

        // Mental Health Root Cause Final List
        const final_root_cause_issue_lst = [...new Set([...root_cause_health_issue_lst_missing, ...root_cause_health_issue_lst_weak])];

        /**
         * END: ROOT CAUSE CALCULATION
         */

        //In PDF report under "You Display" heading if coping up mechanism is
        // active then display the associations corresponding to Hyperactive mapping
        // from 4th octave OR of missing. If missing are not there for 4th octave
        // then we will display problems related to 4th octave of root cause.
        // ----------------------------------------------------------------
        // then we will display problems related to 4th octave of hyperctive.

        // Mental Health Coping Up Interpretation
        // Coping getting total active from 4 oct for coping mechnism
        const { active, allZero } = calulationUtils.get_coping_mechnism(missing_fq, weak_fq, hyper_fq, freqData["4"]);

        let coping_up_score = 0;
        let you_display = [];

        if (active) {
          coping_up_score = 1;

          if (allZero) {
            you_display = [...positive_traits];
          } else {
            you_display = hyper_problems[4];
          }
        } else {
          you_display = [...final_root_cause_issue_lst];

          if (you_display.length < 8) {
            you_display.push(...missing_problems[4]);
          }

          if (you_display.length < 8) {
            you_display.push(...weak_problems_for_you_display[4]);
          }
        }

        you_display = [...new Set(you_display)];
        if (you_display.length > 12) {
          you_display.splice(12, you_display.length);
        }

        const { chakra_status_data, chakra_score: chakra_score_out_of_7 } = calulationUtils.generate_chakra_status_data(
          freqData["4"],
          recommndation.chakra_mapping
        );
        // const { chakra_status_data, chakra_score } = calulationUtils.generate_chakra_status_data_old(missing_fq, weak_fq, hyper_fq);

        let chakra_score = Number((chakra_score_out_of_7 / 7).toFixed("1"));

        let underfunctioning_chakra_count = 0;
        let overfunctioning_chakra_count = 0;
        let normal_chakra_count = 0;
        let missing_chakra_count = 0;
        let chakra_recommendations = [];

        chakra_status_data.forEach((chakra_status) => {
          if (chakra_status["vibration"] == "Low") {
            underfunctioning_chakra_count += 1;
            chakra_recommendations.push(...recommndation.chakra_mapping_recommendations.weak[chakra_status.element.toLowerCase()]);
          }

          if (chakra_status["vibration"] == "Hyperactive") {
            overfunctioning_chakra_count += 1;
            chakra_recommendations.push(...recommndation.chakra_mapping_recommendations.hyperactive[chakra_status.element.toLowerCase()]);
          }

          if (chakra_status["vibration"] == "Normal") {
            normal_chakra_count += 1;
          }

          if (chakra_status["vibration"] == "Missing") {
            missing_chakra_count += 1;
          }
        });

        chakra_recommendations = [...new Set(chakra_recommendations)];

        if (chakra_recommendations.length > 3) {
          chakra_recommendations.splice(3, chakra_recommendations.length);
        }

        const mental_score = root_cause_score + positive_traits_score + coping_up_score + chakra_score;

        const mental_score_per = parseInt((mental_score * 100) / 4);
        const mental_score_base_10 = parseInt((mental_score * 10) / 4);
        const overall_mental_score = mental_score / 4;

        /**
         * Disease progression stage calculation.
         */
        // const disease_progression_stage = calulationUtils.get_disease_progression_stage_old(missing_fq);
        const disease_progression_stage = calulationUtils.get_disease_progression_stage(missing_fq, weak_fq);
        let disease_progression_score = 1;
        if (disease_progression_stage > 5) disease_progression_score = 0;

        /**
         * immunity status reporting
         */
        const { immunity_status_data, immunity_score } = calulationUtils.generate_immunity_status_data(
          missing_fq,
          weak_fq,
          freqData["5"],
          recommndation.immunity
        );
        const immunity_overall_score = Number((immunity_score / 7).toFixed("2"));
        // ''' Deficiencies comes from 6th octave of weak, if not then missing.'''
        let deficiencies = [];
        if (weak_problems_for_you_display[6].length) deficiencies = weak_problems_for_you_display[6];
        else deficiencies = missing_problems[6];

        deficiencies = [...new Set(deficiencies)];
        if (deficiencies.length > 8) {
          deficiencies.splice(8, deficiencies.length);
        }

        let severe_risk = [];
        // ''' Severe Risk coming from 5th octave hyperactivity '''
        if (missing_problems[5].length) {
          severe_risk = missing_problems[5];
          mild_risk = [];
          severe_risk = [...new Set(severe_risk)];

          if (severe_risk.length > 7) {
            severe_risk.splice(7, severe_risk.length);
          }
        }

        // ORGAN RISK CALCULATIONS
        const { stage, interpretation: organ_risk_list } = calulationUtils.get_physical_health_progression_stage(
          missing_fq,
          weak_fq,
          recommndation.missing,
          recommndation.weak_problems
        );
        let organ_risk_score = 1;
        if (stage === 6) organ_risk_score = 0;

        const physical_score = disease_progression_score + immunity_overall_score + organ_risk_score;

        const physical_score_per = parseInt((physical_score * 100) / 3);
        const physical_score_base_10 = parseInt((physical_score * 10) / 3);
        const overall_physical_score = physical_score / 3;

        // Lab tests recommendations
        let lab_tests = calulationUtils.get_recommended_lab_tests(missing_fq[5], weak_fq[5], recommndation.lab_tests);

        // DNA HEALTH MAPPING
        const { score: dna_score, recommendations } = calulationUtils.get_dna_health_mapping(missing_fq["5"]);
        let overall_dna_score = dna_score / 100;

        // if (dna_score > 50 && dna_score < 75) overall_dna_score = 0.6;
        // if (dna_score > 75 && dna_score < 90) overall_dna_score = 0.9;
        if (dna_score > 90) overall_dna_score = 1;

        // BLOOD HEALTH SCORE
        const {
          minrals: mineral_score,
          hormons: hormones_score,
          neuroTansmitters: neuro_score,
          vitamis: vitamins_score,
          aminoAcod: amino_score,
          totalBloodScore,
          bloodScorePercentage: total_blood_score,
          chartData: bool_health_status_data,
          specialTest,
        } = calulationUtils.get_blood_health_score(missing_fq, recommndation.bloodElemets);
        const overall_total_blood_score = totalBloodScore;

        const overall_health_score = Number((overall_mental_score + overall_dna_score + overall_physical_score + overall_total_blood_score).toFixed(1));

        // Charts
        const { missing_chart_url, missing_chart_data } = calulationUtils.generate_missing_chart(file_id, missing_fq);

        // ***** weak fq chart *****
        const { weak_chart_url, weak_chart_fq } = calulationUtils.generate_weak_chart(file_id, weak_fq);

        // ***** hyper fq chart *****
        const { hyper_chart_url, hyper_chart_data } = calulationUtils.generate_hyper_chart(file_id, hyper_fq);

        // ***** hyper fq chart *****
        const whole_chart_url = calulationUtils.generate_whole_chart(file_id, missing_fq, weak_fq, hyper_fq);

        // ------------ New Chart Code ----------------
        // Seven Chakra Chart
        const [chakra_chart_url_abs, chakra_chart_url] = await calulationUtils.generate_chakra_chart(file_id, chakra_status_data);

        // Immunity chart
        const [immunity_chart_abs, immunity_chart] = await calulationUtils.generate_immunity_chart(file_id, immunity_status_data);

        // Blood Chart
        const [blood_chart_url_abs, blood_chart_url] = await calulationUtils.generate_blood_chart_url(file_id, bool_health_status_data);

        // DNA Chart
        const [dna_chart_url_abs, dna_chart_url] = await calulationUtils.generate_dna_chart_url(file_id, overall_dna_score);

        // Overall Chart
        const [overall_chart_abs, overall_chart] = await calulationUtils.generate_overall_chart_url(file_id, {
          overall_mental_score,
          overall_physical_score,
          overall_total_blood_score,
          overall_dna_score,
          overall_health_score,
        });

        const charts_urls = [chakra_chart_url_abs, immunity_chart_abs, blood_chart_url_abs, dna_chart_url_abs, overall_chart_abs];

        const context = {
          // User Info
          name,
          email,
          phone,
          age,
          city,
          recording_date,
          file_id,
          file_path: filePath,

          missing_fq_count,
          weak_fq_count,
          hyper_fq_count,
          positive_traits,
          final_root_cause_issue_lst,
          active,
          you_display,
          chakra_score: chakra_score_out_of_7,
          chakra_mental_score: chakra_score,
          mental_score,
          mental_score_per,
          mental_score_base_10,
          disease_progression_stage,
          immunity_score,
          immunity_status_data,
          organ_risk_score,
          organ_risk_list,
          physical_score,
          physical_score_per,
          physical_score_base_10,
          dna_score,
          lab_tests,
          mineral_score,
          hormones_score,
          neuro_score,
          vitamins_score,
          amino_score,
          total_blood_score,
          overall_health_score,
          root_cause_score,
          positive_traits_score,
          coping_up_score,
          immunity_overall_score,
          disease_progression_score,
          overall_mental_score,
          overall_physical_score,
          overall_total_blood_score,
          overall_dna_score,
          problems_on_mf: missing_problems,
          // Charts URLs
          chakra_chart: chakra_chart_url,
          immunity_chart,
          blood_chart: blood_chart_url,
          dna_chart: dna_chart_url,
          overall_chart,

          mf_chart: missing_chart_url,
          wf_chart: weak_chart_url,
          weak_chart_data: weak_chart_fq,
          hyper_chart: hyper_chart_url,
          whole_fq_chart: whole_chart_url,
          hyper_chart_data,
          missing_chart_data,

          deficiencies,
          mild_risk,
          moderate_risk,
          severe_risk,
          chakra_status_data,
          normal_chakra_count,
          missing_chakra_count,
          underfunctioning_chakra_count,
          overfunctioning_chakra_count,
          chakra_recommendations,
          recommended_lab_tests: lab_tests,
          traits_chart_url,
          root_cause_health_issue_lst_missing,
          root_cause_health_issue_lst_weak,
        };

        generatePdf(context, missing_fq, charts_urls);
      } catch (err) {
        console.error("Report Calculation Error");
        console.error(req.body);
        console.error(err);
      }
    } else {
      console.error(`child process close all stdio with code ${code}`);
      console.log(req.body);
    }
  });

  res.json({
    status: "success",
    message: "Request processed. Generating PDF",
  });
});

app.use((_, res) => {
  res.json({
    status: "error",
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Report server is listening on port ${PORT}!`);
});
