import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

var API_KEY = "AIzaSyD5Zzh6uFjLZvnzMo12dSQraDPMTaIZu6A";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("health-data").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const xmlData = e.target.result;
        const healthData = parseXMLData(xmlData);
        await generateAIResponses(healthData);
        renderCharts(healthData); // Render the charts after processing the file
      };
      reader.readAsText(file);
      document.getElementById("upload-status").textContent = "File uploaded successfully!";
    }
  });
});

function parseXMLData(xmlData) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, "text/xml");
  const days = xmlDoc.getElementsByTagName("Day");

  const stepCounts = [];
  const heartRates = [];
  const sleepHours = [];
  const dates = [];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const stepCount = parseInt(day.getElementsByTagName("StepCount")[0]?.textContent) || 0;
    const heartRate = parseInt(day.getElementsByTagName("HeartRate")[0]?.textContent) || 0;
    const sleepAnalysis = parseFloat(day.getElementsByTagName("SleepAnalysis")[0]?.textContent) || 0;
    const date = day.getElementsByTagName("Date")[0]?.textContent || "";

    stepCounts.push(stepCount);
    heartRates.push(heartRate);
    sleepHours.push(sleepAnalysis);
    dates.push(date);
  }

  return {
    stepCounts,
    heartRates,
    sleepHours,
    dates,
  };
}

async function generateAIResponses(healthData) {
  const prompt = `Steps: ${healthData.stepCounts.join(", ")}, Heart Rate: ${healthData.heartRates.join(", ")}, Sleep Hours: ${healthData.sleepHours.join(", ")}. Provide a risk percentage in the format: Risk Percentage: number% , a risk assessment in the format of Risk Assessment: single paragraph, and specific health recommendations in the format of Recommendations: list of recommendations. Avoid asterisks`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Splitting AI response into risk percentage, assessment, and recommendations
    const parts = text.split(/Risk Percentage:|Risk Assessment:|Recommendations:/i);
    const percentRisk = parts[1]?.trim() || "N/A";
    const riskAssessment = parts[2]?.trim() || "No risk assessment generated.";
    const recommendations = parts[3]?.trim() || "No specific recommendations.";

    updateUI(percentRisk, riskAssessment, recommendations);
  } catch (error) {
    console.error("AI Response Error:", error);
    updateUI("Error", "Error retrieving AI response.", "Please check your API key or internet connection.");
  }
}

function updateUI(percentRisk, riskAssessment, recommendations) {
  document.getElementById("risk-text").innerHTML = `<h3><strong>${percentRisk} Risk</strong></h3><br>${riskAssessment}`;
  document.getElementById("recommendation-text").textContent = recommendations;
}

function renderCharts(healthData) {
  // Hide the placeholder text
  document.getElementById("steps-placeholder").style.display = "none";
  document.getElementById("heart-rate-placeholder").style.display = "none";
  document.getElementById("sleep-hours-placeholder").style.display = "none";

  // Show the charts after the data is processed
  document.getElementById("steps-chart").style.display = "block";
  document.getElementById("heart-rate-chart").style.display = "block";
  document.getElementById("sleep-hours-chart").style.display = "block";

  // Step Count Chart (Bar Chart)
  new Chart(document.getElementById("steps-chart"), {
    type: "bar",
    data: {
      labels: healthData.dates, // Use the dates for the x-axis
      datasets: [{
        label: "Step Count",
        data: healthData.stepCounts,
        backgroundColor: "rgba(75, 192, 192, 0.6)"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Heart Rate Chart (Line Chart)
  new Chart(document.getElementById("heart-rate-chart"), {
    type: "line",
    data: {
      labels: healthData.dates, // Use the dates for the x-axis
      datasets: [{
        label: "Heart Rate",
        data: healthData.heartRates,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Sleep Hours Chart (Pie Chart)
  const sleepRanges = {
    below6: 0,
    between6And7: 0,
    between7And8: 0,
    above8: 0
  };

  // Count the number of days in each sleep range
  healthData.sleepHours.forEach(hours => {
    if (hours < 6) {
      sleepRanges.below6++;
    } else if (hours >= 6 && hours < 7) {
      sleepRanges.between6And7++;
    } else if (hours >= 7 && hours < 8) {
      sleepRanges.between7And8++;
    } else {
      sleepRanges.above8++;
    }
  });

  // Pie chart data for Sleep Hours
  new Chart(document.getElementById("sleep-hours-chart"), {
    type: "pie",
    data: {
      labels: ["Below 6 hours", "6-7 hours", "7-8 hours", "Above 8 hours"],
      datasets: [{
        label: "Sleep Hours",
        data: [sleepRanges.below6, sleepRanges.between6And7, sleepRanges.between7And8, sleepRanges.above8],
        backgroundColor: ["rgba(153, 102, 255, 0.6)", "rgba(75, 192, 192, 0.6)", "rgba(255, 159, 64, 0.6)", "rgba(54, 162, 235, 0.6)"]
      }]
    },
    options: {
      responsive: true
    }
  });
}
