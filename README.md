# Health Frequency Analyzer

Health Frequency Analyzer is a full-stack application designed to analyze audio frequency data and provide a comprehensive health report. It detects and interprets weak, missing, and hyperactive frequencies in an audio file to assess various health parameters such as mental state, physical well-being, immunity, and chakra balance. Based on the analysis, the system generates a detailed PDF report and provides a customized therapy audio file.

---

## Features

- Accepts audio input (WAV/MP3) and performs frequency analysis using Fast Fourier Transform (FFT)
- Identifies missing, weak, and hyper frequencies in the user's input
- Maps frequency gaps to various health aspects, including organ health, mental state, chakras, immunity, and DNA stress
- Predicts possible health issues based on frequency irregularities
- Generates a structured PDF report with detailed insights and suggestions
- Produces a therapy audio file tailored to the user's unique frequency deficiencies

---

## Technologies Used

**Backend:** Node.js, Express.js  
**Scripting & Analysis:** Python (NumPy, SciPy)  
**PDF Generation:** Puppeteer, pdfkit  
**Audio Processing:** ffmpeg, Web Audio API  
**Frontend:** HTML, CSS, JavaScript (basic UI or Postman-supported API usage)

---

## Project Structure

