import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "AIzaSyD5Zzh6uFjLZvnzMo12dSQraDPMTaIZu6A"; // Replace with your actual API key

  // Get DOM elements
  const topicButtons = document.querySelectorAll('.topic-btn');
  const aiResponseElement = document.getElementById('ai-response');
  const aiAnalysisElement = document.getElementById('ai-analysis');
  const optionOneElement = document.getElementById('option1');
  const optionTwoElement = document.getElementById('option2');
  const optionThreeElement = document.getElementById('option3');

  let currentPrompt = ""; // Store the current prompt
  let selectedTopic = ""; // Store the topic
  let choiceHistory = []; // Array to store chosen options
  let iterationCount = 0; // Counter for iterations

  // Function to handle the Gemini API call
  async function generateGeminiResponse(prompt) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  // Event listeners for topic buttons
  topicButtons.forEach(button => {
    button.addEventListener('click', async () => {
      selectedTopic = button.dataset.topic;
      aiResponseElement.textContent = `Generating response for ${selectedTopic}...`;

      // Disable all topic buttons
      topicButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.backgroundColor = '#ccc';
        btn.style.cursor = 'default';
      });

      try {
        // Get user inputs from the survey
        const name = document.getElementById("name").value;
        const career = document.getElementById("career").value;
        const relationships = document.getElementById("relationships").value;
        const finances = document.getElementById("finances").value;
        const health = document.getElementById("health").value;
        const hobbies = document.getElementById("hobbies").value;

        // Construct the initial prompt for Gemini
        currentPrompt = `
          You are a helpful AI therapist/storyteller. Generate 50 words which are the start of a choose your own adventure story adhering to the chosen topic, ${selectedTopic}. Have it be similar to traditional choose your own adventure stories. Base it off of the responses they entered in, ${name}, ${career}, ${relationships}, ${finances}, ${health}, ${hobbies}. Make the story start close to where they currently are in life, so that through the choose your own adventure they can work towards their described goals. Make sure to have an dilemma at the end that needs some thinking to decide. Make the storyline so that it reveals strengths and weaknesses of the user as they go through the adventure. Have 3 options that always generate with A), B), and C) and the words, You could:, before the options.
        `;

        // Display the AI's response
        const aiResponse = await generateGeminiResponse(currentPrompt);
        const message = aiResponse.slice(0, aiResponse.indexOf("You could:"));
        const optionOne = aiResponse.slice(aiResponse.indexOf("A)") + 3, aiResponse.indexOf("B)"));
        const optionTwo = aiResponse.slice(aiResponse.indexOf("B)") + 3, aiResponse.indexOf("C)"));
        const optionThree = aiResponse.slice(aiResponse.indexOf("C)") + 3);

        aiResponseElement.innerText = message;
        optionOneElement.innerText = optionOne;
        optionTwoElement.innerText = optionTwo;
        optionThreeElement.innerText = optionThree;
      } catch (error) {
        // Handle errors
        aiResponseElement.textContent = "Oops! An unexpected error occurred. Please try again later.";
        console.error("Error:", error);
      }
    });
  });

  // Event listeners for the option buttons
  optionOneElement.addEventListener('click', () => generateNextPrompt("A"));
  optionTwoElement.addEventListener('click', () => generateNextPrompt("B"));
  optionThreeElement.addEventListener('click', () => generateNextPrompt("C"));

  async function generateNextPrompt(choiceIdentifier) {
    iterationCount++; // Increment the counter

    if (iterationCount >= 3) {
      // AI Analysis
      try {
        const name = document.getElementById("name").value;
        const career = document.getElementById("career").value;
        const relationships = document.getElementById("relationships").value;
        const finances = document.getElementById("finances").value;
        const health = document.getElementById("health").value;
        const hobbies = document.getElementById("hobbies").value;

        const choiceTextHistory = choiceHistory.map(choice => choice.text).join(", "); // Extract text only
        const analysisPrompt = `
          You are a helpful AI therapist. Analyze the user's personality based on their choices: ${choiceTextHistory}.
          What do you notice about their personality? Provide a detailed 300 word analysis about specific personality traits. Do not bold anything. You can use their inputted characteristics as well: ${name}, ${career}, ${relationships}, ${finances}, ${health}, ${hobbies}. Have strengths and weakness always at the end of the analysis and in this format: Strengths: [strengths] Weaknesses: [weaknesses]. Seperate the strengths and weaknesses from the personality. Also add 50-100 words regarding actions they can take today to improve upon their weaknesses. Seperate this from the strengths and weaknesses, but keep in mind this is the most important portion`;
        const analysisResponse = await generateGeminiResponse(analysisPrompt);
        aiAnalysisElement.innerText = analysisResponse.slice(0, analysisResponse.indexOf("Strengths:"));
      } catch (error) {
        aiAnalysisElement.innerText = "Oops! An unexpected error occurred during analysis. Please try again later.";
        console.error("Analysis Error:", error);
      }

      aiResponseElement.innerText = "You've reached the end of your adventure! Here's an analysis of your choices.";
      // Disable choice buttons
      const choiceButtons = document.querySelectorAll(".choice-btn");
      choiceButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.backgroundColor = "#ccc";
        btn.style.cursor = "default";
      });
      return; // Stop further execution
    }

    aiResponseElement.innerText = "Generating next part of the story...";
    try {
      const nextPrompt = `
        You are a helpful AI therapist/storyteller. Continue the choose your own adventure story based on the user's choice: ${choiceIdentifier}.
        ${currentPrompt}
        Generate 50 words which are the next part of the story. Have it be similar to traditional choose your own adventure stories. Make sure to have an dilemma at the end that needs some thinking to decide while building on previous parts. 
        Then, provide three concise options for the user to choose from. Format each option like this: A) [Option text] | B) [Option text] | C) [Option text]. Do NOT include the next part of the story in the options.
      `;
      const aiResponse = await generateGeminiResponse(nextPrompt);

      // Split the response into message and options
      const parts = aiResponse.split("A)");
      const message = parts[0].trim();

      // Extract options
      const optionsString = "A)" + parts[1];
      const options = optionsString.split("|");

      // Extract the text from the options
      const optionOneText = options[0].trim().slice(3).trim();
      const optionTwoText = options[1].trim().slice(3).trim();
      const optionThreeText = options[2].trim().slice(3).trim();

      aiResponseElement.innerText = message;
      optionOneElement.innerText = optionOneText;
      optionTwoElement.innerText = optionTwoText;
      optionThreeElement.innerText = optionThreeText;
      currentPrompt = nextPrompt;

      // Store choice object with text
      let choiceObject;
      if (choiceIdentifier === "A") {
        choiceObject = { identifier: choiceIdentifier, text: optionOneText };
      } else if (choiceIdentifier === "B") {
        choiceObject = { identifier: choiceIdentifier, text: optionTwoText };
      } else {
        choiceObject = { identifier: choiceIdentifier, text: optionThreeText };
      }

      choiceHistory.push(choiceObject); // Store the chosen option object
      console.log("Choice History:", choiceHistory); // Log the choice history
      console.log("Iteration Count:", iterationCount); // Log the iteration count
    } catch (error) {
      aiResponseElement.innerText = "Oops! An unexpected error occurred. Please try again later.";
      console.error("Error:", error);
    }
  }

  // Update health value display
  document.getElementById("health").addEventListener("input", function () {
    document.getElementById("health-value").textContent = this.value;
  });
});
