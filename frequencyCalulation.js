const _ = require("lodash");

const recommndation = require("./recomandations");
const {
  drawBarChart,
  createDoughnutChart,
  createPieChart,
} = require("./utils/generate_charts");

function find_nearest(hist_array, notes_array, mean) {
  const hist_array_abs = hist_array.map((ele, i) => {
    num = Math.round(Math.abs(ele - mean));
    return num;
  });
  let idx = hist_array_abs.indexOf(Math.min(...hist_array_abs));
  // console.log("idx")
  return { note: notes_array[idx], hit: hist_array[idx], indx: idx };
}

function get_fourth_octave_normal_fq(fourth_normal_fq_dict, mean_forth_oct) {
  let hits_4th = Object.values(fourth_normal_fq_dict);
  let notes_4th = Object.keys(fourth_normal_fq_dict);
  // console.log(hits_4th)
  // console.log(notes_4th)

  const final_nrm_fq = {};

  const nrm_fq_size = hits_4th.length;
  let size = 0;
  if (nrm_fq_size > 3) size = 3;
  else size = nrm_fq_size;

  for (let i = 0; i < size; i++) {
    if (hits_4th.length > 0) {
      const { note, hit, indx } = find_nearest(
        hits_4th,
        notes_4th,
        mean_forth_oct
      );
      // console.log("note, hit, indx")
      // console.log(note, hit, indx)
      final_nrm_fq[note] = hit;
      hits_4th.splice(indx, 1);
      notes_4th.splice(indx, 1);
    }
  }

  return final_nrm_fq;
}

exports.calculate_missing_weak_hyper_fq = (frequency) => {
  const missing_dict = {};

  const weak_dict = {};
  const single_digit_weak = {};
  const double_digit_weak = {};

  const hyper_oct_dict = {};

  const fourth_normal_fq_dict = {};
  const fifth_normal_fq_dict = {};
  const sixth_normal_fq_dict = {};

  const weak_oct_freq_with_hits = {};
  const hyper_oct_freq_with_hits = {};

  let mean_forth_oct = 0;

  // We only need to 4th, 5th and 6th Octave for calulation
  const octs = ["4", "5", "6"];
  // const octs = ["1", "2", "3", "4", "5", "6"];

  octs.forEach((oct) => {
    const oct_value = frequency[oct]; // Ex:- 4th_oct -> {C: 5, ...}
    const missing_oct = [];

    const weak_oct = [];
    const single_digit_weak_nodes = [];
    const double_digit_weak_nodes = [];

    const hyper_oct = [];

    const freq_oct_keys = Object.keys(oct_value); // Ex:- [C, C#, ...]
    const f_avg = Number((oct_value["Sum"] / 12).toFixed(2));
    const f_mean = Number((f_avg / 2).toFixed(2));
    const hyper_thresh = f_avg + f_mean;

    // 4th oct mean
    if (oct === "4") {
      mean_forth_oct = f_avg;
    }

    hyper_oct_freq_with_hits[oct] = {};
    weak_oct_freq_with_hits[oct] = {};

    freq_oct_keys.forEach((oct_col) => {
      if (oct_col == "Sum") return;

      const hits = oct_value[oct_col]; // fq value 40, 50, 60 ...

      if (oct == "5" || oct == "6") {
        if (hits > 0 && hits < f_mean) {
          // *** single digits weak nodes **
          if (hits < 10) single_digit_weak_nodes.push(oct_col);
          // *** double digits weak nodes ***
          if (hits >= 10) double_digit_weak_nodes.push(oct_col);
        }

        // # For 5th and 6th octave weak freq - Always single digit
        // # frequencies only.
        if (hits > 0 && hits < 10) {
          weak_oct.push(oct_col);
          weak_oct_freq_with_hits[oct][oct_col] = hits;
        }
      } else {
        if (hits > 0 && hits < f_mean) {
          if (hits < 10) single_digit_weak_nodes.push(oct_col);
          if (hits > 10) double_digit_weak_nodes.push(oct_col);
          weak_oct.push(oct_col);
          weak_oct_freq_with_hits[oct][oct_col] = hits;
        }
      }

      if (hits == 0 || !hits) {
        // Adding Missing Fq
        missing_oct.push(oct_col);
      } else if (hits > hyper_thresh) {
        // Adding Hyper Fq
        hyper_oct.push(oct_col);
        hyper_oct_freq_with_hits[oct][oct_col] = hits;
      } else if (hits < f_mean || hits < 10) {
        //
      } else {
        if (oct == "4") {
          // 4th octave normal fq with notes
          fourth_normal_fq_dict[oct_col] = hits;
        } else if (oct == "5") {
          // 5th octave normal fq with notes
          fifth_normal_fq_dict[oct_col] = hits;
        } else if (oct == "6") {
          // 6th octave normal fq with notes
          sixth_normal_fq_dict[oct_col] = hits;
        }
      }
    });

    missing_dict[oct] = missing_oct;
    weak_dict[oct] = weak_oct;
    single_digit_weak[oct] = single_digit_weak_nodes;
    double_digit_weak[oct] = double_digit_weak_nodes;
    hyper_oct_dict[oct] = hyper_oct;
  });

  // *** getting final 4rth oct normal notes ***
  let final_4th_nrm_fq = {};
  if (Object.keys(fourth_normal_fq_dict).length !== 0) {
    final_4th_nrm_fq = get_fourth_octave_normal_fq(
      fourth_normal_fq_dict,
      mean_forth_oct
    );
  }
  // console.log("final_4th_nrm_fq");
  // console.log(final_4th_nrm_fq);

  const result = {};
  result["missing"] = missing_dict;
  result["weak_oct"] = weak_dict;
  result["single_digit_weak"] = single_digit_weak;
  result["double_digit_weak"] = double_digit_weak;
  result["hyper"] = hyper_oct_dict;
  result["forth_nrm_fq"] = final_4th_nrm_fq;
  result["nrm_fq"] = {
    4: fourth_normal_fq_dict,
    5: fifth_normal_fq_dict,
    6: sixth_normal_fq_dict,
  };
  result["weak_oct_freq_with_hits"] = weak_oct_freq_with_hits;
  result["hyper_oct_freq_with_hits"] = hyper_oct_freq_with_hits;

  // console.log("result");
  // console.log(JSON.stringify(result));

  return result;
};

// Not in use
exports.generate_chakra_status_data_old = (
  missing_fq = {},
  weak_fq = {},
  hyper_fq = {}
) => {
  const chkra_mapping = recommndation.chakra_mapping;
  const chakra_mapping_list = [];
  let score = 0;

  for (const key in chkra_mapping) {
    const value = chkra_mapping[key];
    /**
     *  Major notes - 7 chakra, 1 major
     * Normal: not in missing, weak(single digit and weak) or hyper
     * Low: weak or missing
     * Hyperactive: hyper
     */
    let chakra_mapping_dict = {};
    if (
      missing_fq["4"].indexOf(key) !== -1 ||
      weak_fq["4"].indexOf(key) !== -1
    ) {
      chakra_mapping_dict = {
        element: value[0],
        vibration: "Low",
      };
      score += 0.5;
    } else if (hyper_fq["4"].indexOf(key) !== -1) {
      chakra_mapping_dict = {
        element: value[0],
        vibration: "Hyperactive",
      };
      score += 1.5;
    } else {
      chakra_mapping_dict = {
        element: value[0],
        vibration: "Normal",
      };
      score += 1.0;
    }
    chakra_mapping_list.push(chakra_mapping_dict);
  }

  return { chakra_status_data: chakra_mapping_list, chakra_score: score };
};

// Use Major Fqs not All
// Chakra calculation only require major fqs
exports.generate_chakra_status_data = (forth_oct, chakra_mapping) => {
  const chakra_octs = Object.keys(chakra_mapping);
  const avg = forth_oct["Sum"] / 12;

  const mean = avg / 2;

  const belowThreshold = avg - mean;
  const aboveThreshold = avg + mean;

  const length = chakra_octs.length;

  let score = 0;
  const chakra_mapping_list = [];

  for (let i = 0; i < length; i++) {
    const element = chakra_octs[i];
    let chakra_mapping_dict;

    let applied = false;

    if (!applied && forth_oct[element] === 0) {
      // score = score + 0;
      applied = true;

      chakra_mapping_dict = {
        element: chakra_mapping[chakra_octs[i]][0],
        vibration: "Missing",
        value: 0,
        // value: forth_oct[element],
        color: chakra_mapping[chakra_octs[i]][1],
      };
    }

    if (
      !applied &&
      forth_oct[element] >= belowThreshold &&
      forth_oct[element] <= aboveThreshold
    ) {
      score = score + 1;
      applied = true;

      chakra_mapping_dict = {
        element: chakra_mapping[chakra_octs[i]][0],
        vibration: "Normal",
        value: 100,
        // value: forth_oct[element],
        color: chakra_mapping[chakra_octs[i]][1],
      };
    }

    if (!applied && forth_oct[element] < belowThreshold) {
      score = score + 0.5;
      applied = true;

      chakra_mapping_dict = {
        element: chakra_mapping[chakra_octs[i]][0],
        vibration: "Low",
        value: 50,
        // value: forth_oct[element],
        color: chakra_mapping[chakra_octs[i]][1],
      };
    }

    if (!applied && forth_oct[element] > aboveThreshold) {
      score = score + 1.5;
      applied = true;

      chakra_mapping_dict = {
        element: chakra_mapping[chakra_octs[i]][0],
        vibration: "Hyperactive",
        value: 150,
        // value: forth_oct[element],
        color: chakra_mapping[chakra_octs[i]][1],
      };
    }

    chakra_mapping_list.push(chakra_mapping_dict);
  }

  return { chakra_status_data: chakra_mapping_list, chakra_score: score };
};

exports.generate_immunity_status_data = (
  missing_fq = null,
  weak_fq = null,
  fifth_oct,
  immunity_mapping
) => {
  const immunity_mapping_list = [];
  let immunity_score = 0;

  for (const key in immunity_mapping) {
    const value = immunity_mapping[key].fq;
    const color = immunity_mapping[key].color;
    let immunity_mapping_dict = {};

    if (missing_fq[5].indexOf(value) !== -1) {
      immunity_score += 0;
      immunity_mapping_dict = {
        element: key,
        frequency: "Missing",
        vibration: "Low",
        value: 0,
        // value: fifth_oct[value],
        color: color,
      };
    } else if (weak_fq[5].indexOf(value) !== -1) {
      immunity_score += 0.5;
      immunity_mapping_dict = {
        element: key,
        frequency: "Missing",
        vibration: "Low",
        value: 50,
        // value: fifth_oct[value],
        color: color,
      };
    } else {
      immunity_score += 1;
      immunity_mapping_dict = {
        element: key,
        frequency: "Normal",
        vibration: "Normal",
        value: 100,
        // value: fifth_oct[value],
        color: color,
      };
    }
    immunity_mapping_list.push(immunity_mapping_dict);
  }

  return { immunity_status_data: immunity_mapping_list, immunity_score };
};

exports.get_positive_traits = (forth_oct_nrm_fq, normal_mapping) => {
  let notes = Object.keys(forth_oct_nrm_fq);
  let your_traits = [];
  if (notes.length > 0) {
    let num_traits = parseInt(6 / notes.length);
    if (num_traits > 4) num_traits = 4;
    if (num_traits === 0) num_traits = 1;
    notes.forEach((note) => {
      let traits = normal_mapping[note];
      let note_traits = _.sampleSize(traits, num_traits);
      your_traits.push(...note_traits);
    });
  }

  return your_traits;
};

exports.predict_on_missing_fq = (missing_fq, missing_prbl) => {
  const all_problems = {};

  for (let oct in missing_fq) {
    const fq_list = missing_fq[oct];

    let problems = [];
    oct = parseInt(oct) || 0;

    if (oct >= 4) {
      const prbl_dict = missing_prbl[oct];

      fq_list.forEach((fq) => {
        const problem_list = prbl_dict[fq];
        problems.push(...problem_list);
      });

      problems = [...new Set(problems)];
      all_problems[oct] = problems;
    }
  }

  return all_problems;
};

exports.predict_on_weak_fq = (
  single_digit_weak_fq,
  double_digit_weak_fq,
  weak_fq,
  weak_prbls
) => {
  const weak_problems = {};

  for (let oct in weak_fq) {
    const fq_list = weak_fq[oct];

    let problems = [];
    oct = parseInt(oct) || 0;

    if (oct >= 4) {
      const prbl_dict = weak_prbls[oct];

      fq_list.forEach((fq) => {
        const problem_list = prbl_dict[fq];
        problems.push(...problem_list);
      });

      problems = [...new Set(problems)];
      weak_problems[oct] = problems;
    }
  }

  let mild_risk = [];
  const moderate_risk = [];
  const single_digit_weak_nodes = single_digit_weak_fq[5];
  const double_digit_weak_nodes = double_digit_weak_fq[5];

  single_digit_weak_nodes.forEach((sd_node) => {
    mild_risk.push(...weak_prbls[5][sd_node]);
  });

  double_digit_weak_nodes.forEach((dd_node) => {
    moderate_risk.push(...weak_prbls[5][dd_node]);
  });

  mild_risk = [...new Set(mild_risk)];

  return {
    mild_risk,
    moderate_risk,
    weak_problems_for_you_display: weak_problems,
  };
};

exports.predict_on_hyper_fq = (
  hyper_fq,
  hyper_problems_list,
  hyper_oct_freq_with_hits
) => {
  const all_problems = {};

  // `oct` is Octave ex: 4th Octave, 5th Octave and 6th Oactave
  for (let oct in hyper_fq) {
    const fq_list = hyper_fq[oct];

    let problems = [];
    oct = parseInt(oct);

    if (oct >= 4) {
      const hyper_issue_at_oct = hyper_problems_list[oct];

      fq_list.forEach((fq) => {
        const problem_list = hyper_issue_at_oct[fq];
        problems.push(...problem_list);
      });

      problems = [...new Set(problems)];
      all_problems[oct] = problems;
    }
  }

  return all_problems;
};

exports.get_coping_mechnism = (missing, weak, hyperactive, forth_oct) => {
  const freqs = [
    "C",
    "C♯",
    "D",
    "D♯",
    "E",
    "F",
    "F♯",
    "G",
    "G♯",
    "A",
    "A♯",
    "B",
  ];

  let active = 0;
  let inactive = 0;
  let allZero = false;

  const oct = "4";
  const avg = parseInt(forth_oct.Sum / 12) || 0;

  if (
    missing[oct].length === 0 &&
    weak[oct].length === 0 &&
    hyperactive[oct].length === 0
  ) {
    allZero = true;
    active = 1;

    return { active, inactive, allZero };
  }

  active = 0;

  for (let i = 0; i < 6; i++) {
    const sum =
      parseInt(forth_oct[freqs[i]]) + parseInt(forth_oct[freqs[i + 6]]);

    if (sum > avg) active++;
    else inactive++;

    // if (active === 1) break;
  }

  // OLD
  // Loop runs for fisrt 6 fq:- "C", "C♯", "D", "D♯", "E", "F"
  // for (let i = 0; i < 6; i++) {
  //     if (missing[oct].indexOf(freqs[i] !== -1) || weak[oct].indexOf(freqs[i] !== -1)) {
  //         if (hyperactive[oct].indexOf(freqs[i + 6]) !== -1) {
  //             active += 1;
  //         } else {
  //             inactive += 1;
  //         }
  //     } else if (hyperactive[oct].indexOf(freqs[i])) {
  //         if (missing[oct].indexOf(freqs[i + 6]) !== -1 || weak[oct].indexOf(freqs[i + 6] !== -1)) {
  //             active += 1;
  //         } else {
  //             inactive += 1;
  //         }
  //     }

  //     if (active > 0) break;
  // }

  return { active, inactive, allZero };
};

exports.get_disease_progression_stage_old = (missing_fq) => {
  if (missing_fq[5].length) {
    return 6;
  }

  let stage = 6;
  while (stage > 0) {
    if (missing_fq[stage].length) {
      return stage;
    } else {
      stage -= 1;
    }
  }

  return stage;
};

exports.get_disease_progression_stage = (missing_fq, weak_fq) => {
  if (missing_fq["5"].length || weak_fq["5"].length) {
    return 6;
  }

  let stage = 5;
  while (stage > 0) {
    if (stage < 4) break;

    if (stage === 5) {
      stage -= 1;
      continue;
    }

    if (missing_fq[stage].length || weak_fq[stage].length) {
      break;
    } else {
      stage -= 1;
    }
  }

  return stage;
};

exports.get_recommended_lab_tests = (
  missing_fq,
  weak_notes,
  lab_tests_mapping
) => {
  const lab_tests = [];

  missing_fq.forEach((missing_note) => {
    lab_tests.push(...lab_tests_mapping[missing_note]);
  });

  weak_notes.forEach((weak_note) => {
    lab_tests.push(...lab_tests_mapping[weak_note]);
  });

  return [...new Set(lab_tests)];
};

exports.get_physical_health_progression_stage = (
  missing_fq,
  weak_fq,
  missing_problems,
  weak_problems
) => {
  let stage = 0;
  const interpretation = [];

  function pushToArray(fqArray, dataArray) {
    fqArray.forEach((fq) => {
      interpretation.push(...dataArray[fq]);
    });
  }

  if (missing_fq["5"].length > 0) {
    stage = 6;
    pushToArray(missing_fq["5"], missing_problems["5"]);
  }

  if (weak_fq["5"].length > 0) {
    stage = 6;
    pushToArray(weak_fq["5"], weak_problems["5"]);
  }

  return { stage, interpretation };
};

exports.get_dna_health_mapping = (missing_fq_5) => {
  const DNA_CONSTANT = 8.34;
  const dnaScore = parseInt(100 - missing_fq_5.length * DNA_CONSTANT);

  if (dnaScore < 75) {
    const recommendations = [
      "Sound therapy for Emotional Issues",
      "Lab tests as per the list generated",
      "Consulting your Physician",
    ];
    return { score: dnaScore, recommendations };
  }

  if (dnaScore < 90) {
    const recommendations = [
      "Sound therapy for Emotional Issues",
      "Lab tests as per the list generated",
      "Repeat Jv-Scan every 3 Months",
    ];
    return { score: dnaScore, recommendations };
  }

  const recommendations = [];
  return { score: dnaScore, recommendations };
};

exports.get_blood_health_score = (missing_fq, bloodElemets) => {
  const data = {
    minrals: 0,
    hormons: 0,
    neuroTansmitters: 0,
    vitamis: 0,
    aminoAcod: 0,
    specialTest: [],
    totalBloodScore: 0,
    bloodScorePercentage: 0,
    chartData: [],
  };

  missing_fq[6].forEach((fq) => {
    data.minrals = data.minrals + Number(bloodElemets["minrals"][fq]);
    data.hormons = data.hormons + Number(bloodElemets["hormons"][fq]);
    data.neuroTansmitters =
      data.neuroTansmitters + Number(bloodElemets["neuroTansmitters"][fq]);
    data.vitamis = data.vitamis + Number(bloodElemets["vitamis"][fq]);
    data.aminoAcod = data.aminoAcod + Number(bloodElemets["aminoAcod"][fq]);
    data.specialTest.push(...bloodElemets["specialTest"][fq]);
  });

  data.minrals =
    (Number(bloodElemets.minrals.sum) - data.minrals) /
    Number(bloodElemets.minrals.sum);
  data.hormons =
    (Number(bloodElemets.hormons.sum) - data.hormons) /
    Number(bloodElemets.hormons.sum);
  data.vitamis =
    (Number(bloodElemets.vitamis.sum) - data.vitamis) /
    Number(bloodElemets.vitamis.sum);
  data.aminoAcod =
    (Number(bloodElemets.aminoAcod.sum) - data.aminoAcod) /
    Number(bloodElemets.aminoAcod.sum);
  data.neuroTansmitters =
    (Number(bloodElemets.neuroTansmitters.sum) - data.neuroTansmitters) /
    Number(bloodElemets.neuroTansmitters.sum);

  const total = Number(
    (
      data.minrals +
      data.hormons +
      data.neuroTansmitters +
      data.vitamis +
      data.aminoAcod
    ).toFixed("2")
  );
  data.totalBloodScore = Number((total / 5).toFixed("2"));
  data.bloodScorePercentage = Number((data.totalBloodScore * 100).toFixed("2"));

  data.minrals = Number((data.minrals * 100).toFixed("2"));
  data.hormons = Number((data.hormons * 100).toFixed("2"));
  data.vitamis = Number((data.vitamis * 100).toFixed("2"));
  data.aminoAcod = Number((data.aminoAcod * 100).toFixed("2"));
  data.neuroTansmitters = Number((data.neuroTansmitters * 100).toFixed("2"));

  const keys = Object.keys(bloodElemets);
  keys.forEach((element) => {
    if (element === "sum" || element === "specialTest") return;
    data.chartData.push({
      element: bloodElemets[element].label,
      value: data[element],
      color: bloodElemets[element].color,
    });
  });

  return data;
};

exports.generate_chakra_chart = async (file_id, chakra_status_data) => {
  const data = [];

  chakra_status_data.forEach((ele) => {
    data.push({ label: ele.element, value: ele.value, color: ele.color });
  });

  let file_name = "chakra_chart_" + file_id;

  // Draw the bar chart and save it as an image
  const url = await drawBarChart(file_name, data);

  return url;
};

exports.generate_immunity_chart = async (file_id, immunity_status_data) => {
  const data = [];

  immunity_status_data.forEach((ele) => {
    data.push({ label: ele.element, value: ele.value, color: ele.color });
  });

  let file_name = "immunity_chart_" + file_id;

  // Draw the bar chart and save it as an image
  const url = await drawBarChart(file_name, data);

  return url;
};

exports.generate_blood_chart_url = async (file_id, bool_health_status_data) => {
  const data = [];

  bool_health_status_data.forEach((ele) => {
    data.push({ label: ele.element, value: ele.value, color: ele.color });
  });

  let file_name = "blood_chart_" + file_id;

  // Draw the bar chart and save it as an image
  const url = await drawBarChart(file_name, data);

  return url;
};

exports.generate_dna_chart_url = async (file_id, overall_dna_score) => {
  const dataset = [overall_dna_score, 1 - overall_dna_score];
  const labels = ["Healthy DNA %", "Sick DNA %"];
  const colors = ["green", "red"];

  let file_name = "dna_chart_" + file_id;

  // Draw the bar chart and save it as an image
  const url = await createDoughnutChart(file_name, {
    dataset,
    labels,
    colors,
  });

  return url;
};

exports.generate_overall_chart_url = async (file_id, scoring) => {
  const labels = ["Mental Health", "DNA Heath", "Blood Health", "DNA Health"];
  const colors = ["#AFD330", "#363B9F", "#EE212A", "#0A7F4E"];

  const sum = scoring.overall_health_score;

  const dataset = [];
  dataset[0] = Number((scoring.overall_mental_score / sum).toFixed("2"));
  dataset[1] = Number((scoring.overall_physical_score / sum).toFixed("2"));
  dataset[2] = Number((scoring.overall_total_blood_score / sum).toFixed("2"));
  dataset[3] = Number((scoring.overall_dna_score / sum).toFixed("2"));

  let file_name = "overall_chart_" + file_id;

  // Draw the bar chart and save it as an image
  const url = await createPieChart(file_name, {
    dataset,
    labels,
    colors,
  });

  return url;
};

exports.generate_missing_chart = (file_id, missing_fq = null) => {
  return { missing_chart_url: "", missing_chart_data: [] };
};

exports.generate_weak_chart = (file_id, missing_fq = null) => {
  return { weak_chart_url: "", weak_chart_fq: [] };
};

exports.generate_hyper_chart = (file_id, missing_fq = null) => {
  return { hyper_chart_url: "", hyper_chart_data: [] };
};

exports.generate_whole_chart = (file_id, missing_fq = null) => {
  return "";
};

exports.generate_traits_chart = (file_id, forth_oct_nrm_fq) => {
  const chart_data = Object.values(forth_oct_nrm_fq);
  const total = chart_data.reduce((a, b) => a + b, 0);

  chart_data.push(total);
  const chart_lable = Object.keys(forth_oct_nrm_fq);
  chart_lable.push("Total");

  // -------------------------------------------------------

  return { traits_chart_url: "", traits_data: [] };
};
